
(function(){

    var Shape = Graph.shape.Shape = Graph.extend({

        props: {
            id: null,
            guid: null,
            mode: null,
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            rotate: 0,
            label: '',
            alias: '',
            fill: 'rgb(255, 255, 255)',
            stroke: 'rgb(0, 0, 0)',
            strokeWidth: 2,
            dataSource: null
        },

        params: [],

        components: {
            shape: null,
            block: null,
            label: null,
            child: null
        },

        layout: {
            suspended: false
        },

        tree: {
            paper: null,
            parent: null,
            children: null
        },

        metadata: {
            type: null,
            icon: Graph.icons.SHAPE,
            style: 'graph-shape',
            tools: null,
            params: []
        },

        cached: {

        },

        plugins: {
            manager: null
        },

        constructor: function(options) {
            var guid;

            this.data(options || {});

            guid = 'graph-shape-' + (++Shape.guid);

            this.props.guid = guid;
            this.tree.children = new Graph.collection.Shape();
            this.plugins.manager = new Graph.plugin.Manager();

            this.initComponent();
            this.initMetadata();

            if (this.components.shape) {
                var style = Graph.styles.SHAPE,
                    shape = this.component();

                if (this.metadata.style) {
                    style += ' ' + this.metadata.style;
                }

                shape.addClass(style);
                shape.attr('data-shape', guid);
                
                style = null;
            }

            Graph.registry.shape.register(this);

            guid = null;
        },

        data: function(name, value) {
            if (name === undefined && value === undefined) {
                return this.props;
            }

            var excludes = {
                type: true,
                client_id: true,
                client_parent: true,
                client_pool: true,
                diagram_id: true,
                parent_id: true
            };

            var maps = {
                stroke_width: 'strokeWidth',
                data_source: 'dataSource'
            };

            var map, key;

            if (_.isPlainObject(name)) {
                for (key in name) {
                    if ( ! excludes[key]) {
                        map = maps[key] || key;
                        if (key == 'params') {
                            this.params = name[key];
                        } else {
                            this.props[map] = name[key];
                        }
                    }
                }
                return this;
            }

            if (value === undefined) {
                return this.props[name];
            }

            if ( ! excludes[name]) {
                map = maps[name] || name;
                if (name == 'params') {
                    this.params = value;
                } else {
                    this.props[map] = value;        
                }
            }

            return this;
        },

        update: function(data) {
            data = data || {};

            if (data.props) {
                this.data(data.props);
            }
        },

        redraw: function(props) {
            var key;
            
            props = props || {};

            this.suspendLayout();

            for (key in props) {
                if (this[key] !== undefined && _.isFunction(this[key])) {
                    this[key](props[key]);
                }
            }

            this.resumeLayout();
            this.refresh();
        },

        is: function(type) {
            return this.metadata.type == type;
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
            for (var key in this.cached) {
                this.cached[key] = null;
            }
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

        editable: function() {
            return this.plugins.manager.get('editor');  
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

        hasChild: function(child) {
            return this.children().has(child);
        },

        addChild: function(child, relocate) {
            var children = this.children(),
                placeTarget = this.component('child'),
                guid = this.guid(),
                me = this;

            relocate = _.defaultTo(relocate, true);

            if ( ! _.isArray(child)) {
                child = [child];
            }

            var beforeDestroyHandler = _.bind(this.onChildBeforeDestroy, this);

            _.forEach(child, function(shape){
                var parent = shape.parent();

                if (parent && parent.guid() != guid) {
                    parent.removeChild(shape);
                }

                if ( ! children.has(shape)) {
                    var shapeComponent = shape.component();

                    if (relocate) {
                        shapeComponent.relocate(placeTarget);    
                    } else {
                        placeTarget.append(shapeComponent);
                    }
                    
                    shape.cached.beforeDestroyHandler = _.bind(me.onChildBeforeDestroy, me);
                    shape.cached.afterDragHandler = _.bind(me.onChildAfterDrag, me);
                    shape.cached.connectHandler = _.bind(me.onChildConnect, me);

                    shape.on('beforedestroy', shape.cached.beforeDestroyHandler);
                    shape.on('afterdrag', shape.cached.afterDragHandler);
                    shape.on('connect', shape.cached.connectHandler);

                    children.push(shape);
                    shape.tree.parent = guid;

                    // update shape props
                    var matrix = shapeComponent.matrix();

                    shape.data({
                        left: matrix.props.e,
                        top: matrix.props.f
                    });
                }
            });

            if (relocate) {
                this.autoResize();    
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
            var guid = this.guid(),
                paperGuid = paper.guid();

            var component = this.component();
            component && component.render(paper);
            
            // save
            this.tree.paper = paperGuid;
            Graph.registry.shape.setContext(guid, paperGuid);
        },

        select: function(single) {
            var blockComponent = this.component('block'),
                paper = this.paper();

            single = _.defaultTo(single, false);

            if (single && paper) {
                paper.collector().clearCollection();
            }

            if (blockComponent) {
                blockComponent.select();
            }
        },

        deselect: function() {
            var blockComponent = this.component('block');
            if (blockComponent) {
                blockComponent.deselect();
            }
        },

        remove: function() {
            // just fire block removal
            this.component('block').remove();
        },

        refresh: _.debounce(function() {
            if (this.layout.suspended) {
                return;
            }

            var label = this.component('label'),
                block = this.component('block'),
                bound = block.bbox().toJson();

            label.attr({
                x: bound.x + bound.width  / 2,
                y: bound.x + bound.height / 2
            });

            label.wrap(bound.width - 10);

        }, 1),

        autoResize: function() {

        },

        center: function() {
            var bbox = this.component().bboxView().toJson();
            return {
                x: (bbox.x + bbox.x2) / 2,
                y: (bbox.y + bbox.y2) / 2
            };
        },

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

            var childComponent = this.component('child');

            if (childComponent) {
                childComponent.dirty(true);
            }

        },

        cascade: function(handler) {
            cascade(this, handler);
        },

        sendToBack: function() {
            var parent = this.parent(),
                container = parent 
                    ? parent.component('child').elem
                    : this.paper().viewport().elem;

            container && container.prepend(this.component().elem);
        },

        sendToFront: function() {
            var parent = this.parent(),
                container = parent 
                    ? parent.component('child').elem
                    : this.paper().viewport().elem;

            container && container.append(this.component().elem);
        },

        suspendLayout: function() {
            this.layout.suspended = true;
        },

        resumeLayout: function() {
            this.layout.suspended = false;
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

            var block = this.component('block'),
                box = block.bbox().toJson(),
                sx = 1,
                sy = value / this.props.height,
                cx = (box.x + box.x2) / 2,
                cy = box.y,
                dx = 0,
                dy = 0;

            var resize = block.resize(sx, sy, cx, cy, dx, dy);
            block.fire('afterresize', resize);
            
            this.props.height = value;
            return this;
        },

        width: function(value) {
            if (value === undefined) {
                return this.props.width;
            }

            var block = this.component('block'),
                box = block.bbox().toJson(),
                sx = value / this.props.width,
                sy = 1,
                cx = box.x,
                cy = (box.y + box.y2) / 2,
                dx = 0,
                dy = 0;

            var resize = block.resize(sx, sy, cx, cy, dx, dy);
            block.fire('afterresize', resize);

            this.props.width = value;
            return this;
        },

        left: function(value) {
            if (value === undefined) {
                return this.props.left;
            }

            var shape = this.component(),
                matrix = shape.matrix(),
                dx = value - matrix.props.e,
                dy = 0;

            shape.translate(dx, dy).commit();
            this.props.left = value;

            return this;
        },

        top: function(value) {
            if (value === undefined) {
                return this.props.top;
            }

            var shape = this.component(),
                matrix = shape.matrix(),
                dx = 0,
                dy = value - matrix.props.f;

            shape.translate(dx, dy).commit();
            this.props.top = value;

            return this;
        },

        rotate: function(value) {
            var block = this.component('block');
            if (block && block.isRotatable()) {
                var center = block.bbox().toJson();
                block.rotate(value, center.x, center.y).commit();
            }
        },

        label: function(label) {
            if (label === undefined) {
                return this.props.label;
            }

            var blockComponent = this.component('block'),
                labelComponent = this.component('label');

            labelComponent.props.text = label;
            blockComponent.data('text', label);

            this.props.label = label;
            this.refresh();
        },

        fill: function(value) {
            if (value === undefined) {
                return this.props.fill;
            }
            this.props.fill = value;
            this.component('block').elem.css('fill', value);
        },

        stroke: function(value) {
            if (value === undefined) {
                return this.props.stroke;
            }
            
            this.props.stroke = value;
            this.component('block').elem.css('stroke', value);
        },

        strokeWidth: function(value) {
            if (value === undefined) {
                return this.props.strokeWidth;
            }

            this.props.strokeWidth = value;
            this.component('block').elem.css('stroke-width', value);
        },

        connect: function(target, start, end, options){
            var sourceNetwork = this.connectable().plugin(),
                targetNetwork = target.connectable().plugin();

            if (sourceNetwork && targetNetwork) {
                return sourceNetwork.connect(targetNetwork, start, end, options);
            }

            return false;
        },

        disconnect: function(target, link) {
            var sourceNetwork = this.connectable().plugin(),
                targetNetwork = target.connectable().plugin();

            if (sourceNetwork && targetNetwork) {
                return sourceNetwork.disconnect(targetNetwork, link);
            }

            return false;
        },

        toJson: function() {
            var blockComponent = this.component('block'),
                paper = this.paper();

            var shape = {
                metadata: {

                },
                props: {
                    id: this.props.id,
                    type: this.toString(),
                    mode: this.props.mode,
                    guid: this.props.guid,
                    pool: null,
                    parent: this.tree.parent,
                    label: this.props.label,
                    left: this.props.left,
                    top: this.props.top,
                    width: this.props.width,
                    height: this.props.height,
                    rotate: this.props.rotate,
                    fill: this.props.fill,
                    strokeWidth: this.props.strokeWidth,
                    stroke: this.props.stroke,
                    dataSource: this.props.dataSource
                },
                params: this.params,
                links: [
                    
                ]
            };

            var network = this.connectable().plugin();

            if (network) {
                var connections = network.connections();

                _.forEach(connections, function(conn){
                    var linkData = conn.link.toJson();

                    shape.links.push({
                        guid: conn.guid,
                        mode: conn.type,
                        pair: conn.type == 'outgoing' ? linkData.props.target : linkData.props.source
                    });
                });
            }

            return shape;
        },

        ///////// PRIVATE OBSERVERS /////////

        onLabelEdit: function(e) {
            this.label(e.text);
        },

        onBeforeDrag: function(e) {
            this.fire(e);
            this.paper().diagram().capture();
        },

        onAfterDrag: function(e) {
            var blockComponent = this.component('block'),
                shapeComponent = this.component('shape'),
                childComponent = this.component('child'),
                blockMatrix = blockComponent.matrix();

            var shapeMatrix;

            blockComponent.reset();

            shapeComponent.matrix().multiply(blockMatrix);
            shapeComponent.attr('transform', shapeComponent.matrix().toValue());
            shapeComponent.dirty(true);

            if (childComponent) {
                childComponent.dirty(true);
            }

            // update props
            shapeMatrix = shapeComponent.matrix();

            this.data({
                left: shapeMatrix.props.e,
                top: shapeMatrix.props.f
            });

            // forward
            this.fire(e);
        },

        onAfterRotate: function(e) {
            var shapeComponent = this.component('shape'),
                blockComponent = this.component('block'),
                childComponent = this.component('child');

            var shapeMatrix = shapeComponent.matrix();

            shapeMatrix.multiply(blockComponent.matrix());
            shapeComponent.attr('transform', shapeMatrix.toValue());
            shapeComponent.dirty(true);

            if (childComponent) {
                childComponent.dirty(true);
            }

            blockComponent.reset();
            blockComponent.rotatable().redraw();

            if (blockComponent.isResizable() && blockComponent.resizable().props.suspended === false) {
                blockComponent.resizable().redraw();    
            }

            var shapeRotate = shapeMatrix.rotate();
            this.props.rotate = shapeRotate.deg;
        },

        onSelect: function(e) {
            this.component('shape').addClass('shape-selected');
            if (e.initial) {
                Graph.topic.publish('shape:select', {shape: this});    
            }
        },

        onDeselect: function(e) {
            this.component('shape').removeClass('shape-selected');
            if (e.initial) {
                Graph.topic.publish('shape:deselect', {shape: this});
            }
        },

        onConnect: function(e) {
            var link = e.link,
                sourceVector = link.router.source(),
                targetVector = link.router.target();

            if (sourceVector && targetVector) {
                var sourceShape = Graph.registry.shape.get(sourceVector),
                    targetShape = Graph.registry.shape.get(targetVector);

                if (sourceShape && targetShape) {
                    this.fire('connect', {
                        link: link,
                        source: sourceShape,
                        target: targetShape
                    });
                }
            }
        },

        onAfterResize: function() {
            this.refresh();
        },

        onBeforeDestroy: function() {
            this.fire('beforedestroy', {shape: this});
        },

        onAfterDestroy: function() {
            // remove label
            this.component('label').remove();

            // remove shape
            this.component('shape').remove();

            for (var name in this.components) {
                this.components[name] = null;
            }

            this.fire('afterdestroy', {shape: this});
            Graph.registry.shape.unregister(this);
        },

        onChildConnect: function(e) {

        },

        onChildAfterDrag: function(e) {
            var childComponent;

            if (e.batch) {
                if (e.master) {
                    childComponent = this.component('child');
                    if (childComponent) {
                        childComponent.dirty(true);
                    }
                }
            } else {
                childComponent = this.component('child');
                if (childComponent) {
                    childComponent.dirty(true);
                }
            }
        },

        onChildBeforeDestroy: function(e) {
            var shape = e.shape;

            this.children().pull(shape);

            shape.off('beforedestroy', shape.cached.beforeDestroyHandler);
            shape.off('afterdrag', shape.cached.afterDragHandler);
            shape.off('connect', shape.cached.connectHandler);

            shape.cached.beforeDestroyHandler = null;
            shape.cached.afterDragHandler = null;
            shape.cached.connectHandler = null;

            var childComponent = shape.component('child');

            if (childComponent) {
                childComponent.dirty(true);
            }
        },

        onConfigToolClick: function(e) {

        },

        onTrashToolClick: function(e) {
            this.paper().diagram().capture();
            this.remove();
        },

        onLinkToolClick: function(e) {
            var paper = this.paper();

            if (paper) {
                var layout = paper.layout(),
                    linker = paper.plugins.linker,
                    coord  = layout.pointerLocation(e);

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
