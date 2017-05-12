
(function(){

    var storage = {},
        context = {};

    var Registry = function() {
        
    };

    Registry.prototype.constructor = Registry;

    Registry.prototype.register = function(link) {
        var id = link.guid();
        storage[id] = link;
    };

    Registry.prototype.unregister = function(link) {
        var id = link.guid();

        if (storage[id]) {
            delete storage[id];
        }

        if (context[id]) {
            delete context[id];
        }
    };

    Registry.prototype.setContext = function(id, scope) {
        if (storage[id]) {
            context[id] = scope;
        }
    };

    Registry.prototype.size = function() {
        return _.keys(storage).length;
    };

    Registry.prototype.has = function(key) {
        return storage[key] !== undefined;
    };

    Registry.prototype.get = function(key) {
        if (key === undefined) {
            return this.toArray();
        }
        
        if (key instanceof SVGElement) {
            key = Graph.$(key).data(Graph.string.ID_LINK);
        } else if (key instanceof Graph.dom.Element) {
            key = key.data(Graph.string.ID_LINK);
        } else if (key instanceof Graph.svg.Vector) {
            key = key.elem.data(Graph.string.ID_LINK);
        }

        return storage[key];
    };

    Registry.prototype.collect = function(scope) {
        var links = [];
        for (var id in context) {
            if (context[id] == scope && storage[id]) {
                links.push(storage[id]);
            }
        }
        return links;
    };

    Registry.prototype.toArray = function() {
        var keys = _.keys(storage);
        return _.map(keys, function(k){
            return storage[k];
        });
    };

    Registry.prototype.toString = function() {
        return 'Graph.registry.Link';
    };

    Graph.registry.link = new Registry();

}());