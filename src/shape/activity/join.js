
(function(){

    Graph.shape.activity.Join = Graph.extend(Graph.shape.Shape, {
        props: {
            width: 300,
            height: 15,
            left: 0,
            top: 0
        },

        metadata: {
            type: 'activity.join',
            style: 'graph-shape-activity-join'
        },

        initComponent: function() {
            var comp = this.components,
                pmgr = this.plugins.manager;

            var shape, block, label;

            shape = (new Graph.svg.Group(this.props.left, this.props.top))
                .selectable(false);

            block = (new Graph.svg.Rect(0, 0, this.props.width, this.props.height, 0))
                .addClass(Graph.styles.SHAPE_BLOCK)
                .render(shape);

            block.elem.data(Graph.string.ID_SHAPE, this.guid());

            pmgr.install('dragger', block, {ghost: true, cls: Graph.styles.SHAPE_DRAG});
            pmgr.install('resizer', block);
            pmgr.install('snapper', block);
            pmgr.install('network', block, {
                wiring: 'v:v', 
                tuning: false,
                limitIncoming: 0,
                limitOutgoing: 1
            });

            block.on('beforedrag.shape', _.bind(this.onBeforeDrag, this));
            block.on('afterdrag.shape',   _.bind(this.onAfterDrag, this));
            block.on('afterresize.shape',    _.bind(this.onAfterResize, this));
            block.on('beforedestroy.shape',    _.bind(this.onBeforeDestroy, this));
            block.on('afterdestroy.shape',    _.bind(this.onAfterDestroy, this));
            block.on('select.shape',    _.bind(this.onSelect, this));
            block.on('deselect.shape',  _.bind(this.onDeselect, this));
            block.on('connect.shape', _.bind(this.onConnect, this));
            
            label = (new Graph.svg.Text(0, 0, this.props.label))
                .addClass(Graph.styles.SHAPE_LABEL)
                .clickable(false)
                .selectable(false)
                .render(shape);

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();
        },

        refresh: function() {
            if (this.layout.suspended) {
                return;
            }
            
            var block = this.component('block'),
                shape = this.component('shape');

            var bound, matrix;

            bound = block.bbox().toJson();
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toValue());

            block.attr({
                x: 0,
                y: 0
            });

            block.dirty(true);
            block.resizable().redraw();

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

        toString: function() {
            return 'Graph.shape.activity.Join';
        }
    });

    ///////// STATIC /////////

}());
