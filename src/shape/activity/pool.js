
(function(){

    /**
     * Virtual pool for lanes
     */

    var Pool = Graph.shape.activity.Pool = function() {
        this.guid = 'pool-' + (++Pool.guid);

        // tree nodes
        this.lanes = (new Graph.collection.Tree([]))
            .keygen(function(lane){
                return lane.bbox.y;
                // return (lane.bbox.y + (1e-9 * lane.bbox.x));
            });

        this.cached = {
            nodes: {},
            contents: null
        };
    };

    Pool.prototype.invalidate = function() {
        this.cached.contents = null;
    };

    Pool.prototype.populateChildren = function() {
        var children = [];

        _.forEach(this.lanes.toArray(), function(node){
            var lane = Graph.registry.shape.get(node.lane);
            children.push(lane);
        });

        return new Graph.collection.Shape(children);
    };

    Pool.prototype.bbox = function() {
        var nodes = this.lanes.toArray(),
             x = [],
             y = [],
            x2 = [],
            y2 = [];

        var bbox;

        for (var i = nodes.length - 1; i >= 0; i--) {
            bbox = nodes[i].bbox;

            x.push(bbox.x);
            y.push(bbox.y);

            x2.push(bbox.x + bbox.width);
            y2.push(bbox.y + bbox.height);
        }

         x = _.min(x);
         y = _.min(y);
        x2 = _.max(x2);
        y2 = _.max(y2);

        nodes = null;

        return Graph.bbox({
            x: x,
            y: y,
            x2: x2,
            y2: y2,
            width: x2 - x,
            height: y2 - y
        });
    };

    Pool.prototype.get = function(index) {
        var data = this.lanes.get(index);
        if (data) {
            return Graph.registry.shape.get(data.lane);
        }
        return null;
    };

    Pool.prototype.prev = function(lane) {
        var index = this.index(lane),
            prev = this.lanes.get(index - 1);

        if (prev) {
            return Graph.registry.shape.get(prev.lane);
        }

        return null;
    };

    Pool.prototype.last = function() {
        var index = this.size() - 1,
            last = this.lanes.get(index);

        if (last) {
            return Graph.registry.shape.get(last.lane);
        }

        return null;
    };

    /**
     * Create new space
     */
    Pool.prototype.createSpaceAbove = function(lane, height) {
        var laneIndex = this.index(lane),
            prev = this.lanes.get(laneIndex - 1),
            me = this;

        if (prev) {
            this.lanes.bubble(prev, function(curr){
                var shape = Graph.registry.shape.get(curr.lane);
                if (shape) {
                    shape.translate(0, -height);
                    curr.bbox = shape.bbox().toJson();

                    shape.children().each(function(c){
                        var comnet = c.connectable().component();
                        comnet && (comnet.dirty(true));
                    });

                    me.relocateLinks(0, -height, shape);
                }
            });
            this.lanes.order();
        }
    };

    Pool.prototype.createSpaceBellow = function(lane, height) {
        var laneIndex = this.index(lane),
            next = this.lanes.get(laneIndex + 1),
            me = this;

        if (next) {
            this.lanes.cascade(next, function(curr){
                var shape = Graph.registry.shape.get(curr.lane);
                if (shape) {
                    shape.translate(0, height);
                    curr.bbox = shape.bbox().toJson();

                    shape.children().each(function(c){
                        var comnet = c.connectable().component();
                        comnet && (comnet.dirty(true));
                    });

                    me.relocateLinks(0, height, shape);
                }
            });
            this.lanes.order();
        }
    };

    Pool.prototype.relocateSiblings = function(lane, dx, dy) {
        var root = this.lanes.root(),
            guid = lane.guid();

        if (root) {
            this.lanes.cascade(root, function(curr){
                if (curr.lane == guid) {
                    curr.bbox = lane.bbox().toJson();
                } else {
                    var shape = Graph.registry.shape.get(curr.lane);
                    if (shape) {
                        shape.translate(dx, dy);
                        curr.bbox = shape.bbox().toJson();
                    }
                }
            });
        }
    };

    Pool.prototype.resizeBy = function(lane) {
        var guid = lane.guid(),
            bbox = lane.bbox().toJson(),
            root = this.lanes.root(),
            index = this.index(lane);

        if (root) {

            // sample
            var prev, next, dx1, dx2, dy1, dy2;

            prev = this.lanes.get(index - 1);
            next = this.lanes.get(index + 1);

            dx1 = 0;
            dy1 = 0;

            dx2 = 0
            dy2 = 0;

            if (prev) {
                dx1 = bbox.x - prev.bbox.x;
                dy1 = bbox.y - (prev.bbox.y + prev.bbox.height);
            }

            if (next) {
                dx2 = bbox.x - next.bbox.x;
                dy2 = (bbox.y + bbox.height) - next.bbox.y;
            }

            this.lanes.cascade(root, function(curr, i){
                if (curr.lane == guid) {
                    curr.bbox = bbox;
                } else {
                    var shape = Graph.registry.shape.get(curr.lane);
                    if (shape) {

                        var group = shape.component(),
                            block = shape.component('block');

                        // up
                        if (index > i) {
                            shape.translate(dx1, dy1);
                        }
                        // down
                        else if (index < i) {
                            shape.translate(dx2, dy2);
                        }

                        block.attr({
                            width: bbox.width
                        });

                        block.dirty(true);
                        shape.refresh();

                        curr.bbox = shape.bbox().toJson();
                    }
                }
            });
        }

        bbox = null;
    };

    Pool.prototype.bringToFront = function(lane) {
        var sets = Graph.$('[data-pool="' + this.guid + '"]'),
            last = sets.last();

        if (last.length()) {
            if (last.node() != lane.component().node()) {
                last.after(lane.component().elem);
            }
        }
    };

    Pool.prototype.moveUp = function(lane) {
        var index = this.index(lane),
            prev  = this.get(index - 1),
            laneNode = this.lanes.get(index),
            prevNode = this.lanes.get(index - 1);

        if (prev) {
            var laneBox = lane.bbox().toJson(),
                prevBox = prev.bbox().toJson();

            var dx1 = 0,
                dy1 = prevBox.y - laneBox.y,
                dx2 = 0,
                dy2 = laneBox.height;

            laneNode.bbox.y  += dy1;
            laneNode.bbox.y2 += dy1;

            prevNode.bbox.y  += dy2;
            prevNode.bbox.y2 += dy2;

            lane.translate(dx1, dy1);
            prev.translate(dx2, dy2);

            this.lanes.order();

            lane.children().each(function(c){
                var comnet = c.connectable().component();
                comnet && (comnet.dirty(true));
            });

            prev.children().each(function(c){
                var comnet = c.connectable().component();
                comnet && (comnet.dirty(true));
            });

            this.relocateLinks(dx1, dy1, lane);
            this.relocateLinks(dx2, dy2, prev);
        }
    };

    Pool.prototype.moveDown = function(lane) {
        var index = this.index(lane),
            next  = this.get(index + 1),
            laneNode = this.lanes.get(index),
            nextNode = this.lanes.get(index + 1);

        if (next) {
            var laneBox = lane.bbox().toJson(),
                nextBox = next.bbox().toJson();

            var dx1 = 0,
                dy1 = nextBox.height,
                dx2 = 0,
                dy2 = laneBox.y - nextBox.y;

            laneNode.bbox.y  += dy1;
            laneNode.bbox.y2 += dy1;

            nextNode.bbox.y  += dy2;
            nextNode.bbox.y2 += dy2;

            lane.translate(dx1, dy1);
            next.translate(dx2, dy2);

            this.lanes.order();

            lane.children().each(function(c){
                var comnet = c.connectable().component();
                comnet && (comnet.dirty(true));
            });

            next.children().each(function(c){
                var comnet = c.connectable().component();
                comnet && (comnet.dirty(true));
            });

            this.relocateLinks(dx1, dy1, lane);
            this.relocateLinks(dx2, dy2, next);
        }
    };

    Pool.prototype.refreshChildren = function() {
        var children = this.populateChildren();

        children.each(function(lane){
            lane.component('child').dirty(true);
        });
    };

    /**
     * Populate lanes children
     */
    Pool.prototype.populateContents = function(lane) {
        var contents;
        if (lane !== undefined) {
            contents = new Graph.collection.Shape(lane.children().toArray());
        } else {
            contents = this.cached.contents;
            if ( ! contents) {
                contents = [];
                _.forEach(this.lanes.toArray(), function(node){
                    var lane = Graph.registry.shape.get(node.lane);
                    if (lane) {
                        contents = _.concat(contents, lane.children().toArray());
                    }
                });

                contents = new Graph.collection.Shape(contents);
                this.cached.contents = contents;
            }    
        }

        return contents;
    };

    Pool.prototype.refreshContents = function() {
        var contents = this.populateContents();

        contents.each(function(shape){
            var connectableBlock = shape.connectable().component();
            if (connectableBlock) {
                connectableBlock.dirty(true);
            }
        });
    };

    Pool.prototype.populateLinks = function(lane) {
        var me = this, 
            contents = me.populateContents(lane),
            contentKeys = contents.keys(),
            result = {
                isolated: {},
                separated: {}
            };

        contents.each(function(shape){
            var network = shape.connectable().plugin(),
                connections = (network && network.connections()) || [];

            var pairVector, pairShape;

            _.forEach(connections, function(conn){
                pairVector = Graph.registry.vector.get((conn.type == 'incoming' ? conn.source : conn.target));
                if (pairVector) {
                    pairShape = Graph.registry.shape.get(pairVector);
                    if (pairShape) {
                        if (_.indexOf(contentKeys, pairShape.guid()) > -1) {
                            if ( ! result.isolated[conn.guid]) {
                                result.isolated[conn.guid] = conn;
                            }
                        } else {
                            if ( ! result.separated[conn.guid]) {
                                result.separated[conn.guid] = conn;
                            }
                        }
                    }
                }
            });
        });

        return result;
    };

    Pool.prototype.relocateLinks = function(dx, dy, lane) {
        var links = this.populateLinks(lane);
        var key, conn, router;
        
        for (key in links.isolated) {
            conn = links.isolated[key];
            conn.link.invalidate('convex');
            conn.link.relocate(dx, dy);
        }
        
        for (key in links.separated) {
            conn = links.separated[key];
            conn.link.invalidate('convex');
            
            if (conn.type == 'incoming') {
                conn.link.relocateHead(dx, dy);
            } else {
                conn.link.invalidate('convex');
                conn.link.relocateTail(dx, dy);
            }
        }
        
        links = null;
    };


    Pool.prototype.size = function() {
        return this.lanes.size();
    };

    Pool.prototype.insert = function(lane) {
        var guid = lane.guid();
        var node, index;

        node = {
            lane: guid,
            bbox: lane.bbox().toJson()
        };

        index = this.lanes.insert(node);

        if (index !== undefined) {
            this.cached.nodes[guid] = node;
            lane.component().elem.attr('data-pool', this.guid);
        }

        node = null;
        return index;
    };

    Pool.prototype.remove = function(lane) {
        var guid = lane.guid(),
            node = this.cached.nodes[guid];

        var index = this.lanes.remove(node);
        
        if (index !== undefined) {
            // shrink pool (direction: up)
            var prev = this.lanes.get(index - 1),
                next = this.lanes.get(index),
                me = this;
            
            if (next) {
                var dx = 0,
                    dy = -node.bbox.height;

                this.lanes.cascade(next, function(node){
                    var lane = Graph.registry.shape.get(node.lane);
                    if (lane) {
                        lane.translate(dx, dy);
                        node.bbox = lane.bbox().toJson();

                        lane.children().each(function(c){
                            var comnet = c.connectable().component();
                            comnet && (comnet.dirty(true));
                        });

                        me.relocateLinks(dx, dy, lane);
                    }
                });

                this.lanes.order();
            }

            delete this.cached.nodes[guid];
        }

        node = null;

        return index;
    };

    Pool.prototype.index = function(lane) {
        var guid = lane.guid(),
            node = this.cached.nodes[guid];

        var index = this.lanes.index(node);

        node = null;

        return index;
    };

    ///////// STATIC /////////

    Pool.guid = 0;

}());
