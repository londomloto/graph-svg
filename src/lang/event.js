
(function(_, $){

    var E = Graph.lang.Event = function(type, data){
        this.type = type;
        this.init(data);
    };

    E.toString = function() {
        return 'function(type, data)';
    };
    
    _.extend(E.prototype, {
        
        cancelBubble: false,
        defaultPrevented: false,

        // sync with `interactjs`
        propagationStopped: false,
        immediatePropagationStopped: false,

        originalData: null,

        init: function(data) {
            if (data) {
                this.originalData = data;    
                _.assign(this, data || {});
            }
        },

        stopPropagation: function() {
            this.cancelBubble = this.propagationStopped = true;
        },

        stopImmediatePropagation: function() {
            this.immediatePropagationStopped = this.propagationStopped = true;
        },

        preventDefault: function() {
            this.defaultPrevented = true;
        },

        toString: function() {
            return 'Graph.lang.Event';
        }
    });

    ///////// SHORTCUT /////////
    
    Graph.event = function(type, data) {
        return new Graph.lang.Event(type, data);
    };

    _.extend(Graph.event, {

        ESC: 27,
        ENTER: 13,
        DELETE: 46,

        fix: function(event) {
            return $.event.fix(event);
        },

        original: function(event) {
            return event.originalEvent || event;
        },

        position: function(event) {
            return {
                x: event.clientX,
                y: event.clientY
            };
        },
        
        relative: function(event, vector) {

            var position = Graph.event.position(event),
                matrix = vector.matrix().clone().invert(),
                relative = {
                    x: matrix.x(position.x, position.y),
                    y: matrix.y(position.x, position.y)
                };

            matrix = null;

            return relative;
        },

        isPrimaryButton: function(event) {
            var original = Graph.event.original(event);
            return ! original.button;
        },

        hasPrimaryModifier: function(event) {
            if ( ! Graph.event.isPrimaryButton(event)) {
                return false;
            }
            var original = Graph.event.original(event);
            return Graph.isMac() ? original.metaKey : original.ctrlKey;
        },

        hasSecondaryModifier: function(event) {
            var original = Graph.event.original(event);
            return Graph.event.isPrimaryButton(event) && original.shiftKey;
        }
    });
    
}(_, jQuery));