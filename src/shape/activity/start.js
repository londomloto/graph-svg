
(function(){

    Graph.ns('Graph.shape.activity');

    Graph.shape.activity.Start = Graph.extend(Graph.shape.Shape, {

        props: {
            label: 'Start',
            width: 60,
            height: 60,
            left: 0,
            top: 0
        },

        metadata: {
            type: 'activity.start',
            style: 'graph-shape-activity-start'
        },

        initComponent: function() {
            var comp = this.components,
                pmgr = this.plugins.manager;

            var shape, block, label;

            shape = (new Graph.svg.Group(this.props.left, this.props.top))
                .selectable(false);

            var cx = this.props.width / 2,
                cy = this.props.height / 2;

            block = (new Graph.svg.Ellipse(cx, cy, cx, cy))
                .addClass(Graph.styles.SHAPE_BLOCK)
                .style({
                    fill: this.props.fill,
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

            label = (new Graph.svg.Text(cx, cy, this.props.label))
                .addClass(Graph.styles.SHAPE_LABEL)
                .selectable(false)
                .clickable(false)
                .render(shape);

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();

            shape = block = label = null;
        },

        refresh: function() {
            if (this.layout.suspended) {
                return;
            }
            
            var block = this.component('block'),
                shape = this.component('shape'),
                label = this.component('label');

            var matrix, bound, cx, cy;

            bound  = block.bbox().toJson(),
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toValue());

            cx = bound.width  / 2;
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
            return 'Graph.shape.activity.Start';
        }

    });

    ///////// STATIC /////////

}());
