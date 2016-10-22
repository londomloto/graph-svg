
(function(){

    Graph.svg.Group = Graph.extend(Graph.svg.Vector, {

        attrs: {
            // 'class': '' // Graph.string.CLS_VECTOR_GROUP
        },
        
        constructor: function(x, y) {
            // this.$super('g');
            this.superclass.prototype.constructor.call(this, 'g');

            if (x !== undefined && y !== undefined) {
                this.graph.matrix.translate(x, y);
                this.attr('transform', this.graph.matrix.toString());
            }
        },

        pathinfo: function() {
            var size = this.dimension();

            return new Graph.lang.Path([
                ['M', size.x, size.y], 
                ['l', size.width, 0], 
                ['l', 0, size.height], 
                ['l', -size.width, 0], 
                ['z']
            ]);
        },

        toString: function() {
            return 'Graph.svg.Group';
        }
        
    });

    ///////// STATIC /////////
    
    Graph.svg.Group.toString = function() {
        return 'function(x, y)';
    };

}());