
(function(){

    Graph.plugin.Pencil = Graph.extend(Graph.plugin.Plugin, {

        writing: {
            startHandler: null
        },

        constructor: function(vector) {
            this.props.vector = vector.guid();
        },

        enable: function(activator) {
            this.props.enabled = true;
            this.props.activator = activator;

            var vector = this.vector(),
                vendor = vector.interactable().vendor();

            vector.cursor('text');
            vector.state('writing');

            this.writing.startHandler = _.bind(this.onPointerDown, this);
            vendor.on('down', this.writing.startHandler);

        },

        disable: function() {
            this.props.enabled = false;
            var vendor = this.vector().interactable().vendor();
            vendor.off('down', this.writing.startHandler);
            this.writing.startHandler = null;
        },

        toString: function() {
            return 'Graph.plugin.Pencil';
        },

        onPointerDown: function(e) {
            var vector = this.vector();

            if (vector.isPaper()) {
                var offset, options, result;

                offset = vector.layout().pointerLocation(e);
                options = {
                    left: offset.x,
                    top: offset.y
                };

                if ( ! vector.diagram().current()) {
                    vector.diagram().create();
                }
                
                result = vector.diagram().current().drawShape(
                    'Graph.shape.common.Label', 
                    options
                );

                if (result.shape) {
                    var t = _.delay(function(e){
                        clearTimeout(t);
                        t = null;

                        vector.tool().activate('panzoom');
                        result.shape.editable().plugin().startEdit();

                    }, 10);    
                } else {
                    //vector.tool().activate('panzoom');
                }
                
            }
        }

    });

}());