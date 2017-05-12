
(function(){

    Graph.shape.activity.Router = Graph.extend(Graph.shape.Shape, {

        props: {
            label: 'Route',
            mode: 'xor', // none | parallel | or | xor | complex | event
            width: 100,
            height: 100,
            left: 0,
            top: 0
        },

        metadata: {
            type: 'activity.router',
            icon: Graph.icons.ROUTER_NONE,
            style: 'graph-shape-activity-router'
        },

        constructor: function() {
            if (this.props.mode != 'none') {
                this.props.width = this.props.height = 50;
            }
            this.superclass.prototype.constructor.apply(this, arguments);
        },

        initMetadata: function() {
            this.metadata.tools = [
                {
                    name: 'mode-none',
                    icon: Graph.icons.ROUTER_NONE,
                    title: Graph._('Change to default mode'),
                    enabled: true,
                    handler: _.bind(this.onModeClick, this, _, 'none')
                },
                {
                    name: 'mode-or',
                    icon: Graph.icons.ROUTER_OR,
                    title: Graph._('Change to OR mode'),
                    enabled: true,
                    handler: _.bind(this.onModeClick, this, _, 'or')
                },
                {
                    name: 'mode-xor',
                    icon: Graph.icons.ROUTER_XOR,
                    title: Graph._('Change to XOR mode'),
                    enabled: true,
                    handler: _.bind(this.onModeClick, this, _, 'xor')
                },
                {
                    name: 'mode-parallel',
                    icon: Graph.icons.ROUTER_PARALLEL,
                    title: Graph._('Change to parallel mode'),
                    enabled: true,
                    handler: _.bind(this.onModeClick, this, _, 'parallel')
                },
                {
                    name: 'config',
                    icon: Graph.icons.CONFIG,
                    title: Graph._('Click to config shape'),
                    enabled: true
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
            var comp = this.components,
                pmgr = this.plugins.manager;

            var shape, block, label, mode;

            var points = [
                this.props.width / 2, 0,
                this.props.width, this.props.height / 2,
                this.props.width / 2, this.props.height,
                0, this.props.height / 2
            ];

            var cx = points[0],
                cy = points[3];

            shape = (new Graph.svg.Group(this.props.left, this.props.top))
                .selectable(false);

            block = (new Graph.svg.Polygon(points))
                .addClass(Graph.styles.SHAPE_BLOCK)
                .data('text', this.props.label)
                .render(shape);

            block.elem.data(Graph.string.ID_SHAPE, this.guid());
            
            pmgr.install('dragger', block, {ghost: true, cls: Graph.styles.SHAPE_DRAG});
            pmgr.install('resizer', block);
            pmgr.install('editor',  block);
            pmgr.install('network', block, {wiring: 'v:v'});
            pmgr.install('snapper', block);

            block.on('edit.shape',      _.bind(this.onLabelEdit, this));
            block.on('beforedrag.shape', _.bind(this.onBeforeDrag, this));
            block.on('afterdrag.shape',   _.bind(this.onAfterDrag, this));
            block.on('afterresize.shape',    _.bind(this.onAfterResize, this));
            block.on('beforedestroy.shape',    _.bind(this.onBeforeDestroy, this));
            block.on('afterdestroy.shape',    _.bind(this.onAfterDestroy, this));
            block.on('select.shape',    _.bind(this.onSelect, this));
            block.on('deselect.shape',  _.bind(this.onDeselect, this));
            block.on('connect.shape', _.bind(this.onConnect, this));

            label = (new Graph.svg.Text(cx, cy, this.props.label))
                .addClass(Graph.styles.SHAPE_LABEL)
                .clickable(false)
                .selectable(false)
                .render(shape);

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();

            shape = block = label = null;

            this.mode(this.props.mode);
        },

        mode: function(mode) {
            if (mode === undefined) {
                return this.props.mode;
            }
            
            this.props.mode = mode;

            var inner;

            if (this.props.mode != 'none') {
                
                this.component('label').hide();
                this.component('block').resizable().disable();

                if (this.components.inner) {
                    this.component('inner').remove();
                }

                var shape = this.component();

                switch(mode) {
                    case 'parallel':
                        inner = (new Graph.svg.Path('M 10 25 L 25 25 L 25 40 L 25 25 L 40 25 L 25 25 L 25 10'));
                        break;
                    case 'or':
                        inner = (new Graph.svg.Circle(25, 25, 10));
                        break;
                    case 'xor':
                        inner = (new Graph.svg.Path('M 15 15 L 25 25 L 15 35 L 25 25 L 35 35 L 25 25 L 35 15'));
                        break;
                }

                if (inner) {
                    inner.addClass('comp-inner');
                    inner.selectable(false);
                    inner.clickable(false);
                    inner.render(shape);

                    this.components.inner = inner.guid();
                }
            } else {
                this.component('label').show();
                this.component('block').resizable().enable();

                inner = this.component('inner');

                if (inner) {
                    inner.remove();
                    this.components.inner = null;
                }

            }

            return this;
        },

        width: function(value) {
            if (value === undefined) {
                return this.props.width;
            }

            var box = this.component('block').bbox().toJson(),
                sx = value / this.props.width,
                sy = 1,
                cx = box.x,
                cy = (box.y + box.y2) / 2,
                dx = 0,
                dy = 0;

            this.component('block').resize(sx, sy, cx, cy, dx, dy);
            this.component().dirty(true);

            this.props.width = value;
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

        refresh: function() {
            if (this.layout.suspended) {
                return;
            }

            var block = this.component('block'),
                shape = this.component('shape'),
                label = this.component('label');

            var bound, matrix;

            bound = block.bbox().toJson();
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toValue());

            var points = [
                bound.width / 2, 0,
                bound.width, bound.height / 2,
                bound.width / 2, bound.height,
                0, bound.height / 2
            ];

            block.attr({
                points: _.join(points, ',')
            });

            block.dirty(true);
            block.resizable().redraw();

            label.attr({
                x: bound.width  / 2,
                y: bound.height / 2
            });

            label.wrap(bound.width - 10);

            // update props

            matrix = shape.matrix();

            this.data({
                left: matrix.props.e,
                top: matrix.props.f,
                width: bound.width,
                height: bound.height
            });

            matrix = null;
            bound  = null;
        },

        toString: function() {
            return 'Graph.shape.activity.Router';
        },

        onModeClick: function(e, mode) {
            this.mode(mode);
        }

    });

    ///////// STATIC /////////

}());
