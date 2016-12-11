
(function(){

    Graph.svg.Image = Graph.extend(Graph.svg.Vector, {

        attrs: {
            preserveAspectRatio: 'none'
        },

        constructor: function(src, x, y, width, height) {
            var me = this;

            // me.$super('image', {
            //     'xlink:href': src,
            //     'x': _.defaultTo(x, 0),
            //     'y': _.defaultTo(y, 0),
            //     'width': _.defaultTo(width, 0),
            //     'height': _.defaultTo(height, 0)
            // });
            
            me.superclass.prototype.constructor.call(me, 'image', {
                'xlink:href': src,
                'x': _.defaultTo(x, 0),
                'y': _.defaultTo(y, 0),
                'width': _.defaultTo(width, 0),
                'height': _.defaultTo(height, 0)
            });
            
        },

        align: function(value, scale) {
            if (value == 'none') {
                this.attr('preserveAspectRatio', 'none');

                return this;
            }

            var aspect = this.attrs.preserveAspectRatio,
                align = '';

            aspect = /(meet|slice)/.test(aspect) 
                ? aspect.replace(/(.*)\s*(meet|slice)/i, '$2')
                : '';

            scale = _.defaultTo(scale, aspect);
            value = value.replace(/s+/, ' ').toLowerCase();

            switch(value) {
                case 'top left':
                case 'left top':
                    align = 'xMinYMin';
                    break;
                case 'top center':
                case 'center top':
                    align = 'xMidYMin';
                    break;
                case 'top right':
                case 'right top':
                    align = 'xMaxYMin';
                    break;
                case 'left':
                    align = 'xMinYMid';
                    break;
                case 'center':
                    align = 'xMidYMid';
                    break;
                case 'right':
                    align = 'xMaxYMid';
                    break;
                case 'bottom left':
                case 'left bottom':
                    align = 'xMinYMax';
                    break;
                case 'bottom center':
                case 'center bottom':
                    align = 'xMidYMax';
                    break;
                case 'bottom right':
                case 'right bottom':
                    align = 'xMaxYMax';
                    break;
            }

            aspect = align + (scale ? ' ' + scale : '');
            this.attr('preserveAspectRatio', aspect);

            return this;
        },

        shape: function() {
            var a = this.attrs;

            return new Graph.lang.Path([
                ['M', a.x, a.y], 
                ['l', a.width, 0], 
                ['l', 0, a.height], 
                ['l', -a.width, 0], 
                ['z']
            ]);
        },
        
        resize: function(sx, sy, cx, cy, dx, dy) {
            var ms = this.graph.matrix.clone().scale(sx, sy, cx, cy),
                ro = this.graph.matrix.rotate();

            this.reset();

            var x = ms.x(this.attrs.x, this.attrs.y),
                y = ms.y(this.attrs.x, this.attrs.y),
                w = +this.attrs.width * sx,
                h = +this.attrs.height * sy;

            this.attr({
                x: x,
                y: y,
                width: w,
                height: h
            });
            
            this.rotate(ro, x, y).commit();

            return {
                matrix: ms,
                x: x,
                y: y
            };
        },
        toString: function() {
            return 'Graph.svg.Image';
        }
    });

    ///////// STATIC /////////

}());