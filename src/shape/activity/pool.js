
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
        
        // raw nodes
        this.cached = {};
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
        var index = this.count() - 1,
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
            prev = this.lanes.get(laneIndex - 1);

        if (prev) {
            this.lanes.bubble(prev, function(curr){
                var shape = Graph.registry.shape.get(curr.lane);
                if (shape) {
                    shape.translate(0, -height);
                    curr.bbox = shape.bbox().toJson();
                }
            });
        }
    };
    
    Pool.prototype.createSpaceBellow = function(lane, height) {
        var laneIndex = this.index(lane),
            next = this.lanes.get(laneIndex + 1);

        if (next) {
            this.lanes.cascade(next, function(curr){
                var shape = Graph.registry.shape.get(curr.lane);
                if (shape) {
                    shape.translate(0, height);
                    curr.bbox = shape.bbox().toJson();
                }
            });
        }
    };
    
    Pool.prototype.translateBy = function(lane, dx, dy) {
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

                        shape.redraw();

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
        }
    };

    Pool.prototype.count = function() {
        return this.lanes.count();
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
            this.cached[guid] = node;
            lane.component().elem.attr('data-pool', this.guid);
        }
        
        node = null;
        return index;
    };

    Pool.prototype.remove = function(lane) {
        var guid = lane.guid(),
            node = this.cached[guid];
        
        var index = this.lanes.remove(node);
        
        if (index !== undefined) {
            delete this.cached[guid];
        }
        
        node = null;
        
        return index;
    };

    Pool.prototype.index = function(lane) {
        var guid = lane.guid(),
            node = this.cached[guid];
        
        var index = this.lanes.index(node);
        
        node = null;
        
        return index;
    };
    
    ///////// STATIC /////////
    
    Pool.guid = 0;
    
}());