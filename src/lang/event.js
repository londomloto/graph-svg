
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

    Evt.options = {
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
    Graph.event.CTRL = 17;
    Graph.event.CMD = 91;

    Graph.event.C = 67;
    Graph.event.V = 86;

    Graph.event.fix = function(event) {
        return $.event.fix(event);
    };

    Graph.event.target = function(event) {
        var e = event.originalEvent || event;
        var target = e.target;

        if (Graph.config.dom == 'shadow') {
            var path = e.path || (e.composedPath && e.composedPath());
            if (path) {
                target = path[0];
            }
        }

        return target;
    }

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

    Graph.event.isNavigation = function(e) {
        var navs = [
            Graph.event.ENTER,
            Graph.event.DELETE,
            Graph.event.SHIFT,
            Graph.event.CTRL,
            Graph.event.CMD,
            Graph.event.ESC
        ];

        var code = e.keyCode;
        return _.indexOf(navs, code) !== -1;
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
