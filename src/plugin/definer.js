
(function(){

    Graph.plugin.Definer = Graph.extend(Graph.plugin.Plugin, {
        props: {
            vector: null
        },

        definitions: {

        },

        components: {
            holder: null
        },

        constructor: function(vector) {
            this.props.vector = vector.guid();

            this.components.holder = Graph.$('<defs/>');
            this.components.holder.prependTo(vector.elem);

            if (vector.isPaper()) {
                this.defineArrowMarker('marker-link-end');
                this.defineCircleMarker('marker-link-start-circle');
            }

        },
        
        defineArrowMarker: function(id) {
            if (this.definitions[id]) {
                return this.definitions[id];
            }

            var marker = Graph.$(_.format(
                '<marker id="{0}" refX="{1}" refY="{2}" viewBox="{3}" markerWidth="{4}" markerHeight="{5}" orient="{6}">' + 
                    '<path d="{7}" fill="{8}" stroke-width="{9}" stroke-linecap="{10}" stroke-dasharray="{11}">' + 
                    '</path>'+
                '</marker>',
                id, '11', '10', '0 0 20 20', '10', '10', 'auto',
                'M 1 5 L 11 10 L 1 15 Z', '#000000', '1', 'round', '10000, 1'
            ));

            this.definitions[id] = marker;
            this.components.holder.append(marker);

            return marker;
        },

        defineCircleMarker: function(id) {
            if (this.definitions[id]) {
                return this.definitions[id];
            }

            var marker = Graph.$(_.format(
                '<marker id="{0}" refX="{1}" refY="{2}" viewBox="{3}" markerWidth="{4}" markerHeight="{5}" orient="{6}">' + 
                    '<circle cx="6" cy="6" r="4" fill="none" stroke="#000000" stroke-width="1" />' + 
                '</marker>',
                id, '6', '6', '0 0 20 20', '10', '10', 'auto'
            ));

            this.definitions[id] = marker;
            this.components.holder.append(marker);

            return marker;
        },

        toString: function() {
            return 'Graph.plugin.Definer';
        }
    });

}());