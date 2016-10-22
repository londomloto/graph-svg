
(function(){

    var Shape = Graph.shape.Shape = Graph.extend({

        props: {
            id: null,
            guid: null,
            width: 0,
            height: 0,
            label: ''
        },

        components: {
            shape: null,
            block: null,
            label: null
        },

        plugins: {},

        constructor: function(options) {
            _.assign(this.props, options || {});

            this.props.guid = 'graph-shape-' + (++Shape.guid);
            this.initComponent();
            Graph.registry.shape.register(this);
        },

        guid: function() {
            return this.props.guid;
        },

        /**
         * Default draw function
         */
        draw: function() {

        },

        render: function(paper) {
            var component = this.component();
            component && component.render(paper);
        },

        initComponent: function() {
            var shape = (new Graph.svg.Group());
            this.components.shape = shape.guid();
            shape = null;
        },

        component: function(name) {
            var manager = Graph.registry.vector;
            if (name === undefined) {
                return manager.get(this.components.shape);
            }
            return manager.get(this.components[name]);
        },
        
        hub: function() {
            // TODO return connectable component
            return this.component('block');
        },

        redraw: _.debounce(function() {
            var label = this.component('label'),
                block = this.component('block'),
                bound = block.bbox().toJson();

            label.attr({
                x: bound.x + bound.width  / 2, 
                y: bound.x + bound.height / 2
            });

            label.wrap(bound.width - 10);

        }, 1),

        move: function(x, y) {
            var shape = this.component(),
                imatrix = shape.matrix().clone().invert();

            x -= this.props.width / 2;
            y -= this.props.height / 2;

            shape.matrix().multiply(imatrix);
            shape.translate(x, y).commit();

            imatrix = null;
        },

        onLabelEdit: function(e) {
            var text = e.text;
            this.component('label').props.text = text;
            this.redraw();
        },

        onDragEnd: function(e) {
            var block = this.component('block'),
                shape = this.component('shape'),
                matrix = block.matrix();

            block.reset();

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toString());
        },

        onResize: function() {
            this.redraw();
        },

        onRemove: function() {
            // remove label
            this.component('label').remove();

            // remove shape
            this.component('shape').remove();

            for (var name in this.components) {
                this.components[name] = null;
            }

            Graph.registry.shape.unregister(this);
        }
    });

    ///////// STATICS /////////
    
    Shape.guid = 0;

    ///////// EXTENSION /////////
    
    Graph.isShape = function(obj) {
        return obj instanceof Graph.shape.Shape;
    };

}());