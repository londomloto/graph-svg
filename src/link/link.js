
(function(){

    var Link = Graph.link.Link = Graph.extend({

        props: {
            id: null,
            name: null,
            guid: null,
            type: 'normal',
            rendered: false,
            selected: false,
            label: '',
            labelDistance: .5,
            source: null,
            target: null,
            connected: false,
            removed: false,
            command: null,
            stroke: '#000',
            convex: 1,
            smooth: 0,
            smoothness: 6,
            dataSource: null
        },

        params: [],

        components: {
            block: null,
            coat: null,
            path: null,
            label: null,
            editor: null
        },

        cached: {
            bendpoints: null,
            controls: null,
            convex: null
        },

        handlers: {
            source: null,
            target: null
        },

        router: null,

        metadata: {
            icon: Graph.icons.SHAPE_LINK
        },

        constructor: function(router, options) {
            var guid;
            this.data(options || {});

            guid = 'graph-link-' + (++Link.guid);

            this.props.guid = guid;
            this.router = router;

            this.initComponent();
            this.initMetadata();

            this.bindResource('source', router.source());
            this.bindResource('target', router.target());

            this.router.on('route', _.bind(this.onRouterRoute, this));
            this.router.on('reroute', _.bind(this.onRouterReroute, this));

            Graph.registry.link.register(this);
        },

        data: function(name, value) {
            if (name === undefined && value === undefined) {
                return this.props;
            }

            var excludes = {
                type: true,
                router_type: true,
                client_id: true,
                client_source: true,
                client_target: true,
                diagram_id: true,
                source_id: true,
                target_id: true
            };

            var maps = {
                label_distance: 'labelDistance',
                data_source: 'dataSource'
            };

            var key, map;

            if (_.isPlainObject(name)) {
                for (var key in name) {
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

        initComponent: function() {
            var comp = this.components;
            var block, coat, path, editor, label;

            block = (new Graph.svg.Group())
                .addClass('graph-link')
                .selectable(false);

            block.elem.data(Graph.string.ID_LINK, this.props.guid);
            block.addClass('link-' + this.props.type);

            coat = (new Graph.svg.Path())
                .addClass('graph-link-coat')
                .render(block);

            coat.data('text', this.props.label);
            coat.elem.data(Graph.string.ID_LINK, this.props.guid);

            coat.draggable({
                ghost: true,
                manual: true,
                batchSync: false
            });

            coat.editable({
                width: 150,
                height: 80,
                offset: 'pointer'
            });

            coat.on('pointerdown.link', _.bind(this.onCoatClick, this));
            coat.on('select.link', _.bind(this.onCoatSelect, this));
            coat.on('deselect.link', _.bind(this.onCoatDeselect, this));
            coat.on('beforedrag.link', _.bind(this.onCoatBeforeDrag, this));
            coat.on('afterdrag.link', _.bind(this.onCoatAfterDrag, this));
            coat.on('edit.link', _.bind(this.onCoatEdit, this));
            coat.on('beforeedit.link', _.bind(this.onCoatBeforeEdit, this));
            coat.on('afterdestroy.link', _.bind(this.onCoatAfterDestroy, this));

            path = (new Graph.svg.Path())
                .addClass('graph-link-path')
                .selectable(false)
                .clickable(false)
                .attr('marker-end', 'url(#marker-link-end)')
                .attr('stroke', this.props.stroke || '#000000')
                .render(block);

            if (this.props.type == 'message') {
                path.attr('marker-start', 'url(#marker-link-start-circle)');
            }

            path.elem.data(Graph.string.ID_LINK, this.props.guid);

            label = (new Graph.svg.Text(0, 0, ''))
                .addClass('graph-link-label')
                .selectable(false)
                .render(block);

            label.draggable({ghost: true});

            label.on('render.link', _.bind(this.onLabelRender, this));
            label.on('afterdrag.link', _.bind(this.onLabelAfterDrag, this));

            // enable label doubletap
            var labelVendor = label.interactable().vendor();
            labelVendor.on('doubletap', _.bind(this.onLabelDoubletap, this));

            editor = (new Graph.svg.Group())
                .selectable(false)
                .render(block);

            comp.block = block.guid();
            comp.coat = coat.guid();
            comp.path = path.guid();
            comp.label = label.guid();
            comp.editor = editor.guid();
        },

        initMetadata: function() {
            this.metadata.tools = [
                {
                    name: 'config',
                    icon: Graph.icons.CONFIG,
                    title: Graph._('Click to config link'),
                    enabled: true,
                    handler: _.bind(this.onConfigToolClick, this)
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
                    title: Graph._('Click to remove link'),
                    enabled: true,
                    handler: _.bind(this.onTrashToolClick, this)
                }
            ];
        },

        unbindResource: function(type) {
            var existing = this.props[type],
                handlers = this.handlers[type];

            if (existing) {
                var vector = Graph.registry.vector.get(existing);
                if (vector) {
                    if (handlers) {
                        var name, ns;
                        for (name in handlers) {
                            ns = name + '.link';
                            vector.off(ns, handlers[name]);
                            ns = null;
                        }
                    }
                }
            }

            handlers = null;

            return this;
        },

        bindResource: function(type, resource) {
            var router = this.router,
                handlers = this.handlers[type];

            this.unbindResource(type, resource);

            handlers = {};

            handlers.afterresize = _.bind(getHandler(this, type, 'AfterResize'), this);
            handlers.select = _.bind(getHandler(this, type, 'Select'), this);
            handlers.afterrotate = _.bind(getHandler(this, type, 'AfterRotate'), this);
            handlers.beforedrag = _.bind(getHandler(this, type, 'BeforeDrag'), this, _, resource);
            handlers.drag = _.bind(getHandler(this, type, 'Drag'), this);
            handlers.afterdrag = _.bind(getHandler(this, type, 'AfterDrag'), this);
            handlers.beforedestroy = _.bind(getHandler(this, type, 'BeforeDestroy'), this);
            
            this.handlers[type] = handlers;
            this.props[type] = resource.guid();

            resource.on('afterresize.link', handlers.afterresize);
            resource.on('afterrotate.link', handlers.afterrotate);
            resource.on('beforedestroy.link', handlers.beforedestroy);
            resource.on('select.link', handlers.select);

            // VERY EXPENSIVE!!!
            if (resource.isDraggable()) {
                resource.on('beforedrag.link', handlers.beforedrag);
                if ( ! resource.draggable().ghost()) {
                    resource.on('drag.link', handlers.drag);
                } else {
                    resource.on('afterdrag.link', handlers.afterdrag);
                }
            }

            return this;
        },

        bindSource: function(source) {
            return this.bindResource('source', source);
        },

        bindTarget: function(target) {
            return this.bindResource('target', target);
        },

        unbindSource: function(source) {
            return this.unbindResource('source');
        },

        unbindTarget: function(target) {
            return this.unbindResource('target');
        },

        component: function(name) {
            if (name === undefined) {
                return Graph.registry.vector.get(this.components.block);
            }
            return Graph.registry.vector.get(this.components[name]);
        },

        invalidate: function(cache) {
            if (cache !== undefined) {
                this.cached[cache] = null;
            } else {
                this.cached.bendpoints = null;
            }
        },

        render: function(container) {
            var paper;

            this.component().render(container);
            paper = container.paper();

            if (paper) {
                Graph.registry.link.setContext(this.guid(), paper.guid());
            }
        },

        id: function() {
            return this.props.id;
        },

        guid: function() {
            return this.props.guid;
        },

        type: function(type) {
            if (type === undefined) {
                return this.props.type;
            }

            this.props.type = type;

            var component = this.component();

            if (type == 'message') {
                this.component('path').attr('marker-start', 'url(#marker-link-start-circle)');
            } else {
                this.component('path').attr('marker-start', '');
            }

            component.removeClass('link-normal link-message');
            component.addClass('link-' + type);
        },

        connect: function(start, end) {
            // already connected ?
            if (this.props.connected) {
                return;
            }

            this.router.route(start, end);
            this.props.connected = true;
        },

        connectByCommand: function(command) {
            if (this.props.connected) {
                return;
            }

            this.router.execute(command);
            this.props.connected = true;
        },

        disconnect: function(reload) {
            // already disconnected ?
            if ( ! this.props.connected) {
                return;
            }

            reload = _.defaultTo(reload, true);

            this.props.connected = false;

            if (reload) {
                this.router.reset();
                this.reload(this.router.command());    
            }
        },

        redraw: function(props) {

        },

        reload: function(command, silent) {
            silent = _.defaultTo(silent, false);

            command = command || '';

            this.component('coat').attr('d', command).dirty(true);
            this.component('path').attr('d', command);
            this.invalidate();

            if ( ! silent) {
                this.refresh();
                this.fire('change');
                Graph.topic.publish('link:change');
            }
        },

        reloadConvex: function(convex) {
            this.cached.convex = convex;
        },

        removeConvex: function() {
            this.cached.convex = null;
        },

        reset: function(silent) {
            var command = this.router.command();
            this.reload(command, silent);
        },

        refresh: function() {

            // TODO: update label position
            if (this.props.label) {
                var label = this.component('label');

                if (label.props.rendered) {
                    var path = this.router.path();

                    if (path.segments.length) {
                        var bound = label.bbox().toJson(),
                            distance = this.props.labelDistance || .5,
                            scale = this.router.layout().scale(),
                            path = this.router.path(),
                            dots = path.pointAt(distance * path.length(), true),
                            align = Graph.util.pointAlign(dots.start, dots.end, 10);

                        if (align == 'h') {
                            dots.x += (bound.width / 2 + (10 / scale.x));
                        } else {
                            dots.y -= (bound.height - (5 / scale.y));
                        }

                        label.attr({
                            x: dots.x,
                            y: dots.y
                        });

                        label.arrange();

                        path = null;
                        dots = null;

                        label.dirty(true);
                    } else {
                        label.hide();
                    }
                }
            }

        },

        label: function(text) {
            var path, distance, point, align;

            if (text === undefined) {
                return this.props.label;
            }

            this.props.label = text;
            
            var componentLabel = this.component('label'),
                componentCoat = this.component('coat');

            componentLabel.write(text);
            componentLabel.arrange();

            componentCoat.data('text', text);
            
            if (componentLabel.props.rendered) {
                this.refresh();
            }

            return this;
        },

        stroke: function(color) {
            color = color || '#000';

            this.props.stroke = color;
            this.component('path').attr('stroke', color);

            return this;
        },

        select: function(single) {
            var paper = this.router.source().paper();
            single = _.defaultTo(single, false);
            if (single && paper) {
                paper.collector().clearCollection();
            }

            this.component('coat').select();
        },

        deselect: function() {
            this.component('coat').deselect();
        },

        renderControl: function() {
            // TODO: render bends control
        },

        resumeControl: function() {
            var me = this, editor = me.component('editor');

            if ( ! me.cached.bendpoints) {
                me.cached.bendpoints = me.router.bendpoints();
                me.renderControl();
            }

            editor.elem.appendTo(this.component('block').elem);
        },

        suspendControl: function() {
            this.component('editor').elem.detach();
        },

        sendToFront: function() {
            var container = this.component().parent();
            this.component().elem.appendTo(container.elem);
        },

        relocate: function(dx, dy) {
            this.router.relocate(dx, dy);
            this.reload(this.router.command());
        },

        relocateHead: function(dx, dy) {
            var port = this.router.head();
            if (port) {
                port.x += dx;
                port.y += dy;
                this.router.repair(this.router.target(), port);
            }
        },

        relocateTail: function(dx, dy) {
            var port = this.router.tail();
            if (port) {
                port.x += dx;
                port.y += dy;
                this.router.repair(this.router.source(), port);
            }
        },

        remove: function() {
            var me = this;
            var prop;

            if (this.props.removed) {
                return;
            }

            // flag
            this.props.removed = true;

            // disconnect first
            this.disconnect(false);
            
            // unbind resource
            this.unbindSource();
            this.unbindTarget();

            this.fire('beforedestroy', {link: this});

            // remove label
            me.component('label').remove();

            // remove vertexs
            if (me.cached.controls) {
                _.forEach(me.cached.controls, function(id){
                    var c = Graph.registry.vector.get(id);
                    c && c.remove();
                });
                me.cached.controls = null;
            }

            // remove editor
            me.component('editor').remove();

            // remove path
            me.component('path').remove();

            // remove block
            me.component('block').remove();

            for (prop in me.components) {
                me.components[prop] = null;
            }

            // clear cache
            for (prop in me.cached) {
                me.cached[prop] = null;
            }

            me.router.destroy();
            me.router = null;

            me.fire('afterdestroy');

            // unregister
            Graph.registry.link.unregister(me);

            // publish
            Graph.topic.publish('link:afterdestroy');
        },
        isSelected: function() {
            return this.props.selected;
        },
        isConnected: function() {
            return this.props.connected;
        },

        toString: function() {
            return 'Graph.link.Link';
        },

        toJson: function() {
            var source = this.router.source(),
                target = this.router.target();

            var sourceShape = Graph.registry.shape.get(source),
                targetShape = Graph.registry.shape.get(target);

            var link = {
                metadata: {

                },
                props: {
                    id: this.props.id,
                    name: this.props.name,
                    guid: this.guid(),
                    type: this.toString(),
                    routerType: this.router.type(),
                    command: this.router.command(),
                    label: this.props.label,
                    labelDistance: this.props.labelDistance,
                    source: sourceShape ? sourceShape.guid() : source.guid(),
                    sourceType: sourceShape ? 'shape' : 'vector',
                    target: targetShape ? targetShape.guid() : target.guid(),
                    targetType: targetShape ? 'shape' : 'vector',
                    convex: +this.props.convex ? 1 : 0,
                    smooth: +this.props.smooth ? 1 : 0,
                    smoothness: this.props.smoothness,
                    stroke: this.props.stroke,
                    dataSource: this.props.dataSource
                },

                params: this.params
            };

            return link;
        },

        ///////// OBSERVERS /////////

        onRouterRoute: function(e) {
            var command = e.command;
            this.reload(command);
        },

        onRouterReroute: function(e) {
            var source = e.source,
                target = e.target;

            this.bindResource('source', source);
            this.bindResource('target', target);

            this.sendToFront();
        },

        onLabelRender: function(e) {
            if (this.props.label) {
                this.label(this.props.label);
            }
        },

        onLabelAfterDrag: function(e) {
            var label = this.component('label'),
                matrix = label.matrix(),
                x = label.attrs.x,
                y = label.attrs.y,
                p = {
                    x: matrix.x(x, y),
                    y: matrix.y(x, y)
                }

            label.attr({
                x: p.x,
                y: p.y
            });

            label.arrange();

            // update label distance
            var path = this.router.path(),
                near = path.nearest(p);

            this.props.labelDistance = near.distance / path.length();

            label.reset();
            matrix = path = null;
        },

        onLabelDoubletap: function(e) {
            var coat = this.component('coat');
            coat.editable().startEdit(e);
        },

        onCoatBeforeEdit: function(e) {
            this.component('label').hide();
            this.component().addClass('editing');
        },

        onCoatEdit: function(e) {
            this.component().removeClass('editing');
            this.component('label').show();
            this.label(e.text, e.left, e.top);
        },

        onCoatClick: function(e) {
            var paper = this.component('coat').paper();
            if (paper.state() == 'linking') {
                paper.tool().activate('panzoom');
            }
        },

        onCoatSelect: function(e) {
            var coat = this.component('coat'),
                showControl = false;

            if (e.initial) {
                showControl = true;
            }

            this.props.selected = true;
            this.component().addClass('selected');

            if (showControl) {
                this.resumeControl();
                Graph.topic.publish('link:select', {link: this});
            }
        },

        onCoatDeselect: function(e) {
            if (this.props.removed) return;

            this.props.selected = false;
            this.component().removeClass('selected');
            this.suspendControl();

            if (e.initial) {
                Graph.topic.publish('link:deselect', {link: this});    
            }
        },

        onCoatBeforeDrag: function(e) {
            this.suspendControl();
        },

        onCoatAfterDrag: function(e) {
            this.relocate(e.dx, e.dy);
        },

        onCoatAfterDestroy: function(e) {
            this.remove();
        },

        ///////// OBSERVERS /////////

        onSourceAfterRotate: function(e) {
            var matrix = this.router.source().matrix(),
                oport = this.router.tail(),
                nport = {
                    x: matrix.x(oport.x, oport.y),
                    y: matrix.y(oport.x, oport.y)
                },
                dx = nport.x - oport.x,
                dy = nport.y - oport.y;

            this.relocateTail(dx, dy);
        },

        onSourceSelect: function(e) {
            var target = this.router.target();
            if (this.isSelected()) {
                if ( ! target.isSelected()) {
                    this.deselect();
                }
            } else {
                if (target.isSelected()) {
                    this.select();
                }
            }
        },

        onSourceBeforeDrag: function(e, source) {
            var target = this.router.target();
            if ( ! source.isSelected() || ! target.isSelected()) {
                this.deselect();
            }
            this.cached.convex = null;
        },

        onSourceDrag: function(e) {
            console.warn('Not yet implemented');
        },

        onSourceAfterDrag: function(e) {
            var source = this.router.source(),
                target = this.router.target(),
                dx = e.tx,
                dy = e.ty;

            if (source.isSelected()) {
                if ( ! target.isSelected()) {
                    this.relocateTail(dx, dy);
                }
            } else {
                this.relocateTail(dx, dy);
            }
        },

        onSourceAfterResize: function(e) {
            this.relocateTail(e.translate.dx, e.translate.dy);
        },

        onSourceBeforeDestroy: function() {
            if ( ! this.props.removed) {
                this.component('coat').remove();    
            }
        },

        onTargetAfterRotate: function(e) {
            var matrix = this.router.target().matrix(),
                oport = this.router.head(),
                nport = {
                    x: matrix.x(oport.x, oport.y),
                    y: matrix.y(oport.x, oport.y)
                },
                dx = nport.x - oport.x,
                dy = nport.y - oport.y;

            this.relocateHead(dx, dy);
        },

        onTargetSelect: function(e) {
            var source = this.router.source();
            if (this.isSelected()) {
                if ( ! source.isSelected()) {
                    this.deselect();
                }
            } else {
                if (source.isSelected()) {
                    this.select();
                }
            }
        },

        onTargetBeforeDrag: function(e, target) {
            var source = this.router.source();
            if ( ! source.isSelected() || ! target.isSelected()) {
                this.deselect();
            }
            this.cached.convex = null;
        },

        onTargetDrag: function(e) {
            console.warn('Not yet implemented');
        },

        onTargetAfterDrag: function(e) {
            var target = this.router.target(),
                source = this.router.source(),
                dx = e.tx,
                dy = e.ty;

            if (target.isSelected()) {
                if ( ! source.isSelected()) {
                    this.relocateHead(dx, dy);
                }
            } else {
                this.relocateHead(dx, dy);
            }
        },

        onTargetAfterResize: function(e) {
            this.relocateHead(e.translate.dx, e.translate.dy);
        },

        onTargetBeforeDestroy: function() {
            if ( ! this.props.removed) {
                this.component('coat').remove();    
            }
        },  

        onTrashToolClick: function(e) {
            this.component('coat').remove();
        },

        onConfigToolClick: function(e) {

        },

        onFrontToolClick: function(e) {
            this.sendToFront();
        },

        onBackToolClick: function(e) {

        },

        destroy: function() {

        }

    });

    ///////// STATICS /////////

    Link.guid = 0;

    ///////// HELPERS /////////

    function getHandler(scope, resource, handler) {
        var name = 'on' + _.capitalize(resource) + handler,
            func = scope[name];

        name = null;
        return func;
    }

}());
