
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
            label: null,
            child: null
        },

        tree: {
            paper: null,
            parent: null,
            children: null
        },

        metadata: {
            name: null,
            icon: Graph.icons.SHAPE,
            style: 'graph-shape',
            tools: null
        },

        cached: {
            innerMatrix: null,
            outerMatrix: null,
            innerBBox: null,
            outerBBox: null
        },

        constructor: function(options) {
            var guid;

            _.assign(this.props, options || {});

            guid = 'graph-shape-' + (++Shape.guid);

            this.props.guid = guid;
            this.tree.children = new Graph.collection.Shape();

            this.initComponent();
            this.initMetadata();

            if (this.components.shape) {
                var style = Graph.styles.SHAPE;

                if (this.metadata.style) {
                    style += ' ' + this.metadata.style;
                }
                
                this.component().addClass(style);
                style = null;
            }

            Graph.registry.shape.register(this);

            guid = null;
        },

        initMetadata: function() {
            this.metadata.tools = [
                {
                    name: 'config', 
                    icon: Graph.icons.CONFIG, 
                    title: Graph._('Click to config shape'), 
                    enabled: true,
                    handler: _.bind(this.onConfigToolClick, this)
                },
                {
                    name: 'link', 
                    icon: Graph.icons.LINK, 
                    title: Graph._('Click to start shape linking'), 
                    enabled: true,
                    handler: _.bind(this.onLinkToolClick, this)
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

        invalidate: function() {
            this.cached.innerMatrix = null;
            this.cached.outerMatrix = null;
            this.cached.innerBBox = null;
            this.cached.outerBBox = null;
        },

        provider: function(plugin) {    
            var provider;

            switch(plugin) {
                case 'network':
                case 'resizer':
                case 'dragger':
                case 'snapper':
                    provider = this.components.block;
                    break;
                default:
                    provider = this.components.block;
                    break;
            }

            return Graph.registry.vector.get(provider);
        },

        paper: function() {
            return Graph.registry.vector.get(this.tree.paper);
        },

        parent: function() {
            return Graph.registry.shape.get(this.tree.parent);
        },

        children: function() {
            return this.tree.children;
        },

        addChild: function(shape) {
            var parent = shape.parent();

            if (parent) {
                parent.removeChild(shape);
            }

            this.children().push(shape);
            shape.tree.parent = this.guid();

            if (this.components.child) {
                this.component('child').append(shape.component());
            }

            return this;
        },

        removeChild: function(shape) {
            this.children().pull(shape);
            shape.tree.parent = null;

            var paper = shape.paper();

            if (paper) {
                paper.viewport().append(shape.component());
            }

            return this;
        },
        
        addChild_: function(child, relocate) {
            this.children().push(child);
            child.tree.parent = this.guid();

            if (this.components.child) {
                var context = this.component(),
                    target = this.component('child'),
                    source = child.component();
                
                // sync vector tree
                target.children().push(source);
                source.tree.parent = target.guid();

                relocate = _.defaultTo(relocate, true);

                if (relocate) {

                    target.elem.append(source.elem);

                    var matrix = source.innerMatrix(context);

                    source.graph.matrix = matrix;
                    source.attr('transform', matrix.toValue());
                    source.dirty(true);

                    // update child props
                    _.assign(child.props, {
                        left: matrix.props.e,
                        top:  matrix.props.f
                    });

                    matrix = null;
                }
            }
        },

        removeChild_: function(child, relocate) {
            // sync shape tree
            this.children().pull(child);
            child.tree.parent = null;

            // sync vector tree => revert back to paper
            var paper = child.paper();

            if (paper) {
                var source = child.component(),
                    target = paper.viewport();

                // need relocate node ?
                relocate = _.defaultTo(relocate, true);

                if (relocate) {
                    var context = this.component(),
                        srcmat = Graph.matrix();

                    source.bubble(function(curr){
                        srcmat.multiply(curr.matrix());
                        if (curr === context) {
                            return false;
                        }
                    });

                    source.graph.matrix = srcmat;
                    source.attr('transform', srcmat.toValue());
                    source.dirty(true);

                    // update child props
                    _.assign(child.props, {
                        left: srcmat.props.e,
                        top: srcmat.props.f
                    });

                    srcmat = null;

                    target.children().push(source);
                    source.tree.parent = target.guid();    
                    target.elem.append(source.elem);

                } else {
                    target.children().push(source);
                    source.tree.parent = target.guid();    
                }
            }
        },
        
        guid: function() {
            return this.props.guid;
        },

        data: function(name, value) {
            var me = this;
            
            if (_.isPlainObject(name)) {
                _.forOwn(name, function(v, k){
                    me.data(k, v);
                });
                return me;
            }
            
            if (value === undefined) {
                return me.props[name];
            }
            
            me.props[name] = value;
            return me;
        },

        matrix: function() {
            return this.component().matrix();
        },

        innerMatrix: function() {
            var paper = this.paper();
            var matrix;

            if (paper) {
                matrix = this.cached.innerMatrix;

                if ( ! matrix) {

                    var context = paper.viewport(),
                        contextId = context.guid(),
                        current = this.component(),
                        currentId = current.guid(),
                        component = this.component(),
                        outerMatrix = Graph.matrix();

                    component.bubble(function(curr){
                        var guid = curr.guid();

                        if (guid == contextId) {
                            return false;
                        }

                        if (guid != currentId) {
                            outerMatrix.multiply(curr.matrix());    
                        }
                    });

                    outerMatrix.invert();
                    matrix = component.matrix().clone().multiply(outerMatrix);

                    this.cached.innerMatrix = matrix;

                    outerMatrix = null;
                }
            } else {
                matrix = this.matrix();
            }

            return matrix.clone();
        },

        outerMatrix: function() {
            var paper = this.paper();
            var matrix;

            if (paper) {
                matrix = this.cached.outerMatrix;

                if ( ! matrix) {
                    var context = paper.viewport(),
                        contextId = context.guid(),
                        component = this.component();

                    matrix = Graph.matrix();

                    component.bubble(function(curr){
                        if (curr.guid() == contextId) {
                            return false;
                        }
                        matrix.multiply(curr.matrix());
                    });

                    this.cached.outerMatrix = matrix;

                    context = component = null;
                }
            } else {
                matrix = this.matrix();
            }

            return matrix.clone();
        },

        bbox: function() {
            return Graph.bbox({
                 x: this.props.left,
                 y: this.props.top,
                x2: this.props.left + this.props.width,
                y2: this.props.top + this.props.height,
                width: this.props.width,
                height: this.props.height
            });
        },

        innerBBox: function() {
            var bbox = this.cached.innerBBox;
        },

        outerBBox: function() {
            var bbox = this.cached.outerBBox;

            if ( ! bbox) {
                var matrix = this.outerMatrix(),
                    path = this.component().pathinfo().transform(matrix);

                bbox = path.bbox();
                this.cached.outerBBox = bbox;
            }

            return bbox.clone();
        },

        contains: function(shape) {
            var bbox1, bbox2;

            bbox1 = this.outerBBox();
            bbox2 = shape.outerBBox();

            return bbox1.contains(bbox2);
        },

        render: function(paper) {
            var component = this.component();
            component && component.render(paper);
            
            // save
            this.tree.paper = paper.guid();
        },

        remove: function() {
            // just fire block removal
            this.component('block').remove();
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
        
        translate: function(dx, dy) {
            var component = this.component();
            component.translate(dx, dy).commit();

            // update props
            var matrix = component.matrix(),
                left = matrix.props.e,
                top = matrix.props.f;
            
            this.data({
                left: left,
                top: top
            });
        },

        sendToBack: function() {
            var paper = this.paper();
        },

        sendToFront: function() {
            var paper = this.paper();
            paper.viewport().elem.append(this.component().elem);
        },

        /**
         *  Use this method only for updating `width`, `height`, `left`, `top`
         *  otherwise use data()
         */
        attr: function(name, value) {
            var me = this;
            
            if (_.isPlainObject(name)) {
                _.forOwn(name, function(v, k){
                    me.props[k] = v;
                });
                return this;
            }
            
            if (value === undefined) {
                return this.props[name];
            }
            
            this.props[name] = value;
            return this;
        },
        
        height: function(value) {
            if (value === undefined) {
                return this.props.height;
            }
            
            return this.attr('height', value);
        },

        left: function(value) {
            if (value === undefined) {
                return this.props.left;
            }
            
            return this.attr('left', value);
        },
        
        top: function(value) {
            if (value === undefined) {
                return this.props.top;
            }
            
            return this.attr('top', value);
        },

        onLabelEdit: function(e) {
            var text = e.text;
            this.component('label').props.text = text;
            this.redraw();
        },

        onDragStart: function(e) {
            var shape = this.component();
            shape.addClass('shape-dragging');
        },
        
        onDragEnd: function(e) {
            var block = this.component('block'),
                shape = this.component('shape'),
                matrix = block.matrix();

            block.reset();

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toValue());
            shape.dirty(true);
            
            // update props
            var matrix = shape.matrix();

            this.data({
                left: matrix.props.e,
                top: matrix.props.f
            });

            // forward
            this.fire(e);

            shape.removeClass('shape-dragging');
        },
        
        onSelect: function() {
            this.component('shape').addClass('shape-selected');
            Graph.topic.publish('shape/select', {shape: this});
        },

        onDeselect: function() {
            this.component('shape').removeClass('shape-selected');
            Graph.topic.publish('shape/deselect', {shape: this});
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
        },
        
        onConfigToolClick: function(e) {
            
        },
        
        onTrashToolClick: function(e) {
            this.remove();
        },
        
        onLinkToolClick: function(e) {
            var paper = this.paper();
            
            if (paper) {
                var layout = paper.layout(),
                    linker = paper.plugins.linker,
                    coord  = layout.grabLocation(e);
                
                paper.tool().activate('linker');
                linker.start(this.provider('network'), coord);
            }
        },

        onFrontToolClick: function(e) {
            this.sendToFront();
        },

        onBackToolClick: function(e) {
            this.sendToBack();
        }
    });

    ///////// STATICS /////////
    
    Shape.guid = 0;

    Shape.toString = function() {
        return 'function(options)';
    };

    ///////// EXTENSION /////////
    
    Graph.isShape = function(obj) {
        return obj instanceof Graph.shape.Shape;
    };

}());