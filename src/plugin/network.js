
(function(){
    
    var CLS_CONNECT_VALID = 'connect-valid',
        CLS_CONNECT_INVALID = 'connect-invalid',
        CLS_CONNECT_HOVER = 'connect-hover';
    
    Graph.plugin.Network = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector:  null,
            wiring: 'h:h'
        },

        links: [],
        
        cached: {
            bboxMatrix: null,
            pathMatrix: null
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
            
            _.assign(me.props, options || {});
            
            me.props.vector = guid;
            vector.addClass('graph-connectable');
            
            // setup link droppable
            
            var vendor = vector.interactable().vendor();
            
            vendor.dropzone({
                accept: _.format('.{0}, .{1}', Graph.string.CLS_LINK_HEAD, Graph.string.CLS_LINK_TAIL),
                overlap: .2
            })
            .on('dropdeactivate', function(e){
                var v = Graph.registry.vector.get(e.target);
                
                if (v) {
                    v.removeClass([CLS_CONNECT_VALID, CLS_CONNECT_INVALID, CLS_CONNECT_HOVER]);
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
                    v.removeClass([CLS_CONNECT_VALID, CLS_CONNECT_INVALID]);
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

        invalidate: function() {
            this.cached.bboxMatrix = null;
            this.cached.pathMatrix = null;
        },
        
        invalidateTrans: function() {
            for (var name in this.linking) {
                this.linking[name] = null;
            }
        },  
        
        bboxMatrix: function() {
            var matrix = this.cached.bboxMatrix;
            
            if ( ! matrix) {
                var vector = this.vector(),
                    paper  = vector.paper(),
                    matrix = vector.matrix(),
                    scope  = null;
                
                if (paper) {
                    scope = paper.viewport();
                }
                
                vector.bubble(function(curr){
                    if (scope && scope === curr) {
                        return false;
                    }
                    matrix = curr.matrix();
                });
                
                matrix = matrix.clone();
                this.cached.bboxMatrix = matrix;
            }
            
            return matrix;
        },
        
        pathMatrix: function() {
            var matrix = this.cached.pathMatrix;
            
            if ( ! matrix) {
                var vector = this.vector(),
                    paper  = vector.paper(),
                    matrix = Graph.matrix(),
                    scope  = null;
                
                if (paper) {
                    scope = paper.viewport();
                }
                
                vector.bubble(function(curr){
                    if (scope && scope === curr) {
                        return false;
                    }
                    matrix.multiply(curr.matrix());
                });
                
                this.cached.pathMatrix = matrix;
            }
            
            return matrix;
        },

        bbox: function() {
            var matrix = this.bboxMatrix(),
                path = this.vector().pathinfo().transform(matrix),
                bbox = path.bbox();
            
            matrix = path = null;
            
            return bbox;
        },

        pathinfo: function() {
            var matrix = this.pathMatrix(),
                path = this.vector().pathinfo().transform(matrix);
            
            matrix = null;
            
            return path;
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
        }

    });

}());