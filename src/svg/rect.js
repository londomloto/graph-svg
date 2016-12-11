
(function(){

    Graph.svg.Rect = Graph.extend(Graph.svg.Vector, {
        
        constructor: function(x, y, width, height, r) {
            var me = this;
            r = _.defaultTo(r, 6);

            // me.$super('rect', {
            //     x: _.defaultTo(x, 0),
            //     y: _.defaultTo(y, 0),
            //     rx: r,
            //     ry: r,
            //     width: _.defaultTo(width, 0),
            //     height: _.defaultTo(height, 0)
            // });

            me.superclass.prototype.constructor.call(me, 'rect', {
                x: _.defaultTo(x, 0),
                y: _.defaultTo(y, 0),
                rx: r,
                ry: r,
                width: _.defaultTo(width, 0),
                height: _.defaultTo(height, 0)
            });
            
            me.origpath = me.shape();
        },

        attr: function(name, value) {
            var result = this.superclass.prototype.attr.apply(this, [name, value]);

            if (name == 'rx' && value !== undefined) {
                this.attrs.r = this.attrs.rx;    
            }

            return result;
        },

        shape: function() {
            var a = this.attrs, p;

            if (a.r) {
                p = Graph.path([
                    ['M', a.x + a.r, a.y], 
                    ['l', a.width - a.r * 2, 0], 
                    ['a', a.r, a.r, 0, 0, 1, a.r, a.r], 
                    ['l', 0, a.height - a.r * 2], 
                    ['a', a.r, a.r, 0, 0, 1, -a.r, a.r], 
                    ['l', a.r * 2 - a.width, 0], 
                    ['a', a.r, a.r, 0, 0, 1, -a.r, -a.r], 
                    ['l', 0, a.r * 2 - a.height], 
                    ['a', a.r, a.r, 0, 0, 1, a.r, -a.r], 
                    ['z']
                ]);
            } else {
                p = Graph.path([
                    ['M', a.x, a.y], 
                    ['l', a.width, 0], 
                    ['l', 0, a.height], 
                    ['l', -a.width, 0], 
                    ['z']
                ]);
            }

            return p;
        },
        
        resize: function(sx, sy, cx, cy, dx, dy) {
            var matrix = this.matrix().clone(),
                rotate = matrix.rotate().deg;

            var x, y, w, h;

            matrix.scale(sx, sy, cx, cy);

            this.reset();

            x = matrix.x(this.attrs.x, this.attrs.y);
            y = matrix.y(this.attrs.x, this.attrs.y);
            w = this.attrs.width  * sx;
            h = this.attrs.height * sy;

            this.attr({
                x: x,
                y: y,
                width: w,
                height: h
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
            return 'Graph.svg.Rect';
        }
    });

    ///////// STATIC /////////

}());