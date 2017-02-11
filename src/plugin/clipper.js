
(function(){

    Graph.plugin.Clipper = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null
        },

        constructor: function(vector) {
            var me = this,
                guid = vector.guid();

            me.props.vector = guid;

            if (vector.isPaper()) {
                vector.on('keycopy', function(e){
                    me.copy();
                });

                vector.on('keypaste', function(e){
                    me.paste();
                });
            }

            me.cached.clips = null;
            me.cached.paste = 1;
        },

        vector: function() {
            return Graph.registry.vector.get(this.props.vector);
        },

        invalidate: function() {
            this.cached.clips = null;
        },

        cut: function() {

        },

        copy: function() {
            var me = this,
                paper = this.vector(),
                selection = paper.collector().collection.toArray().slice();

            me.cached.paste = 1;

            if (selection.length) {
                var clips = [],
                    excludes = { 
                        guid: true,
                        id: true
                    };

                _.forEach(selection, function(vector){
                    var shape = Graph.registry.shape.get(vector);
                    if (shape) {
                        var data = shape.toJson(),
                            clip = {};
                        var key, val;

                        for (key in data.props) {
                            val = data.props[key];
                            if ( ! excludes[key]) {
                                clip[key] = val;
                            }
                        }
                        clips.push(clip);
                    }
                });
                this.cached.clips = clips;
            } else {
                this.cached.clips = null;
            }
        },

        paste: function() {
            var me = this,
                clips = this.cached.clips,
                paper = this.vector(),
                scale = paper.layout().scale(),
                collector = paper.collector();

            if (clips && clips.length) {

                collector.clearCollection();

                _.forEach(clips, function(clip){
                    var prop = _.cloneDeep(clip);  

                    if (prop.left !== undefined) {
                        prop.left += me.cached.paste * 20 / scale.x;
                    }

                    if (prop.top !== undefined) {
                        prop.top += me.cached.paste * 20 / scale.y;
                    }

                    var shape = Graph.factory(Graph.ns(clip.type), [prop]);
                    shape.render(paper);
                    shape.select();
                });

                me.cached.paste++;
            }
        }

    });

}());