
(function(){

    Graph.svg.Circle = Graph.extend(Graph.svg.Vector, {
        
        constructor: function(cx, cy, r) {
            var me = this;
            
            if (Graph.isPoint(cx)) {
                r  = cy;
                cy = cx.props.y;
                cx = cx.props.x;
            }

            // me.$super('circle', {
            //     cx: cx,
            //     cy: cy,
            //     r: r
            // });

            me.superclass.prototype.constructor.call(me, 'circle', {
                cx: cx,
                cy: cy,
                r: r
            });
            
        },

        shape: function() {
            var a = this.attrs;
            
            return Graph.path([
                ['M', a.cx, a.cy],
                ['m', 0, -a.r],
                ['a', a.r, a.r, 0, 1, 1, 0,  2 * a.r],
                ['a', a.r, a.r, 0, 1, 1, 0, -2 * a.r],
                ['z']
            ]);
        },
        
        resize: function(sx, sy, cx, cy, dx, dy) {
            var matrix = this.graph.matrix.clone(),
                rotate = this.props.rotate,
                ax = this.attrs.cx,
                ay = this.attrs.cy,
                ar = this.attrs.r;

            var x, y, r;
            
            if (sy === 1) {
                r  = ar * sx;
                sy = sx;
            } else if (sx === 1) {
                r  = ar * sy;
                sx = sy;
            } else if (sx < sy) {
                r = ar * sy;
                sx = sy;
            } else if (sx > sy) {
                r  = ar * sx;
                sy = sx;
            }

            matrix.scale(sx, sy, cx, cy);

            x = matrix.x(ax, ay);
            y = matrix.y(ax, ay);

            this.reset();

            this.attr({
                cx: x,
                cy: y,
                 r: r
            });
            
            if (rotate) {
                this.rotate(rotate, x, y).commit();    
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
                    cx: x,
                    cy: y
                }
            };
        },

        toString: function() {
            return 'Graph.svg.Circle';
        }
    });

    ///////// STATIC /////////

}());