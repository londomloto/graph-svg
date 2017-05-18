
(function(){
    
    // storages
    var vendors = {};

    var Reactor = Graph.plugin.Reactor = function(vector, listeners) {

        var me = this,
            node = vector.node(),
            guid = vector.guid();

        me.props = {
            vector: guid
        };
        
        me.listeners = listeners || {};

        var vendor = vendors[guid] = interact(node);

        vendor.on('down', function reactorDown(e){
            var target = Graph.event.target(e);
            if (target === node) {
                e.originalType = 'pointerdown';
                Graph.topic.publish('vector:pointerdown', {vector: vector});
                vector.fire(e);
            }
        }, true);

        vector.elem.on({
            contextmenu: function(e) {
                var target = Graph.event.target(e);
                if (target === node) {
                    vector.fire(e);
                    // e.preventDefault();
                }
            }
        });

        vendor = null;

    };

    Reactor.prototype.constructor = Reactor;

    Reactor.prototype.fire = function(eventType) {
        var eventObject;

        switch(eventType) {
            case 'down':

                eventObject = {
                    type: 'mousedown'
                };

                break;
        }

        if (eventObject) {
            // this.vendor().fire(eventObject);
        }
    };

    Reactor.prototype.vendor = function() {
        return vendors[this.props.vector];
    };

    Reactor.prototype.draggable = function(options) {
        return this.vendor().draggable(options);
    };

    Reactor.prototype.dropzone = function(options) {
        return this.vendor().dropzone(options);
    };

    Reactor.prototype.gesturable = function(options) {
        return this.vendor().gesturable(options);
    };

    Reactor.prototype.destroy = function() {
        var guid = this.props.vector,
            vendor = vendors[guid];

        if (vendor) {
            vendor.unset();
        }

        delete vendors[guid];
    };

    Reactor.prototype.toString = function() {
        return 'Graph.plugin.Reactor';
    };

}());