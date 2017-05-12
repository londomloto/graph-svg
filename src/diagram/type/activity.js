(function(){

    var Diagram = Graph.diagram.type.Activity = Graph.extend(Graph.diagram.type.Diagram, {

        props: {
            name: 'Activity Diagram',
            description: 'No diagram description',
            cover: null
        },

        rendering: {
            active: false
        },

        metadata: {
            type: 'diagram.activity'
        },

        drawShape: function(namespace, options) {
            var paper = this.paper();

            // already drawing
            if (this.drawing.dragging) {
                this.drawing.dragging = false;

                this.drawing.shape.off('beforedrag', this.drawing.beforeDrag);
                this.drawing.shape.off('aferdrag', this.drawing.afterDrag);

                this.drawing.beforeDrag = null;
                this.drawing.afterDrag = null;

                // mark as invalid
                this.drawing.shape.remove();
                this.drawing.shape = null;
            }

            var clazz, shape, movable;

            options = options || {};
            movable = true;

            if (namespace == 'Graph.shape.activity.Lane') {
                var shapes = this.getShapes();
                if (shapes.size() && ! this.hasLane()) {
                    var bbox = shapes.bbox().toJson();
                    
                    options.left = bbox.x - 40;
                    options.top = bbox.y - 20;

                    movable = false;
                    bbox = null;
                }
                shapes = null;
            } else if (namespace == 'Graph.shape.common.Label') {
                movable = false;
            }

            clazz = Graph.ns(namespace);
            shape = Graph.factory(clazz, [options]);

            // check again...
            if (movable) {
                movable = !!shape.draggable().plugin();
            }

            var me = this;

            this.drawing.beforeDrag = function(e) {
                shape.component().addClass('picking');
            };

            this.drawing.afterDrag = function() {
                var timer;

                timer = _.delay(function(shape){
                    var valid = false;

                    clearTimeout(timer);
                    timer = null;

                    if (shape.is('activity.lane')) {
                        valid = true;
                    } else {
                        if (me.hasLane()) {
                            var parent = shape.parent();
                            valid = parent && parent.is('activity.lane');
                        } else {
                            valid = true;
                        }
                    }

                    if ( ! valid) {
                        Graph.message("Can't drop shape outside lane or pool", 'warning');
                        shape.remove();
                        shape = null;
                    }
                }, 0, me.drawing.shape);

                shape.component().removeClass('picking');

                me.drawing.beforeDrag = null;
                me.drawing.afterDrag = null;
                me.drawing.dragging = false;
                me.drawing.shape = null;

            };

            if (movable) {
                this.drawing.dragging = true;
                this.drawing.shape = shape;

                shape.render(paper);

                var draggable = shape.draggable().plugin(),
                    snappcomp = shape.snappable().component();

                draggable.start();

                if (options.left !== undefined && options.top !== undefined) {
                    var center = shape.center(),
                        dx = options.left - center.x,
                        dy = options.top - center.y;
                    shape.translate(dx, dy);    

                    if (snappcomp) {
                        snappcomp.dirty(true);
                    }
                }

                shape.one('beforedrag', this.drawing.beforeDrag);
                shape.one('afterdrag', this.drawing.afterDrag);

            } else {

                me.drawing.dragging = false;
                me.drawing.shape = null;
                me.drawing.beforeDrag = null;
                me.drawing.afterDrag = null;
                
                if (shape.is('activity.lane')) {
                    var children = me.getShapes().toArray();

                    shape.render(paper);
                    shape.addChild(children);
                    children = null;

                } else if (shape.is('common.label')) {

                    var lanes = me.findShapeBy(function(shape){ return shape.is('activity.lane'); }),
                        coord = {x: shape.props.left, y: shape.props.top},
                        found = false;

                    shape.render(paper);

                    /*if (lanes.length) {
                        var box, i, j;

                        for (i = 0, j = lanes.length; i < j; i++) {
                            box = lanes[i].bbox().toJson();
                            
                            if (Graph.util.isBoxContainsPoint(box, coord)) {
                                found = lanes[i];
                                break;
                            }
                        }

                        if (found) {
                            found.addChild(shape);
                        } else {
                            Graph.message("Can't drop shape outside lane or pool", 'warning');
                            shape.remove();
                            shape = null;
                        }

                    }*/
                }
            }

            return {
                movable: movable,
                shape: shape
            };
        },

        hasLane: function() {
            return this.findShapeBy(function(shape){ return shape.is('activity.lane'); }).length !== 0;
        },

        render: function(data) {
            var me = this,
                paper = this.paper(),
                parser = new Graph.diagram.Parser(data);

            if (this.rendering.active) {
                return;
            }

            this.rendering.active = true;
            this.empty();

            parser.props().each(function(v, k){
                me.props[k] = v;
            });

            render(parser).then(function(rendered){
                parser.links().each(function(item){
                    var props = item.props,
                        params = JSON.parse(item.params),
                        sourceShape = rendered[props.source_id],
                        targetShape = rendered[props.target_id];

                    if (sourceShape && targetShape) {
                        var sourceNetwork = sourceShape.connectable().plugin(),
                            targetNetwork = targetShape.connectable().plugin();

                        if (sourceNetwork && targetNetwork) {
                            var link = sourceNetwork.connect(targetNetwork, null, null, item.props);
                            link.params = params;
                        }
                    }
                })
                
                me.rendering.active = false;

                parser.destroy();
                parser = null;

                me.paper().snapper().refresh();
            }); 

            ///////// RENDERER /////////
            
            function render(parser) {
                var def = Graph.defer(),
                    rendered = {},
                    pools = {},
                    count = 0,
                    tick = 0;

                parser.shapes().each(function(item, index, total){
                    var props = item.props,
                        params = JSON.parse(item.params),
                        clazz = Graph.ns(props.type);

                    var shape, delay;

                    delay = _.delay(function(clazz, props, params){
                        clearTimeout(delay);
                        delay = null;

                        shape = Graph.factory(clazz, [props]);
                        shape.params = params;
                        shape.render(paper);

                        if (props.client_pool) {
                            if (pools[props.client_pool] === undefined) {
                                pools[props.client_pool] = [];
                            }
                            pools[props.client_pool].push(shape);
                        }

                        if (rendered[props.parent_id] !== undefined) {
                            rendered[props.parent_id].addChild(shape, false);
                            
                            var netcom = shape.connectable().component();

                            if (netcom) {
                                netcom.dirty(true);
                            }
                        }

                        rendered[props.id] = shape;
                        count++;
                        
                        if (count === total) {
                            
                            var lanes, key, pool;

                            for (key in pools) {
                                lanes = pools[key];
                                pool  = null;

                                if (lanes.length > 1) {
                                    _.forEach(lanes, function(lane, idx){
                                        if ( ! pool) {
                                            pool = lane.pool();
                                        } else {
                                            lane.tree.pool = pool;
                                            pool.insert(lane);
                                        }
                                    });
                                }

                                if (pool) {
                                    pool.invalidate();
                                }
                            }

                            def.resolve(rendered);
                        }

                    }, (tick * 100), clazz, props, params);

                    tick++;
                });

                return def.promise();
            };  
        },  

        toString: function() {
            return 'Graph.diagram.type.Activity';
        },

        toJson: function() {
            var diagram = {
                props: {
                    id: this.props.id,
                    name: this.props.name,
                    type: this.toString(),
                    description: this.props.description,
                    cover: this.props.cover
                },
                shapes: [],
                links: []
            };

            var shapes = this.getShapes(),
                links = this.getLinks();

            shapes.each(function(shape){
                var data = shape.toJson();
                diagram.shapes.push({
                    props: data.props,
                    params: data.params
                });
            });

            links.each(function(link){
                var data = link.toJson();
                diagram.links.push({
                    props: data.props,
                    params: data.params
                });
            });

            shapes = links = null;
            return diagram;
        }
    });
    
}());

