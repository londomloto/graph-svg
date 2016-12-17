
(function(){
    var Parser = Graph.diagram.Parser = function(data) {
        data = data || {};

        this._props  = data.props || {};
        this._shapes = data.shapes || [];
        this._links  = data.links || [];
        this._tree   = {};

        this.parse();
    };

    Parser.prototype.constructor = Parser;

    Parser.prototype.parse = function() {
        var shapes = this._shapes,
            tree = {},
            nodes = {},
            total = shapes.length;

        _.forEach(shapes, function(shape, idx){
            nodes[shape.props.id] = {
                id: shape.props.id,
                parent_id: shape.props.parent_id,
                index: idx,
                total: total
            };
        });

        var key, node;

        for (key in nodes) {
            node = nodes[key];
            if ( ! node.parent_id) {
                tree[key] = node;
            } else {
                if (nodes[node.parent_id].children === undefined) {
                    nodes[node.parent_id].children = {};
                }
                nodes[node.parent_id].children[node.id] = node;
            }
        }

        this._tree = tree;
    };

    Parser.prototype.shapes = function() {
        var shapes = this._shapes,
            tree = this._tree;

        return {
            total: shapes.length,
            each: function(callback) {
                traverse(tree, shapes, callback);
            }
        };
    };

    Parser.prototype.links = function() {
        var links = this._links;
        return {
            total: links.length,
            each: function(callback) {
                _.forEach(links, callback);
            }
        }
    };

    Parser.prototype.props = function() {
        var props = this._props;
        return {
            each: function(callback) {
                _.forOwn(props, callback);
            }
        }
    };

    Parser.prototype.destroy = function() {
        this._shapes = null;
        this._links = null;
        this._tree = null;
        this._props = null;
    };

    function traverse(nodes, shapes, callback) {
        var key, node;
        for (key in nodes) {
            node = nodes[key];
            callback(shapes[node.index], node.index, node.total);
            if (node.children !== undefined) {
                traverse(node.children, shapes, callback);
            }
        }
    }

}());
