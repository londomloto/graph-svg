
(function(){

    Graph.plugin.Collector = Graph.extend(Graph.plugin.Plugin, {

        props: {
            x: 0,
            y: 0,
            x2: 0,
            y2: 0,
            dir: null,
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            offset: [0, 0],
            enabled: false,
            suspended: true,
            rendered: false,
            activator: 'tool'
        },

        paper: null,
        collection: [],

        components: {
            rubber: null
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
            var me = this, paper = me.paper;

            if (me.plugin) {
                return;
            }
            // me.tree.container.on('scroll', function(){
            //     var top = me.tree.container.scrollTop(),
            //         left = me.tree.container.scrollLeft(),
            //         dy = top - me.props.top,
            //         dx = left - me.props.left;

            //     me.props.height += dy;
            //     me.props.width += dx;

            //     me.props.top = top;
            //     me.props.left = left;
            // });

            me.plugin = paper.interactable().draggable({
                manualStart: true,

                onstart: function(e) {
                    me.reset();
                    me.resize(0, 0);

                    var offset = paper.tree.container.offset(),   
                        x = e.pageX - offset.left,
                        y = e.pageY - offset.top;

                    me.translate(x, y);
                    me.props.offset = [x, y];
                },
                
                onmove: function(e) {
                    var dw = 0,
                        dh = 0,
                        dx = 0,
                        dy = 0;

                    if ( ! me.props.dir) {
                        switch(true) {
                            case (e.dx > 0 && e.dy > 0):
                                me.props.dir = 'nw';
                                break;
                            case (e.dx < 0 && e.dy < 0):
                                me.props.dir = 'se';
                                break;
                            case (e.dx < 0 && e.dy > 0):
                                me.props.dir = 'ne';
                                break;
                            case (e.dx > 0 && e.dy < 0):
                                me.props.dir = 'sw';
                                break;
                        }
                    } else {
                        switch(me.props.dir) {
                            case 'nw':
                                dw = e.dx;
                                dh = e.dy;
                                dx = 0;
                                dy = 0;
                                break;
                            case 'ne':
                                dw = -e.dx;
                                dh =  e.dy;
                                dx =  e.dx;
                                dy =  0;
                                break;
                            case 'se':
                                dw = -e.dx;
                                dh = -e.dy;
                                dx =  e.dx;
                                dy =  e.dy;
                                break;
                            case 'sw':
                                dw =  e.dx;
                                dh = -e.dy;
                                dx =  0;
                                dy =  e.dy;
                                break;
                        }
                        
                        me.props.width  += dw;
                        me.props.height += dh;

                        if (me.props.width >= 0 && me.props.height >= 0) {
                            me.translate(dx, dy); 
                            me.resize(me.props.width, me.props.height);
                        } else {
                            me.props.width  -= dw;
                            me.props.height -= dh;
                        }
                        
                    }
                },

                onend: function() {
                    var bbox

                    me.props.x2 = me.props.x + me.props.width;
                    me.props.y2 = me.props.y + me.props.height;

                    bbox = me.bbox();
                    
                    paper.cascade(function(c){
                        if (c !== paper && c.isSelectable() && ! c.isGroup()) {
                            if (bbox.contains(c)) {
                                me.collect(c);
                            }
                        }
                    });

                    if (me.props.activator == 'tool') {
                        paper.tool().activate('panzoom');    
                    }

                    me.resize(0, 0);
                    me.suspend();
                }
            })
            .on('down', function(e){
                var single = ! (e.ctrlKey || e.shiftKey),
                    vector = Graph.registry.vector.get(e.target);

                if (vector) {
                    if ( ! vector.isSelectable()) {
                        if ( ! vector.elem.belong('graph-resizer') && ! vector.elem.belong('graph-link')) {
                            single && me.clearCollection();    
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
                    
                    me.collect(vector);
                }

            }, true)
            .on('move', function(e){
                var i = e.interaction;

                if (me.props.enabled) {
                    if (i.pointerIsDown && ! i.interacting()) {
                        if (e.currentTarget === paper.node()) {
                            if (me.props.suspended) {
                                me.resume();
                            }
                            i.start({name: 'drag'}, e.interactable, me.components.rubber.node());        
                        }
                    }
                }
            });

            me.plugin.styleCursor(false);
        },

        render: function() {
            var me = this;

            if (me.props.rendered) {
                return;
            }

            me.paper.container().append(me.components.rubber);
            me.props.rendered = true;
        },

        bbox: function() {
            var props = this.props;
            
            return Graph.bbox({
                x: props.x,
                y: props.y,
                x2: props.x2,
                y2: props.y2,
                width: props.width,
                height: props.height
            });
        },

        collect: function(vector, silent) {
            var me = this, offset;

            vector.$collector = this;
            vector.select();

            silent = _.defaultTo(silent, false);
            offset = _.indexOf(this.collection, vector);

            if (offset === -1) {
                this.collection.push(vector);
                if ( ! silent) {
                    vector.fire('collect');
                }
            }
        },

        decollect: function(vector) {
            var offset;
            
            vector.$collector = null;
            vector.deselect();

            offset = _.indexOf(this.collection, vector);

            if (offset > -1) {
                this.collection.splice(offset, 1);
                vector.fire('decollect');
            }
        },

        clearCollection: function(except) {
            var me = this;
            me.paper.cascade(function(c){
                if (c !== me.paper && c !== except && c.props.selected) {
                    me.decollect(c);
                }
            });
        },

        suspend: function() {
            this.props.suspended = true;
            this.components.rubber.detach();
            // this.components.rubber.removeClass('visible');
        },

        resume: function() {
            this.props.suspended = false;

            if ( ! this.props.rendered) {
                this.render();
            } else {
                this.paper.container().append(this.components.rubber);
                // this.components.rubber.addClass('visible');
            }
        },

        reset: function() {
            var top = this.paper.container().scrollTop(),
                left = this.paper.container().scrollLeft();

            this.props.x = 0;
            this.props.y = 0;
            this.props.x2 = this.props.x,
            this.props.y2 = this.props.y,
            this.props.top = top;
            this.props.left = left;
            this.props.dir = null;
            this.props.width = 0;
            this.props.height = 0;
            this.props.offset = [0, 0];
        },

        translate: function(dx, dy) {
            this.props.x += dx;
            this.props.y += dy;
            
            this.components.rubber.css({
                transform: 'translate(' + this.props.x + 'px,' + this.props.y + 'px)'
            });
        },

        resize: function(width, height) {
            this.components.rubber.width(width).height(height);
        },

        syncDragStart: function(origin, e) {
            var me = this;

            _.forEach(me.collection, function(v){
                if (v.plugins.dragger && v.plugins.dragger.props.enabled && v !== origin) {
                    (function(){
                        var mat = v.graph.matrix.data(),
                            sin = mat.sin,
                            cos = mat.cos;

                        if (v.plugins.resizer) {
                            v.plugins.resizer.redraw();
                            v.plugins.resizer.suspend();
                        }

                        if (v.plugins.dragger.components.helper) {
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
                            dy: e.dx * -sin + e.dy * cos
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

                        if (v.plugins.dragger.components.helper) {
                            v.plugins.dragger.helper().translate(e.ox, e.oy).commit();
                        } else {
                            v.translate(dx, dy).commit();
                        }

                        v.syncdrag.tdx += dx;
                        v.syncdrag.tdy += dy;

                        v.fire('dragmove', {
                            dx: dx,
                            dy: dy
                        });

                    }(v, e));    
                }
            });

        },

        syncDragEnd: function(origin, e) {
            var me = this;

            _.forEach(me.collection, function(v){
                if (v.plugins.dragger && v.plugins.dragger.props.enabled && v !== origin) {
                    (function(v, e){
                        var manual = v.plugins.dragger.props.manual,
                            helper = v.plugins.dragger.components.helper;

                        if (helper) {
                            if ( ! manual) {
                                v.translate(v.syncdrag.tdx, v.syncdrag.tdy).commit();    
                            }
                            v.plugins.dragger.suspend();
                        }
                        
                        if ( ! manual) {
                            v.dirty(true);    
                        }

                        if (v.plugins.resizer) {
                            v.plugins.resizer.resume();
                        }

                        v.fire('dragend', {
                            dx: v.syncdrag.tdx,
                            dy: v.syncdrag.tdy
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