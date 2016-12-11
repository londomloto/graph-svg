
(function(){

    Graph.svg.Group = Graph.extend(Graph.svg.Vector, {

        attrs: {
            'stroke': null,
            'stroke-width': null,
            'class': null,
            'fill': null,
            'style': null
        },
        
        constructor: function(x, y) {
            // this.$super('g');
            this.superclass.prototype.constructor.call(this, 'g');

            if (x !== undefined && y !== undefined) {
                this.graph.matrix.translate(x, y);
                this.attr('transform', this.graph.matrix.toValue());
            }
        },

        shape: function() {
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

}());