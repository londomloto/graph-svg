
(function(_, $){

    var Evt = Graph.lang.Event = function(type, data){
        this.type = type;
        this.originalData = null;
        this.cancelBubble = false;
        this.defaultPrevented = false;
        this.propagationStopped = false;
        this.immediatePropagationStopped = false;

        this.init(data);
    };
    
    Evt.defaults = {
        type: null,
        originalData: null,
        cancelBubble: false,
        defaultPrevented: false,
        propagationStopped: false,
        immediatePropagationStopped: false
    };

    Evt.extend = Graph.lang.Class.extend;

    Evt.prototype.constructor = Evt;
    
    Evt.prototype.init = function(data) {
        if (data) {
            this.originalData = data;    
            _.assign(this, data || {});
        }
    };

    Evt.prototype.stopPropagation = function() {
        this.cancelBubble = this.propagationStopped = true;
    };

    Evt.prototype.stopImmediatePropagation = function() {
        this.immediatePropagationStopped = this.propagationStopped = true;
    };

    Evt.prototype.preventDefault = function() {
        this.defaultPrevented = true;
    };

    Evt.prototype.toString = function() {
        return 'Graph.lang.Event';
    };

    ///////// SHORTCUT /////////
    
    Graph.event = function(type, data) {
        return new Graph.lang.Event(type, data);
    };

    Graph.isEvent = function(obj) {
        return obj instanceof Graph.lang.Event;
    };
    
    ///////// STATIC /////////
    
    Graph.event.ESC = 27;
    Graph.event.ENTER = 13;
    Graph.event.DELETE = 46;
    Graph.event.SHIFT = 16;

    Graph.event.fix = function(event) {
        return $.event.fix(event);
    };

    Graph.event.original = function(event) {
        return event.originalEvent || event;
    };

    Graph.event.position = function(event) {
        return {
            x: event.clientX,
            y: event.clientY
        };
    };
    
    Graph.event.relative = function(event, vector) {
        var position = Graph.event.position(event),
            matrix = vector.matrix().clone().invert(),
            relative = {
                x: matrix.x(position.x, position.y),
                y: matrix.y(position.x, position.y)
            };

        matrix = null;

        return relative;
    };

    Graph.event.isPrimaryButton = function(event) {
        var original = Graph.event.original(event);
        return ! original.button;
    };

    Graph.event.hasPrimaryModifier = function(event) {
        if ( ! Graph.event.isPrimaryButton(event)) {
            return false;
        }
        var original = Graph.event.original(event);
        return Graph.isMac() ? original.metaKey : original.ctrlKey;
    };

    Graph.event.hasSecondaryModifier = function(event) {
        var original = Graph.event.original(event);
        return Graph.event.isPrimaryButton(event) && original.shiftKey;
    };
    
}(_, jQuery));