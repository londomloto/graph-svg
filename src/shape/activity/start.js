
(function(){

    Graph.ns('Graph.shape.activity');

    Graph.shape.activity.Start = Graph.extend(Graph.shape.Shape, {
        
        props: {
            label: 'START',
            width: 60,
            height: 60,
            left: 0,
            top: 0
        },

        initComponent: function() {
            var me = this, 
                comp = me.components;

            var shape, block, label;

            shape = (new Graph.svg.Group(me.props.left, me.props.top))
                .addClass('graph-shape-activity-start')
                .selectable(false);

            var cx = me.props.width / 2,
                cy = me.props.height / 2;

            block = (new Graph.svg.Ellipse(cx, cy, cx, cy))
                .data('text', me.props.label)
                .render(shape);

            block.draggable({ghost: true});
            block.connectable({shield: shape, wiring: 'h:v'});
            block.resizable({shield: shape});
            block.editable();

            block.on('edit',    _.bind(me.onLabelEdit, me));
            block.on('dragend', _.bind(me.onDragEnd, me));
            block.on('resize',  _.bind(me.onResize, me));
            block.on('remove',  _.bind(me.onRemove, me));

            label = (new Graph.svg.Text(cx, cy, me.props.label))
                .selectable(false)
                .clickable(false)
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

            var matrix, bound, cx, cy;

            bound  = block.bbox().toJson(),
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toString());

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

            bound  = null;
            matrix = null;
        },

        toString: function() {
            return 'Graph.shape.activity.Start';
        }

    });

}());