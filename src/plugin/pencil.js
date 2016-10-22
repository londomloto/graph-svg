
(function(){

    Graph.plugin.Pencil = Graph.extend(Graph.plugin.Plugin, {

        paper: null,

        drawing: {
            offset: {
                x: 0, 
                y: 0
            },
            moveHandler: null,
            stopHandler: null
        },

        constructor: function(paper) {
            this.paper = paper;
        },
        
        draw: function() {
            var paper, shape, vendor;
            
            // activate panzoom
            this.paper.tool().activate('panzoom');

            shape = Graph.shape.apply(null, arguments);

            if (shape) {

                shape.render(this.paper);
                shape.move(-500, -500);
                
                this.refresh(shape);
                this.paper.state('drawing');

                vendor = this.paper.interactable().vendor();

                this.drawing.offset = this.paper.layout().offset();
                this.drawing.moveHandler = _.bind(this.onPointerMove, this, _, shape);
                this.drawing.stopHandler = _.bind(this.onPointerStop, this, _, shape);

                vendor.on('move', this.drawing.moveHandler);
                vendor.on('up', this.drawing.stopHandler);    
            }

            return shape;
        },

        refresh: function(shape) {
            var snapping = this.paper.layout().dragSnapping();

            shape.component().cascade(function(comp){
                if (comp.isDraggable()) {
                    comp.draggable().snap(snapping);
                }

                if (comp.isResizable()) {
                    comp.resizable().snap(snapping);
                }
            });

        },

        onPointerMove: function(e, shape) {
            var offset = this.drawing.offset,   
                viewport = this.paper.viewport(),
                coords = Graph.event.relative(e, viewport),
                scale = viewport.scale();

            var x = coords.x - (offset.left / scale.x),
                y = coords.y - (offset.top / scale.y);

            shape.move(x, y);
        },

        onPointerStop: function(e, shape) {
            var vendor = this.paper.interactable().vendor();
            var delay;

            delay = _.delay(_.bind(function(){
                if (this.drawing.moveHandler) {
                    vendor.off('move', this.drawing.moveHandler);    
                    this.drawing.moveHandler = null;
                }

                if (this.drawing.stopHandler) {
                    vendor.off('up', this.drawing.stopHandler);    
                    this.drawing.stopHandler = null;
                }
            }, this), 0);
            
        }

    });

}());