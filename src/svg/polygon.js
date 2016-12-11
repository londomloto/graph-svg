
(function(){

    Graph.svg.Polygon = Graph.extend(Graph.svg.Vector, {
        
        constructor: function(points) {
            points = _.defaultTo(points, '');
            
            if (_.isArray(points)) {
                if (points.length) {
                    if (_.isPlainObject(points[0])) { 
                        points = _.map(points, function(p){ return p.x + ',' + p.y; });
                    }
                    points = _.join(points, ',');
                } else {
                    points = '';
                }
            }

            this.superclass.prototype.constructor.call(this, 'polygon', {
                points: points
            });
        },

        attr: function(name, value) {
            if (name == 'points' && _.isArray(value)) {
                value = _.join(value, ',');
            }
            
            return this.superclass.prototype.attr.call(this, name, value); // this.$super(name, value);
        },

        shape: function() {
            var command = Graph.util.polygon2path(this.attrs.points);
            return Graph.path(command);
        },
        
        resize: function(sx, sy, cx, cy, dx, dy) {
            var matrix = this.graph.matrix.clone(),
                origin = this.graph.matrix.clone(),
                rotate = this.props.rotate,
                ps = this.shape().segments,
                dt = [],
                rx = ps[0][1],
                ry = ps[0][2];

            if (rotate) {
                origin.rotate(-rotate, ps[0][1], ps[0][2]); 
                rx = origin.x(ps[0][1], ps[0][2]);
                ry = origin.y(ps[0][1], ps[0][2]);
            }

            origin.scale(sx, sy, cx, cy);
            matrix.scale(sx, sy, cx, cy);

            _.forEach(ps, function(seg){
                var ox, oy, x, y;
                if (seg[0] != 'Z') {
                    ox = seg[seg.length - 2];
                    oy = seg[seg.length - 1];
                    x = origin.x(ox, oy);
                    y = origin.y(ox, oy);
                    dt.push(x + ',' + y);
                }
            });

            dt = _.join(dt, ' ');

            this.reset();
            this.attr('points', dt);

            if (rotate) {
                this.rotate(rotate, rx, ry).commit();
            }
            
            return {
                matrix: matrix,
                translate: {
                    dx: dx,
                    dy: dy
                },
                scale: {
                    sx: sx,
                    sy: sy,
                    cx: cx,
                    cy: cy
                },
                rotate: {
                    deg: rotate,
                    cx: rx,
                    cy: ry
                }
            };
        },
        toString: function() {
            return 'Graph.svg.Polygon';
        }
    });

    ///////// STATIC /////////

}());