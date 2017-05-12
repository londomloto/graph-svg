
(function(){

    var storage = {},
        context = {};

    var Registry = function() {
        
    };

    Registry.prototype.constructor = Registry;

    Registry.prototype.register = function(shape) {
        var id = shape.guid();
        storage[id] = shape;
    };

    Registry.prototype.setContext = function(id, scope) {
        if (storage[id]) {
            context[id] = scope;
        }
    };

    Registry.prototype.collect = function(scope) {
        var shapes = [];
        for (var id in context) {
            if (context[id] == scope && storage[id]) {
                shapes.push(storage[id]);
            }
        }
        return shapes;
    };

    Registry.prototype.unregister = function(shape) {
        var id = shape.guid();
        
        if (storage[id]) {
            storage[id] = null;
            delete storage[id];
        }

        if (context[id]) {
            delete context[id];
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
            key = Graph.$(key).data(Graph.string.ID_SHAPE);
        } else if (key instanceof Graph.dom.Element) {
            key = key.data(Graph.string.ID_SHAPE);
        } else if (key instanceof Graph.svg.Vector) {
            key = key.elem.data(Graph.string.ID_SHAPE);
        }
        return storage[key];
    };

    Registry.prototype.toString = function() {
        return 'Graph.registry.Shape';
    };
    
    Graph.registry.shape = new Registry();

}());