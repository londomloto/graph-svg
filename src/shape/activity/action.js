
(function(){

    Graph.shape.activity.Action = Graph.extend(Graph.shape.Shape, {

        props: {
            label: 'Action',
            width: 140,
            height: 60,
            left: 0,
            top: 0
        },

        metadata: {
            name: 'activity.action',
            icon: Graph.icons.SHAPE_ACTION,
            style: 'graph-shape-activity-action'
        },

        initComponent: function() {
            var me = this, comp = this.components;
            var shape, block, label;

            var cx = me.props.width / 2,
                cy = me.props.height / 2;

            shape = (new Graph.svg.Group(me.props.left, me.props.top))
                .selectable(false);

            block = (new Graph.svg.Rect(0, 0, me.props.width, me.props.height))
                .addClass(Graph.styles.SHAPE_BLOCK)
                .data('text', me.props.label)
                .render(shape);

            block.elem.data(Graph.string.ID_SHAPE, me.guid());

            block.draggable({ghost: true, dragClass: Graph.styles.SHAPE_DRAG});
            block.resizable();
            block.editable();
            block.connectable({wiring: 'h:v'});
            block.snappable();

            block.on('edit.shape',      _.bind(me.onLabelEdit, me));
            block.on('dragstart.shape', _.bind(me.onDragStart, me));
            block.on('dragend.shape',   _.bind(me.onDragEnd, me));
            block.on('resize.shape',    _.bind(me.onResize, me));
            block.on('remove.shape',    _.bind(me.onRemove, me));
            block.on('select.shape',    _.bind(me.onSelect, me));
            block.on('deselect.shape',  _.bind(me.onDeselect, me));

            label = (new Graph.svg.Text(cx, cy, me.props.label))
                .addClass(Graph.styles.SHAPE_LABEL)
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
            shape.attr('transform', shape.matrix().toValue());

            block.attr({
                x: 0,
                y: 0
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
            
            bound  = null;
            matrix = null;
        },

        onResize: function() {
            this.redraw();
        },

        toString: function() {
            return 'Graph.shape.activity.Action';
        }

    });

    ///////// STATIC /////////

}());