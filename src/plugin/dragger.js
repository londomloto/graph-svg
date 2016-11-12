
(function(){

    Graph.plugin.Dragger = Graph.extend(Graph.plugin.Plugin, {
        
        props: {
            ready: false,
            manual: false,
            
            ghost: false,
            vector: null,
            enabled: true,
            rendered: false,
            suspended: true,
            inertia: false,
            bound: false,
            grid: null,
            axis: false,
            cursor: 'move',

            dragClass: '',

            // batching operation
            batchSync: true
        },

        rotation: {
            deg: 0,
            rad: 0,
            sin: 0,
            cos: 1
        },

        scaling: {
            x: 1,
            y: 1
        },

        trans: {
            vector: null,
            paper: null,
            helper: null,
            dx: 0,
            dy: 0
        },

        components: {
            holder: null,
            helper: null
        },
        
        constructor: function(vector, options) {
            var me = this;

            vector.addClass('graph-draggable');
            me.props.vector = vector.guid();

            options = _.extend({
                inertia: false
            }, options || {});

            _.forEach(['axis', 'grid', 'bbox', 'ghost'], function(name){
                if (options[name] !== undefined) {
                    me.props[name] = options[name];
                }
            });
            
            _.assign(me.props, options);

            me.cached.snapping = null;
            me.cached.origin = null;

            me.initComponent();

            vector.on('render.dragger', _.bind(me.onVectorRender, me));
            
            if (vector.props.rendered) {
                me.setup();
            }
        },
        
        holder: function() {
            return Graph.registry.vector.get(this.components.holder);
        },

        helper: function() {
            return Graph.registry.vector.get(this.components.helper);
        },

        initComponent: function() {
            var me = this, comp = me.components;
            var holder, helper;

            if (me.props.ghost) {
                holder = (new Graph.svg.Group())
                    .addClass('graph-dragger')
                    .removeClass('graph-elem graph-elem-group')
                    .traversable(false)
                    .selectable(false);

                var style = 'graph-dragger-helper' + (me.props.dragClass ? ' ' + me.props.dragClass : '');

                helper = (new Graph.svg.Rect(0, 0, 0, 0, 0))
                    .addClass(style)
                    .removeClass('graph-elem graph-elem-rect')
                    .traversable(false)
                    .selectable(false)
                    .clickable(false)
                    .render(holder);

                style = null;

                helper.elem.data(Graph.string.ID_VECTOR, this.vector().guid());

                comp.holder = holder.guid();
                comp.helper = helper.guid();

                holder = null;
                helper = null;
            }
        },

        setup: function() {
            var me, vector, vendor, paper, options;

            if (this.props.ready) {
                return;
            }

            me = this;
            vector = me.vector();
            paper = vector.paper();
            options = {};

            _.extend(options, {
                manualStart: true,
                onstart: _.bind(me.onDragStart, me),
                onmove: _.bind(me.onDragMove, me),
                onend: _.bind(me.onDragEnd, me)
            });

            vendor = vector.interactable().vendor();
            vendor.draggable(options);
            vendor.styleCursor(false);

            me.cached.origin   = vendor.origin();
            me.cached.snapping = [];
            
            vendor.on('down', function draggerDown(e){
                e.preventDefault();
                // e.stopPropagation();
            });

            if ( ! me.props.manual) {
                vendor.on('move', _.bind(me.onPointerMove, me, _, vector));    
            }
            
            var matrix = vector.globalMatrix(),
                rotate = matrix.rotate(),
                scale  = matrix.scale();

            me.rotate(rotate.deg);
            me.scale(scale.x, scale.y);
            
            if (me.props.grid) {
                me.snap({
                    mode: 'grid',
                    x: me.props.grid[0],
                    y: me.props.grid[1]
                });
            }

            me.props.ready = true;
        },

        enable: function() {
            this.props.enabled = true;
        },

        disable: function() {
            this.props.enabled = false;
        },

        ghost: function(ghost) {
            if (ghost === undefined) {
                return this.props.ghost;
            }
            this.props.ghost = ghost;
            return this;
        },

        render: function() {
            var me = this, vector = me.vector();

            if ( ! me.props.rendered) {
                me.props.rendered = true;
                me.holder().render(vector.parent());
            }

            if (me.props.ghost) {
                me.redraw();
            }   
            
        },

        suspend: function() {
            this.props.suspended = true;
            this.holder().elem.detach();
        },

        resume: function() {
            this.props.suspended = false;

            if ( ! this.props.rendered) {
                this.render();
            } else {
                this.vector().parent().elem.append(this.holder().elem);
                this.redraw();
            }
        },

        redraw: function() {
            var vector = this.vector(),
                helper = this.helper();

            if (helper) {
                var vbox = vector.bbox().toJson(),
                    hbox = helper.bbox().toJson();

                var dx = vbox.x - hbox.x,
                    dy = vbox.y - hbox.y;

                helper.translate(dx, dy).commit();

                helper.attr({
                    width: vbox.width,
                    height: vbox.height
                });
            }
        },

        rotate: function(deg) {
            var rad = Graph.util.rad(deg);
            this.rotation.deg = deg;
            this.rotation.rad = rad;
            this.rotation.sin = Math.sin(rad);
            this.rotation.cos = Math.cos(rad);
        },

        scale: function(sx, sy) {
            sy = _.defaultTo(sy, sx);
            this.scaling.x = sx;
            this.scaling.y = sy;
        },

        origin: function(origin) {
            if (origin === undefined) {
                return this.cached.origin;
            }

            this.cached.origin = origin;

            var vendor = this.vector().interactable().vendor();

            if (vendor) {
                vendor.origin(origin);
            }
        },

        snap: function(snap, end) {

            if (snap === undefined) {
                return this.cached.snapping;
            }

            if (end === undefined) {
                end = false;
            }

            var me = this, snaps = [];

            // save original request
            this.cached.snapping = snap;

            if (_.isArray(snap)) {
                _.forEach(snap, function(s){
                    snaps.push(fixsnap(s));
                });
            } else {
                snaps.push(fixsnap(snap));
            }

            var vendor = this.vector().interactable().vendor();

            if (vendor) {
                vendor.setOptions('snap', {
                    targets: snaps,
                    endOnly: end
                });
            }

            /////////
            
            function fixsnap(snap) {
                
                if (_.isFunction(snap)) {
                    return snap;
                }
                
                snap.mode = _.defaultTo(snap.mode, 'anchor');
                
                if (snap.mode == 'grid') {
                    if (me.props.axis == 'x') {
                        snap.y = 0;
                    } else if (me.props.axis == 'y') {
                        snap.x = 0;
                    }
                    snap = interact.createSnapGrid({x: snap.x, y: snap.y});
                } else {
                    snap.range = _.defaultTo(snap.range, 20);
                }
                return snap;
            }
        },

        resetSnap: function() {
            this.snaps = [];

            this.snap({
                mode: 'grid',
                x: this.props.grid[0],
                y: this.props.grid[1]
            });
        },

        bound: function(bound) {
            
        },

        onVectorRender: function() {
            this.setup();
        },

        onPointerMove: function draggerMove(e, vector) {
            var i = e.interaction;

            if (this.props.enabled) {
                if (i.pointerIsDown && ! i.interacting()) {
                    var paper = vector.paper(),
                        node = vector.node(),
                        action = {name: 'drag'};

                    // -- workaround for a bug in v1.2.6 of interact.js
                    i.prepared.name = action.name;
                    i.setEventXY(i.startCoords, i.pointers);

                    if (e.currentTarget === node) {
                        if (paper) {
                            var state = paper.state();
                            
                            if (state == 'collecting') {
                                if (vector.elem.belong('graph-resizer')) {
                                    paper.tool().activate('panzoom');    
                                } else {
                                    return;
                                }
                            } else if (state == 'linking') {
                                return;
                            }
                        }
                        
                        if (this.props.ghost) {
                            if (this.props.suspended) {
                                this.resume();
                            }
                            i.start(action, e.interactable, this.helper().node());
                        } else {
                            i.start(action, e.interactable, node);
                        }

                    }
                }    
            }

            e.preventDefault();

        },

        onDragStart: function(e) {
            var vector = this.vector(), 
                paper = vector.paper(),
                helper = this.helper();

            vector.addClass('dragging');
            paper.cursor(this.props.cursor);

            this.trans.vector = vector;
            this.trans.paper = paper;
            this.trans.helper = helper;

            this.trans.dx = 0;
            this.trans.dy = 0;
            this.trans.hx = 0;
            this.trans.hy = 0;

            var edata = {
                x: e.clientX,
                y: e.clientY,
                dx: 0,
                dy: 0,
                ghost: this.props.ghost,
                batch: false
            };

            this.fire('dragstart', edata);
        },

        onDragMove: function(e) {
            
            var trans = this.trans,
                paper = trans.paper,
                vector = trans.vector,
                helper = trans.helper,
                axs = this.props.axis,
                deg = this.rotation.deg,
                sin = this.rotation.sin,
                cos = this.rotation.cos,
                scaleX = this.scaling.x,
                scaleY = this.scaling.y;

            // check current scaling
            var scaling = vector.globalMatrix().scale();
            
            if (scaling.x !== scaleX || scaling.y !== scaleY) {
                this.scale(scaling.x, scaling.y);
                scaleX = scaling.x;
                scaleY = scaling.y;
            }
            
            var edx = _.defaultTo(e.dx, 0),
                edy = _.defaultTo(e.dy, 0);
            
            var dx, dy, hx, hy, tx, ty;
            
            dx = dy = hx = hy = tx = ty = 0;
                
            edx /= scaleX;
            edy /= scaleY;

            if (axs == 'x') {
                dx = hx = edx;
                dy = hy = 0;

                tx = edx *  cos + 0 * sin;
                ty = edx * -sin + 0 * cos;
            } else if (axs == 'y') {
                dx = hx = 0;
                dy = hy = edy;

                tx = 0 *  cos + edy * sin;
                ty = 0 * -sin + edy * cos;
            } else {
                hx = edx;
                hy = edy;
                
                dx = tx = edx *  cos + edy * sin;
                dy = ty = edx * -sin + edy * cos;  
            }

            this.trans.dx += tx;
            this.trans.dy += ty;

            this.trans.hx += hx;
            this.trans.hy += hy;
            
            var pageX = _.defaultTo(e.pageX, e.x0),
                pageX = _.defaultTo(e.pageY, e.y0);

            pageX /= scaleX;
            pageX /= scaleY;
            
            var event = {
                pageX: pageX,
                pageY: pageX,
                
                ex: edx,
                ey: edy,

                dx: dx,
                dy: dy,
                
                hx: hx,
                hy: hy,
                
                ox: hx,
                oy: hy,
                
                ghost: this.props.ghost,
                batch: false
            };

            this.fire('dragmove', event);
            
            if (helper) {
                helper.translate(event.hx, event.hy).commit();
            } else {
                vector.translate(event.dx, event.dy).commit();
            }
        },

        onDragEnd: function(e) {
            var trans = this.trans,
                paper = trans.paper,
                vector = trans.vector,
                helper = trans.helper,
                dx = trans.dx,
                dy = trans.dy,
                hx = trans.hx,
                hy = trans.hy;

            if (helper) {
                vector.translate(dx, dy).commit();
                this.redraw();
                this.suspend();
            }

            vector.removeClass('dragging');
            paper.cursor('default');

            var edata = {
                dx: dx,
                dy: dy,
                ghost: this.props.ghost,
                batch: false
            };
            
            this.fire('dragend', edata);
            
            this.trans.vector = null;
            this.trans.paper = null;
            this.trans.helper = null;

            this.trans.dx = 0;
            this.trans.dy = 0;
            this.trans.hx = 0;
            this.trans.hy = 0;

        },

        destroy: function() {
            var me = this;

            if (me.components.helper) {
                me.helper().remove();
            }

            me.components.helper = null;

            if (me.components.holder) {
                me.holder().remove();
            }

            me.components.holder = null;
            me.listeners = {};
        }
    });

}());