
(function(){

    Graph.util.Toolpad = Graph.extend({

        props: {
            vector: null,

            rendered: false,
            suspended: true,
            
            tools: [

            ]
        },

        components: {
            block: null
        },

        paper: null,

        constructor: function(paper) {
            this.paper = paper;
            this.initComponent();

            Graph.topic.subscribe('vector/select', _.bind(this.onVectorSelect, this));
            Graph.topic.subscribe('vector/deselect', _.bind(this.onVectorDeselect, this));
        },

        initComponent: function() {
            var comp = this.components;
            comp.block = Graph.$('<div class="graph-util-toolpad">');
        },

        render: function() {
            if (this.props.rendered) {
                this.redraw();
                return;
            }

            this.paper.container().append(this.components.block);
            this.rendered = true;

            this.redraw();
        },

        vector: function() {
            return Graph.registry.vector.get(this.props.vector);
        },

        resume: function() {
            this.props.suspended = false;

            if ( ! this.props.rendered) {
                this.render();
            } else {
                this.paper.container().append(this.components.block);
            }

            this.redraw();
        },

        redraw: function() {
            var vector = this.vector(),
                box = vector.bbox().toJson(),
                pos = vector.position();

            this.components.block.css({
                top: pos.top,
                left: pos.left + box.width + 12
            });
        },

        suspend: function()  {
            this.props.suspended = true;
            this.components.block.detach();
        },

        onVectorSelect: function(e) {
            // var vector = e.vector;
            // this.props.vector = vector.guid();
            // this.resume();
        },

        onVectorDeselect: function(e) {
            // this.suspend();
        }

    });

}());