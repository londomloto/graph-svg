
(function(){
    
    Graph.plugin.Resizer = Graph.extend(Graph.plugin.Plugin, {
        
        props: {
            vector: null,
            enabled: true,
            suspended: true,
            restriction: null,
            handleImage: null,
            handleSize: null,
            rendered: false
        },

        components: {
            holder: null,
            helper: null,
            handle: null
        },

        trans: {
            // original offset
            ox: 0,
            oy: 0,

            // original
            ow: 0,
            oh: 0,

            // current
            cw: 0,
            ch: 0,

            // translation
            dx: 0,
            dy: 0
        },

        constructor: function(vector, options) {
            var me = this, guid = vector.guid();
            
            options = options || {};

            _.assign(me.props, options);

            vector.addClass('graph-resizable');

            me.props.handleImage = Graph.config.base + 'img/' + Graph.config.resizer.image;
            me.props.handleSize = Graph.config.resizer.size;

            me.props.vector = guid;

            me.cached.snapping = null;
            me.cached.vertices = null;

            me.initComponent();
        },
        
        holder: function() {
            return Graph.registry.vector.get(this.components.holder);
        },

        helper: function() {
            return Graph.registry.vector.get(this.components.helper);
        },

        handle: function(dir) {
            return Graph.registry.vector.get(this.components.handle[dir]);
        },

        initComponent: function() {
            var me = this, comp = me.components;
            var holder, helper;

            holder = (new Graph.svg.Group())
                .addClass('graph-resizer')
                .removeClass('graph-elem graph-elem-group');

            holder.elem.group('graph-resizer');

            holder.on({
                render: _.bind(me.onHolderRender, me)
            });
            
            helper = (new Graph.svg.Rect(0, 0, 0, 0, 0))
                .addClass('graph-resizer-helper')
                .removeClass('graph-elem graph-elem-rect')
                .selectable(false)
                .clickable(false)
                .render(holder);

            helper.elem.group('graph-resizer');

            comp.handle = {};

            var handle = {
                ne: {ghost: false, cursor: 'nesw-resize'},
                se: {ghost: false, cursor: 'nwse-resize'},
                sw: {ghost: false, cursor: 'nesw-resize'},
                nw: {ghost: false, cursor: 'nwse-resize'},
                 n: {ghost: false, cursor: 'ns-resize', axis: 'y'},
                 e: {ghost: false, cursor: 'ew-resize', axis: 'x'},
                 s: {ghost: false, cursor: 'ns-resize', axis: 'y'},
                 w: {ghost: false, cursor: 'ew-resize', axis: 'x'}
            };

            _.forOwn(handle, function(c, dir){
                (function(dir){
                    var h = (new Graph.svg.Image(
                        me.props.handleImage,
                        0,
                        0,
                        me.props.handleSize,
                        me.props.handleSize
                    ))
                    .selectable(false)
                    .removeClass('graph-elem graph-elem-image')
                    .addClass('graph-resizer-handle handle-' + dir);

                    h.elem.group('graph-resizer');
                    h.props.dir = dir;
                    h.draggable(c);
                    
                    h.on('beforedrag', _.bind(me.onHandleBeforeDrag, me));
                    h.on('drag', _.bind(me.onHandleDrag, me));
                    h.on('afterdrag', _.bind(me.onHandleAfterDrag, me));

                    h.render(holder);

                    comp.handle[dir] = h.guid();
                    h = null;
                }(dir));
            });

            comp.holder = holder.guid();
            comp.helper = helper.guid();

            holder = null;
            helper = null;
            handle = null;
        },

        invalidate: function()  {
            this.superclass.prototype.invalidate.call(this);
            this.cached.vertices = null;
        },

        disable: function() {
            this.props.enabled = false;
        },

        enable: function() {
            this.props.enabled = true;
        },

        render: function() {
            var me = this;

            if (me.props.rendered) {
                me.redraw();
                return;
            }

            me.holder().render(me.vector().parent());
            me.props.rendered = true;
            me.redraw();
        },

        snap: function(snap) {
            this.cached.snapping = snap;
        },

        vertices: function() {
            var me = this,
                vector = me.vector(),
                vertices = me.cached.vertices;

            if ( ! vertices) {
                // get original bounding
                var path, bbox, rotate;
                var ro, cx, cy, ox, oy, hs, hw, hh;

                path = vector.shape();
                bbox = path.bbox().toJson();
                // rotate = vector.matrixCurrent().rotate();
                rotate = vector.matrix().rotate();

                ro = rotate.deg;
                cx = 0;
                cy = 0;
                ox = bbox.x;
                oy = bbox.y;
                hs = me.props.handleSize / 2;
                
                if (ro) {
                    var rmatrix = Graph.matrix(),
                        path = vector.shapeRelative();

                    cx = bbox.x + bbox.width / 2,
                    cy = bbox.y + bbox.height / 2;

                    rmatrix.rotate(-ro, cx, cy);

                    path = path.transform(rmatrix);
                    bbox = path.bbox().toJson();
                } else {
                    var vmatrix = vector.matrix();
                    path = path.transform(vmatrix);
                    bbox = path.bbox().toJson();
                }
                

                hw = bbox.width / 2;
                hh = bbox.height / 2;

                vertices = {
                    ne: {
                        x: bbox.x + bbox.width - hs,
                        y: bbox.y - hs
                    },

                    se: {
                        x: bbox.x + bbox.width - hs,
                        y: bbox.y + bbox.height - hs
                    },

                    sw: {
                        x: bbox.x - hs,
                        y: bbox.y + bbox.height - hs
                    },

                    nw: {
                        x: bbox.x - hs,
                        y: bbox.y - hs
                    },

                    n: {
                        x: bbox.x + hw - hs,
                        y: bbox.y - hs
                    },
                    e: {
                        x: bbox.x + bbox.width - hs,
                        y: bbox.y + hh - hs
                    },
                    s: {
                        x: bbox.x + hw - hs,
                        y: bbox.y + bbox.height - hs
                    },
                    w: {
                        x: bbox.x - hs,
                        y: bbox.y + hh - hs
                    },

                    rotate: {
                        deg: ro,
                        cx: cx,
                        cy: cy
                    },

                    box: {
                        x: bbox.x,
                        y: bbox.y,
                        width: bbox.width,
                        height: bbox.height
                    },

                    offset: {
                        x: ox,
                        y: oy
                    }
                };

                this.cached.vertices = vertices;
            }

            return vertices;
        },

        redraw: function() {
            var me = this,
                helper = me.helper(),
                holder = me.holder();

            var vx;

            if ( ! holder) {
                return;
            }

            vx = this.vertices();

            if ( ! vx) {
                return;
            }
            
            helper.reset();

            helper.attr({
                x: vx.box.x,
                y: vx.box.y,
                width: vx.box.width,
                height: vx.box.height
            });

            helper.rotate(vx.rotate.deg, vx.rotate.cx, vx.rotate.cy).commit();

            _.forOwn(me.components.handle, function(id, dir){
                (function(id, dir){
                    var h = me.handle(dir);
                    h.show();
                    h.reset();
                    h.attr(vx[dir]);
                    h.rotate(vx.rotate.deg, vx.rotate.cx, vx.rotate.cy).commit();
                }(id, dir));
            });

            me.trans.ox = vx.offset.x;
            me.trans.oy = vx.offset.y;
            me.trans.ow = this.trans.cw = vx.box.width;
            me.trans.oh = this.trans.ch = vx.box.height;
            me.trans.dx = 0;
            me.trans.dy = 0;
        },

        suspend: function() {
            this.props.suspended = true;
            this.holder().elem.detach();
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

        restrict: function(options) {
            _.assign(this.props, {
                restriction: options
            });
        },

        setupRestriction: function(handle) {
            var me = this,
                restriction = this.props.restriction || {},
                vector = me.vector(),
                paper = vector.paper(),
                layout = paper.layout(),
                dir = handle.props.dir,
                width = +restriction.width || 0,
                height = +restriction.height || 0,
                MAX_VALUE = Number.MAX_SAFE_INTEGER;

            var bounds = {
                top: -MAX_VALUE,
                left: -MAX_VALUE,
                right: MAX_VALUE,
                bottom: MAX_VALUE
            };

            var origin;
            
            if (restriction.origin === undefined) {
                var box = vector.bboxView().toJson();
                origin = getRestrictOrigin(handle, box);
            } else {
                origin = _.extend({x: 0, y: 0}, restriction.origin);
            }

            switch(dir) {
                case 'n':
                    bounds.bottom = origin.y - height;
                    break;
                case 'e':
                    bounds.left = origin.x + width;
                    break;
                case 's':
                    bounds.top = origin.y + height;
                    break;
                case 'w':
                    bounds.right = origin.x - width;
                    break;
                case 'ne':
                    bounds.left = origin.x + width;
                    bounds.bottom = origin.y - height;
                    break;
                case 'se':
                    bounds.top = origin.y + height;
                    bounds.left = origin.x + width;
                    break;
                case 'sw':
                    bounds.right = origin.x - width;
                    bounds.top = origin.y + height;
                    break;
                case 'nw':
                    bounds.right = origin.x - width;
                    bounds.bottom = origin.y - height;
                    break;
            }

            handle.draggable().restrict(bounds);

        },
        
        onHolderRender: function(e) {
            
        },

        onHandleBeforeDrag: function(e) {
            var me = this, 
                vector = me.vector(), 
                handle = e.publisher;

            me.fire('beforeresize', {
                resizer: this,
                direction: handle.props.dir
            });

            if (vector.isRotatable()) {
                vector.rotatable().suspend();
            }

            _.forOwn(me.components.handle, function(id, dir){
                var h = me.handle(dir);
                if (h !== handle) {
                    h.hide();
                }
            });

            var snapping = this.cached.snapping;

            if (snapping && handle.draggable().snap() !== snapping) {
                handle.draggable().snap(snapping);    
            }
            
            if (this.props.restriction) {
                this.setupRestriction(handle);    
            }

            handle.show();
            handle.removeClass('dragging');
        },

        onHandleDrag: function(e) {
            var me = this, 
                helper = me.helper(), 
                handle = e.publisher;
            
            var tr = this.trans,
                dx = e.dx,
                dy = e.dy;

            switch(handle.props.dir) {
                case 'ne':
                    tr.cw += dx;
                    tr.ch -= dy;

                    me.trans.dy += dy;
                    helper.translate(0, dy).commit();
                    break;

                case 'se':
                    tr.cw += dx;
                    tr.ch += dy;

                    break;

                case 'sw':
                    tr.cw -= dx;
                    tr.ch += dy;

                    me.trans.dx += dx;
                    helper.translate(dx, 0).commit();
                    break;

                case 'nw':
                    tr.cw -= dx;
                    tr.ch -= dy;

                    me.trans.dx += dx;
                    me.trans.dy += dy;
                    helper.translate(dx, dy).commit();
                    break;

                case 'n':
                    tr.cw += 0;
                    tr.ch -= dy;

                    me.trans.dy += dy;
                    helper.translate(0, dy).commit();
                    break;

                case 'e':
                    tr.cw += dx;
                    tr.ch += 0;

                    break;

                case 's':
                    tr.cw += 0;
                    tr.ch += dy;
                    break;

                case 'w':
                    tr.cw -= dx;
                    tr.ch += 0;

                    me.trans.dx += dx;
                    helper.translate(dx, 0).commit();
                    break;
            }

            helper.attr({
                width:  tr.cw,
                height: tr.ch
            });

        },

        onHandleAfterDrag: function(e) {
            var me = this,
                tr = this.trans,
                handle = e.publisher;

            var sx, sy, cx, cy, dx, dy;

            sx = tr.ow > 0 ? (tr.cw / tr.ow) : 1;
            sy = tr.oh > 0 ? (tr.ch / tr.oh) : 1;
            dx = tr.dx;
            dy = tr.dy;

            switch(handle.props.dir) {
                case 'ne':
                    cx = tr.ox;
                    cy = tr.oy + tr.oh;
                    break;
                case 'se':
                    cx = tr.ox;
                    cy = tr.oy;
                    break;
                case 'sw':
                    cx = tr.ox + tr.ow;
                    cy = tr.oy;
                    break;
                case 'nw':
                    cx = tr.ox + tr.ow;
                    cy = tr.oy + tr.oh;
                    break;
                case 'n':
                    cx = tr.ox + tr.ow / 2;
                    cy = tr.oy + tr.oh;
                    break;
                case 'e':
                    cx = tr.ox;
                    cy = tr.oy + tr.oh / 2;
                    break;
                case 's':
                    cx = tr.ox + tr.ow / 2;
                    cy = tr.oy;
                    break;
                case 'w':
                    cx = tr.ox + tr.ow;
                    cy = tr.oy + tr.oh / 2;
                    break;
            }

            // track translation
            var vector = me.vector(),
                oldcen = vector.bbox().center().toJson(),
                resize = vector.resize(sx, sy, cx, cy, dx, dy),
                newcen = vector.bbox().center().toJson();

            var vdx = newcen.x - oldcen.x,
                vdy = newcen.y - oldcen.y;

            resize.translate.dx = vdx;
            resize.translate.dy = vdy;
            
            me.redraw();
            me.fire('afterresize', resize);

            if (vector.isRotatable()) {
                vector.rotatable().resume();
            }
        },

        toString: function() {
            return 'Graph.plugin.Resizer';
        },

        destroy: function() {
            // remove handles
            var me = this

            _.forOwn(me.components.handle, function(id, dir){
                var h = me.handle(dir);
                h.remove();
            });

            me.components.handle = null;

            // remove helper
            me.helper().remove();
            me.components.helper = null;

            // remove holder
            me.holder().remove();
            me.components.holder = null;

            // remove listeners
            me.listeners = null;
        }
        
    });

    ///////// HELPERS /////////
    
    function getRestrictOrigin(handle, box) {
        var origin = {
            x: box.x,
            y: box.y
        };

        switch(handle.props.dir) {
            case 'n':
                origin.x = (box.x + box.x2) / 2;
                origin.y = box.y2;
                break;
            case 'e':
                origin.x = box.x;
                origin.y = (box.y + box.y2) / 2;
                break;
            case 's':
                origin.x = (box.x + box.x2) / 2;
                origin.y = box.y;
                break;
            case 'w':
                origin.x = box.x2;
                origin.y = (box.y + box.y2) / 2;
                break;
            case 'ne':
                origin.x = box.x;
                origin.y = box.y2;
                break;
            case 'se':
                origin.x = box.x;
                origin.y = box.y;
                break;
            case 'sw':
                origin.x = box.x2;
                origin.y = box.y;
                break;
            case 'nw':
                origin.x = box.x2;
                origin.y = box.y2;
                break;
        }

        return origin;
    }

}());