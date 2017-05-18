
(function(){

    var CLS_CONNECT_VALID = 'connect-valid',
        CLS_CONNECT_INVALID = 'connect-invalid',
        CLS_CONNECT_RESET = 'connect-valid connect-invalid',
        CLS_CONNECT_CLEAR = 'connect-valid connect-invalid connect-hover',
        CLS_CONNECT_HOVER = 'connect-hover',

        CONNECT_OUTGOING = 'outgoing',
        CONNECT_INCOMING = 'incoming';

    Graph.plugin.Network = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null,
            wiring: 'h:h',
            tuning: true,
            limitIncoming: 0,
            limitOutgoing: 0
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
                var t = Graph.event.target(e);
                var v = Graph.registry.vector.get(t);
                if (v) {
                    v.removeClass(CLS_CONNECT_CLEAR);
                }
                me.invalidateTrans();
            })
            .on('dropactivate', function(e){
                var t = Graph.event.target(e);
                var v = Graph.registry.vector.get(t);

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
                var t = Graph.event.target(e);
                var v = Graph.registry.vector.get(t);
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
                var link = Graph.registry.link.get(e.relatedTarget);

                if (me.linking.valid) {
                    if (me.linking.pole == 'head') {

                        var oldTarget = me.linking.router.target();
                        
                        if (oldTarget && oldTarget.guid() != vector.guid()) {
                            oldTarget.connectable().removeLink(link);
                        }

                        me.linking.router.updateTrans('CONNECT', {
                            target: vector
                        });

                    } else {

                        var oldSource = me.linking.router.source();

                        if (oldSource && oldSource.guid() != vector.guid()) {
                            oldSource.connectable().removeLink(link);
                        }

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
            if (this.props.tuning) {
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
            } else {
                return this.props.wiring;
            }
        },

        orientation: function(network) {
            var sourceBox = this.vector().bboxOriginal().toJson(),
                targetBox = network.vector().bboxOriginal().toJson(),
                orientation = Graph.util.boxOrientation(sourceBox, targetBox, this.treshold());

            sourceBox = targetBox = null;
            return orientation;
        },

        isSource: function(link) {
            return link.source().guid() == this.vector().guid();
        },

        isTarget: function(link) {
            return link.target().guid() == this.vector().guid();
        },

        connect: function(target, start, end, options) {
            if (this.canConnect(target)) {

                if (start && ! end) {
                    options = start;
                    start = null;
                    end = null;
                } else {
                    if (start instanceof Graph.lang.Point) {
                        start = start.toJson();
                    }

                    if (end instanceof Graph.lang.Point) {
                        end = end.toJson();
                    }    
                }

                options = options || {};

                var source = this,
                    sourceVector = source.vector(),
                    targetVector = target.vector(),
                    paper = sourceVector.paper(),
                    paperLayout = paper.layout(),
                    router = paperLayout.createRouter(sourceVector, targetVector),
                    link = paperLayout.createLink(router, options);

                if (options.command !== undefined) {
                    link.connectByCommand(options.command);
                } else {
                    link.connect(start, end);    
                }

                link.render(paper);

                link.cached.beforeDestroyHandler = _.bind(this.onLinkBeforeDestroy, this);
                link.on('beforedestroy', link.cached.beforeDestroyHandler);

                source.addLink(link, CONNECT_OUTGOING, targetVector);
                target.addLink(link, CONNECT_INCOMING, sourceVector);

                sourceVector.fire('connect', {link: link});

                return link;
            }

            return false;
        },

        connectByLinker: function(target, start, end, options) {
            var routerType = this.vector().paper().layout().routerType();

            if (routerType == 'orthogonal') {
                this.connect(target, null, null, options);
            } else {
                this.connect(target, start, end, options);
            }
        },

        disconnect: function(target, link) {
            var connections = this.connections(target),
                connectionsLength = connections.length,
                disconnected = 0,
                linkIds = [];

            if (link !== undefined) {
                if ( ! _.isArray(link)) {
                    linkIds = link ? [link.guid()] : [];
                } else {
                    linkIds = _.map(link, function(l){ return l && l.guid() });
                }
            }
            
            _.forEach(connections, function(conn){
                if (linkIds.length) {
                    if (_.indexOf(linkIds, conn.guid) > -1) {
                        conn.link.disconnect();
                        disconnected++;
                        connectionsLength--;
                    }
                } else {
                    conn.link.disconnect();
                    connectionsLength--;
                }
            });

            if (linkIds.length) {
                return disconnected === linkIds.length;
            } else {
                return connectionsLength === 0;
            }

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

        repairLinks: function() {
            console.log('called');
        },

        hasConnection: function(network) {
            var conn = this.connections(network);
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
                                guid: guid,
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
                        guid: guid,
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
         * Can connect to target
         */
        canConnect: function(target) {
            if (target instanceof Graph.plugin.Network) {
                var sourceVector = this.vector().guid(),
                    targetVector = target.vector().guid();

                var connections, outgoing, incoming;

                // check limit outgoing
                if (this.props.limitOutgoing > 0) {
                    connections = this.connections();
                    outgoing = _.filter(connections, function(conn){
                        return conn.type == 'outgoing';
                    });

                    if (outgoing.length + 1 > this.props.limitOutgoing) {
                        return false;
                    }
                }

                if (target.props.limitIncoming > 0) {
                    connections = target.connections();
                    
                    incoming = _.filter(connections, function(conn){
                        return conn.type == 'incoming';
                    });

                    if (incoming.length + 1 > target.props.limitIncoming) {
                        return false;
                    }
                }

                if (sourceVector != targetVector) {
                    return true;
                }
            }

            return false;
        },

        destroy: function() {
            var me = this;

            // collect garbage
            this.cached.cables = null;
            this.cached.pairs  = null;
        },

        toString: function() {
            return 'Graph.plugin.Network';
        },

        onLinkBeforeDestroy: function(e) {
            var link = e.link;
            var vector, network;

            if ((vector = link.router.source())) {
                vector.connectable().removeLink(link);
            }

            if ((vector = link.router.target())) {
                vector.connectable().removeLink(link);
            }

            link.off('beforedestroy', link.cached.beforeDestroyHandler);
            link.cached.beforeDestroyHandler = null;
        }

    });

}());
