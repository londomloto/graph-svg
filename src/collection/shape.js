
(function(){

    var Collection = Graph.collection.Shape = Graph.extend({
        
        items: [],

        constructor: function(shapes) {
            this.items = shapes || [];
        },

        count: function() {
            return this.items.length;
        },

        index: function(shape) {
            var id = shape.guid();
            return _.indexOf(this.items, id);
        },

        has: function(shape) {
            var id = shape.guid();
            return _.indexOf(this.items, id) !== -1;
        },
        
        push: function(shape) {
            var id = shape.guid();
            this.items.push(id);
            return this.items.length;
        },

        pop: function() {
            var id = this.items.pop();
            return Graph.registry.shape.get(id);
        },

        shift: function() {
            var id = this.items.shift();
            return Graph.registry.shape.get(id);
        },

        unshift: function(shape) {
            this.items.unshift(shape);
            return shape;
        },

        pull: function(shape) {
            var id = shape.guid();
            _.pull(this.items, id);
        },

        last: function() {
            return _.last(this.items);
        },

        each: function(iteratee) {
            var me = this;
            _.forEach(me.items, function(id, i){
                var shape = Graph.registry.shape.get(id);
                if (shape) {
                    iteratee.call(shape, shape, i);
                }
            });
        },

        toString: function() {
            return 'Graph.collection.Shape';
        }
    });

    Graph.collection.Shape.toString = function() {
        return 'function(shapes)';
    };

}());