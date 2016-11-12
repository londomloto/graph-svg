
(function(){

    Graph.plugin.Plugin = Graph.extend({

        props: {
            context: null,
            vector: null,
            activator: 'tool'
        },

        cached: {
            path: null,
            bbox: null
        },

        /**
         * Update options
         */
        options: function(options) {
            options = options || {};

            var context = _.defaultTo(options.context, this.vector()),
                contextId = context.guid();

            if (contextId != this.props.context) {
                this.props.context = contextId;
                this.cached.bbox = null;
                this.cached.path = null;
            }
        },
        
        vector: function() {
            return Graph.registry.vector.get(this.props.vector);
        },

        context: function() {
            if (this.props.context == this.props.vector) {
                return this.vector();
            }
            return Graph.registry.vector.get(this.props.context);    
        },
        
        invalidate: function() {
            this.cached.path = null;
            this.cached.bbox = null;
        },

        bbox: function() {
            var bbox = this.cached.bbox;

            if ( ! bbox) {
                // TODO: grab outer matrix based on current context
                var vector = this.vector(),
                    path = vector.pathinfo();

                var matrix, contextId;

                if (this.props.context == this.props.vector) {
                    matrix = vector.matrix();
                } else {
                    matrix = Graph.matrix();
                    contextId = this.props.context;

                    vector.bubble(function(curr){
                        if (curr.guid() == contextId) {
                            return false;
                        }
                        matrix.multiply(curr.matrix());
                    });
                }

                // TODO: transform path based on calculated matrix
                path = path.transform(matrix);
                
                bbox = path.bbox();
                this.cached.bbox = bbox;

                matrix = path = null;
            }

            return bbox.clone();
        },

        pathinfo: function() {
            var path = this.cached.path;

            if ( ! path) {
                // TODO: grab outer matrix based on current context
                var vector = this.vector(),
                    path = vector.pathinfo();

                var matrix, contextId;

                if (this.props.context == this.props.vector) {
                    matrix = vector.matrix();
                } else {
                    matrix = Graph.matrix();
                    contextId = this.props.context;

                    vector.bubble(function(curr){
                        if (curr.guid() == contextId) {
                            return false;
                        }
                        matrix.multiply(curr.matrix());
                    });
                }

                // TODO: transform path
                path = path.transform(matrix);
                this.cached.path = path;

                matrix = null;
            }

            return path.clone();
        },

        enable: function(activator) {},

        disable: function() {},

        destroy: function() {}

    });

}());