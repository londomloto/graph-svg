
(function(){
    
    var Reactor = Graph.plugin.Reactor = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null
        },

        plugin: null,

        cached: {
            keynavHandler: null
        },

        constructor: function(vector, listeners) {
            
            this.props.vector = vector.guid();
            this.plugin = interact(vector.node());
            this.listeners = listeners || {};

            this.plugin.on('down', function(e){
                e.originalType = 'pointerdown';
                vector.fire(e);
            }, true);

            vector.elem.on({
                mouseenter: function(e) {
                    e.type = 'pointerin'
                    vector.fire(e);
                },
                mouseleave: function(e) {
                    e.type = 'pointerout';
                    vector.fire(e);
                }
            });

            if (vector.isPaper()) {
                Graph.$(document).on('keydown', function(e){
                    e.originalType = 'keynav';
                    vector.fire(e);
                });
            }
        },
        
        vendor: function() {
            return this.plugin;
        },

        draggable: function(options) {
            return this.plugin.draggable(options);
        },

        dropzone: function(options) {
            return this.plugin.dropzone(options);
        },

        gesturable: function(options) {
            return this.plugin.gesturable(options);
        },

        destroy: function() {
            this.plugin.unset();
            this.plugin = null;
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