
(function(){

    Graph.shape.activity.Lane = Graph.extend(Graph.shape.Shape, {

        props: {
            label: 'Participant Role',
            width: 1000,
            height: 200,
            left: 0,
            top: 0
        },

        initComponent: function() {
            var me = this, comp = me.components;
            var shape, block, header, label;

            shape = (new Graph.svg.Group(me.props.left, me.props.top))
                .addClass('graph-shape-activity-lane')
                .selectable(false);

            block = (new Graph.svg.Rect(0, 0, me.props.width, me.props.height, 0))
                .addClass('block')
                .render(shape);

            block.resizable({shield: shape});
            block.draggable({ghost: true});

            block.on('dragend', _.bind(me.onDragEnd, me));
            block.on('resize', _.bind(me.onResize, me));
            block.on('remove',  _.bind(me.onRemove, me));

            header = (new Graph.svg.Rect(0, 0, 30, me.props.height, 0))
                .addClass('header')
                .selectable(false)
                .render(shape);

            var tx = 15,
                ty = me.props.height / 2;

            label = (new Graph.svg.Text(tx, ty, me.props.label))
                .selectable(false)
                .clickable(false)
                .render(shape);

            label.rotate(270, tx, ty).commit();

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.header = header.guid();
            comp.label = label.guid();

            shape = block = header = label = null;
        },

        onDragEnd: function() {
            var block = this.component('block'),
                shape = this.component('shape'),
                matrix = block.matrix();

            block.reset();
            block.attr('transform', '');

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toString());
        },

        redraw: function() {
            var block = this.component('block'),
                shape = this.component('shape'),
                header = this.component('header'),
                label = this.component('label');

            var matrix, bound;

            bound  = block.bbox().toJson();
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toString());

            block.attr({
                x: 0,
                y: 0
            });

            block.dirty(true);
            block.resizable().redraw();

            header.attr({
                x: 0,
                y: 0,
                height: bound.height
            });

            header.dirty(true);

            var tx = 15,
                ty = bound.height / 2;

            label.graph.matrix = Graph.matrix();
            label.attr('transform', '');

            label.attr({
                x: tx,
                y: ty
            });

            label.wrap(bound.height - 10);
            label.rotate(270, tx, ty).commit();

        },

        toString: function() {
            return 'Graph.shape.activity.Lane';
        },

        onRemove: function() {
            // remove label
            this.component('label').remove();

            // remove header
            this.component('header').remove();

            // remove shape
            this.component('shape').remove();

            for (var name in this.components) {
                this.components[name] = null;
            }

            Graph.registry.shape.unregister(this);
        }

    });

}());