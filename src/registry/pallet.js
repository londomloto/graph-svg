
(function(){

    var storage = {};

    var Registry = function() {
        
    };
    
    Registry.prototype.constructor = Registry;

    Registry.prototype.register = function(pallet) {
        var id = pallet.guid();
        storage[id] = pallet;
    };

    Registry.prototype.unregister = function(pallet) {
        var id = pallet.guid();
        if (storage[id]) {
            delete storage[id];
        }
    };

    Registry.prototype.get = function(key) {
        if (key === undefined) {
            return this.toArray();
        }
        return storage[key];
    };

    Registry.prototype.toArray = function() {
        var keys = _.keys(storage);
        return _.map(keys, function(k){
            return storage[k];
        });
    };

    Registry.prototype.toString = function() {
        return 'Graph.registry.Pallet';
    };

    Graph.registry.pallet = new Registry();

}());