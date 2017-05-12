
(function(){

    var Collection = Graph.collection.Point = function(points) {
        this.items = points || [];
    };

    Collection.prototype.constructor = Collection;
    Collection.prototype.items = [];

    Collection.prototype.get = function(index) {
        return this.items[index];
    };

    Collection.prototype.push = function(item) {
        this.items.push(item);
        return item;
    };

    Collection.prototype.pop = function() {
        var item = this.items.pop();
        return item;
    };

    Collection.prototype.shift = function() {
        var item = this.items.shift();
        return item;
    };

    Collection.prototype.first = function() {
        return _.head(this.items);
    };

    Collection.prototype.last = function() {
        return _.last(this.items);
    };

    Collection.prototype.clear = function() {
        this.items = [];
        return this;
    },

    Collection.prototype.modify = function(index, x, y) {
        var item = this.items[index];
        item.props.x = x;
        item.props.y = y;
        return item;
    };

    Collection.prototype.each = function(iteratee) {
        _.forEach(this.items, iteratee);
    };

    Collection.prototype.toArray = function() {
        return this.items;
    };

    Collection.prototype.toJson = function() {
        return _.map(this.items, function(item){
            return item.toJson();
        });
    };

}());