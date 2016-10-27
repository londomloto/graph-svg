
(function(){

    Graph.plugin.Plugin = Graph.extend({

        props: {
            shield: null,
            vector: null,
            activator: 'tool'
        },

        cached: {
            bboxMatrix: null,
            pathMatrix: null
        },

        vector: function() {
            return Graph.registry.vector.get(this.props.vector);
        },

        shield: function() {
            if (this.props.shield == this.props.vector) {
                return this.vector();
            }
            return Graph.registry.vector.get(this.props.shield);
        },

        invalidate: function() {
            this.cached.bboxMatrix = null;
            this.cached.pathMatrix = null;
        },

        bboxMatrix: function() {
            var matrix = this.cached.bboxMatrix;

            if ( ! matrix) {
                if (this.props.vector == this.props.shield) {
                    matrix = this.vector().matrix().clone();
                } else {
                    matrix = this.shield().matrix().clone();
                }

                this.cached.bboxMatrix = matrix;
            }
            
            return matrix;
        },
        
        pathMatrix: function() {
            var matrix = this.cached.pathMatrix;

            if ( ! matrix) {
                matrix = Graph.matrix();

                if (this.props.vector == this.props.shield) {
                    matrix = matrix.multiply(this.vector().matrix());
                } else {
                    var shield = this.shield(),
                        vector = this.vector();

                    vector.bubble(function(curr){
                        matrix.multiply(curr.matrix());
                        if (curr == shield) {
                            return false;
                        }
                    });
                }
                this.cached.pathMatrix = matrix;
            }

            return matrix;
        },

        bbox: function() {
            var matrix = this.bboxMatrix(),
                path = this.vector().pathinfo().transform(matrix),
                bbox = path.bbox();
            
            matrix = path = null;
            
            return bbox;
        },

        pathinfo: function() {
            var matrix = this.pathMatrix(),
                path = this.vector().pathinfo().transform(matrix);
            
            matrix = null;
            
            return path;
        },

        hasShield: function() {
            return this.props.vector != this.props.shield;
        },

        enable: function(activator) {},

        disable: function() {},

        destroy: function() {}

    });

}());