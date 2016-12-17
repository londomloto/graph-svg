
(function(){

    var Collection = Graph.collection.Link = function(links) {
        this.items = _.map(links, function(l){
            return l.guid();
        });
        links = null;
    };

    Collection.prototype.constructor = Collection;

    Collection.prototype.keys = function() {
        return this.items.slice();
    };

    Collection.prototype.size = function() {
        return this.items.length;
    };

    Collection.prototype.index = function(link) {
        var id = link.guid();
        return _.indexOf(this.items, id);
    };

    Collection.prototype.has = function(link) {
        var id = link.guid();
        return _.indexOf(this.items, id) !== -1;
    };

    Collection.prototype.find = function(identity) {
        var links = this.toArray();
        return _.find(links, identity);
    };

    Collection.prototype.push = function(link) {
        var me = this;
        
        if (_.isArray(link)) {
            _.forEach(link, function(s){
                var id = s.guid();
                me.items.push(id);
            });
        } else {
            me.items.push(link.guid());
        }
        
        return me.items.length;
    };

    Collection.prototype.pop = function() {
        var id = this.items.pop();
        return Graph.registry.link.get(id);
    };

    Collection.prototype.shift = function() {
        var id = this.items.shift();
        return Graph.registry.link.get(id);
    };

    Collection.prototype.unshift = function(link) {
        this.items.unshift(link);
        return link;
    };

    Collection.prototype.pull = function(link) {
        var id = link.guid();
        _.pull(this.items, id);
    };

    Collection.prototype.last = function() {
        return _.last(this.items);
    };

    Collection.prototype.each = function(iteratee) {
        var me = this;
        _.forEach(me.items, function(id, i){
            var link = Graph.registry.link.get(id);
            if (link) {
                iteratee.call(link, link, i);
            }
        });
    };
    
    Collection.prototype.toArray = function() {
        return _.map(this.items, function(id){
            return Graph.registry.link.get(id);
        });
    };

    Collection.prototype.toString = function() {
        return 'Graph.collection.link';
    };
    
}());