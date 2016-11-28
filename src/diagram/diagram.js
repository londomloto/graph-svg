
(function(){

    Graph.diagram.Diagram = Graph.extend({
        
        props: {
            type: '',
            name: '',
            desc: ''
        },

        constructor: function(options) {
            options = options || {};
            _.assign(this.props, options);
        },

        toString: function() {
            return 'Graph.diagram.Diagram';
        }
    });

    Graph.diagram.Diagram.toString = function() {
        return 'function(options)';
    };

}());