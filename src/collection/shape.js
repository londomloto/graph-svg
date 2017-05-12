
(function(){

    var Collection = Graph.collection.Shape = function(shapes) {
        this.items = _.map(shapes, function(s){
            return s.guid();
        });
        shapes = null;
    };

    Collection.prototype.constructor = Collection;

    Collection.prototype.keys = function() {
        return this.items.slice();
    };

    Collection.prototype.size = function() {
        return this.items.length;
    };

    Collection.prototype.index = function(shape) {
        var id = shape.guid();
        return _.indexOf(this.items, id);
    };

    Collection.prototype.has = function(shape) {
        var id = shape.guid();
        return _.indexOf(this.items, id) !== -1;
    };

    Collection.prototype.find = function(identity) {
        var shapes = this.toArray();
        return _.find(shapes, identity);
    };

    Collection.prototype.push = function(shape) {
        var me = this;
        
        if (_.isArray(shape)) {
            _.forEach(shape, function(s){
                var id = s.guid();
                me.items.push(id);
            });
        } else {
            me.items.push(shape.guid());
        }
        
        return me.items.length;
    };

    Collection.prototype.pop = function() {
        var id = this.items.pop();
        return Graph.registry.shape.get(id);
    };

    Collection.prototype.shift = function() {
        var id = this.items.shift();
        return Graph.registry.shape.get(id);
    };

    Collection.prototype.unshift = function(shape) {
        this.items.unshift(shape);
        return shape;
    };

    Collection.prototype.pull = function(shape) {
        var id = shape.guid();
        _.pull(this.items, id);
    };

    Collection.prototype.last = function() {
        return _.last(this.items);
    };

    Collection.prototype.each = function(iteratee) {
        var me = this;
        _.forEach(me.items, function(id, i){
            var shape = Graph.registry.shape.get(id);
            if (shape) {
                iteratee.call(shape, shape, i);
            }
        });
    };

    Collection.prototype.bbox = function() {
        var x = [], y = [], x2 = [], y2 = [];
        var shape, vector, box;

        for (var i = this.items.length - 1; i >= 0; i--) {
            shape = Graph.registry.shape.get(this.items[i]);
            vector = shape.component();
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
            return Graph.registry.shape.get(id);
        });
    };

    Collection.prototype.toString = function() {
        return 'Graph.collection.Shape';
    };
    
}());