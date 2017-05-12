
(function(){

    var Manager = Graph.diagram.Manager = Graph.extend({

        props: {
            paper: null,
            defaultType: 'activity'
        },

        pallets: [],
        diagram: null,
        snapshoot: [],

        constructor: function(paper) {
            this.props.paper = paper.guid();
            paper.on('keynavdown', _.bind(this.onKeynavDown, this));
        },

        paper: function() {
            return Graph.registry.vector.get(this.props.paper);
        },

        deselectAll: function() {
            this.paper().collector().clearCollection();
        },

        removeSelection: function() {
            var selection = this.paper().collector().collection.toArray().slice();
                  
            this.capture();

            _.forEach(selection, function(vector){
                vector.remove();
            });
        },

        capture: function() {
            // capture to snapshoot
            if (this.diagram) {
                // var data = this.diagram.toJson();
                // this.snapshoot = [data];
            }
        },

        undo: function() {
            if (this.snapshoot.length) {
                this.diagram.render(this.snapshoot[0]);
            }
        },

        redo: function() {

        },

        addPallet: function(pallet) {
            var me = this,
                paper = me.paper(),
                layout = paper.layout(),
                scale = layout.scale(),
                drawing = null;

            me.pallets.push(pallet);

            pallet.on({
                pick: function(e) {

                    paper.tool().activate('panzoom');

                    if ( ! me.diagram) {
                        me.create(me.props.defaultType);
                    }

                    var origin = layout.pointerLocation({
                        clientX: e.origin.x,
                        clientY: e.origin.y
                    });

                    var options = {
                        left: origin.x,
                        top: origin.y
                    };

                    var result = me.diagram.drawShape(e.shape, options);
                    
                    if (result.movable) {
                        drawing = result.shape;
                        scale = paper.layout().scale();
                        drawing.component('block').dirty(true);
                        drawing.component().dirty(true);
                    } else {
                        drawing = null;
                        pallet.stopPicking();
                    }

                },
                drag: function(e) {
                    if (drawing) {
                        var dx = e.dx,
                            dy = e.dy;

                        dx /= scale.x;
                        dy /= scale.y;

                        if (scale.x < 1) {
                            dx += scale.x;
                        }

                        drawing.translate(dx, dy);
                    }
                },
                drop: function(e) {
                    if (drawing) {
                        drawing = null;
                    }
                }
            });

        },

        current: function() {
            return this.diagram;
        },

        remove: function() {
            if (this.diagram) {
                this.diagram.remove();
                this.diagram = null;

                this.paper().fire('diagram.destroy');
            }
        },

        create: function(type, options, silent) {
            type = _.defaultTo(this.props.defaultType);

            var clazz = Graph.diagram.type[_.capitalize(type)],
                paper = this.paper();

            this.diagram = Graph.factory(clazz, [paper, options]);
            silent = _.defaultTo(silent, false);

            if ( ! silent) {
                paper.fire('diagram.create', {
                    diagram: this.diagram
                });
            }

            return this.diagram;
        },

        saveAsImage: function(type, filename) {
            var exporter = new Graph.data.Exporter(this.paper());
              
            switch(type) {
                case 'svg':
                    exporter.exportSVG(filename);
                    break;
                case 'png':
                    exporter.exportPNG(filename);
                    break;
                case 'jpg':
                case 'jpeg':
                    exporter.exportJPEG(filename);
                    break;
            }

            exporter = null;
        },

        saveAsFile: function(callback) {
            var exporter = new Graph.data.Exporter(this.paper());
            exporter.exportFile(callback);
            exporter = null;
        },

        saveAsBlob: function(callback) {
            var exporter = new Graph.data.Exporter(this.paper());
            return exporter.exportBlob(callback);
        },

        onKeynavDown: function(e) {
            switch (e.keyCode) {
                case Graph.event.DELETE:
                    this.removeSelection();
                    e.preventDefault();
                    break;
            }
        }

    });

}());