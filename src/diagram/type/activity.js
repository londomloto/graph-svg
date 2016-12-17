(function(){

    var Diagram = Graph.diagram.type.Activity = Graph.extend(Graph.diagram.type.Diagram, {

        props: {
            name: 'Activity Diagram',
            description: 'Example of activity diagram'
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
            if (this.drawing.enabled) {
                
                this.drawing.enabled = false;
                this.drawing.shape.off('afterdrag', this.drawing.dropHandler);
                this.drawing.dropHandler = null;

                // mark as invalid
                this.drawing.shape.remove();
                this.drawing.shape = null;
            }

            var clazz, shape, movable;

            options = options || {};
            movable = true;

            if (namespace == 'Graph.shape.activity.Lane') {
                if ( ! this.hasLane() && this.getShapes().length) {
                    var bbox = this.shapes.bbox().toJson();
                    
                    options.left = bbox.x - 40;
                    options.top = bbox.y - 20;

                    movable = false;
                    bbox = null;
                }
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

            this.drawing.dropHandler = function() {
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

                me.drawing.dropHandler = null;
                me.drawing.enabled = false;
                me.drawing.shape = null;

            };

            if (movable) {
                this.drawing.enabled = true;
                this.drawing.shape = shape;

                if (options.left !== undefined && options.top !== undefined) {
                    var center = shape.center(),
                        dx = options.left - center.x,
                        dy = options.top - center.y;

                    shape.translate(dx, dy);    
                }
                
                shape.render(paper);
                
                var draggable = shape.draggable().plugin();
                draggable.start();

                shape.one('afterdrag', this.drawing.dropHandler);

            } else {
                me.drawing.enabled = false;
                me.drawing.shape = null;
                me.drawing.dropHandler = null;

                if (shape.is('activity.lane')) {
                    shape.render(paper);

                    var children = me.shapes.toArray().slice();    
                    shape.addChild(children);
                    children = null;

                } else if (shape.is('common.label')) {
                    var lanes = me.findShapeBy(function(shape){ return shape.is('activity.lane'); }),
                        coord = {x: shape.props.left, y: shape.props.top},
                        found = false;
                    
                    shape.render(paper);

                    if (lanes.length) {
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

                    }
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
                        sourceShape = rendered[props.source_id],
                        targetShape = rendered[props.target_id];

                    if (sourceShape && targetShape) {
                        var sourceNetwork = sourceShape.connectable().plugin(),
                            targetNetwork = targetShape.connectable().plugin();

                        if (sourceNetwork && targetNetwork) {
                            sourceNetwork.connect(targetNetwork, null, null, item.props);
                        }
                    }
                })
                
                me.rendering.active = false;

                parser.destroy();
                parser = null;
            }); 

            ///////// RENDERER /////////
            
            function render(parser) {
                var def = Graph.defer(),
                    rendered = {},
                    counter = 0;

                parser.shapes().each(function(item, index, total){
                    var props = item.props,
                        clazz = Graph.ns(props.type);

                    var shape;

                    if (clazz) {
                        var delay;

                        delay = _.delay(function(index, clazz, props){
                            clearTimeout(delay);
                            delay = null;

                            shape = Graph.factory(clazz, [props]);
                            shape.render(paper);

                            if (rendered[props.parent_id] !== undefined) {
                                rendered[props.parent_id].addChild(shape, false);
                            }

                            rendered[props.id] = shape;

                            if (index === total - 1) {
                                def.resolve(rendered);
                            }

                        }, (counter * 100), index, clazz, props);
                        
                    }
                    counter++;
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
                    description: this.props.description
                },
                shapes: [],
                links: []
            };

            _.forEach(this.getShapes(), function(shape){
                var data = shape.toJson();
                diagram.shapes.push({
                    props: data.props,
                    params: data.params
                });
            });

            _.forEach(this.getLinks(), function(link){
                var data = link.toJson();
                diagram.links.push({
                    props: data.props,
                    params: data.params
                });
            });

            return diagram;
        }
    });
    
}());

