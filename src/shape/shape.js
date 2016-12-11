
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

        },

        plugins: {
            manager: null
        },

        constructor: function(options) {
            var guid;

            _.assign(this.props, options || {});

            guid = 'graph-shape-' + (++Shape.guid);

            this.props.guid = guid;
            this.tree.children = new Graph.collection.Shape();
            this.plugins.manager = new Graph.plugin.Manager();

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

        },
        
        connectable: function() {
            return this.plugins.manager.get('network');
        },

        resizable: function() {
            return this.plugins.manager.get('resizer');
        },

        draggable: function() {
            return this.plugins.manager.get('dragger');
        },

        snappable: function() {
            return this.plugins.manager.get('snapper');
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

        addChild: function(child) {
            var children = this.children(),
                parent = child.parent();

            if (parent && parent.guid() != this.guid()) {
                parent.removeChild(child);
            }

            if ( ! children.has(child)) {
                children.push(child);
                child.tree.parent = this.guid();
            }
        },

        removeChild: function(child) {
            var children = this.children();

            if (children.has(child)) {
                children.pull(child);
                child.tree.parent = null;
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

        cascade: function(handler) {
            cascade(this, handler);
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

        width: function(value) {
            if (value === undefined) {
                return this.props.width;
            }
            return this.attr('width', value);
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
            this.component().addClass('shape-dragging');
        },

        onDragEnd: function(e) {
            var blockComponent = this.component('block'),
                shapeComponent = this.component('shape'),
                blockMatrix = blockComponent.matrix();

            var shapeMatrix;

            blockComponent.reset();

            shapeComponent.matrix().multiply(blockMatrix);
            shapeComponent.attr('transform', shapeComponent.matrix().toValue());
            shapeComponent.dirty(true);

            // update props
            shapeMatrix = shapeComponent.matrix();

            this.data({
                left: shapeMatrix.props.e,
                top: shapeMatrix.props.f
            });

            // forward
            this.fire(e);
            shapeComponent.removeClass('shape-dragging');
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
                linker.start(this.connectable().component(), coord);
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

    ///////// EXTENSION /////////

    Graph.isShape = function(obj) {
        return obj instanceof Graph.shape.Shape;
    };

    ///////// HELPERS /////////

    function cascade(shape, handler) {
        var child = shape.children().toArray();
        var result;

        result = handler.call(shape, shape);
        result = _.defaultTo(result, true);

        if (result && child.length) {
            _.forEach(child, function(curr){
                cascade(curr, handler);
            });
        }
    }

}());
