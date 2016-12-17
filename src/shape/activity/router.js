
(function(){

    Graph.shape.activity.Router = Graph.extend(Graph.shape.Shape, {

        props: {
            label: 'Route',
            width: 100,
            height: 100,
            left: 0,
            top: 0
        },

        metadata: {
            type: 'activity.router',
            icon: Graph.icons.SHAPE_ROUTER,
            style: 'graph-shape-activity-router'
        },

        initComponent: function() {
            var comp = this.components,
                pmgr = this.plugins.manager;

            var shape, block, label;

            var points = [
                this.props.width / 2, 0,
                this.props.width, this.props.height / 2,
                this.props.width / 2, this.props.height,
                0, this.props.height / 2
            ];

            var cx = points[0],
                cy = points[3];

            shape = (new Graph.svg.Group(this.props.left, this.props.top))
                .selectable(false);

            block = (new Graph.svg.Polygon(points))
                .addClass(Graph.styles.SHAPE_BLOCK)
                .data('text', this.props.label)
                .render(shape);

            block.elem.data(Graph.string.ID_SHAPE, this.guid());
            
            pmgr.install('dragger', block, {ghost: true, dragClass: Graph.styles.SHAPE_DRAG});
            pmgr.install('resizer', block);
            pmgr.install('editor',  block);
            pmgr.install('network', block, {wiring: 'h:v'});
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
                .clickable(false)
                .selectable(false)
                .render(shape);

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();

            shape = block = label = null;
        },

        width: function(value) {
            if (value === undefined) {
                return this.props.width;
            }

            var box = this.component('block').bbox().toJson(),
                sx = value / this.props.width,
                sy = 1,
                cx = box.x,
                cy = (box.y + box.y2) / 2,
                dx = 0,
                dy = 0;

            this.component('block').resize(sx, sy, cx, cy, dx, dy);
            this.component().dirty(true);

            this.props.width = value;
            return this;
        },

        height: function(value) {
            if (value === undefined) {
                return this.props.height;
            }

            var block = this.component('block'),
                box = block.bbox().toJson(),
                sx = 1,
                sy = value / this.props.height,
                cx = (box.x + box.x2) / 2,
                cy = box.y,
                dx = 0,
                dy = 0;

            var resize = block.resize(sx, sy, cx, cy, dx, dy);
            block.fire('afterresize', resize);

            this.props.height = value;
            return this;
        },

        refresh: function() {
            if (this.layout.suspended) {
                return;
            }

            var block = this.component('block'),
                shape = this.component('shape'),
                label = this.component('label');

            var bound, matrix;

            bound = block.bbox().toJson();
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toValue());

            var points = [
                bound.width / 2, 0,
                bound.width, bound.height / 2,
                bound.width / 2, bound.height,
                0, bound.height / 2
            ];

            block.attr({
                points: _.join(points, ',')
            });

            block.dirty(true);
            block.resizable().redraw();

            label.attr({
                x: bound.width  / 2,
                y: bound.height / 2
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

            matrix = null;
            bound  = null;
        },

        toString: function() {
            return 'Graph.shape.activity.Router';
        }

    });

    ///////// STATIC /////////

}());
