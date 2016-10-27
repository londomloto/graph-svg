
(function(){

    var MIN_BOX_WIDTH  = 150,
        MIN_BOX_HEIGHT = 50,
        OFFSET_TRESHOLD = 10;

    Graph.plugin.Editor = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null,
            rendered: false,
            suspended: true,
            width: 'auto',
            height: 'auto',
            offset: 'auto'
        },

        editing: {
            commitHandler: null
        },

        components: {
            editor: null
        },

        constructor: function(vector, options) {
            var vendor;

            _.assign(this.props, options || {});

            this.props.vector = vector.guid();

            _.assign(this.cached, {
                left: 0,
                top: 0,
                width: 0,
                height: 0
            });

            vendor = vector.interactable().vendor();
            vendor.on('doubletap', _.bind(this.onDoubleTap, this));

            this.initComponent();
        },

        initComponent: function() {
            var me = this, comp = this.components;
            comp.editor = Graph.$('<div class="graph-editor" contenteditable="true"></div>');
            comp.editor.on('keypress', function(e){
                if (e.keyCode === Graph.event.ENTER) {
                    me.commit();
                }
            });
        },
        
        commit: function() {
            var text = this.components.editor.text();
            this.suspend();
            this.vector().props.text = text;

            this.fire('edit', {
                text: text,
                left: this.cached.left,
                top: this.cached.top
            });
        },

        render: function() {
            if (this.props.rendered) {
                this.redraw();
                return;
            }

            this.vector().paper().container().append(this.components.editor);
            this.props.rendered = true;
            this.redraw();
        },

        suspend: function() {
            this.props.suspended = true;
            this.components.editor.detach();

            if (this.editing.commitHandler) {
                Graph.topic.unsubscribe('paper/beforezoom', this.editing.commitHandler);
                Graph.topic.unsubscribe('paper/beforescroll', this.editing.commitHandler);
                this.vector().paper().off('pointerdown', this.editing.commitHandler);
                this.editing.commitHandler = null;
            }
        },

        resume: function() {
            var container;

            if ( ! this.props.rendered) {
                this.render();
            } else {
                if (this.props.suspended) {
                    this.props.suspended = false;
                    container = this.vector().paper().container();
                    container.append(this.components.editor);
                }
                this.redraw();
            }

        },

        redraw: function() {
            var editor = this.components.editor,
                vector = this.vector(),
                matrix = vector.matrix(true),
                scale  = matrix.scale();

            var vbox = vector.bbox().clone().transform(matrix).toJson();
            var left, top, width, height;
            
            width  = vbox.width;
            height = vbox.height;
            left = vbox.x;
            top  = vbox.y;

            if (this.props.width != 'auto') {
                width = Math.max(Math.min(this.props.width, width), MIN_BOX_WIDTH);
                left = vbox.x + (vbox.width - width) / 2;
            }

            if (this.props.height != 'auto') {
                height = Math.max((Math.min(this.props.height, height)), MIN_BOX_HEIGHT);
                top = vbox.y + (vbox.height - height) / 2;
            }

            left = left + 4 * scale.x;
            top = top + 4 * scale.y;
            width = width - 8 * scale.x;
            height = height - 8 * scale.y;

            editor.css({
                left: left,
                top:  top,
                width: width,
                height: height
            });

            _.assign(this.cached, {
                left: left,
                top: top,
                width: width,
                height: height
            });

            editor.text((vector.props.text || ''));
            editor.focus();

            vbox = null;
        },

        startEdit: function(e) {
            var me = this, vector = me.vector();

            if (vector.$collector) {
                vector.$collector.decollect(vector);
            }

            if (vector.paper().tool().current() == 'linker') {
                vector.paper().tool().activate('panzoom');
            }

            me.fire('beforeedit');
            me.resume();

            if (e && this.props.offset == 'pointer') {
                var editor = me.components.editor,
                    paper = vector.paper(),
                    scale = paper.layout().currentScale();

                var offset, coords, left, top;

                if (paper) {
                    offset = paper.offset();
                    coords = paper.layout().grabLocation(e);

                    left = e.clientX - offset.left + (OFFSET_TRESHOLD * scale.x);
                    top = e.clientY - offset.top + (OFFSET_TRESHOLD * scale.y);

                    editor.css({
                        left: left,
                        top: top
                    });

                    me.cached.left = coords.x;
                    me.cached.top = coords.y;
                }
            }

            me.editing.commitHandler = function() {
                me.commit();
            };

            Graph.topic.subscribe('paper/beforezoom', me.editing.commitHandler);
            Graph.topic.subscribe('paper/beforescroll', me.editing.commitHandler);

            vector.paper().on('pointerdown', me.editing.commitHandler);
            vector = null;
        },

        onDoubleTap: function(e) {
            this.startEdit(e);
            e.preventDefault();
        },

        destroy: function() {

        }

    });

}());