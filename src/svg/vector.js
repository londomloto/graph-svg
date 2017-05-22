
(function(){

    var Vector = Graph.svg.Vector = Graph.extend({

        tree: {
            container: null,
            paper: null, // root
            parent: null,
            children: null,
            next: null,
            prev: null
        },

        props: {
            id: null,
            guid: null,
            type: null,
            text: null,
            rotate: 0,
            scaleX: 1,
            scaleY: 1,
            traversable: true,
            selectable: true,
            focusable: false,
            snappable: false,
            selected: false,
            rendered: false,
            state: null
        },

        attrs: {
            'style': null,
            'class': null
        },

        plugins: {
            transformer: null,
            collector: null,
            definer: null,
            animator: null,
            resizer: null,
            rotator: null,
            reactor: null,
            dragger: null,
            dropper: null,
            network: null,
            history: null,
            panzoom: null,
            toolmgr: null,
            toolpad: null,
            snapper: null,
            editor: null
        },

        graph: {
            matrix: null,
            layout: null
        },

        cached: {
            bbox: null,
            bboxView: null,
            bboxPristine: null,
            bboxOriginal: null,
            matrixCurrent: null,
            matrixView: null,
            shapeOriginal: null,
            shapeView: null,
            position: null,
            offset: null
        },

        elem: null,

        constructor: function(type, attrs) {
            var me = this, guid;

            me.graph.matrix = Graph.matrix();
            me.tree.children = new Graph.collection.Vector();

            guid  = 'graph-elem-' + (++Vector.guid);
            attrs = _.extend({}, me.attrs, attrs || {});

            me.elem = Graph.$(document.createElementNS(Graph.config.xmlns.svg, type));

            if (attrs['class']) {
                attrs['class'] = Graph.styles.VECTOR + ' ' + attrs['class'];
            } else {
                attrs['class'] = Graph.styles.VECTOR;
            }

            // apply initial attributes
            me.attr(attrs);

            me.props.guid = me.props.id = guid; // Graph.uuid();
            me.props.type = type;

            guid = null;

            me.elem.data(Graph.string.ID_VECTOR, me.props.guid);
            me.elem.attr('data-elem', me.props.guid);

            // me.plugins.history = new Graph.plugin.History(me);
            me.plugins.transformer = (new Graph.plugin.Transformer(me))
                .on('aftertranslate', _.bind(me.onTransformerAfterTranslate, me))
                .on('afterrotate', _.bind(me.onTransformerAfterRotate, me))
                .on('afterscale', _.bind(me.onTransformerAfterScale, me));

            if (me.isPaper()) {
                me.plugins.toolmgr = (new Graph.plugin.ToolManager(me))
                    .on('activate', _.bind(me.onActivateTool, me))
                    .on('deactivate', _.bind(me.onDeactivateTool, me));
            }

            Graph.registry.vector.register(this);
        },

        /**
         * Get/set local matrix
         */
        matrix: function(matrix) {
            if (matrix === undefined) {
                return this.graph.matrix;
            }
            this.graph.matrix = matrix;
            return this;
        },

        /**
         * Get relative matrix (relative to viewport)
         */
        matrixView: function() {
            var matrix = this.cached.matrixView;
            if ( ! matrix) {
                var paper = this.paper();
                if (paper) {
                    var viewport = paper.viewport(),
                        viewportGuid = viewport.guid();

                    matrix = Graph.matrix();

                    // TODO: check this....
                    this.bubble(function(curr){
                        if (curr.guid() == viewportGuid) {
                            return false;
                        }
                        matrix.multiply(curr.matrix());
                    });
                } else {
                    matrix = this.matrix();
                }
                this.cached.matrix = matrix;
            }
            return matrix;
        },

        /**
         * Get global matrix
         */
        matrixCurrent: function() {
            var native = this.node().getCTM();
            var matrix;

            if (native) {
                matrix = new Graph.lang.Matrix(
                    native.a,
                    native.b,
                    native.c,
                    native.d,
                    native.e,
                    native.f
                );
                native = null;
            } else {
                matrix = this.matrix().clone();
            }

            return matrix;
        },

        /**
         * Get/set layout
         */
        layout: function(options) {
            if (options === undefined) {
                return this.graph.layout;
            }

            var clazz, layout;

            options = options == 'default' ? 'layout' : options;

            if (_.isString(options)) {
                clazz = Graph.layout[_.capitalize(options)];
                layout = Graph.factory(clazz, [this]);
            } else if (_.isPlainObject(options)) {
                if (options.name) {
                    clazz = Graph.layout[_.capitalize(options.name)];
                    delete options.name;
                    layout = Graph.factory(clazz, [this, options]);
                }
            }

            layout.refresh();
            this.graph.layout = layout;

            return this;
        },

        reset: function() {
            this.graph.matrix = Graph.matrix();
            this.removeAttr('transform');
            this.props.rotate = 0;
            this.props.scale = 0;

            this.dirty(true);
            this.fire('reset', this.props);
        },

        invalidate: function(cache) {
            this.cached[cache] = null;
        },

        /**
         * Get/set state
         */
        state: function(name) {
            if (name === undefined) {
                return this.props.state;
            }
            this.props.state = name;
            return this;
        },

        /**
         * Get/set dirty
         */
        dirty: function(state) {
            var me = this;

            if (state === undefined) {
                return me.cached.bbox === null;
            }

            if (state) {
                // invalidates
                for (var name in this.cached) {
                    me.cached[name] = null;
                }

                // update core plugins
                var plugins = ['resizer', 'rotator', 'network'];

                _.forEach(plugins, function(name){
                    if (me.plugins[name]) {
                        me.plugins[name].invalidate();
                    }
                });
            }

            return this;
        },

        /**
         * Get/set reactor plugin
         */
        interactable: function(options) {
            if ( ! this.plugins.reactor) {
                this.plugins.reactor = new Graph.plugin.Reactor(this, options);
            }
            return this.plugins.reactor;
        },

        /**
         * Get/set animator plugin
         */
        animable: function() {
            var me = this;

            if ( ! me.plugins.animator) {
                me.plugins.animator = new Graph.plugin.Animator(me);
                me.plugins.animator.on({
                    animstart: function(e) {
                        me.fire(e);
                    },
                    animating: function(e) {
                        me.fire(e);
                    },
                    animend: function(e) {
                        me.fire(e);
                    }
                })
            }

            return me.plugins.animator;
        },

        /**
         * Get/set resizer plugin
         */
        resizable: function(options) {
            if ( ! this.plugins.resizer) {
                this.plugins.resizer = new Graph.plugin.Resizer(this, options);
                this.plugins.resizer.on({
                    beforeresize: _.bind(this.onResizerBeforeResize, this),
                    afterresize: _.bind(this.onResizerAfterResize, this)
                });
            } else if (options !== undefined) {
                this.plugins.resizer.options(options);
            }

            return this.plugins.resizer;
        },

        rotatable: function(options) {
            if ( ! this.plugins.rotator) {
                this.plugins.rotator = new Graph.plugin.Rotator(this, options);
                this.plugins.rotator.on({
                    afterrotate: _.bind(this.onRotatorAfterRotate, this)
                });
            }
            return this.plugins.rotator;
        },

        /**
         * Get/set dragger plugin
         */
        draggable: function(config) {
            if ( ! this.plugins.dragger) {
                this.plugins.dragger = new Graph.plugin.Dragger(this, config);

                this.plugins.dragger.on({
                    beforedrag: _.bind(this.onDraggerStart, this),
                    drag: _.bind(this.onDraggerMove, this),
                    afterdrag: _.bind(this.onDraggerEnd, this)
                });
            }
            return this.plugins.dragger;
        },

        /**
         * Get/set panzoom plugin
         */
        zoomable: function() {
            if ( ! this.plugins.panzoom) {
                this.plugins.panzoom = new Graph.plugin.Panzoom(this);
                this.plugins.toolmgr.register('panzoom');
            }
            return this.plugins.panzoom;
        },

        /**
         * Get/set dropzone plugin
         */
        droppable: function() {
            if ( ! this.plugins.dropper) {
                this.plugins.dropper = new Graph.plugin.Dropper(this);

                this.plugins.dropper.on({
                    dropenter: _.bind(this.onDropperEnter, this),
                    dropleave: _.bind(this.onDropperLeave, this)
                });
            }
            return this.plugins.dropper;
        },

        /**
         * Get/set network plugin
         */
        connectable: function(options) {
            if ( ! this.plugins.network) {
                this.plugins.network = new Graph.plugin.Network(this, options);
            } else if (options !== undefined) {
                this.plugins.network.options(options);
            }
            return this.plugins.network;
        },

        /**
         * Get/set traversable
         */
        traversable: function(traversable) {
            if (traversable === undefined) {
                return this.props.traversable;
            }

            this.props.traversable = traversable;
            return this;
        },

        /**
         * Get/set selectable
         */
        selectable: function(selectable) {
            if (selectable === undefined) {
                return this.props.selectable;
            }

            this.props.selectable = selectable;
            return this;
        },

        /**
         * Get/set clickable
         */
        clickable: function(clickable) {
            if (clickable === undefined) {
                return this.attrs['pointer-events'] != 'none' ? true : false;
            }

            this.attr('pointer-events', (clickable ? '' : 'none'));
            return this;
        },

        /**
         * Get/set label editor plugin
         */
        editable: function(options) {
            var me = this;
            if ( ! this.plugins.editor) {
                this.plugins.editor = new Graph.plugin.Editor(this, options);
                this.plugins.editor.on({
                    beforeedit: function(e){
                        me.fire(e);
                    },
                    edit: function(e) {
                        me.fire(e);
                    }
                });
            }
            return this.plugins.editor;
        },

        snappable: function(options) {
            var me = this,
                paper = me.paper();

            var enabled, snapper;

            if (_.isBoolean(options)) {
                options = {
                    enabled: options
                };
            } else {
                options = _.extend({
                    enabled: true
                }, options || {});
            }

            me.props.snappable = options.enabled;

            if ( ! paper) {
                paper = Graph.svg.Paper.getDefaultInstance();
                snapper = paper.plugins.snapper;
                
                me.on('render', function(){
                    me.paper().plugins.snapper.setup(me, options);
                });
            } else {
                snapper = paper.plugins.snapper;
            }
            
            // still no exists?
            if ( ! paper) {
                throw Graph.error("Unable to install snapper plugin. Paper doesn't rendered yet!");
            }

            return snapper;
        },

        id: function() {
            return this.props.id;
        },

        guid: function() {
            return this.props.guid;
        },

        node: function() {
            return this.elem.node();
        },

        data: function(name, value) {
            var me = this;

            if (_.isPlainObject(name)) {
                _.forOwn(name, function(v, k){
                    me.props[k] = v;
                });
                return this;
            }

            if (name === undefined && value === undefined) {
                return me.props;
            }

            if (value === undefined) {
                return me.props[name];
            }

            me.props[name] = value;
            return this;
        },

        /**
         * Element properties
         */
        attr: function(name, value) {

            var me = this, node = me.node();

            if (_.isPlainObject(name)) {
                _.forOwn(name, function(v, k){
                    (function(v, k){
                        me.attr(k, v);
                    }(v, k));
                });
                return me;
            }

            if (name === undefined) {
                return me.attrs;
            }

            if (value === undefined) {
                return me.attrs[name] || '';
            }

            me.attrs[name] = value;

            if (value !== null) {
                if (name.substring(0, 6) == 'xlink:') {
                    node.setAttributeNS(Graph.config.xmlns.xlink, name.substring(6), _.toString(value));
                } else if (name == 'class') {
                    node.className.baseVal = _.toString(value);
                } else {
                    node.setAttribute(name, _.toString(value));
                }
            }

            return me;
        },

        removeAttr: function(name) {
            this.node().removeAttribute(name);

            if (this.attrs[name]) {
                delete this.attrs[name];
            }
            return this;
        },

        style: function(name, value) {
            var me = this;

            if (_.isPlainObject(name)) {
                _.forOwn(name, function(v, k){
                    me.style(k, v);
                });
                return this;
            }

            this.elem.css(name, value);
            return this;
        },

        // set/get pointer style
        cursor: function(style) {
            this.elem.css('cursor', style);
        },

        hasClass: function(predicate) {
            return _.indexOf(_.split(this.attrs['class'], ' '), predicate) > -1;
        },

        addClass: function(added) {
            var classes = _.chain(this.attrs['class']).split(' ').concat(_.split(added, ' ')).uniq().join(' ').trim().value();
            this.attr('class', classes);
            return this;
        },

        removeClass: function(removed) {
            var classes = _.split(this.attrs['class'], ' '),
                removal = _.isArray(removed) ? removed : _.split(removed, ' ');

            _.pullAll(classes, removal);

            this.attr('class', _.join(classes, ' '));
            return this;
        },

        hide: function() {
            this.elem.hide();
        },

        show: function() {
            this.elem.show();
        },

        /**
         * Get vector path (shape)
         */
        shape: function() {
            var shape = new Graph.lang.Path([]);
            return shape;
        },

        shapeOriginal: function() {
            var shape = this.cached.shapeOriginal;

            if ( ! shape) {
                var vmatrix = this.matrixView(),
                    vrotate = vmatrix.rotate().deg;

                shape = this.shape();

                if (vrotate) {
                    var rmatrix = vmatrix.clone(),
                        rcenter = this.bboxPristine().center().toJson();

                    rmatrix.rotate(-vrotate, rcenter.x, rcenter.y);
                    shape = shape.transform(rmatrix);

                } else {
                    shape = shape.transform(vmatrix);
                }

                this.cached.shapeOriginal = shape;
            }

            return shape;
        },

        /**
         * Get shape relative to viewport
         */
        shapeView: function() {
            var shape = this.cached.shapeView;
            if ( ! shape) {
                var matrix = this.matrixView();
                shape = this.shape().transform(matrix);
                this.cached.shapeView = shape;
            }
            return shape;
        },

        /**
         * Get shape relative to parent
         */
        shapeRelative: function() {
            var parent = this.parent(),
                parentMatrix = parent.matrixView().clone().invert(),
                matrix = this.matrixView().clone(),
                shape = this.shape();

            matrix.multiply(parentMatrix);
            shape = shape.transform(matrix);

            matrix = parentMatrix = parent = null;
            return shape;
        },

        vertices: function(absolute) {
            var ma, pa, ps, dt;

            absolute = _.defaultTo(absolute, false);

            ma = absolute ? this.matrixCurrent() : this.matrix(),
            pa = this.shape().transform(ma);
            ps = pa.segments;
            dt = [];

            _.forEach(ps, function(seg){
                var x, y;
                if (seg[0] != 'Z') {
                    x = seg[seg.length - 2];
                    y = seg[seg.length - 1];
                    dt.push([x, y]);
                }
            });

            return dt;
        },

        dimension: function() {
            var size = {},
                node = this.node();

            try {
                size = node.getBBox();
            } catch(e) {
                size = {
                    x: node.clientLeft,
                    y: node.clientTop,
                    width: node.clientWidth,
                    height: node.clientHeight
                };
            } finally {
                size = size || {};
            }

            return size;
        },

        /**
         * Get absolute position
         */
        offset: function() {
            var node = this.node(),
                bbox = node.getBoundingClientRect();

            var offset = {
                top: bbox.top,
                left: bbox.left,
                bottom: bbox.bottom,
                right: bbox.right,
                width: bbox.width,
                height: bbox.height
            }

            return offset;
        },

        /**
         * Get relative posisition to canvas
         */
        position: function() {
            if ( ! this.cached.position) {
                var node = this.node(),
                    nbox = node.getBoundingClientRect(),
                    pbox = position(node);

                this.cached.position = {
                    top: nbox.top - pbox.top,
                    left: nbox.left - pbox.left,
                    bottom: nbox.bottom - pbox.top,
                    right: nbox.right - pbox.left,
                    width: nbox.width,
                    height: nbox.height
                };
            }

            return this.cached.position;
        },

        /**
         * Get transformed local bbox
         */
        bbox: function() {
            var bbox = this.cached.bbox;
            if ( ! bbox) {
                var path = this.shape(),
                    matrix = this.matrix();

                path = path.transform(matrix);
                bbox = path.bbox();

                this.cached.bbox = bbox;

                path = matrix = null;
            }
            return bbox;
        },

        /**
         * Get untransormed local bbox
         */
        bboxPristine: function() {
            var bbox = this.cached.bboxPristine;
            if ( ! bbox) {
                var shape = this.shape();
                bbox = shape.bbox();
                this.cached.bboxPristine = bbox;
            }
            return bbox;
        },

        /**
         * Get relative bbox (relative to current viewport)
         */
        bboxView: function() {
            var bbox = this.cached.bboxView;

            if ( ! bbox) {
                var matrix = this.matrixView(),
                    shape = this.shape();

                shape = shape.transform(matrix);
                bbox = shape.bbox();
                
                this.cached.bboxView = bbox;
            }

            return bbox;
        },

        bboxOriginal: function() {
            var bbox = this.cached.bboxOriginal;
            if ( ! bbox) {
                var shape = this.shapeOriginal(),
                    rotate = this.matrixView().rotate();

                bbox = shape.bbox();
                bbox.rotate = rotate;
                
                this.cached.bboxOriginal = bbox;
            }
            return bbox;
        },

        find: function(selector) {
            var elems = this.elem.find(selector),
                vectors = [];

            elems.each(function(i, node){
                vectors.push(Graph.registry.vector.get(node));
            });

            return new Graph.collection.Vector(vectors);
        },

        render: function(container, method, sibling) {
            var me = this,
                guid = me.guid(),
                traversable = me.props.traversable;

            var offset;

            if (me.props.rendered) {
                return me;
            }

            container = _.defaultTo(container, me.paper());
            method = _.defaultTo(method, 'append');

            if (container) {

                if (container.isPaper()) {
                    container = container.viewport();
                }

                me.tree.paper = container.tree.paper;

                if (traversable) {
                    me.tree.parent = container.guid();
                }

                switch(method) {
                    case 'before':

                        if ( ! sibling) {
                            throw Graph.error('vector.render(): Sibling vector is undefined')
                        }

                        sibling.elem.query.before(me.elem.query);

                        if (traversable) {
                            offset = container.children().index(sibling);
                            container.children().insert(me, offset);
                        }

                        break;

                    case 'after':

                        if ( ! sibling) {
                            throw Graph.error('vector.render(): Sibling vector is undefined')
                        }

                        sibling.elem.query.after(me.elem.query);

                        if (traversable) {
                            offset = container.children().index(sibling);
                            container.children().insert(me, offset + 1);
                        }

                        break;

                    case 'append':
                        container.elem.query.append(me.elem.query);

                        if (traversable) {
                            container.children().push(me);
                        }

                        break;

                    case 'prepend':
                        container.elem.query.prepend(me.elem.query);

                        if (traversable) {
                            container.children().unshift(me);
                        }

                        break;
                }

                // broadcast
                if (container.props.rendered) {

                    me.props.rendered = true;
                    me.fire('render');

                    var paper = container.isViewport() ? container.paper() : null;

                    if (paper) {
                        Graph.registry.vector.setContext(guid, me.tree.paper);
                    }

                    me.cascade(function(c){
                        if (c !== me && ! c.props.rendered) {
                            c.props.rendered = true;
                            c.tree.paper = me.tree.paper;
                            c.fire('render');

                            if (paper) {
                                Graph.registry.vector.setContext(c.props.guid, me.tree.paper);
                            }
                        }
                    });
                }
            }

            return me;
        },

        children: function() {
            return this.tree.children;
        },

        attach: function(vector, method) {
            if ( ! this.isContainer()) {
                return this;
            }

            method = _.defaultTo(method, 'append');

            if ( ! vector.isRendered()) {
                vector.render(this, method);
            } else {
                var container = this.isPaper() ? this.viewport() : this,
                    traversable = vector.isTraversable();

                if (traversable) {
                    var parent = vector.parent();

                    if (parent) {
                        parent.children().pull(vector);
                        vector.tree.parent = null;
                    }
                }

                container.elem[method](vector.elem);

                if (traversable) {
                    switch(method) {
                        case 'append':
                            container.children().push(vector);
                            break;
                        case 'prepend':
                            container.children().unshift(vector);
                            break;
                    }

                    vector.tree.parent = this.guid();
                }
            }

            return this;
        },

        detach: function() {
            this.elem.detach();
            return this;
        },

        append: function(vector) {
            return this.attach(vector, 'append');
        },

        prepend: function(vector) {
            return this.attach(vector, 'prepend');
        },

        relocate: function(target) {
            if (target.isPaper()) {
                target = target.viewport();
            }

            var resetMatrix = this.matrixView().clone();

            this.graph.matrix = resetMatrix;
            this.attr('transform', resetMatrix.toValue());
            this.dirty(true);

            // append to target
            target.append(this);

            var targetMatrix = target.matrixView().clone(),
                applyMatrix = this.matrix().clone();

            applyMatrix.multiply(targetMatrix.invert());
            
            this.graph.matrix = applyMatrix;
            this.attr('transform', applyMatrix.toValue());

            targetMatrix = applyMatrix = null;

            // flag as dirty
            this.dirty(true);
        },

        ancestors: function() {
            var ancestors = [], guid = this.guid();

            this.bubble(function(curr){
                if (curr.guid() != guid) {
                    ancestors.push(curr);
                }
            });

            return new Graph.collection.Vector(ancestors);
        },

        descendants: function() {
            var descendants = [], guid = this.guid();

            this.cascade(function(curr){
                if (curr.guid() != guid) {
                    descendants.push(curr);
                }
            });

            return new Graph.collection.Vector(descendants);
        },

        paper: function() {
            if (this.isPaper()) {
                return this;
            } else {
                return Graph.registry.vector.get(this.tree.paper);
            }
        },

        parent: function() {
            return Graph.registry.vector.get(this.tree.parent);
        },

        prev: function() {
            return Graph.registry.vector.get(this.tree.prev);
        },

        next: function() {
            return Graph.registry.vector.get(this.tree.next);
        },

        cascade: function(handler) {
            cascade(this, handler);
        },

        bubble: function(handler) {
            return bubble(this, handler);
        },

        remove: function() {
            var parent = this.parent();

            if (this.props.removed) {
                return;
            }
            
            this.props.removed = true;

            this.fire('beforedestroy');
            this.deselect();

            // destroy plugins
            for (var name in this.plugins) {
                if (this.plugins[name]) {
                    this.plugins[name].destroy();
                    this.plugins[name] = null;
                }
            }

            if (parent) {
                parent.children().pull(this);
            }

            if (this.elem) {
                this.elem.remove();
                this.elem = null;
            }

            Graph.registry.vector.unregister(this);

            // last chance
            this.fire('afterdestroy');
            this.listeners = null;
        },

        empty: function() {
            var guid = this.guid();

            this.cascade(function(curr){
                if (curr.guid() != guid) {
                    Graph.registry.vector.unregister(curr);
                }
            });

            this.children().clear();
            this.elem.empty();

            return this;
        },

        select: function() {
            var paper = this.paper(),
                initial = false;
            
            if (paper) {
                var collector = paper.collector();
                collector.add(this);

                if (collector.index(this) === 0) {
                    initial = true;
                }

            } else {
                initial = true;
            }

            this.addClass('graph-selected');
            this.props.selected = true;

            if (initial) {
                if (this.isResizable()) {
                    this.resizable().resume();
                }

                if (this.isRotatable()) {
                    this.rotatable().resume();
                }
            }

            this.fire('select', {
                initial: initial
            });

            return this;
        },

        deselect: function() {
            var paper = this.paper(),
                initial = false;

            if (paper) {
                var collector = paper.collector();
                initial = collector.index(this) === 0 ? true : false;
                collector.remove(this);
            }

            this.removeClass('graph-selected');
            this.props.selected = false;

            if (this.isResizable()) {
                this.resizable().suspend();
            }

            if (this.isRotatable()) {
                this.rotatable().suspend();
            }

            this.fire('deselect', {
                initial: initial
            });
            
            return this;
        },

        collector: function() {
            return this._collector;
        },

        transform: function(command) {
            return this.plugins.transformer.transform(command);
        },

        translate: function(dx, dy) {
            return this.plugins.transformer.translate(dx, dy);
        },

        scale: function(sx, sy, cx, cy) {
            if (sx === undefined) {
                return this.matrixCurrent().scale();
            }
            return this.plugins.transformer.scale(sx, sy, cx, cy);
        },

        rotate: function(deg, cx, cy) {
            return this.plugins.transformer.rotate(deg, cx, cy);
        },

        animate: function(params, duration, easing, callback) {
            if (this.plugins.animator) {
                this.plugins.animator.animate(params, duration, easing, callback);
                return this.plugins.animator;
            }
            return null;
        },

        label: function(label) {
            this.elem.text(label);
            return this;
        },

        sendToFront: function() {
            if ( ! this.tree.paper) {
                return this;
            }
            this.paper().elem.append(this.elem);
            return this;
        },

        sendToBack: function() {
            if ( ! this.tree.paper) {
                return this;
            }
            this.paper().elem.prepend(this.elem);
            return this;
        },

        resize: function(sx, sy, cx, cy, dx, dy) {
            return this;
        },

        isContainer: function() {
            return this.isGroup() || this.isPaper();
        },

        isGroup: function() {
            return this.props.type == 'g';
        },

        isPaper: function() {
            return this.props.type == 'svg';
        },

        isViewport: function() {
            return this.props.viewport === true;
        },

        isTraversable: function() {
            return this.props.traversable;
        },

        isSelectable: function() {
            return this.props.selectable;
        },

        isDraggable: function() {
            return this.plugins.dragger !== null;
        },

        isResizable: function() {
            return this.plugins.resizer !== null;
        },

        isRotatable: function() {
            return this.plugins.rotator !== null;
        },

        isConnectable: function() {
            return this.plugins.network ? true : false;
        },

        isSnappable: function() {
            return this.props.snappable;
        },

        isRendered: function() {
            return this.props.rendered;
        },

        isSelected: function() {
            return this.props.selected === true;
        },

        ///////// TOOLS //////////

        tool: function() {
            return this.plugins.toolmgr;
        },

        toString: function() {
            return 'Graph.svg.Vector';
        },

        ///////// OBSERVERS /////////

        onResizerBeforeResize: function(e) {
            this.fire(e);
        },

        onResizerAfterResize: function(e) {
            this.dirty(true);
            // forward
            this.fire(e);

            // publish
            Graph.topic.publish('vector:afterresize', e);
        },

        onDraggerStart: function(e) {
            e.master = true;
            this.fire(e);
            
            var collector = this.collector();

            if (collector) {
                collector.syncBeforeDrag(this, e);
            }

            // invoke core plugins
            if (this.plugins.resizer) {
                this.plugins.resizer.suspend();
            }

            if (this.plugins.rotator) {
                this.plugins.rotator.suspend();
            }

            if (this.plugins.editor) {
                this.plugins.editor.suspend();
            }
        },

        onDraggerMove: function(e) {
            // forward event
            e.master = true;
            
            var collector = this.collector();

            if (collector) {
                collector.syncDrag(this, e);
            }

            this.fire(e);
        },

        onDraggerEnd: function(e) {
            this.dirty(true);

            e.master = true;
            this.fire(e);

            var collector = this.collector();

            if (collector) {
                collector.syncAfterDrag(this, e);
            }

            Graph.topic.publish('vector:afterdrag', e);
        },

        onDropperEnter: function(e) {
            this.fire(e);
        },

        onDropperLeave: function(e) {
            this.fire(e);
        },

        onTransformerAfterRotate: function(e) {
            this.dirty(true);
            this.props.rotate = e.deg;

            this.fire('afterrotate', {
                deg: e.deg
            });
        },

        onTransformerAfterTranslate: function(e) {
            this.dirty(true);
            this.fire('aftertranslate', {dx: e.dx, dy: e.dy});
        },

        onTransformerAfterScale: function(e) {
            this.dirty(true);
            this.props.scaleX = e.sx;
            this.props.scaleY = e.sy;

            this.fire('afterscale', {sx: e.sx, sy: e.sy});

            if (this.plugins.dragger) {
                var scale = this.matrixCurrent().scale();
                this.plugins.dragger.scale(scale.x, scale.y);
            }
        },

        onRotatorAfterRotate: function(e) {
            this.fire(e);
        },  

        onActivateTool: function(e) {
            var data = e.originalData;
            this.fire('activatetool', data);
        },

        onDeactivateTool: function(e) {
            var data = e.originalData
            this.fire('deactivatetool', data);
        }

    });

    ///////// STATICS /////////

    Vector.guid = 0;

    ///////// LANGUAGE CHECK /////////
    Graph.isVector = function(obj) {
        return obj instanceof Graph.svg.Vector;
    };

    ///////// HELPERS /////////

    function cascade(vector, handler) {
        var child = vector.children().toArray();
        var result;

        result = handler.call(vector, vector);
        result = _.defaultTo(result, true);

        if (result && child.length) {
            _.forEach(child, function(curr){
                cascade(curr, handler);
            });
        }
    }

    function bubble(vector, handler) {
        var parent = vector.parent();
        var result;

        result = handler.call(vector, vector);
        result = _.defaultTo(result, true);

        if (result && parent) {
            bubble(parent, handler);
        }
    }

    function position(node) {
        if (node.parentNode) {
            if (node.parentNode.nodeName == 'svg') {
                return node.parentNode.getBoundingClientRect();
            }
            return position(node.parentNode);
        }

        return {
            top: 0,
            left: 0
        };
    }

}());
