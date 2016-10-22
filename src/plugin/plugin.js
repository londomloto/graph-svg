
(function(){

    Graph.plugin.Plugin = Graph.extend({

        props: {
            vector: null
        },

        vector: function() {
            return Graph.registry.vector.get(this.props.vector);
        },

        invalidate: function() {},

        enable: function() {},

        disable: function() {},

        destroy: function() {}

    });

}());