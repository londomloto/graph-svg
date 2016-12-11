
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
            var comp = this.components,
                pmgr = this.plugins.manager;

            var shape, block, beam, label;

            shape = (new Graph.svg.Group(this.props.left, this.props.top))
                .selectable(false);

            block = (new Graph.svg.Rect(0, 0, this.props.width, this.props.height, 0))
                .addClass('block')
                .render(shape);

            pmgr.install('dragger', block, {ghost: true});
            pmgr.install('network', block);

            block.on('dragend', _.bind(this.onDragEnd, this));
            
            comp.shape = shape.guid();
            comp.block = block.guid();
        },

        toString: function() {
            return 'Graph.shape.activity.Join';
        }
    });

    ///////// STATIC /////////

}());
