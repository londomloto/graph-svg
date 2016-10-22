
(function(){
    
    var storage = {},
        context = {};
    
    var Registry = Graph.extend({
        
        context: {},

        constructor: function() {
            this.context = context;
        },

        register: function(vector) {
            var id = vector.guid(), found = this.get(id);
            
            if (found !== vector) {
                // vector.on('resize', function(){
                //     if (vector.isConnectable()) {
                //         var delay = _.delay(function(){
                //             clearTimeout(delay);
                //             Graph.registry.link.synchronize(vector);
                //         }, 1);
                //     }
                // });

                // vector.on('translate', function(){
                //     if (vector.isConnectable()) {
                //         var delay = _.delay(function(){
                //             clearTimeout(delay);
                //             Graph.registry.link.synchronize(vector);
                //         }, 1);
                //     }
                // });
            }

            storage[id] = vector;
        },

        unregister: function(vector) {
            var id = vector.guid();
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

        toArray: function() {
            var keys = _.keys(storage);
            return _.map(keys, function(k){
                return storage[k];
            });
        },

        get: function(key) {

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
        },

        wipe: function(paper) {
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
        },
        
        toString: function() {
            return 'Graph.registry.Vector';
        }

    });

    /**
     * Singleton vector manager
     */
    Graph.registry.vector = new Registry();

}());