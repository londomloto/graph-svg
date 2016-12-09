
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

        metadata: {
            name: 'activity.lane',
            icon: Graph.icons.SHAPE_LANE,
            style: 'graph-shape-activity-lane'
        },

        constructor: function(options) {
            this.superclass.prototype.constructor.call(this, options);
            this.initDropzone();
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
            var me = this, 
                comp = me.components;

            var shape, block, header, label, child;

            shape = (new Graph.svg.Group(me.props.left, me.props.top))
                .selectable(false);

            block = (new Graph.svg.Rect(0, 0, me.props.width, me.props.height, 0))
                .addClass(Graph.styles.SHAPE_BLOCK)
                .render(shape);

            block.resizable({
                minWidth: 200
            });

            block.draggable({
                ghost: true,
                batchSync: false
            });

            block.on('dragstart.shape', _.bind(me.onDragStart, me));
            block.on('dragend.shape', _.bind(me.onDragEnd, me));
            block.on('resize.shape', _.bind(me.onResize, me));
            block.on('remove.shape',  _.bind(me.onRemove, me));
            block.on('select.shape',  _.bind(me.onSelect, me));
            block.on('deselect.shape',  _.bind(me.onDeselect, me));

            header = (new Graph.svg.Rect(0, 0, 30, me.props.height, 0))
                .addClass(Graph.styles.SHAPE_HEADER)
                .selectable(false)
                .render(shape);

            header.data('text', me.props.label);
            header.editable({
                width: 200,
                height: 100
            });

            header.on('edit.shape', _.bind(me.onLabelEdit, me));

            var tx = 15,
                ty = me.props.height / 2;

            label = (new Graph.svg.Text(tx, ty, me.props.label))
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
            me.tree.pool = new Graph.shape.activity.Pool();
            me.tree.pool.insert(me);

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
                var vector, shape, batch;

                comp.addClass('receiving');

                if ( ! me.transfer) {
                    vector = Graph.registry.vector.get(e.relatedTarget);

                    if (vector) {

                        shape = Graph.registry.shape.get(vector);

                        if (shape) {
                            me.transfer = {
                                shape: shape,
                                batch: []
                            };

                            me.transfer.shape.on('dragend', onTransferEnd);
                            me.transfer.batch = [shape];

                            if (vector.lasso) {
                                batch = vector.lasso.collection.slice();

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

                        var placeTarget = me.component('child');

                        _.forEach(me.transfer.batch, function(shape){
                            var shapeComponent = shape.component();

                            shapeComponent.relocate(placeTarget);
                            me.addChild(shape);
                        });

                        me.autoResize();
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

                    me.transfer.shape.off('dragend', onTransferEnd);
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
        },

        sendToBack: function() {
            var paper = this.paper();
        },

        sendToFront: function() {
            this.pool().bringToFront(this);
        },
        
        redraw: function() {
            var block = this.component('block'),
                shape = this.component('shape'),
                header = this.component('header'),
                label = this.component('label');

            var matrix, bound;

            bound  = block.bbox().toJson();
            matrix = Graph.matrix().translate(bound.x, bound.y);
            
            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toValue());
            shape.dirty(true);
            
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
                
                this.redraw();
                
            } else if (value !== undefined) {
                block = this.component('block');
                
                if (maps[name]) {
                    block.attr(maps[name], value);
                }
                
                this.redraw();
            }
            
            return result;
        },
        
        addSiblingAbove: function() {
            var sibling = new Graph.shape.activity.Lane(),
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
            }
            
            return sibling;
        },
        
        addSiblingBellow: function() {
            var sibling = new Graph.shape.activity.Lane(),
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
            }
            
            return sibling;
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
                childComponent = this.component('child'),
                
                offset = {
                    top: 20,
                    bottom: 20,
                    left: 40,
                    right: 20
                },
                
                padding = {
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0
                };

            var bounds = _.extend({}, bbox);

            if (actualBBox.y - bbox.y < padding.top) {
                bounds.y = actualBBox.y - offset.top;
            }

            if (actualBBox.x - bbox.x < padding.left) {
                bounds.x = actualBBox.x - offset.left;
            }

            if ((bbox.x + bbox.width) - (actualBBox.x + actualBBox.width) < padding.right) {
                bounds.x2 = (actualBBox.x + actualBBox.width) + offset.right;
            }

            if ((bbox.y + bbox.height) - (actualBBox.y + actualBBox.height) < padding.bottom) {
                bounds.y2 = (actualBBox.y + actualBBox.height) + offset.bottom;
            }

            var dx = bounds.x - bbox.x,
                dy = bounds.y - bbox.y;

            var width = bounds.x2 - bounds.x,
                height = bounds.y2 - bounds.y;

            // preserver child component
            childComponent.translate(Math.abs(dx), Math.abs(dy)).commit();

            this.translate(dx, dy);
            // this.pool().translateBy(this, dx, dy);

            this.attr({
                width: width,
                height: height
            });

            this.pool().resizeBy(this);

        },

        toString: function() {
            return 'Graph.shape.activity.Lane';
        },

        onRemove: function() {
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
        },

        onSelect: function() {
            this.superclass.prototype.onSelect.call(this, arguments);
            
            var me = this,
                guid = me.guid();

            var delay = _.delay(function(){
                
                clearTimeout(delay);
                delay = null;

                me.cascade(function(curr){
                    if (curr.guid() != guid) {
                        var vector = curr.provider('dragger');
                        if (vector && vector.lasso) {
                            vector.lasso.decollect(vector);
                        }
                    }
                });

            }, 0)

        },

        onDragEnd: function(e) {
            this.superclass.prototype.onDragEnd.call(this, e);

            if ( ! e.batch) {
                this.pool().translateBy(this, e.dx, e.dy);
            }
        },

        onResize: function(e) {
            this.superclass.prototype.onResize.call(this, e);
            this.pool().resizeBy(this);
        },

        onAboveToolClick: function(e) {
            this.addSiblingAbove();
        },
        
        onBelowToolClick: function(e) {
            this.addSiblingBellow();
        },

        onUpToolClick: function(e) {
            this.pool().moveUp(this);
        },

        onDownToolClick: function(e) {
            this.pool().moveDown(this);
        }

    });

    ///////// STATIC /////////

}());