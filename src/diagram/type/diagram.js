
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
                if (k != 'type') {
                    me.props[k] = v;    
                }
            });

            parser.shapes().each(function(item){
                var shape;

                if (item.props.id) {
                    shape = me.getShapeBy(function(s){ 
                        return s.props.id == item.props.id; 
                    });
                }

                // stil not found?
                shape = me.getShapeBy(function(s){
                    return s.props.guid == item.props.client_id;
                });

                // if (item.props.id) {
                //     shape = me.getShapeBy(function(s){ 
                //         return s.props.id == item.props.id; 
                //     });
                // } else {
                //     shape = me.getShapeBy(function(s){
                //         return s.props.guid == item.props.client_id;
                //     });
                // }

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
                }

                // still not found ?
                link = me.getLinkBy(function(link){
                    return link.props.guid == item.props.client_id;
                });

                // if (item.props.id) {
                //     link = me.getLinkBy(function(link){
                //         return link.props.id == item.props.id;
                //     });
                // } else {
                //     link = me.getLinkBy(function(link){
                //         return link.props.guid == item.props.client_id;
                //     });
                // }

                if (link) {
                    link.data(item.props);
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
            var shapes = this.getShapes();
            
            this.paper().snapper().invalidate();

            shapes.each(function(shape){
                if ( ! shape.tree.parent) {
                    shape.remove();
                }
            });

            shapes = null;
            return this;
        },

        getShapes: function() {
            var context = this.paper().guid(),
                shapes = Graph.registry.shape.collect(context);
            
            return new Graph.collection.Shape(shapes);
        },

        getLinks: function() {
            var shapes = this.getShapes().toArray(),  
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
            return new Graph.collection.Link(links);
        },
        
        drawShape: function(namespace, options) {

        },

        findShapeBy: function(identity) {
            var shapes = this.getShapes().toArray();
            return _.filter(shapes, identity);
        },

        getShapeBy: function(identity) {
            var shapes = this.getShapes().toArray();
            return _.find(shapes, identity);
        },

        getLinkBy: function(identity) {
            var links = this.getLinks().toArray();
            return _.find(links, identity);
        },

        remove: function() {
            this.empty();
            this.fire('afterdestroy');
        },

        toJson: function() {
            var json = {};
            return json;
        }

    });

}());