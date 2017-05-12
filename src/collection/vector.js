
(function(){

    var Collection = Graph.collection.Vector = function(vectors) {
        this.items = _.map(vectors || [], function(v){
            return v.guid();
        });
        vectors = null;
    };

    Collection.prototype.constructor = Collection;

    Collection.prototype.has = function(vector) {
        var id = vector.guid();
        return _.indexOf(this.items, id) > -1;
    };
    
    Collection.prototype.not = function(vector) {
        var guid = vector.guid();

        var items = _.filter(this.items, function(o) {
            return o != guid;
        });

        return new Collection(items);
    };

    Collection.prototype.size = function() {
        return this.items.length;
    };
    
    Collection.prototype.index = function(vector) {
        var id = vector.guid();
        return _.indexOf(this.items, id);
    };
    
    Collection.prototype.push = function(vector) {
        var id = vector.guid();
        this.items.push(id);
        return this.items.length;
    };

    Collection.prototype.pop = function() {
        var id = this.items.pop();
        return Graph.registry.vector.get(id);
    };

    Collection.prototype.shift = function() {
        var id = this.items.shift();
        return Graph.registry.vector.get(id);
    };

    Collection.prototype.unshift = function(vector) {
        var id = vector.guid();
        this.items.unshift(id);
    };

    Collection.prototype.insert = function(vector, offset) {
        if (offset === -1) {
            offset = 0;
        }
        this.items.splice(offset, 0, vector.guid());
    };

    Collection.prototype.pull = function(vector) {
        var id = vector.guid();
        _.pull(this.items, id);
    };

    Collection.prototype.clear = function() {
        this.items = [];
    };

    Collection.prototype.reverse = function() {
        this.items.reverse();
        return this;
    };

    Collection.prototype.each = function(iteratee) {
        _.forEach(this.items, function(id){
            var vector = Graph.registry.vector.get(id);
            iteratee.call(vector, vector);
        });
    };
    
    Collection.prototype.bbox = function() {
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
    };

    Collection.prototype.toArray = function() {
        return _.map(this.items, function(id){
            return Graph.registry.vector.get(id);
        });
    };

    Collection.prototype.toString = function() {
        return 'Graph.collection.Vector';
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