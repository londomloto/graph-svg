
(function(){

    Graph.plugin.Dragger = Graph.extend(Graph.plugin.Plugin, {

        props: {
            ready: false,
            manual: false,

            ghost: true,
            vector: null,
            enabled: true,
            rendered: false,
            suspended: true,
            inertia: false,
            bound: false,
            grid: null,
            axis: false,
            cursor: 'move',

            cls: '',

            // batching operation
            batchSync: true,
            restriction: false
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

        dragging: {
            enabled: false,
            vector: null,
            paper: null,
            helper: null,
            dx: 0,
            dy: 0,
            coord: null
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

                helper = (new Graph.svg.Rect(0, 0, 0, 0, 0))
                    .addClass('graph-dragger-helper' + ((this.props.cls ? ' ' : '') + this.props.cls ))
                    .removeClass('graph-elem graph-elem-rect')
                    .traversable(false)
                    .selectable(false)
                    .clickable(false)
                    .render(holder);

                helper.elem.data(Graph.string.ID_VECTOR, this.vector().guid());

                comp.holder = holder.guid();
                comp.helper = helper.guid();

                holder = null;
                helper = null;
            } else {
                this.props.cls && (this.vector().addClass(this.props.cls));
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

            me.cached.origin = vendor.origin();
            me.cached.snapping = [];

            vendor.on('down', _.bind(me.onPointerDown, me));

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
            if (this.props.ghost) {
                if ( ! this.props.rendered) {
                    this.props.rendered = true;
                    this.holder().render(this.vector().parent());
                    this.redraw();
                }
            }
        },

        suspend: function() {
            if (this.props.ghost) {
                this.props.suspended = true;
                this.holder().elem.detach();    
            }
        },

        resume: function() {
            if (this.props.ghost) {
                this.props.suspended = false;
                if ( ! this.props.rendered) {
                    this.render();
                } else {
                    this.vector().parent().elem.append(this.holder().elem);
                    this.redraw();
                }    
            }
        },

        redraw: function() {
            if (this.props.ghost) {
                var vector = this.vector(),
                    helper = this.helper(),
                    matrix = vector.matrix(),
                    rotate = matrix.rotate().deg,
                    bound = vector.bbox().toJson();

                var cx, cy;

                if (rotate) {
                    var rmatrix = Graph.matrix(),
                        rpath = vector.shapeRelative();

                    cx = bound.x + bound.width / 2,
                    cy = bound.y + bound.height /2;

                    rmatrix.rotate(-rotate, cx, cy);

                    rpath = rpath.transform(rmatrix);
                    bound = rpath.bbox().toJson();
                }

                helper.reset();

                helper.attr({
                    x: bound.x,
                    y: bound.y,
                    width: bound.width,
                    height: bound.height
                });

                if (rotate) {
                    helper.rotate(rotate, cx, cy).commit();
                }
            }
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

        restrict: function(options) {
            this.props.restriction = options;
        },

        start: function() {
            var me = this, 
                vector = me.vector(),
                vendor = vector.interactable().vendor();

            if (me.props.manual) {
                return;
            }

            if (me.dragging.enabled) {
                return;
            }

            me.dragging.enabled = true;
            me.dragging.moveHandler = _.bind(me.onPointerMove, me, _, vector);
            
            vendor.on('move', me.dragging.moveHandler);
        },

        onVectorRender: function() {
            this.setup();
        },

        onPointerDown: function draggerDown(e) {
            e.preventDefault();
            this.start();
        },

        onPointerMove: function draggerMove(e, vector) {
            var i = e.interaction;

            if (this.props.enabled) {
                if (i.pointerIsDown && ! i.interacting()) {
                    var paper = vector.paper(),
                        node = vector.node(),
                        action = { name: 'drag' };

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
                layout = paper.layout(),
                helper = this.helper();

            vector.addClass('dragging');

            paper.cursor(this.props.cursor);

            this.dragging.vector = vector;
            this.dragging.paper = paper;
            this.dragging.helper = helper;

            this.dragging.dx = 0;
            this.dragging.dy = 0;
            this.dragging.tx = 0;
            this.dragging.ty = 0;

            var matrix = vector.matrixCurrent(),
                rotate = matrix.rotate(),
                scale  = matrix.scale();

            this.dragging.deg = rotate.deg;
            this.dragging.rad = rotate.rad;
            this.dragging.sin = Math.sin(rotate.rad);
            this.dragging.cos = Math.cos(rotate.rad);
            this.dragging.sx = scale.x;
            this.dragging.sy = scale.y;

            var edata = {
                x: e.clientX,
                y: e.clientY,
                dx: 0,
                dy: 0,
                ghost: this.props.ghost
            };

            this.fire('beforedrag', edata);

            var coord = layout.pointerLocation(e);
            this.dragging.coord = coord;
        },

        onDragMove: function(e) {

            var dragging = this.dragging,
                paper = dragging.paper,
                vector = dragging.vector,
                helper = dragging.helper,
                ghost = this.props.ghost,
                axs = this.props.axis,
                deg = dragging.deg,
                sin = dragging.sin,
                cos = dragging.cos,
                scaleX = dragging.sx,
                scaleY = dragging.sy;

            var tx = _.defaultTo(e.dx, 0),
                ty = _.defaultTo(e.dy, 0);

            var dx, dy, mx, my;

            dx = dy = mx = my = 0;

            tx /= scaleX;
            ty /= scaleY;
            
            if (axs == 'x') {
                dx = tx;
                dy = 0;

                mx = tx *  cos + 0 * sin;
                my = tx * -sin + 0 * cos;
            } else if (axs == 'y') {
                dx = 0;
                dy = ty;

                mx = 0 *  cos + ty * sin;
                my = 0 * -sin + ty * cos;
            } else {
                dx = mx = tx *  cos + ty * sin;
                dy = my = tx * -sin + ty * cos;
            }

            // check restriction
            var restriction = this.props.restriction;

            if (restriction) {
                var coord = this.dragging.coord;

                coord.x += dx;
                coord.y += dy;

                if (coord.x < restriction.left || coord.x > restriction.right) {
                    dx = mx = tx = 0;
                }
                
                if (coord.y < restriction.top || coord.y > restriction.bottom) {
                    dy = my = ty = 0;
                }
            }

            this.dragging.dx += mx;
            this.dragging.dy += my;
            this.dragging.tx += tx;
            this.dragging.ty += ty;

            var pageX = _.defaultTo(e.pageX, e.x0),
                pageX = _.defaultTo(e.pageY, e.y0);

            pageX /= scaleX;
            pageX /= scaleY;

            var event = {
                pageX: pageX,
                pageY: pageX,

                tx: tx,
                ty: ty,

                dx: dx,
                dy: dy,

                ghost: this.props.ghost
            };

            this.fire('drag', event);

            if (ghost) {
                helper.translate(event.dx, event.dy).commit();
            } else {
                vector.translate(event.dx, event.dy).commit();
            }
        },

        onDragEnd: function(e) {
            var dragging = this.dragging,
                paper = dragging.paper,
                vector = dragging.vector,
                helper = dragging.helper,
                ghost = this.props.ghost,
                dx = dragging.dx,
                dy = dragging.dy,
                tx = dragging.tx,
                ty = dragging.ty;

            if (ghost) {
                vector.translate(dx, dy).commit();

                this.redraw();
                this.suspend();
            }

            vector.removeClass('dragging');
            paper.cursor('default');

            var edata = {
                dx: dx,
                dy: dy,
                tx: tx,
                ty: ty,
                ghost: this.props.ghost
            };

            var vendor = vector.interactable().vendor();
            vendor.off('move', this.dragging.moveHandler);
            
            this.dragging.moveHandler = null;
            this.dragging.enabled = false;

            this.fire('afterdrag', edata);

            for (var key in this.dragging) {
                this.dragging[key] = null;
            }

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
        },

        toString: function() {
            return 'Graph.plugin.Dragger';
        }
    });

}());
