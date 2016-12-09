
(function(){

    Graph.shape.activity.Join = Graph.extend(Graph.shape.Shape, {
        props: {
            width: 140,
            height: 12,
            left: 0,
            top: 0
        },

        metadata: {
            name: 'activity.join',
            style: 'graph-shape-activity-join'
        },

        initComponent: function() {
            var me = this, comp = this.components;
            var shape, block, beam, label;

            shape = (new Graph.svg.Group(me.props.left, me.props.top))
                .selectable(false);

            block = (new Graph.svg.Rect(0, 0, me.props.width, me.props.height, 0))
                .addClass('block')
                .render(shape);

            block.draggable({ghost: true});
            block.connectable();
            block.on('dragend', _.bind(me.onDragEnd, me));

            comp.shape = shape.guid();
            comp.block = block.guid();
        },

        toString: function() {
            return 'Graph.shape.activity.Join';
        }
    });

    ///////// STATIC /////////

}());