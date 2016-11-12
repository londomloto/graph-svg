
(function(){

    var storage = {},
        context = {};

    var Registry = Graph.extend({

        context: {},

        constructor: function() {
            this.context = context;
        },

        register: function(link) {
            var id = link.guid();
            storage[id] = link;
        },

        unregister: function(link) {
            var id = link.guid();
            
            if (storage[id]) {
                delete storage[id];
            }

            if (context[id]) {
                delete context[id];
            }
        },

        setContext: function(id, scope) {
            if (storage[id]) {
                context[id] = scope;
            }
        },

        count: function() {
            return _.keys(storage).length;
        },

        has: function(key) {
            return storage[key] !== undefined;
        },  

        get: function(key) {
            if (key === undefined) {
                return this.toArray();
            }

            if (key instanceof SVGElement) {
                key = Graph.$(key).data(Graph.string.ID_LINK);
            } else if (key instanceof Graph.dom.Element) {
                key = key.data(Graph.string.ID_LINK);
            }

            return storage[key];
        },

        collect: function(scope) {
            var links = [];
            for (var id in context) {
                if (context[id] == scope && storage[id]) {
                    links.push(storage[id]);
                }
            }
            return links;
        },
        
        toArray: function() {
            var keys = _.keys(storage);
            return _.map(keys, function(k){
                return storage[k];
            });
        },

        toString: function() {
            return 'Graph.registry.Link';
        }

    });

    /**
     * Singleton link manager
     */
    Graph.registry.link = new Registry();

}());