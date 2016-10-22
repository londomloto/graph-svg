
(function(){

    Graph.layout.Manhattan = Graph.extend(Graph.layout.Layout, {

        props: {
            router: 'ortho',
            grid: 1
        },

        constructor: function(view, options) {
            // this.$super(view, options);
            this.superclass.prototype.constructor.call(this, view, options);
        },

        refresh: function() {
            this.fire('refresh');
        },

        orientation: function(src, ref) {
            var sbox = src.bbox(),
                rbox = ref.bbox();

            var sori = sbox.origin(true),
                rori = rbox.origin(true);

            var scor = sbox.corner(true),
                rcor = rbox.corner(true);
            
            var top    = scor.y <= rori.y,
                right  = sori.x >= rcor.x,
                bottom = sori.y >= rcor.y,
                left   = scor.x <= rori.x;

            var ver = top  ? 'top'  : (bottom ? 'bottom' : null),
                hor = left ? 'left' : (right ? 'right' : null);

            if (hor && ver) {
                return ver + '-' + hor;
            } else {
                return hor || ver || 'intersect';
            }
        },

        direction: function(orientation, def) {
            switch(orientation) {
                case 'intersect':
                    return null;
                case 'top':
                case 'bottom':
                    return 'v:v';
                case 'left':
                case 'right':
                    return 'h:h';
                default:
                    return def;
            }
        },

        bendpoints: function(start, end, direction) { 
            var x1 = start.props.x,
                y1 = start.props.y,
                x2 = end.props.x,
                y2 = end.props.y,
                bp = [];

            var xm, ym;

            direction = _.defaultTo(direction, 'h:h');

            if (direction == 'h:v') {
                bp = [
                    { x: x2, y: y1 }
                ];
            } else if (direction == 'v:h') {
                bp = [
                    { x: x1, y: y2 }
                ];
            } else if (direction == 'h:h') {
                xm = Math.round((x2 - x1) / 2 + x1);
                bp = [
                    { x: xm, y: y1 },
                    { x: xm, y: y2 }
                ];
            } else if (direction == 'v:v') {
                ym = Math.round((y2 - y1) / 2 + y1);
                bp = [
                    { x: x1, y: ym },
                    { x: x2, y: ym }
                ];
            } else {
                bp = [];
                // throw new Error(
                //     'unknown directions: <' + directions + '>: ' +
                //     'directions must be specified as {a direction}:{b direction} (direction in h|v)');
            }

            return _.map(bp, function(o){
                return Graph.point(o.x, o.y);
            });
        },

        waypoints: function(start, end, direction) {
            var points = [];
            
            if ( ! start.alignment(end)) {
                points = this.bendpoints(start, end, direction);
            }

            points.unshift(start);
            points.push(end);

            return points;
        },

        connect: function(source, target, start, end, opts) {
            var sbox = source.bbox(),
                sdat = sbox.toJson(),
                tbox = target.bbox(),
                tdat = tbox.toJson();

            start = _.defaultTo(start, sbox.center());
            end = _.defaultTo(end, tbox.center());

            var orientation = this.orientation(source, target);
            var direction = this.direction(orientation, 'h:h');
            
            if ( ! direction) {
                return;
            }

            if (direction == 'h:h') {
                switch (orientation) {
                    case 'top-right':
                    case 'right':
                    case 'bottom-right':
                        start = { 
                            original: start, 
                            x: sdat.x, 
                            y: start.props.y 
                        };
                        
                        end = { 
                            original: end, 
                            x: tdat.x + tdat.width, 
                            y: end.props.y 
                        };

                        break;
                    case 'top-left':
                    case 'left':
                    case 'bottom-left':
                        start = { 
                            original: start, 
                            x: sdat.x + sdat.width, 
                            y: start.props.y 
                        };
                        
                        end = { 
                            original: end, 
                            x: tdat.x, 
                            y: end.props.y 
                        };

                        break;
                }
            }

            if (direction == 'v:v') {
                switch (orientation) {
                    case 'top-left':
                    case 'top':
                    case 'top-right':
                        start = { 
                            original: start, 
                            x: start.props.x, 
                            y: sdat.y + sdat.height 
                        };

                        end = { 
                            original: end, 
                            x: end.props.x, 
                            y: tdat.y 
                        };
                        break;
                    case 'bottom-left':
                    case 'bottom':
                    case 'bottom-right':
                        start = { 
                            original: start, 
                            x: start.props.x, 
                            y: sdat.y 
                        };

                        end = { 
                            original: end, 
                            x: end.props.x, 
                            y: tdat.y + tdat.height 
                        };
                        break;
                }
            }

            var spoint = Graph.point(start.x, start.y);
            spoint.original = start.original;

            var epoint = Graph.point(end.x, end.y);
            epoint.original = end.original;

            start = null;
            end = null;
            
            return this.waypoints(spoint, epoint, direction);
        },

        connect: function(source, target) {
            var paper = this.view.paper(),
                router = Graph.factory(
                    Graph.router[_.capitalize(this.props.router)], 
                    [paper, source, target]
                );

            router.route();
        },

        dragSnapping: function() {
            var grid = this.props.grid;

            return {
                mode: 'grid',
                x: grid,
                y: grid
            };
        },

        toString: function() {
            return 'Graph.layout.Manhattan';
        }

    });

}());