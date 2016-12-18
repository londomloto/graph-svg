
(function(){

    Graph.shape.activity.Final = Graph.extend(Graph.shape.Shape, {

        props: {
            label: 'End',
            width: 60,
            height: 60,
            left: 0,
            top: 0,
            fill: '#FF4081'
        },

        metadata: {
            type: 'activity.final',
            style: 'graph-shape-activity-final'
        },

        initComponent: function() {
            var comp = this.components,
                pmgr = this.plugins.manager;

            var shape, block, inner, label;

            shape = (new Graph.svg.Group(this.props.left, this.props.top))
                .selectable(false);

            var cx = this.props.width / 2,
                cy = this.props.height / 2;

            block = (new Graph.svg.Ellipse(cx, cy, cx, cy))
                .addClass(Graph.styles.SHAPE_BLOCK)
                .style({
                    stroke: this.props.stroke,
                    strokeWidth: this.props.strokeWidth
                })
                .data('text', this.props.label)
                .render(shape);

            block.elem.data(Graph.string.ID_SHAPE, this.guid());

            pmgr.install('dragger', block, {ghost: true, cls: Graph.styles.SHAPE_DRAG});
            pmgr.install('network', block, {wiring: 'h:v'});
            pmgr.install('resizer', block);
            pmgr.install('editor',  block);
            pmgr.install('snapper', block);

            block.on('edit.shape',      _.bind(this.onLabelEdit, this));
            block.on('beforedrag.shape', _.bind(this.onBeforeDrag, this));
            block.on('afterdrag.shape',   _.bind(this.onAfterDrag, this));
            block.on('afterresize.shape',    _.bind(this.onAfterResize, this));
            block.on('beforedestroy.shape',    _.bind(this.onBeforeDestroy, this));
            block.on('afterdestroy.shape',    _.bind(this.onAfterDestroy, this));
            block.on('select.shape',    _.bind(this.onSelect, this));
            block.on('deselect.shape',  _.bind(this.onDeselect, this));
            block.on('connect.shape', _.bind(this.onConnect, this));

            inner = (new Graph.svg.Ellipse(cx, cy, cx - 6, cy - 6))
                .addClass('comp-inner')
                .style({
                    fill: this.props.fill
                })
                .clickable(false)
                .selectable(false)
                .render(shape);

            label = (new Graph.svg.Text(cx, cy, this.props.label))
                .addClass(Graph.styles.SHAPE_LABEL)
                .addClass('comp-label')
                .selectable(false)
                .clickable(false)
                .render(shape);

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();
            comp.inner = inner.guid();

            shape = block = label = inner = null;
        },

        fill: function(value) {
            if (value === undefined) {
                return this.props.value;
            }

            this.component('inner').elem.css('fill', value);
            this.props.fill = value;

            return this;
        },

        refresh: function() {
            if (this.layout.suspended) {
                return;
            }

            var block = this.component('block'),
                shape = this.component('shape'),
                inner = this.component('inner'),
                label = this.component('label');

            var matrix, bound, cx, cy;

            bound  = block.bbox().toJson(),
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toValue());

            cx = bound.width / 2,
            cy = bound.height / 2;

            block.attr({
                cx: cx,
                cy: cy
            });

            block.dirty(true);
            block.resizable().redraw();

            label.attr({
                x: cx,
                y: cy
            });

            label.wrap(bound.width - 10);

            inner.attr({
                cx: cx,
                cy: cy,
                rx: cx - 6,
                ry: cy - 6
            });

            // update props
            matrix = shape.matrix();

            this.data({
                left: matrix.props.e,
                top: matrix.props.f,
                width: bound.width,
                height: bound.height
            });

            bound  = null;
            matrix = null;
        },

        toString: function() {
            return 'Graph.shape.activity.Final';
        },

        onAfterDestroy: function() {
            // remove label
            this.component('label').remove();

            // remove inner
            this.component('inner').remove();

            // remove shape
            this.component('shape').remove();

            for (var name in this.components) {
                this.components[name] = null;
            }

            Graph.registry.shape.unregister(this);
            
            this.fire('afterdestroy');
        }

    });

    ///////// STATIC /////////


}());
