
(function(){
    
    var CLS_CONNECT_VALID = 'connect-valid',
        CLS_CONNECT_INVALID = 'connect-invalid',
        CLS_CONNECT_RESET = 'connect-valid connect-invalid',
        CLS_CONNECT_CLEAR = 'connect-valid connect-invalid connect-hover',
        CLS_CONNECT_HOVER = 'connect-hover';
    
    Graph.plugin.Network = Graph.extend(Graph.plugin.Plugin, {

        props: {
            context: null,
            vector: null,
            wiring: 'h:h'
        },

        linking: {
            valid: false,
            router: null,
            source: null,
            target: null,
            link: null,
            pole: null
        },
        
        constructor: function(vector, options) {
            var me = this, guid = vector.guid();
            
            options = options || {};

            if (options.context) {
                options.context = options.context.guid();
            } else {
                options.context = guid;
            }

            _.assign(me.props, options);

            me.props.vector = guid;

            me.cached.cables = {};
            me.cached.pairs = {};

            vector.addClass('graph-connectable');
            
            // setup link droppable
            
            var vendor = vector.interactable().vendor();
            
            vendor.dropzone({
                accept: _.format('.{0}, .{1}', Graph.styles.LINK_HEAD, Graph.styles.LINK_TAIL),
                overlap: .2
            })
            .on('dropdeactivate', function(e){
                var v = Graph.registry.vector.get(e.target);
                if (v) {
                    v.removeClass(CLS_CONNECT_CLEAR);
                }
                me.invalidateTrans();
            })
            .on('dropactivate', function(e){
                var v = Graph.registry.vector.get(e.target);
                
                if (v) {
                    v.addClass(CLS_CONNECT_HOVER);
                }
                
                me.invalidateTrans();
            })
            .on('dragenter', function(e){
                var link = Graph.registry.link.get(e.relatedTarget);

                if (link) {
                    var pole = Graph.$(e.relatedTarget).data('pole');
                    var valid, source, target;

                    if (pole == 'head') {
                        source = link.router.source();
                        target = vector;
                    } else {
                        source = vector;
                        target = link.router.target();
                    }
                    
                    valid  = source.connectable().canConnect(target.connectable(), link);
                    
                    if (valid) {
                        vector.removeClass(CLS_CONNECT_INVALID);
                        vector.addClass(CLS_CONNECT_VALID);
                    } else {
                        vector.removeClass(CLS_CONNECT_VALID);
                        vector.addClass(CLS_CONNECT_INVALID);
                    }
                    
                    _.assign(me.linking, {
                        valid: valid,
                        router: link.router,
                        source: source,
                        target: target,
                        pole: pole
                    });

                    link.router.updateTrans('CONNECT', {
                        valid: valid,
                        source: source,
                        target: target
                    });
                }
            })
            .on('dragleave', function(e){
                var v = Graph.registry.vector.get(e.target);
                if (v) {
                    v.removeClass(CLS_CONNECT_RESET);
                }
                
                me.linking.valid = false;
                
                if (me.linking.pole == 'head') {
                    me.linking.router.updateTrans('CONNECT', {
                        valid: false,
                        target: null
                    });    
                } else {
                    me.linking.router.updateTrans('CONNECT', {
                        valid: false,
                        source: null
                    });
                }
                
            })
            .on('drop', function(e){
                if (me.linking.valid) {
                    if (me.linking.pole == 'head') {
                        me.linking.router.updateTrans('CONNECT', {
                            target: vector
                        });
                    } else {
                        me.linking.router.updateTrans('CONNECT', {
                            source: vector
                        });
                    }
                }
            });
        },
        
        invalidateTrans: function() {
            for (var name in this.linking) {
                this.linking[name] = null;
            }
        },  
        
        wiring: function() {
            return this.props.wiring;
        },

        treshold: function() {
            var wiring = this.props.wiring;

            switch(wiring) {
                case 'h:h':
                case 'v:v':
                    return 20;
                case 'h:v':
                case 'v:h':
                    return -10;
            }

            return 0;
        },
        
        direction: function (network) {
            var orient = this.orientation(network);
            
            switch(orient) {
                case 'intersect':
                    return null;
                case 'top':
                case 'bottom':
                    return 'v:v';
                case 'left':
                case 'right':
                    return 'h:h';
                default:
                    return this.props.wiring;
            }
        },
        
        orientation: function(network) {
            var srcbox = this.bbox().toJson(),
                refbox = network.bbox().toJson(),
                orient = Graph.util.boxOrientation(srcbox, refbox, this.treshold());
            
            srcbox = refbox = null;
            
            return orient;
        },
        
        isSource: function(link) {
            return link.source().guid() == this.vector().guid();
        },
        
        isTarget: function(link) {
            return link.target().guid() == this.vector().guid();
        },
        
        addLink: function(link, type, pair) {
            var guid = link.guid(),
                cables = this.cached.cables,
                pairs = this.cached.pairs;

            pair  = pair.guid();
            pairs = pairs || {};
            
            pairs[pair] = pairs[pair] || [];

            if (_.indexOf(pairs[pair], guid) === -1) {
                pairs[pair].push(guid);
            }
            
            cables[guid] = {
                type: type,
                pair: pair
            };
        },

        removeLink: function(link) {
            var guid, pair;

            if (_.isString(link)) {
                guid = link;
            } else {
                guid = link.guid();
            }
            
            var conn = this.cached.cables[guid];

            if (conn) {
                if (this.cached.pairs[conn.pair]) {
                    var index = _.indexOf(this.cached.pairs[conn.pair], guid);
                
                    if (index > -1) {
                        this.cached.pairs[conn.pair].splice(index, 1);
                    }

                    if ( ! this.cached.pairs[conn.pair].length) {
                        delete this.cached.pairs[conn.pair];
                    }
                }
            }

            delete this.cached.cables[guid];
            conn = null;
        },
        
        hasConnection: function(network) {
            var conn = this.getConnection();
            return conn.length ? conn : false;
        },
        
        connections: function(network) {
            var me = this, 
                registry = Graph.registry.link,
                current = this.props.vector,
                conns = [];
            
            if (network !== undefined) {
                
                var pair = network.vector().guid();
                
                if (this.cached.pairs[pair]) {
                    _.forEach(me.cached.pairs[pair], function(guid){
                        var link = registry.get(guid),
                            opts = me.cached.cables[guid];
                        if (link && opts) {
                            conns.push({
                                link: link,
                                type: opts.type,
                                source: opts.type == 'outgoing' ? current : pair,
                                target: opts.type == 'outgoing' ? pair : current
                            });
                        }
                    });
                }
                
                return conns;
            }
            
            var cables = me.cached.cables;
            
            _.forOwn(cables, function(opts, guid){
                var link = registry.get(guid);
                if (link) {
                    conns.push({
                        link: link,
                        type: opts.type,
                        source: opts.type == 'outgoing' ? current : opts.pair,
                        target: opts.type == 'outgoing' ? opts.pair : current
                    });
                }
            });
            
            return conns;
        },

        ///////// RULES /////////
        
        /**
         * Can connect to target network
         */
        canConnect: function(network, link) {
            var a = this.vector().guid(),
                b = network.vector().guid();
            
            if (a != b) {
                return true;
            }

            return false;
        },

        destroy: function() {
            var me = this, conns = this.connections();

            _.forEach(conns, function(conn){
                conn.link.remove(); 
            });
            
            // collect garbage
            this.cached.cables = null;
            this.cached.pairs  = null;
        }

    });

}());