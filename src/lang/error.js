
(function(){

    var Err = Graph.lang.Error = function(message) {
        this.message = message;

        var err = new Error();
        this.stack = err.stack;

        err = null;
    };

    Err.options = {
        message: ''
    };
    Err.extend = Graph.lang.Class.extend;

    Err.prototype = Object.create(Error.prototype);
    Err.prototype.constructor = Err;
    Err.prototype.name = "Graph.lang.Error";
    Err.prototype.message = "";

    ///////// SHORTCUT /////////

    Graph.error = function(message) {
        return new Graph.lang.Error(message);
    };

    Graph.isError = function(obj) {
        return obj instanceof Graph.lang.Error;
    };

}());
