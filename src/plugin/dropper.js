
(function(){

    Graph.plugin.Dropper = Graph.extend(Graph.plugin.Plugin, {

        props: {
            overlap: 'center',
            accept: '.graph-draggable'
        },

        constructor: function(vector, options) {
            var me = this;

            _.assign(me.props, options || {});
            vector.addClass('graph-dropzone').removeClass('graph-draggable');

            me.props.vector = vector.guid();    
            
            vector.on({
                render: _.bind(me.onVectorRender, me)
            });

            if (vector.props.rendered) {
                me.setup();
            }
        },

        setup: function() {
            var me = this;

            if (me.plugin) {
                return;
            }

            var config = _.extend({}, me.props, {
                checker: _.bind(me.onDropValidate, me),

                ondropactivate: _.bind(me.onDropActivate, me),
                ondropdeactivate: _.bind(me.onDropDeactivate, me),
                ondragenter: _.bind(me.onDragEnter, me),
                ondragleave: _.bind(me.onDragLeave, me),
                ondrop: _.bind(me.onDrop, me)
            });

            me.plugin = me.vector.interactable().dropzone(config);
        },

        onDropValidate: function( edrop, edrag, dropped, dropzone, dropel, draggable, dragel ) {
            return dropped;
            /*if (dropped) {
                if (this.config.validate) {
                    var args = _.toArray(arguments);
                    dropped = this.config.validate.apply(this, args);
                }    
            }
            
            return dropped;*/
        },

        onVectorRender: function() {
            this.setup();
        },

        onDropActivate: function(e) {
            this.vector().addClass('drop-activate');
        },

        onDropDeactivate: function(e) {
            this.vector().removeClass('drop-activate');
        },

        onDragEnter: function(e) {
            this.vector().removeClass('drop-activate').addClass('drop-enter');
            e.type = 'dropenter';
            this.fire(e);
        },

        onDragLeave: function(e) {
            this.vector().removeClass('drop-enter').addClass('drop-activate');
            e.type = 'dropleave';
            this.fire(e);
        },

        onDrop: function(e) {
            this.vector().removeClass('drop-activate drop-enter');
        }
    });

}());