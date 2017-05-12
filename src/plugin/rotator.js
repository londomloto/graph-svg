
(function(){

    Graph.plugin.Rotator = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null,
            enabled: true,
            suspended: true,
            handleImage: null,
            handleSize: null,
            rendered: false
        },

        components: {
            helper: null,
            handle: null,
            holder: null,
            circle: null,
            radius: null
        },

        constructor: function(vector, options) {
            var guid = vector.guid();

            options = options || {};

            _.assign(this.props, options);

            this.props.vector = guid;
            this.props.handleImage = Graph.config.base + 'img/' + Graph.config.rotator.image;
            this.props.handleSize = Graph.config.rotator.size;

            this.initComponent();
        },

        invalidate: function()  {
            this.superclass.prototype.invalidate.call(this);
        },

        initComponent: function() {
            var holder, helper, handle, circle, radius;

            holder = (new Graph.svg.Group())    
                .removeClass(Graph.styles.VECTOR)
                .addClass('graph-rotator');

            holder.elem.group('graph-rotator');
            holder.on('render.rotator', _.bind(this.setup, this));

            helper = (new Graph.svg.Rect(0, 0, 0, 0, 0))
                .removeClass(Graph.styles.VECTOR)
                .addClass('graph-rotator-helper')
                .selectable(false)
                .clickable(false)
                .render(holder);

            handle = (new Graph.svg.Image(
                this.props.handleImage, 
                0, 
                0, 
                this.props.handleSize - 2, 
                this.props.handleSize
            ))
            .selectable(false)
            .removeClass(Graph.styles.VECTOR)
            .addClass('graph-rotator-handle')
            .render(holder);

            handle.elem.group('graph-rotator');

            radius = (new Graph.svg.Line())
                .selectable(false)
                .clickable(false)
                .removeClass(Graph.styles.VECTOR)
                .render(holder);

            circle = (new Graph.svg.Circle(0, 0, 5))
                .selectable(false)
                .clickable(false)
                .removeClass(Graph.styles.VECTOR)
                .render(holder);

            this.components.helper = helper.guid();
            this.components.handle = handle.guid();
            this.components.holder = holder.guid();
            this.components.circle = circle.guid();
            this.components.radius = radius.guid();
            this.suspendHelper();

            holder = handle = helper = circle = radius = null;
        },

        setup: function() {

            var me = this,
                vector = this.vector(),
                layout = vector.paper().layout(),
                helper = this.helper(),
                handle = this.handle(),
                holder = this.holder(),
                radius = this.radius(),
                handleNode = handle.node();

            var trans = {
                scale: null,
                center: null,
                translate: null,
                move: null,
                rotate: null,
                snaps: null,
                resizing: null
            };

            handle.interactable().draggable({
                manualStart: true,
                onstart: function(e) {

                    var matrix = vector.matrix();
                    var center, radian;

                    trans.scale = layout.scale();
                    trans.origin = handle.bbox().center().toJson();
                    trans.target = {x: trans.origin.x, y: trans.origin.y};
                    trans.move = {x: 0, y: 0};
                    trans.rotate = matrix.rotate().deg;
                    trans.snaps = [0, 45, 90, -135, -180, -225, -90, -45];
                    trans.resizing = vector.isResizable() && vector.resizable().props.suspended === false;
                    
                    center = helper.bbox().center().toJson();
                    trans.center = center;

                    radian = holder.matrixCurrent().rotate().rad;
                    trans.radian = {
                        sin: Math.sin(radian),
                        cos: Math.cos(radian)
                    };

                    if (trans.resizing) {
                        vector.resizable().suspend();
                    }

                    me.resumeHelper();
                },
                onmove: function(e) {
                    var edx = e.dx,
                        edy = e.dy;

                    var transform, rad, deg, dx, dy, tx, ty;

                    trans.matrix = new Graph.lang.Matrix();

                    // scaling
                    edx /= trans.scale.x;
                    edy /= trans.scale.y;

                    // radian
                    dx = edx *  trans.radian.cos + edy * trans.radian.sin;
                    dy = edx * -trans.radian.sin + edy * trans.radian.cos;

                    trans.move.x += dx;
                    trans.move.y += dy;

                    tx = trans.move.x + trans.origin.x;
                    ty = trans.move.y + trans.origin.y;

                    trans.target = {x: tx, y: ty};

                    // rad = Math.atan2((ty - trans.center.y), (tx - trans.center.x));
                    rad = Math.atan2((trans.center.y - ty), (trans.center.x - tx));
                    deg = Math.round(rad * 180 / Math.PI - 90);

                    // snapping
                    deg = Graph.util.snapValue(deg, trans.snaps, 5);
                    
                    trans.matrix.rotate(deg, trans.center.x, trans.center.y);
                    trans.rotate = deg;

                    transform = trans.matrix.toValue();

                    handle.attr('transform', transform);
                    helper.attr('transform', transform);
                    radius.attr('transform', transform);
                },

                onend: function() {
                    var vmatrix = vector.matrix(),
                        vcenter = vector.bboxPristine().center().toJson(),
                        vrotate = vmatrix.rotate().deg,
                        drotate = trans.rotate - vrotate;

                    var cx, cy;

                    cx = vcenter.x;
                    cy = vcenter.y;

                    vmatrix.rotate(drotate, cx, cy);
                    vector.attr('transform', vmatrix.toValue());
                    vector.dirty(true);

                    me.redraw();

                    if (trans.resizing) {
                        vector.resizable().resume();
                    }

                    me.fire('afterrotate', {
                        deg: trans.rotate - 90,
                        cx: cx,
                        cy: cy
                    });

                }
            })
            .on('down', function(e){
                e.preventDefault();
                e.stopPropagation();
            })
            .on('move', function(e){
                if (me.props.enabled) {
                    var i = e.interaction;
                    if (i.pointerIsDown && ! i.interacting()) {
                        var a = {name: 'drag'};
                        i.prepared.name = a.name;
                        i.setEventXY(i.startCoords, i.pointers);

                        if (e.currentTarget === handleNode) {
                            i.start(a, e.interactable, handleNode);    
                        }
                    }    
                }
            });
        },

        holder: function() {
            return Graph.registry.vector.get(this.components.holder);
        },

        helper: function() {
            return Graph.registry.vector.get(this.components.helper);
        },

        circle: function() {
            return Graph.registry.vector.get(this.components.circle);
        },

        radius: function() {
            return Graph.registry.vector.get(this.components.radius);
        },

        handle: function() {
            return Graph.registry.vector.get(this.components.handle);
        },

        resume: function() {
            if ( ! this.props.enabled) {
                return;
            }

            if (this.props.suspended) {
                this.props.suspended = false;

                if ( ! this.props.rendered) {
                    this.render();
                } else {
                    this.vector().parent().elem.append(this.holder().elem);
                    this.redraw();
                }
            }
        },

        resumeHelper: function() {
            var vector, key;
            for (key in this.components) {
                if (['holder', 'handle'].indexOf(key) === -1) {
                    vector = this[key]();
                    vector && vector.show();
                }
            }
        },

        suspend: function() {
            this.props.suspended = true;
            this.holder().elem.detach();
        },

        suspendHelper: function() {
            var vector, key;
            for (key in this.components) {
                if (['holder', 'handle'].indexOf(key) === -1) {
                    vector = this[key]();
                    vector && vector.hide();
                }
            }
        },

        render: function() {
            if (this.props.rendered) {
                this.redraw();
                return;
            }

            this.props.rendered = true;
            this.holder().render(this.vector().parent());
            this.redraw();
        },

        redraw: function() {
            
            var vector = this.vector(),
                holder = this.holder(),
                helper = this.helper(),
                handle = this.handle(),
                circle = this.circle(),
                radius = this.radius(),
                rotate = vector.matrix().rotate().deg;

            var bound = vector.bbox().toJson(),
                edge = 30;

            var cx, cy;

            if (rotate) {
                var rmatrix = Graph.matrix(),
                    rpath = vector.shapeRelative();

                cx = bound.x + bound.width / 2,
                cy = bound.y + bound.height / 2;

                rmatrix.rotate(-rotate, cx, cy);

                rpath = rpath.transform(rmatrix);
                bound = rpath.bbox().toJson();

            } else {
                var vmatrix = vector.matrix(),
                    vpath = vector.shape();

                vpath = vpath.transform(vmatrix);
                bound = vpath.bbox().toJson();

                cx = bound.x + bound.width / 2;
                cy = bound.y + bound.height / 2;
            }

            

            // reset first
            helper.reset();
            handle.reset();
            radius.reset();

            helper.attr({
                x: bound.x,
                y: bound.y,
                width: bound.width,
                height: bound.height
            });

            var hw = (this.props.handleSize - 2) / 2,
                hh = (this.props.handleSize) / 2,
                hx = cx - hw,
                hy = bound.y - edge - hh;

            circle.attr({
                cx: cx, 
                cy: cy
            });

            handle.attr({
                x: hx, 
                y: hy
            });

            radius.attr({
                x1: cx,
                y1: cy,
                x2: cx,
                y2:  bound.y - edge + hh
            });

            handle.rotate(rotate, cx, cy).commit();
            helper.rotate(rotate, cx, cy).commit();
            radius.rotate(rotate, cx, cy).commit();

            holder = helper = bound = handle = radius = circle = null;
        },

        destroy: function() {
            var key, cmp;

            for (key in this.components) {
                cmp = this[key]();
                if (cmp) {
                    cmp.remove();
                    this.components[key] = cmp = null;
                }
            }

        }

    });

}());