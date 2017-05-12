
(function(){
    
    var storage = {},
        context = {};

    var Registry = function() {

    };

    Registry.prototype.constructor = Registry;

    Registry.prototype.register = function(vector) {
        var id = vector.guid(), found = this.get(id);
        storage[id] = vector;
    };

    Registry.prototype.unregister = function(vector) {
        var id = vector.guid();
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

    Registry.prototype.toArray = function() {
        var keys = _.keys(storage);
        return _.map(keys, function(k){
            return storage[k];
        });
    };

    Registry.prototype.get = function(key) {

        if (_.isUndefined(key)) {
            return this.toArray();
        }

        if (key instanceof SVGElement) {
            if (key.tagName == 'tspan') {
                // we only interest to text
                key = key.parentNode;
            }
            key = Graph.$(key).data(Graph.string.ID_VECTOR);
        } else if (key instanceof Graph.dom.Element) {
            key = key.data(Graph.string.ID_VECTOR);
        }
        return storage[key];
    };

    Registry.prototype.collect = function(scope) {
        var vectors = [];
        for (var id in context) {
            if (context[id] == scope && storage[id]) {
                vectors.push(storage[id]);
            }
        }
        return vectors;
    };

    Registry.prototype.wipe = function(paper) {
        var pid = paper.guid();

        for (var id in storage) {
            if (storage.hasOwnProperty(id)) {
                if (storage[id].tree.paper == pid) {
                    delete storage[id];
                }
            }
        }

        if (storage[pid]) {
            delete storage[pid];
        }
    };

    Registry.prototype.toString = function() {
        return 'Graph.registry.Vector';
    };
    
    Graph.registry.vector = new Registry();

}());