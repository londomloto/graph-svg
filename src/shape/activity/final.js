
(function(){

    Graph.shape.activity.Final = Graph.extend(Graph.shape.Shape, {
        
        props: {
            label: 'STOP',
            width: 60,
            height: 60,
            left: 0,
            top: 0
        }, 

        metadata: {
            name: 'activity.final',
            style: 'graph-shape-activity-final'
        },

        initComponent: function() {
            var me = this, 
                comp = me.components;

            var shape, block, inner, label;

            shape = (new Graph.svg.Group(me.props.left, me.props.top))
                .selectable(false);

            var cx = me.props.width / 2,
                cy = me.props.height / 2;

            block = (new Graph.svg.Ellipse(cx, cy, cx, cy))
                .addClass('comp-block')
                .data('text', me.props.label)
                .render(shape);

            block.draggable({ghost: true});
            block.connectable();
            block.resizable();
            block.editable();

            block.on('edit',    _.bind(me.onLabelEdit, me));
            block.on('dragend', _.bind(me.onDragEnd, me));
            block.on('resize',  _.bind(me.onResize, me));
            block.on('remove',  _.bind(me.onRemove, me));

            inner = (new Graph.svg.Ellipse(cx, cy, cx - 6, cy - 6))
                .addClass('comp-inner')
                .clickable(false)
                .selectable(false)
                .render(shape);

            label = (new Graph.svg.Text(cx, cy, me.props.label))
                .addClass('comp-label')
                .selectable(false)
                .clickable(false)
                .render(shape);

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();
            comp.inner = inner.guid();

            shape = block = label = null;
        },

        redraw: function() {
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

        onRemove: function() {
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
        }

    });

    ///////// STATIC /////////
    
    Graph.shape.activity.Final.toString = function() {
        return 'function(options)';
    };

}());