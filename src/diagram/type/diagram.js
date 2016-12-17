
(function(){

    Graph.diagram.type.Diagram = Graph.extend({
        props: {
            id: null,
            paper: null,
            dirty: false
        },

        drawing: {
            enabled: false
        },

        metadata: {
            type: 'diagram.diagram'
        },

        constructor: function(paper, options) {
            options = options || {};
            _.assign(this.props, options);

            this.props.paper = paper.guid();
            this.empty();
        },

        /**
         * update properties
         */
        update: function(data) {
            var me = this,
                parser = new Graph.diagram.Parser(data),
                paper = me.paper();
            
            parser.props().each(function(v, k){
                me.props[k] = v;
            });

            parser.shapes().each(function(item){
                var shape;

                if (item.props.id) {
                    shape = me.getShapeBy(function(shape){ 
                        return shape.props.id == item.props.id; 
                    });
                } else {
                    shape = me.getShapeBy(function(shape){
                        return shape.props.guid == item.props.client_id;
                    });
                }

                if (shape) {
                    shape.update(item);
                }
            });

            parser.links().each(function(item){
                var link;
                if (item.props.id) {
                    link = me.getLinkBy(function(link){
                        return link.props.id == item.props.id;
                    });
                } else {
                    link = me.getLinkBy(function(link){
                        return link.props.guid == item.props.client_id;
                    });
                }

                if (link) {
                    // link.update(item);
                }
            });

            parser.destroy();
            parser = null;
        },

        commit: function() {
            this.props.dirty = false;
            return this;
        },

        /**
         * Render data and update properties
         */
        render: function(data) {

        },

        paper: function() {
            return Graph.registry.vector.get(this.props.paper);
        },

        empty: function() {
            _.forEach(this.getShapes(), function(shape){
                if ( ! shape.tree.parent) {
                    shape.remove();
                }
            });
            return this;
        },

        getShapes: function() {
            var context = this.paper().guid();
            return Graph.registry.shape.collect(context);
        },

        getLinks: function() {
            var shapes = this.getShapes(),  
                indexes = {},
                links = [];

            var network, connections, i, ii, j, jj;

            for(i = 0, ii = shapes.length; i < ii; i++) {
                network = shapes[i].connectable().plugin();
                if (network) {
                    connections = network.connections();
                    for (j = 0, jj = connections.length; j < jj; j++) {
                        if (indexes[connections[j].guid] === undefined) {
                            links.push(connections[j].link);
                            indexes[connections[j].guid] = true;
                        }
                    }
                }
            }

            indexes = null;

            return links;
        },
        
        arrange: function() {

        },

        drawShape: function(namespace, options) {

        },

        findShapeBy: function(identity) {
            return _.filter(this.getShapes(), identity);
        },

        getShapeBy: function(identity) {
            return _.find(this.getShapes(), identity);
        },

        getLinkBy: function(identity) {

        },

        toJson: function() {
            var json = {};
            return json;
        }

    });

}());