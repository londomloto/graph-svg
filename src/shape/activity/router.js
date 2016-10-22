
(function(){

    Graph.shape.activity.Router = Graph.extend(Graph.shape.Shape, {

        props: {
            label: 'Route',
            width: 100,
            height: 100,
            left: 0,
            top: 0
        },

        initComponent: function() {
            var me = this, comp = me.components;
            var shape, block, label;

            var points = [
                me.props.width / 2, 0,
                me.props.width, me.props.height / 2,
                me.props.width / 2, me.props.height,
                0, me.props.height / 2
            ];

            var cx = points[0],
                cy = points[3];

            shape = (new Graph.svg.Group(me.props.left, me.props.top))
                .selectable(false);

            block = (new Graph.svg.Polygon(points))
                .data('text', me.props.label)
                .render(shape);

            block.draggable({ghost: true});
            block.resizable();
            block.editable();
            block.connectable();

            block.on('edit', _.bind(me.onLabelEdit, me));
            block.on('dragend', _.bind(me.onDragEnd, me));
            block.on('resize', _.bind(me.onResize, me));
            block.on('remove',  _.bind(me.onRemove, me));

            label = (new Graph.svg.Text(cx, cy, me.props.label))
                .clickable(false)
                .selectable(false)
                .render(shape);

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();

            shape = block = label = null;
        },

        redraw: function() {
            var block = this.component('block'),
                shape = this.component('shape'),
                label = this.component('label');

            var bound, matrix;

            bound = block.bbox().toJson();
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toString());

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

            matrix = null;
            bound  = null;
        }

    });

}());