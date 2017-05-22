
(function(){

    var MIN_BOX_WIDTH  = 150,
        MIN_BOX_HEIGHT = 50,
        OFFSET_TRESHOLD = 10;

    var Editor = Graph.plugin.Editor = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null,
            rendered: false,
            suspended: true,
            width: 'auto',
            height: 'auto',
            offset: 'auto',
            align: 'center'
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
            comp.editor.css('text-align', this.props.align);
            
            comp.editor.on('keydown', function(e){
                switch(e.keyCode) {
                    case Graph.event.ENTER:
                        me.commit();
                        break;
                    case Graph.event.DELETE:
                    case Graph.event.SHIFT:
                        e.stopPropagation();
                        break;

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
                Graph.topic.unsubscribe('paper:beforezoom', this.editing.commitHandler);
                Graph.topic.unsubscribe('paper:beforescroll', this.editing.commitHandler);
                Graph.topic.unsubscribe('vector:pointerdown', this.editing.commitHandler);

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
                matrix = vector.matrixCurrent(),
                scale  = matrix.scale();

            var vbox = vector.bbox().clone().transform(matrix).toJson();
            var left, top, width, height;
            
            width  = vbox.width;
            height = vbox.height;
            left = vbox.x;
            top  = vbox.y;

            if (this.props.width != 'auto') {
                width = Math.max(this.props.width, MIN_BOX_WIDTH);
                width = Math.max(width * scale.x, width);
                left = vbox.x;
            } else {
                width = width - 8 * scale.x;
                left = left + 4 * scale.x;
            }   

            if (this.props.height != 'auto') {
                height = Math.max(this.props.height, MIN_BOX_HEIGHT);
                height = Math.max(height * scale.y, height);
                top = vbox.y;
            } else {
                height = height - 8 * scale.y;
                top = top + 4 * scale.y;
            }

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

            vector.deselect();

            if (vector.paper()) {
                if (vector.paper().tool().current() == 'linker') {
                    vector.paper().tool().activate('panzoom');
                }        
            }

            me.fire('beforeedit');
            me.resume();

            if (e && this.props.offset == 'pointer') {
                var editor = me.components.editor,
                    paper = vector.paper(),
                    layout = paper.layout(),
                    scale = layout.scale();

                var offset, coords, screen;

                if (paper) {
                    offset = paper.position();
                    coords = layout.pointerLocation(e);
                    
                    if (this.props.align == 'center') {
                        screen = {
                            x: e.clientX - offset.left,
                            y: e.clientY - offset.top
                        };

                        editor.css({
                            left: screen.x - editor.width() / 2,
                            top: screen.y - editor.height() / 2
                        });
                    } else {
                        screen = vector.bboxView().toJson();
                        screen = layout.screenLocation({x: screen.x, y: screen.y});

                        editor.css({
                            left: screen.x - offset.left,
                            top: screen.y - offset.top
                        });
                    }

                    editor.focus(true);

                    me.cached.left = coords.x;
                    me.cached.top  = coords.y;
                }
            }

            if ( ! me.editing.commitHandler) {
                me.editing.commitHandler = function() {
                    me.commit();
                };

                Graph.topic.subscribe('paper:beforezoom', me.editing.commitHandler);
                Graph.topic.subscribe('paper:beforescroll', me.editing.commitHandler);
                Graph.topic.subscribe('vector:pointerdown', me.editing.commitHandler);
            }
        },

        onDoubleTap: function(e) {
            this.startEdit(e);
            e.preventDefault();
        },

        destroy: function() {
            if (this.editing.commitHandler) {
                Graph.topic.unsubscribe('paper:beforezoom', this.editing.commitHandler);
                Graph.topic.unsubscribe('paper:beforescroll', this.editing.commitHandler);
                Graph.topic.unsubscribe('vector:pointerdown', this.editing.commitHandler);

                this.editing.commitHandler = null;
            }

        },

        toString: function() {
            return 'Graph.plugin.Editor';
        }

    });

    ///////// STATICS /////////
    
    

}());