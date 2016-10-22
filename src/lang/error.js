
(function(){

    var E = Graph.lang.Error = function(message) {
        this.message = message;

        var err = new Error();
        this.stack = err.stack;

        err = null;
    };
    
    Object.setPrototypeOf(E, Error);

    E.prototype = Object.create(Error.prototype);
    E.prototype.name = "Graph.lang.Error";
    E.prototype.message = "";
    E.prototype.constructor = E;

    ///////// SHORTCUT /////////
    
    Graph.error = function(message) {
        return new Graph.lang.Error(message);
    };

}());