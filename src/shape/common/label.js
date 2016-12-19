
(function(){

    Graph.shape.common.Label = Graph.extend(Graph.shape.Shape, {
        props: {
            label: 'untitled',
            align: 'left',
            fontSize: 16,
            lineHeight: 1.1
        },
        metadata: {
            type: 'common.label',
            icon: 'ion-android-create'
        },
        initComponent: function() {
            var pmgr = this.plugins.manager;
            var shape, block, label;

            shape = (new Graph.svg.Group(this.props.left, this.props.top))
                .selectable(false);

            block = (new Graph.svg.Rect(0, 0, 0, 0, 0))
                .data('text', this.props.label)
                .render(shape);

            block.style({
                fill: 'rgba(255,255,255,0)',
                'stroke-width': 0
            });

            block.elem.data(Graph.string.ID_SHAPE, this.guid());

            pmgr.install('dragger', block, {cls: Graph.styles.SHAPE_DRAG});
            pmgr.install('editor',  block, {width: 300, height: 75, align: 'left', offset: 'pointer'});

            block.on('edit.shape', _.bind(this.onLabelEdit, this));
            block.on('afterdrag.shape', _.bind(this.onAfterDrag, this));
            block.on('select.shape', _.bind(this.onSelect, this));
            block.on('deselect.shape', _.bind(this.onDeselect, this));
            block.on('beforedestroy.shape',    _.bind(this.onBeforeDestroy, this));
            block.on('afterdestroy.shape',    _.bind(this.onAfterDestroy, this));

            label = (new Graph.svg.Text(0, (this.props.lineHeight * this.props.fontSize) , this.props.label))
                .attr('font-size', this.props.fontSize)
                .attr('text-anchor', this.props.align)
                .clickable(false)
                .selectable(false)
                .render(shape);

            label.on('render.shape', _.bind(this.onLabelRender, this));

            _.assign(this.components, {
                shape: shape.guid(),
                block: block.guid(),
                label: label.guid()
            });
        },

        initMetadata: function() {
            this.metadata.tools = [
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

        refresh: _.debounce(function() {
            if (this.layout.suspended) {
                return;
            }

            var label = this.component('label'),
                block = this.component('block');

            label.write(this.props.label);
            label.dirty(true);
            
            var labelBox = label.bbox().toJson();

            block.attr({
                width: labelBox.width
            });

            block.dirty(true);
            
        }, 1),

        toString: function() {
            return 'Graph.shape.common.Label';
        },

        onLabelRender: function() {

            var label = this.component('label'),
                block = this.component('block'),
                labelBox = label.bbox().toJson();

            block.attr({
                width: labelBox.width,
                height: labelBox.height
            });
        },

        onLabelEdit: function(e) {
            var text = e.text;

            if (text) {
                this.component('label').props.text = text;
                this.props.label = text;
                this.refresh();    
            } else {
                this.remove();
            }
        },

        onAfterDrag: function(e) {
            var blockComponent = this.component('block'),
                shapeComponent = this.component('shape'),
                blockMatrix = blockComponent.matrix();

            var shapeMatrix;

            blockComponent.reset();

            shapeComponent.matrix().multiply(blockMatrix);
            shapeComponent.attr('transform', shapeComponent.matrix().toValue());
            shapeComponent.dirty(true);

            shapeMatrix = shapeComponent.matrix();

            this.data({
                left: shapeMatrix.props.e,
                top: shapeMatrix.props.f
            });

            this.fire(e);
        },

        onSelect: function(e) {
            this.component().addClass('label-selected');
            if (e.initial) {
                Graph.topic.publish('shape:select', {shape: this});
            }
        },

        onDeselect: function(e) {
            this.component().removeClass('label-selected');
            if (e.initial) {
                Graph.topic.publish('shape:deselect', {shape: this});
            }
        }
    });

}());