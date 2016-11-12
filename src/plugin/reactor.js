
(function(){
    
    // storages
    var vendors = {};

    var Reactor = Graph.plugin.Reactor = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null
        },

        navigationKeys: [
            Graph.event.ENTER,
            Graph.event.DELETE,
            Graph.event.SHIFT,
            Graph.event.CTRL,
            Graph.event.ESC
        ],

        constructor: function(vector, listeners) {
            var me = this, 
                node = vector.node(),
                guid = vector.guid();

            var vendor;

            me.props.vector = guid;
            me.listeners = listeners || {};

            vendor = vendors[guid] = interact(node);

            vendor.on('down', function reactorDown(e){
                if (e.target === node) {
                    e.originalType = 'pointerdown';
                    vector.fire(e);    
                }
            }, true);

            vector.elem.on({
                contextmenu: function(e) {
                    if (e.currentTarget === node) {
                        vector.fire(e);
                        // e.preventDefault();
                    }
                }
            });

            if (vector.isPaper()) {
                var doc = Graph.$(document);

                doc.on('keydown', function(e){
                    if (me.isNavigation(e) && Graph.cached.paper == guid) {
                        e.originalType = 'keynavdown';
                        vector.fire(e); 
                    }
                });

                doc.on('keyup', function(e){
                    if (me.isNavigation(e) && Graph.cached.paper == guid) {
                        e.originalType = 'keynavup';
                        vector.fire(e);
                    }
                });

                doc = null;
            }

            vendor = null;
        },

        isNavigation: function(e) {
            var key = e.keyCode;
            return _.indexOf(this.navigationKeys, key) > -1;
        },
        
        vendor: function() {
            return vendors[this.props.vector];
        },

        draggable: function(options) {
            return this.vendor().draggable(options);
        },

        dropzone: function(options) {
            return this.vendor().dropzone(options);
        },

        gesturable: function(options) {
            return this.vendor().gesturable(options);
        },

        destroy: function() {
            var guid = this.props.vector,
                vendor = vendors[guid];

            if (vendor) {
                vendor.unset();
            }

            delete vendors[guid];
        },

        toString: function() {
            return 'Graph.plugin.Reactor';
        }
    });

    var on  = Reactor.prototype.on,
        off = Reactor.prototype.off;

    /**
     * Override
     */
    Reactor.prototype.on = function(event, handler) {
        var vector = this.vector();
        return on.apply(vector, [event, handler]);
    };

    /**
     * Override
     */
    Reactor.prototype.off = function(event, handler) {
        var vector = this.vector();
        return off.apply(vector, [event, handler]);
    };

}());