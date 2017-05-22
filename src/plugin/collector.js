
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
            enabled: false
        },

        constructor: function(paper) {
            var me = this;

            if ( ! paper.isPaper()) {
                throw Graph.error('Collector tool only available for paper !');
            }

            me.paper = paper;
            me.components.rubber = Graph.$('<div class="graph-rubberband">');
            me.collection = new Graph.collection.Vector();

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
                position = layout.position(),
                rubber = me.components.rubber,
                vendor = paper.interactable().vendor();

            vendor.styleCursor(false);

            vendor.draggable({

                manualStart: true,

                onstart: function(e) {
                    layout.invalidate();
                    position = layout.position();

                    var offset = {
                        x: e.clientX - position.left,
                        y: e.clientY - position.top
                    };

                    _.assign(collecting, {
                        enabled: true,
                        start: {
                            // x: e.clientX,
                            // y: e.clientY,
                            x: offset.x,
                            y: offset.y
                        },
                        end: {
                            // x: e.clientX,
                            // y: e.clientY,
                            x: offset.x,
                            y: offset.y
                        },
                        bounds: {}
                    });

                    rubber.query.css({
                        width: 0,
                        height: 0,
                        // transform: 'translate(' + (collecting.start.x - position.left) + 'px, ' + (collecting.start.y - position.top) + 'px)'
                        transform: 'translate(' + (collecting.start.x) + 'px, ' + (collecting.start.y) + 'px)'
                    });
                },

                onmove: function(e) {
                    var start = collecting.start,
                        offset = {
                            x: e.clientX - position.left,
                            y: e.clientY - position.top
                        },
                        end = {
                            // x: e.clientX,
                            // y: e.clientY
                            x: offset.x,
                            y: offset.y
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
                        // transform: 'translate(' + (bounds.x - position.left) + 'px,' + (bounds.y - position.top) + 'px)'
                        transform: 'translate(' + (bounds.x) + 'px,' + (bounds.y) + 'px)'
                    });
                },

                onend: function() {
                    
                    if ( ! collecting.enabled) return;
                    collecting.enabled = false;

                    var context = paper.guid(),
                        vectors = Graph.registry.vector.collect(context),
                        bounds = collecting.bounds;

                    var start = layout.pointerLocation({
                        clientX: bounds.x + position.left,
                        clientY: bounds.y + position.top
                    });

                    var end = layout.pointerLocation({
                        clientX: bounds.x + position.left + bounds.width,
                        clientY: bounds.y + position.top + bounds.height
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
                var target, single, vector;

                target = Graph.event.target(e);
                single = ! (e.ctrlKey || e.shiftKey);
                vector = Graph.registry.vector.get(target);

                if (vector) {
                    if ( ! vector.isSelectable()) {
                        if ( 
                            ! vector.elem.belong('graph-resizer') && 
                            ! vector.elem.belong('graph-link') && 
                            ! vector.elem.belong('graph-rotator')
                        ) {
                            if (single) {
                                me.clearCollection();
                            }
                        }
                    }
                }
            })
            .on('tap', function(e){
                var target, vector, single;
                
                target = Graph.event.target(e);
                vector = Graph.registry.vector.get(target);
                single = ! (e.ctrlKey || e.shiftKey);

                if (vector && vector.isSelectable()) {
                    if (vector.paper().state() == 'linking') {
                        me.clearCollection();
                        return;
                    }

                    if (single) {
                        me.clearCollection();
                    }

                    me.collect(vector);
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

        size: function() {
            return this.collection.size();
        },

        index: function(vector) {
            return this.collection.index(vector);
        },

        add: function(vector) {
            var offset = this.index(vector);
            vector._collector = this;
            if (offset === -1) {
                this.collection.push(vector);
            }
        },

        remove: function(vector) {
            delete vector._collector;
            this.collection.pull(vector);
        },

        collect: function(vector) {
            vector.select();
            Graph.cached.paper = this.paper.guid();
        },

        decollect: function(vector) {
            vector.deselect();
        },

        clearCollection: function() {
            var me = this,
                collection = me.collection.toArray().slice();

            _.forEach(collection, function(vector){
                me.decollect(vector);
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

        syncBeforeDrag: function(master, e) {
            var me = this;

            me.collection.each(function(v){
                if (v.plugins.dragger && v.plugins.dragger.props.enabled && v !== master) {
                    (function(){
                        // var mat = v.graph.matrix.data(),
                        //     sin = mat.sin,
                        //     cos = mat.cos;

                        var rotate = v.matrixCurrent().rotate(),
                            rad = rotate.rad,
                            sin = Math.sin(rad),
                            cos = Math.cos(rad);

                        if (v.plugins.resizer && ! v.plugins.resizer.props.suspended) {
                            v.plugins.resizer.suspend();
                        }

                        if (v.plugins.rotator && ! v.plugins.rotator.props.suspended) {
                            v.plugins.rotator.suspend();
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

                        v.fire('beforedrag', {
                            dx: e.dx *  cos + e.dy * sin,
                            dy: e.dx * -sin + e.dy * cos,
                            master: false
                        });

                    }());
                }
            });

            me.fire('beforedrag');
        },

        syncDrag: function(master, e) {
            var me = this;

            me.collection.each(function(v){
                if (v.plugins.dragger && v.plugins.dragger.props.enabled && v !== master) {
                    (function(v, e){
                        var dx = e.tx *  v.syncdrag.cos + e.ty * v.syncdrag.sin,
                            dy = e.tx * -v.syncdrag.sin + e.ty * v.syncdrag.cos;

                        if (v.plugins.dragger.props.ghost) {
                            v.plugins.dragger.helper().translate(dx, dy).commit();
                        } else {
                            v.translate(dx, dy).commit();
                        }

                        v.syncdrag.tdx += dx;
                        v.syncdrag.tdy += dy;

                        v.fire('drag', {
                            dx: dx,
                            dy: dy,
                            master: false
                        });

                    }(v, e));
                }
            });

        },

        syncAfterDrag: function(master, e) {
            var me = this;

            me.collection.each(function(v){
                if (v.plugins.dragger && v.plugins.dragger.props.enabled && v !== master) {
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

                        v.fire('afterdrag', {
                            dx: v.syncdrag.tdx,
                            dy: v.syncdrag.tdy,
                            batch: true,
                            master: false
                        });

                        v.removeClass('dragging');

                        delete v.syncdrag;

                    }(v, e));
                }
            });

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
