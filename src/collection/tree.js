
(function(){

    var Tree = Graph.collection.Tree = function(nodes) {
        var me = this;

        me.nodes = nodes;
        
        me.key = function(node){ return node; };

        me.bisect = _.bisector(function(node){ 
            return me.key(node); 
        }).left;
    };

    Tree.prototype.get = function(index) {
        return this.nodes[index];
    };

    Tree.prototype.size = function() {
        return this.nodes.length;
    };

    Tree.prototype.insert = function(node) {
        var index = this.index(node),
            value = this.key(node);

        if (this.nodes[index] && value == this.key(this.nodes[index])) {
            return;
        }

        this.nodes.splice(index, 0, node);

        return index;
    };

    Tree.prototype.remove = function(node) {
        var index = this.index(node);
        this.nodes.splice(index, 1);
        
        return index;
    };

    Tree.prototype.keygen = function(keygen) {
        this.key = keygen;
        return this;
    };

    Tree.prototype.index = function(node) {
        return this.bisect(this.nodes, this.key(node));
    };

    Tree.prototype.order = function() {
        this.nodes.sort(_.ascendingKey(this.key));
        return this;
    };
    
    Tree.prototype.root = function() {
        return this.nodes[0];
    };
    
    Tree.prototype.cascade = function(node, iteratee) {
        var index = this.index(node),
            nodes = this.nodes,
            count = this.nodes.length;
        
        var start = 0;
        
        for (var n = index; n < count; n++) {
            iteratee(nodes[n], start);
            start++;
        }
    };

    Tree.prototype.bubble = function(node, iteratee) {
        var index = this.index(node),
            nodes = this.nodes;

        var start = 0;

        for (var n = index; n >= 0; n--) {
            iteratee(nodes[n], start);
            start++;
        }
    };

    Tree.prototype.toArray = function() {
        return this.nodes.slice();
    };

}());