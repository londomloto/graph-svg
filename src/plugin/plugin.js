
(function(){

    Graph.plugin.Plugin = Graph.extend({

        props: {
            vector: null,
            activator: 'tool'
        },

        cached: {
            
        },

        /**
         * Get/set options
         */
        options: function(options) {

        },
        
        vector: function() {
            return Graph.registry.vector.get(this.props.vector);
        },

        invalidate: function() {
            
        },

        enable: function(activator) {},

        disable: function() {},

        destroy: function() {}

    });

}());