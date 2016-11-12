
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

        metadata: {
            name: 'activity.start',
            style: 'graph-shape-activity-start'
        },

        initComponent: function() {
            var me = this, 
                comp = me.components;

            var shape, block, label;

            shape = (new Graph.svg.Group(me.props.left, me.props.top))
                .selectable(false);

            var cx = me.props.width / 2,
                cy = me.props.height / 2;

            block = (new Graph.svg.Ellipse(cx, cy, cx, cy))
                .addClass(Graph.styles.SHAPE_BLOCK)
                .data('text', me.props.label)
                .render(shape);

            block.draggable({
                ghost: true,
                dragClass: Graph.styles.SHAPE_DRAG
            });
            
            block.connectable({wiring: 'h:v'});
            block.resizable();
            block.editable();
            block.snappable();

            block.elem.data(Graph.string.ID_SHAPE, this.guid());

            block.on('edit.shape',    _.bind(me.onLabelEdit, me));
            block.on('dragstart.shape', _.bind(me.onDragStart, me));
            block.on('dragend.shape', _.bind(me.onDragEnd, me));
            block.on('resize.shape',  _.bind(me.onResize, me));
            block.on('remove.shape',  _.bind(me.onRemove, me));
            block.on('select.shape',  _.bind(me.onSelect, me));
            block.on('deselect.shape',  _.bind(me.onDeselect, me));

            label = (new Graph.svg.Text(cx, cy, me.props.label))
                .addClass(Graph.styles.SHAPE_LABEL)
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
    
    Graph.shape.activity.Start.toString = function() {
        return 'function(options)';
    };

}());