
(function(){

    Graph.svg.Line = Graph.extend(Graph.svg.Vector, {
        
        constructor: function(x1, y1, x2, y2) {
            var args = _.toArray(arguments);

            if (args.length === 1) {
                var start = args[0].start().toJson(),
                    end = args[0].end().toJson();

                x1 = start.x;
                y1 = start.y;
                x2 = end.x;
                y2 = end.y;
            } else if (args.length === 2) {
                if (Graph.isPoint(args[0])) {
                    x1 = args[0].props.x;
                    y1 = args[0].props.y;
                    x2 = args[1].props.x;
                    y2 = args[1].props.y;
                } else {
                    x1 = args[0].x;
                    y1 = args[0].y;
                    x2 = args[1].x;
                    y2 = args[1].y;
                }
                
            }

            // this.$super('line', {
            //     x1: _.defaultTo(x1, 0),
            //     y1: _.defaultTo(y1, 0),
            //     x2: _.defaultTo(x2, 0),
            //     y2: _.defaultTo(y2, 0)
            // });
            
            this.superclass.prototype.constructor.call(this, 'line', {
                x1: _.defaultTo(x1, 0),
                y1: _.defaultTo(y1, 0),
                x2: _.defaultTo(x2, 0),
                y2: _.defaultTo(y2, 0)
            });
        },

        toString: function() {
            return 'Graph.svg.Line';
        }

    });

    ///////// STATIC /////////
    
}());