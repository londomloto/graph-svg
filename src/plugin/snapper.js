
(function(){

    Graph.plugin.Snapper = Graph.extend(Graph.plugin.Plugin, {

        props: {
            enabled: true,
            vector: null
        },

        clients: {

        },

        constructor: function(vector, options) {
            options = options || {};

            if ( ! vector.isPaper()) {
                throw Graph.error("Snapper plugin only available for paper");
            }

            this.props.vector = vector.guid();
            
            this.cached.origins = [];
            this.cached.locations = [];
        },

        subscribe: function(options) {
            var vector = options.vector,
                shield = options.shield,
                guid = vector.guid();

            if (this.clients[guid]) {
                delete this.clients[guid];
            }

            if (options.enabled) {
                this.clients[guid] = {
                    vector: guid,
                    shield: shield.guid()
                };
            }

            console.log(this);
        },

        handlex: function(vector) {
            var guid = vector.guid(),
                listeners = this.handlers[guid];

            if (listeners) {
                vector.off('dragmove', listeners.onTargetMove);
                vector.off('remove', listeners.onTargetRemove);

                delete this.handlers[guid];
            }

            if (vector.isSnappable()) {
                listeners = listeners || {};

                listeners.onTargetMove = _.bind(this.onTargetMove, this);
                listeners.onTargetRemove = _.bind(this.onTargetRemove, this);

                vector.on('dragmove', listeners.onTargetMove);
                this.handlers[guid] = listeners;
            }

        },

        onTargetMove: function(e) {
            
        },

        onTargetRemove: function(e) {

        }

    });

}());