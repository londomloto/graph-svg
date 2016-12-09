
(function(){

    Graph.plugin.Collector = Graph.extend(Graph.plugin.Plugin, {

        props: {
            enabled: false,
            suspended: true,
            rendered: false,
            activator: 'tool',
            ready: false
        },

        paper: null,

        collection: [],

        components: {
            rubber: null
        },

        collecting: {
            
        },

        constructor: function(paper) {
            var me = this;

            if ( ! paper.isPaper()) {
                throw Graph.error('Lasso tool only available for paper !');
            }
            
            me.paper = paper;
            me.components.rubber = Graph.$('<div class="graph-rubberband">');

            paper.on('keynavdown', _.bind(me.onKeynavDown, me));
            paper.on('keynavup', _.bind(me.onKeynavUp, me));

            if (me.paper.props.rendered) {
                me.setup();
            } else {
                me.paper.on('render', function(){
                    me.setup();
                });
            }
        },

        enable: function(activator) {
            this.props.enabled = true;
            this.props.activator = activator;

            this.paper.cursor('crosshair');
            this.paper.state('collecting');
        },

        disable: function() {
            this.props.enabled = false;
            this.paper.cursor('default');
        },

        setup: function() {
            var me = this;

            if (me.props.ready) {
                return;
            }

            me.props.ready = true;

            var collecting = me.collecting,
                paper = me.paper,
                layout = paper.layout(),
                offset = layout.offset(),
                rubber = me.components.rubber,
                vendor = paper.interactable().vendor();

            vendor.styleCursor(false);

            vendor.draggable({

                manualStart: true,

                onstart: function(e) {

                    _.assign(collecting, {
                        start: {
                            x: e.clientX,
                            y: e.clientY,    
                        },
                        end: {
                            x: e.clientX,
                            y: e.clientY,    
                        },
                        bounds: {}
                    });

                    rubber.query.css({
                        width: 0,
                        height: 0,
                        transform: 'translate(' + (collecting.start.x - offset.left) + 'px, ' + (collecting.start.y - offset.top) + 'px)'   
                    });
                },
                
                onmove: function(e) {
                    var start = collecting.start,
                        end = {
                            x: e.clientX,
                            y: e.clientY
                        };

                    var bounds;

                    if ((start.x <= end.x && start.y < end.y) || (start.x < end.x && start.y <= end.y)) {
                        bounds = {
                            x: start.x,
                            y: start.y,
                            width:  end.x - start.x,
                            height: end.y - start.y
                        };
                    } else if ((start.x >= end.x && start.y < end.y) || (start.x > end.x && start.y <= end.y)) {
                        bounds = {
                            x: end.x,
                            y: start.y,
                            width:  start.x - end.x,
                            height: end.y - start.y
                        };
                    } else if ((start.x <= end.x && start.y > end.y) || (start.x < end.x && start.y >= end.y)) {
                        bounds = {
                            x: start.x,
                            y: end.y,
                            width:  end.x - start.x,
                            height: start.y - end.y
                        };
                    } else if ((start.x >= end.x && start.y > end.y) || (start.x > end.x && start.y >= end.y)) {
                        bounds = {
                            x: end.x,
                            y: end.y,
                            width:  start.x - end.x,
                            height: start.y - end.y
                        };
                    } else {
                        bounds = {
                            x: end.x,
                            y: end.y,
                            width:  0,
                            height: 0
                        };
                    }

                    collecting.bounds = bounds;

                    rubber.query.css({
                        width:  bounds.width,
                        height: bounds.height,
                        transform: 'translate(' + (bounds.x - offset.left) + 'px,' + (bounds.y - offset.top) + 'px)'
                    });
                },

                onend: function() {
                    var context = paper.guid(),
                        vectors = Graph.registry.vector.collect(context),
                        bounds = collecting.bounds,
                        scale = layout.scale();

                    var start = layout.grabLocation({
                        clientX: bounds.x, 
                        clientY: bounds.y
                    });

                    var end = layout.grabLocation({
                        clientX: bounds.x + bounds.width,
                        clientY: bounds.y + bounds.height
                    });

                    var bbox = new Graph.lang.BBox({
                        x: start.x,
                        y: start.y,
                        x2: end.x,
                        y2: end.y,
                        width: end.x - start.x,
                        height: end.y - start.y
                    });

                    bbox.transform(paper.viewport().matrix());
                    
                    _.forEach(vectors, function(v){
                        if (v.guid() != context && v.isSelectable() && ! v.isGroup()) {
                            if (bbox.contains(v)) {
                                me.collect(v, true);
                            }
                        }
                    });

                    if (me.props.activator == 'tool') {
                        paper.tool().activate('panzoom');    
                    }

                    bbox = null;
                    me.suspend();
                }
            })
            .on('down', function(e){
                var single = ! (e.ctrlKey || e.shiftKey),
                    vector = Graph.registry.vector.get(e.target);

                if (vector) {
                    if ( ! vector.isSelectable()) {
                        if ( ! vector.elem.belong('graph-resizer') && ! vector.elem.belong('graph-link')) {
                            if (single) {
                                me.clearCollection(); 
                            }
                        }
                    }
                }
            })
            .on('tap', function(e){
                var vector = Graph.registry.vector.get(e.target),
                    single = ! (e.ctrlKey || e.shiftKey);
                
                if (vector && vector.isSelectable()) {
                    if (vector.paper().state() == 'linking') {
                        me.clearCollection();
                        return;
                    }

                    if (single) {
                        me.clearCollection();
                    }
                    
                    me.collect(vector, ! single);
                }

            }, true)
            .on('move', function(e){
                var i = e.interaction;

                if (me.props.enabled) {
                    if (i.pointerIsDown && ! i.interacting()) {

                        var action = {name: 'drag'};

                        // -- workaround for a bug in v1.2.6 of interact.js
                        i.prepared.name = action.name;
                        i.setEventXY(i.startCoords, i.pointers);

                        if (e.currentTarget === paper.node()) {
                            if (me.props.suspended) {
                                me.resume();
                            }
                            i.start(action, e.interactable, rubber.node());
                        }
                    }
                }
            });
        },

        render: function() {
            var me = this;

            if (me.props.rendered) {
                return;
            }

            me.paper.container().append(me.components.rubber);
            me.props.rendered = true;
        },

        collect: function(vector, batch) {
            var me = this, offset;

            vector.lasso = this;
            vector.batch = batch;

            vector.select(batch);

            offset = _.indexOf(this.collection, vector);

            if (offset === -1) {
                this.collection.push(vector);
            }

            Graph.cached.paper = me.paper.guid();
        },

        decollect: function(vector) {
            var batch, offset;
            
            batch = vector.batch;

            delete vector.lasso;
            delete vector.batch;

            vector.deselect(batch);
            offset = _.indexOf(this.collection, vector);

            if (offset > -1) {
                this.collection.splice(offset, 1);
            }
        },

        clearCollection: function(except) {
            var me = this, 
                collection = me.collection.slice();

            _.forEach(collection, function(v){
                if (v !== except) {
                    me.decollect(v);
                }
            });

            collection = null;
        },

        suspend: function() {
            this.props.suspended = true;
            this.components.rubber.detach();
        },

        resume: function() {
            if (this.props.suspended) {
                this.props.suspended = false;
                if ( ! this.props.rendered) {
                    this.render();
                } else {
                    this.paper.container().append(this.components.rubber);
                }
            }
        },

        syncDragStart: function(origin, e) {
            var me = this;

            _.forEach(me.collection, function(v){
                if (v.plugins.dragger && v.plugins.dragger.props.enabled && v !== origin) {
                    (function(){
                        var mat = v.graph.matrix.data(),
                            sin = mat.sin,
                            cos = mat.cos;

                        if (v.plugins.resizer && ! v.plugins.resizer.suspended) {
                            v.plugins.resizer.suspend();
                        }

                        if (v.plugins.dragger.props.ghost) {
                            v.plugins.dragger.resume();
                        }

                        v.syncdrag = {
                            sin: sin,
                            cos: cos,
                            tdx: 0,
                            tdy: 0
                        };

                        v.addClass('dragging');
                        
                        v.fire('dragstart', {
                            dx: e.dx *  cos + e.dy * sin,
                            dy: e.dx * -sin + e.dy * cos,
                            batch: true
                        });

                    }());
                }
            });

            me.fire('beforedrag');
        },

        syncDragMove: function(origin, e) {
            var me = this, dx, dy;

            _.forEach(me.collection, function(v){
                if (v.plugins.dragger && v.plugins.dragger.props.enabled && v !== origin) {
                    (function(v, e){
                        var dx = e.ox *  v.syncdrag.cos + e.oy * v.syncdrag.sin,
                            dy = e.ox * -v.syncdrag.sin + e.oy * v.syncdrag.cos;

                        if (v.plugins.dragger.props.ghost) {
                            v.plugins.dragger.helper().translate(e.ox, e.oy).commit();
                        } else {
                            v.translate(dx, dy).commit();
                        }

                        v.syncdrag.tdx += dx;
                        v.syncdrag.tdy += dy;

                        v.fire('dragmove', {
                            dx: dx,
                            dy: dy,
                            batch: true
                        });

                    }(v, e));    
                }
            });

        },

        syncDragEnd: function(origin, e) {
            var me = this;

            _.forEach(me.collection, function(v, i){
                if (v.plugins.dragger && v.plugins.dragger.props.enabled && v !== origin) {
                    (function(v, e){
                        var batchSync = v.plugins.dragger.props.batchSync,
                            ghost = v.plugins.dragger.props.ghost;

                        if (ghost) {
                            if (batchSync) {
                                v.translate(v.syncdrag.tdx, v.syncdrag.tdy).commit();    
                            }
                            v.plugins.dragger.suspend();
                        }
                        
                        if ( ! batchSync) {
                            v.dirty(true);    
                        }

                        v.fire('dragend', {
                            dx: v.syncdrag.tdx,
                            dy: v.syncdrag.tdy,
                            batch: true
                        });
                        
                        v.removeClass('dragging');
                        
                        delete v.syncdrag;

                    }(v, e));
                }
            });

            e.origin = origin;
            e.type = 'afterdrag';
            
            me.fire(e);
        },

        toString: function() {
            return 'Graph.plugin.Collector';
        },

        onKeynavDown: function(e) {
            if (e.keyCode == Graph.event.SHIFT && this.props.activator != 'key') {
                var tool = this.paper.tool(),
                    curr = tool.current();

                if (curr != 'collector') {
                    tool.activate('collector', 'key');
                }
            }
        },

        onKeynavUp: function(e) {
            if (e.keyCode == Graph.event.SHIFT) {
                var tool = this.paper.tool(),
                    curr = tool.current();

                if (curr == 'collector') {
                    this.props.activator = 'tool';
                    tool.activate('panzoom');
                }
            }
        }   

    });

}());