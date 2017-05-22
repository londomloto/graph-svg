
(function(){

    var TRANSFER_RECEIVE = 'receive',
        TRANSFER_DISPOSE = 'dispose';

    Graph.shape.activity.Lane = Graph.extend(Graph.shape.Shape, {

        props: {
            label: 'Participant Role',
            width: 1000,
            height: 200,
            left: 0,
            top: 0
        },

        components: {
            header: null
        },

        tree: {
            pool: null
        },

        transfer: null,

        resizing: null,

        metadata: {
            type: 'activity.lane',
            icon: Graph.icons.SHAPE_LANE,
            style: 'graph-shape-activity-lane'
        },

        constructor: function(options) {
            this.superclass.prototype.constructor.call(this, options);
        },

        initMetadata: function() {
            this.metadata.tools = [
                {
                    name: 'config',
                    icon: Graph.icons.CONFIG,
                    title: Graph._('Click to config shape'),
                    enabled: true
                },
                {
                    name: 'above',
                    icon: Graph.icons.LANE_ABOVE,
                    title: Graph._('Add shape above'),
                    enabled: true,
                    handler: _.bind(this.onAboveToolClick, this)
                },
                {
                    name: 'below',
                    icon: Graph.icons.LANE_BELOW,
                    title: Graph._('Add shape below'),
                    enabled: true,
                    handler: _.bind(this.onBelowToolClick, this)
                },
                {
                    name: 'moveup',
                    icon: Graph.icons.MOVE_UP,
                    title: Graph._('Move up'),
                    enabled: true,
                    handler: _.bind(this.onUpToolClick, this)
                },
                {
                    name: 'movedown',
                    icon: Graph.icons.MOVE_DOWN,
                    title: Graph._('Move down'),
                    enabled: true,
                    handler: _.bind(this.onDownToolClick, this)
                },
                {
                    name: 'sendtofront',
                    icon: Graph.icons.SEND_TO_FRONT,
                    title: Graph._('Send to front'),
                    enabled: true,
                    handler: _.bind(this.onFrontToolClick, this)
                },
                {
                    name: 'sendtoback',
                    icon: Graph.icons.SEND_TO_BACK,
                    title: Graph._('Send to back'),
                    enabled: true,
                    handler: _.bind(this.onBackToolClick, this)
                },
                {
                    name: 'trash',
                    icon: Graph.icons.TRASH,
                    title: Graph._('Click to remove shape'),
                    enabled: true,
                    handler: _.bind(this.onTrashToolClick, this)
                }
            ];
        },

        initComponent: function() {
            var comp = this.components,
                pmgr = this.plugins.manager;

            var shape, block, header, label, child;

            shape = (new Graph.svg.Group(this.props.left, this.props.top))
                .selectable(false);

            block = (new Graph.svg.Rect(0, 0, this.props.width, this.props.height, 0))
                .addClass(Graph.styles.SHAPE_BLOCK)
                .render(shape);

            block.elem.data(Graph.string.ID_SHAPE, this.guid());

            pmgr.install('resizer', block, {restriction: { width: 200, height: 100 }});
            pmgr.install('dragger', block, {ghost: true, batchSync: false, cls: Graph.styles.SHAPE_DRAG});

            block.on('beforedrag.shape', _.bind(this.onBeforeDrag, this));
            block.on('afterdrag.shape',   _.bind(this.onAfterDrag, this));
            block.on('beforeresize.shape', _.bind(this.onBeforeResize, this));
            block.on('afterresize.shape',    _.bind(this.onAfterResize, this));
            block.on('beforedestroy.shape',    _.bind(this.onBeforeDestroy, this));
            block.on('afterdestroy.shape',    _.bind(this.onAfterDestroy, this));
            block.on('select.shape',    _.bind(this.onSelect, this));
            block.on('deselect.shape',  _.bind(this.onDeselect, this));

            header = (new Graph.svg.Rect(0, 0, 30, this.props.height, 0))
                .addClass(Graph.styles.SHAPE_HEADER)
                .selectable(false)
                .render(shape);

            header.data('text', this.props.label);

            pmgr.install('editor', header, {
                width: 200, 
                height: 100,
                offset: 'pointer'
            });

            header.on('edit.shape', _.bind(this.onLabelEdit, this));

            var tx = 15,
                ty = this.props.height / 2;

            label = (new Graph.svg.Text(tx, ty, this.props.label))
                .addClass(Graph.styles.SHAPE_LABEL)
                .selectable(false)
                .clickable(false)
                .render(shape);

            label.rotate(270, tx, ty).commit();

            child = (new Graph.svg.Group())
                .addClass(Graph.styles.SHAPE_CHILD)
                .selectable(false)
                .render(shape);

            child.translate(50, 0).commit();

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.header = header.guid();
            comp.label = label.guid();
            comp.child = child.guid();

            // set virtual pool
            this.tree.pool = new Graph.shape.activity.Pool();
            this.tree.pool.insert(this);

            shape = block = header = label = null;
        },

        initDropzone: function() {
            var me = this,
                comp = me.component(),
                block = me.component('block'),
                children = me.children();

            block.interactable().dropzone({
                accept: '.shape-draggable',
                overlap: .2
            })
            .on('dragenter', function laneDragEnter(e){
                var poolGuid = me.pool().guid,
                    laneGuid = me.guid();

                var vector, shape, batch;

                if ( ! me.transfer) {
                    vector = Graph.registry.vector.get(e.relatedTarget);

                    if (vector) {

                        shape = Graph.registry.shape.get(vector);

                        if (shape) {

                            if (
                                (shape.guid() == laneGuid) || 
                                (shape.is('activity.lane') && shape.pool().guid == poolGuid)
                            ) {
                                return;
                            }

                            me.transfer = {
                                shape: shape,
                                batch: []
                            };

                            me.transfer.shape.on('afterdrag', onTransferEnd);
                            me.transfer.batch = [shape];

                            var collector = vector.collector();

                            if (collector) {
                                batch = collector.collection.toArray().slice();
                                
                                _.forEach(batch, function(v){
                                    var s = Graph.registry.shape.get(v);
                                    if (s && s.guid() != shape.guid()) {
                                        me.transfer.batch.push(s);
                                    }
                                });

                                batch = null;
                            }
                        }
                    }
                }

                if (me.transfer) {
                    comp.addClass('receiving');
                }
            })
            .on('dragleave', function laneDragLeave(e){
                comp.removeClass('receiving');
            })
            .on('drop', function laneDrop(e){
                if (me.transfer) {
                    var delay;

                    delay = _.delay(function(){
                        clearTimeout(delay);
                        delay = null;

                        // takeout lane from batch
                        var appended = [],
                            lanes = [],
                            poolGuid = me.pool().guid,
                            laneGuid = me.guid();

                        _.forEach(me.transfer.batch, function(shape){
                            if (shape.is('activity.lane')) {
                                if (shape.guid() != laneGuid && shape.pool().guid != poolGuid) {
                                    lanes.push(shape);
                                }
                            } else {
                                appended.push(shape);
                            }
                        });

                        if (appended.length) {
                            me.addChild(appended);
                        }

                        if (lanes.length) {
                            me.addSiblingBellow(lanes);
                        }

                    }, 0);

                }

                comp.removeClass('receiving');
            });

            block = null;

            /////////

            function onTransferEnd() {
                var delay;

                delay = _.delay(function(){

                    clearTimeout(delay);
                    delay = null;

                    me.transfer.shape.off('afterdrag', onTransferEnd);
                    me.transfer = null;

                }, 0);
            }
        },

        pool: function() {
            return this.tree.pool;
        },

        // @Override
        render: function(paper, method, sibling) {
            var component = this.component();

            method = _.defaultTo(method, 'prepend');

            component.render(paper, method, sibling);

            // save
            this.tree.paper = paper.guid();
            Graph.registry.shape.setContext(this.guid(), paper.guid());

            this.initDropzone();
        },

        sendToBack: function() {
            var paper = this.paper();
        },

        sendToFront: function() {
            this.pool().bringToFront(this);
        },

        refresh: function() {
            if (this.layout.suspended) {
                return;
            }

            var block = this.component('block'),
                shape = this.component('shape'),
                child = this.component('child'),
                header = this.component('header'),
                label = this.component('label');

            var matrix, bound;

            bound  = block.bbox().toJson();
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toValue());
            shape.dirty(true);
            child.dirty(true);

            block.attr({
                x: 0,
                y: 0
            });

            block.dirty(true);
            block.resizable().redraw();

            header.attr({
                x: 0,
                y: 0,
                height: bound.height
            });

            header.dirty(true);

            var tx = 15,
                ty = bound.height / 2;

            label.graph.matrix = Graph.matrix();
            label.attr('transform', '');

            label.attr({
                x: tx,
                y: ty
            });

            label.wrap(bound.height - 10);
            label.rotate(270, tx, ty).commit();

            // update props

            matrix = shape.matrix();

            this.data({
                left: matrix.props.e,
                top: matrix.props.f,
                width: bound.width,
                height: bound.height
            });

            bound  = null;
            matrix = null;
        },

        attr: function(name, value) {
            var result = this.superclass.prototype.attr.call(this, name, value),
                maps = {
                    width: 'width',
                    height: 'height',
                    left: 'x',
                    top: 'y'
                };

            var block, key, val;

            if (_.isPlainObject(name)) {

                block = this.component('block');

                for (key in name) {
                    if (maps[key]) {
                        val = name[key];
                        block.attr(maps[key], val);
                    }
                }

                this.refresh();

            } else if (value !== undefined) {
                block = this.component('block');

                if (maps[name]) {
                    block.attr(maps[name], value);
                }

                this.refresh();
            }

            return result;
        },

        height: function(value) {
            if (value !== undefined) {
                var childBox = this.component('child').bbox().toJson();
                value = Math.max(value, (childBox.y + childBox.height + 20));    
            }

            return this.superclass.prototype.height.call(this, value);
        },

        width: function(value) {
            if (value !== undefined) {
                var childBox = this.component('child').bbox().toJson();
                value = Math.max(value, (childBox.x + childBox.width + 20));
            }

            return this.superclass.prototype.width.call(this, value);
        },

        stroke: function(value) {
            var result = this.superclass.prototype.stroke.call(this, value);
            if (value !== undefined) {
                this.component('header').elem.css('stroke', this.props.stroke);
            }
            return result;
        },

        addChild: function(child, redraw) {
            this.superclass.prototype.addChild.call(this, child, redraw);
            this.pool().invalidate();
        },

        removeChild: function(child) {
            this.superclass.prototype.removeChild.call(this, child);
            this.pool().invalidate();
        },

        addSiblingBellow: function(lanes) {
            if ( ! _.isArray(lanes)) {
                lanes = [lanes];
            }

            var pool = this.pool(),
                height = _.reduce(
                    _.map(lanes, function(lane){
                        return lane.height();
                    }),
                    function(result, curr) {
                        return result + curr;
                    },
                    0
                ),
                offsetWidth = this.width(),
                offsetLeft = this.left(),
                offsetTop = (this.top() + this.height());

            pool.createSpaceBellow(this, height);

            _.forEach(lanes, function(lane){

                var boxBefore = lane.component().bboxView().clone().toJson();
                var boxAfter, dx, dy;

                lane.component().reset();

                lane.attr({
                    width: offsetWidth,
                    left: offsetLeft,
                    top: offsetTop
                });

                height = lane.height();
                offsetTop += height;
                
                lane.tree.pool = pool;
                pool.insert(lane);

                lane.children().each(function(c){
                    var netcom = c.connectable().component();
                    netcom && (netcom.dirty(true));
                });

                boxAfter = lane.component().bboxView().toJson();

                dx = boxAfter.x - boxBefore.x;
                dy = boxAfter.y - boxBefore.y;

                pool.relocateLinks(dx, dy, lane);
                
            });

            pool.invalidate();
            this.refreshSnapper();
            
        },

        createSiblingAbove: function(options) {
            var sibling = new Graph.shape.activity.Lane(options),
                paper = this.paper(),
                pool = this.pool();

            // create space above
            pool.createSpaceAbove(this, sibling.height());

            // sync position 'above'
            var top = (this.top() - sibling.height());

            sibling.attr({
                width: this.props.width,
                left: this.props.left,
                top: top
            });

            // sync pool
            sibling.tree.pool = pool;

            var result = pool.insert(sibling);

            if (result !== undefined) {
                sibling.render(paper, 'before', this.component());
                pool.invalidate();
                this.refreshSnapper();
            }

            return sibling;
        },

        createSiblingBellow: function(options) {
            var sibling = new Graph.shape.activity.Lane(options),
                paper = this.paper(),
                pool = this.pool();

            // create space
            pool.createSpaceBellow(this, sibling.height());

            // sync position 'bellow'
            var bottom = (this.top() + this.height());

            sibling.attr({
                width: this.props.width,
                left: this.props.left,
                top: bottom
            });

            // sync pool
            sibling.tree.pool = pool;

            var result = pool.insert(sibling);

            if (result !== undefined) {
                sibling.render(paper, 'after', this.component());
                pool.invalidate();
                this.refreshSnapper();
            }

            return sibling;
        },

        refreshSnapper: function() {
            this.paper().snapper().refresh();
        },

        autoResize: function() {

            var shapeComponent = this.component(),
                blockComponent = this.component('block');

            if (blockComponent.isSelected()) {
                blockComponent.deselect();
            }

            var bbox = this.bbox().toJson(),
                actualBBox = shapeComponent.bbox().toJson(),
                blockComponent = this.component('block'),
                padding = {
                    top: 20,
                    bottom: 20,
                    left: 40,
                    right: 20
                };

            var bounds = _.extend({}, bbox);
            
            if (actualBBox.y + padding.top - bbox.y < padding.top) {
                bounds.y = actualBBox.y - padding.top;
            }

            if (actualBBox.x + padding.left - bbox.x < padding.left) {
                bounds.x = actualBBox.x - padding.left;
            }

            if (bbox.x2 - actualBBox.x2 + padding.right < padding.right) {
                bounds.x2 = actualBBox.x2 + padding.right;
            }

            if (bbox.y2 - actualBBox.y2 + padding.bottom < padding.bottom) {
                bounds.y2 = actualBBox.y2 + padding.bottom;
            }

            var dx = bounds.x - bbox.x,
                dy = bounds.y - bbox.y;

            var width = bounds.x2 - bounds.x,
                height = bounds.y2 - bounds.y;

            var pool = this.pool(),
                curr = this.guid(),
                lanes = pool.populateChildren(),
                childOffsets = {};

            lanes.each(function(lane){
                var childBox = lane.component('child').bboxView().toJson();
                childOffsets[lane.guid()] = {
                    x: childBox.x,
                    y: childBox.y
                };
            });

            this.translate(dx, dy);

            this.attr({
                width: width,
                height: height
            });

            pool.resizeBy(this);

            lanes.each(function(lane){
                var child = lane.component('child'),
                    childBox = child.bboxView().toJson(),
                    offset = childOffsets[lane.guid()]

                if (offset) {
                    var dx = offset.x - childBox.x,
                        dy = offset.y - childBox.y;

                    child.translate(dx, dy).commit();
                }

            });

        },

        toString: function() {
            return 'Graph.shape.activity.Lane';
        },

        toJson: function() {
            var result = this.superclass.prototype.toJson.call(this);
            result.props.pool = this.pool().guid;
            return result;
        },

        onAfterDestroy: function() {
            var me = this, guid = this.guid();

            me.cascade(function(shape){
                if (shape.guid() != guid) {
                    shape.remove();
                }
            });

            this.pool().remove(this);

            // remove child
            this.component('child').remove();

            // remove label
            this.component('label').remove();

            // remove header
            this.component('header').remove();

            // remove shape
            this.component('shape').remove();

            for (var name in this.components) {
                this.components[name] = null;
            }

            Graph.registry.shape.unregister(this);
            this.fire('afterdestroy');
        },

        onChildConnect: function(e) {
            var sourceParent = e.source.parent(),
                targetParent = e.target.parent();

            if (sourceParent && targetParent) {
                var sourcePool = sourceParent.pool(),
                    targetPool = targetParent.pool();

                if (sourcePool.guid != targetPool.guid) {
                    e.link.type('message');
                }
            }
        },

        onChildBeforeDestroy: function(e) {
            this.superclass.prototype.onChildBeforeDestroy.call(this, e);
            this.pool().invalidate();
        },

        onSelect: function(e) {
            var me = this, guid = me.guid();

            var delay = _.delay(function(){

                clearTimeout(delay);
                delay = null;

                me.cascade(function(curr){
                    if (curr.guid() != guid) {
                        var vector, network;

                        // deselect shape
                        vector = curr.draggable().component();

                        if (vector) {
                            vector.deselect();
                        }

                        // deselect links
                        network = curr.connectable().plugin();

                        if (network) {
                            var connections = network.connections();
                            _.forEach(connections, function(conn){
                                conn.link.deselect();
                            });
                        }
                        
                    }
                });

                me.component('shape').addClass('shape-selected');
                Graph.topic.publish('shape:select', {shape: me});

            }, 0);
        },

        onBeforeDrag: function(e) {
            if (e.master) {

                this.fire(e);
                this.paper().diagram().capture();

                var links = this.pool().populateLinks();
                var link, key;

                for (key in links.isolated) {
                    link = links.isolated[key].link;
                    link.deselect();
                }

                for (key in links.separated) {
                    link = links.separated[key].link;
                    link.deselect();
                }

            }
        },

        onAfterDrag: function(e) {
            if (e.master) {
                var blockComponent = this.component('block'),
                    shapeComponent = this.component('shape'),
                    childComponent = this.component('child'),
                    blockMatrix = blockComponent.matrix(),
                    pool = this.pool();

                var shapeMatrix;

                blockComponent.reset();

                shapeComponent.matrix().multiply(blockMatrix);
                shapeComponent.attr('transform', shapeComponent.matrix().toValue());
                shapeComponent.dirty(true);
                childComponent.dirty(true);

                // update props
                shapeMatrix = shapeComponent.matrix();

                this.data({
                    left: shapeMatrix.props.e,
                    top: shapeMatrix.props.f
                });

                // forward
                this.fire(e);

                // sync other
                pool.relocateSiblings(this, e.dx, e.dy);
                pool.refreshContents();

                // sync links
                pool.relocateLinks(e.dx, e.dy);
                pool.refreshChildren();

                this.refreshSnapper();
            }

        },

        onBeforeResize: function(e){
            this.resizing = {
                childOffsets: {}
            };

            // set resize restriction
            // calculate max children bound for all lanes
            var bounds = this.component('child').bboxView().toJson(),
                lanes = this.pool().populateChildren(),
                resizing = this.resizing;

            lanes.each(function(lane){
                var laneChildComponent = lane.component('child'),
                    laneChildBox = laneChildComponent.bboxView().toJson();

                resizing.childOffsets[lane.guid()] = {
                    x: laneChildBox.x,
                    y: laneChildBox.y
                };

                if (laneChildBox.x < bounds.x) {
                    bounds.x = laneChildBox.x;
                }

                if (bounds.x2 < laneChildBox.x2) {
                    bounds.x2 = laneChildBox.x2;
                }

            });

            var resizer = e.resizer,
                direction = e.direction,
                origin = {
                    x: bounds.x, 
                    y: bounds.y
                },
                padding = {
                    top: 10,
                    left: 40,
                    right: 10,
                    bottom: 10
                };

            switch(direction) {
                case 'n':
                    origin.x = (bounds.x + bounds.x2) / 2;
                    origin.y = bounds.y2 - padding.bottom;
                    break;
                case 'e':
                    origin.x = bounds.x + padding.right;
                    origin.y = (bounds.y + bounds.y2) / 2;
                    break;
                case 's':
                    origin.x = (bounds.x + bounds.x2) / 2;
                    origin.y = bounds.y + padding.top;
                    break;
                case 'w':
                    origin.x = bounds.x2 - padding.left;
                    origin.y = (bounds.y + bounds.y2) / 2;
                    break;
                case 'ne':
                    origin.x = bounds.x + padding.right;
                    origin.y = bounds.y2 - padding.bottom;
                    break;
                case 'se':
                    origin.x = bounds.x + padding.right;
                    origin.y = bounds.y + padding.top;
                    break;
                case 'sw':
                    origin.x = bounds.x2 - padding.left;
                    origin.y = bounds.y + padding.top;
                    break;
                case 'nw':
                    origin.x = bounds.x2 - padding.left;
                    origin.y = bounds.y2 - padding.bottom;
                    break;
            }

            var width = bounds.x2 - bounds.x,
                height = bounds.y2 - bounds.y;

            if (width <= 0) {
                width = 200;
            }

            if (height <= 0) {
                height = 100;
            }

            resizer.restrict({
                width: width,
                height: height,
                origin: origin
            });

        },

        onAfterResize: function(e) {
            this.superclass.prototype.onAfterResize.call(this, e);

            var pool = this.pool();
            pool.resizeBy(this);

            if (this.resizing) {
                var lanes = pool.populateChildren(),
                    resizing = this.resizing;

                lanes.each(function(lane){
                    var child = lane.component('child'),
                        childBox = child.bboxView().toJson(),
                        offset = resizing.childOffsets[lane.guid()];

                    if (offset) {
                        var dx = offset.x - childBox.x,
                            dy = offset.y - childBox.y;

                        child.translate(dx, dy).commit();
                    }

                });

                this.resizing = resizing = null;
            }

        },

        onAboveToolClick: function(e) {
            this.createSiblingAbove();
        },

        onBelowToolClick: function(e) {
            this.createSiblingBellow();
        },

        onUpToolClick: function(e) {
            this.pool().moveUp(this);
            this.refreshSnapper();
        },

        onDownToolClick: function(e) {
            this.pool().moveDown(this);
            this.refreshSnapper();
        }

    });

    ///////// STATIC /////////

}());
