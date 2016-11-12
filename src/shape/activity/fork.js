
(function(){

    Graph.shape.activity.Fork = Graph.extend(Graph.shape.Shape, {

        props: {
            width: 100,
            height: 50,
            left: 0,
            top: 0
        },

        metadata: {
            name: 'activity.fork',
            style: 'graph-shape-activity-fork'
        },

        initComponent: function() {
            var me = this, comp = this.components;
            var shape, block, label;

            shape = (new Graph.svg.Group(me.props.left, me.props.top))
                .selectable(false);

            comp.shape = shape.guid();
        }

    });

    ///////// STATIC /////////
    
    Graph.shape.activity.Fork.toString = function() {
        return 'function(options)';
    };

}());