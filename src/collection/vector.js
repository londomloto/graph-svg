
(function(){

    var Collection = Graph.collection.Vector = Graph.extend({
        
        items: [],

        constructor: function(vectors) {
            this.items = _.map(vectors, function(v){
                return v.guid();
            });
        },

        has: function(vector) {
            var id = vector.guid();
            return _.indexOf(this.items, id) > -1;
        },
        
        not: function(vector) {
            var guid = vector.guid();

            var items = _.filter(this.items, function(o) {
                return o != guid;
            });

            return new Collection(items);
        },

        count: function() {
            return this.items.length;
        },

        index: function(vector) {
            var id = vector.guid();
            return _.indexOf(this.items, id);
        },
        
        push: function(vector) {
            var id = vector.guid();
            this.items.push(id);
            return this.items.length;
        },

        pop: function() {
            var id = this.items.pop();
            return Graph.registry.vector.get(id);
        },

        shift: function() {
            var id = this.items.shift();
            return Graph.registry.vector.get(id);
        },

        unshift: function(vector) {
            var id = vector.guid();
            this.items.unshift(id);
        },

        insert: function(vector, offset) {
            if (offset === -1) {
                offset = 0;
            }
            this.items.splice(offset, 0, vector.guid());
        },

        pull: function(vector) {
            var id = vector.guid();
            _.pull(this.items, id);
        },

        clear: function() {
            this.items = [];
        },

        reverse: function() {
            this.items.reverse();
            return this;
        },

        each: function(iteratee) {
            _.forEach(this.items, function(id){
                var vector = Graph.registry.vector.get(id);
                iteratee.call(vector, vector);
            });
        },
        
        bbox: function() {
            var x = [], y = [], x2 = [], y2 = [];
            var vector, box;

            for (var i = this.items.length - 1; i >= 0; i--) {
                vector = Graph.registry.vector.get(this.items[i]);
                box = vector.bbox().toJson();

                x.push(box.x);
                y.push(box.y);
                x2.push(box.x + box.width);
                y2.push(box.y + box.height);
            }   

            x  = _.min(x);
            y  = _.min(y);
            x2 = _.max(x2);
            y2 = _.max(y2);

            return Graph.bbox({
                x: x,
                y: y,
                x2: x2,
                y2: y2,
                width: x2 - x,
                height: y2 - y
            });
        },

        toArray: function() {
            return _.map(this.items, function(id){
                return Graph.registry.vector.get(id);
            });
        },

        toString: function() {
            return 'Graph.collection.Vector';
        }
    });

    Graph.collection.Vector.toString = function() {
        return 'function(vectors)';
    };

    ///////// COLLECTIVE METHOD /////////
    var methods = ['attr', 'remove'];

    _.forEach(methods, function(method){
        (function(method){
            Collection.prototype[method] = function() {
                var args = _.toArray(arguments);
                this.each(function(vector){
                    vector[method].apply(vector, args);
                });
                return this;
            };
        }(method));
    });
    
}());