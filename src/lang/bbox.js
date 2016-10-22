
(function(){
    
    var BBox = Graph.lang.BBox = Graph.extend({
        
        props: {
            // origin
            x: 0,
            y: 0,

            // corner
            x2: 0,
            y2: 0,

            // dimension
            width: 0,
            height: 0
        },

        constructor: function(bbox) {
            this.props = _.cloneDeep(bbox);
        },
        
        data: function(name, value) {
            if (name === undefined && value === undefined) {
                return this.props;
            }

            if (value === undefined) {
                return this.props[name];
            }

            return null;
        },

        pathinfo: function() {
            var a = this.props;

            return new Graph.lang.Path([
                ['M', a.x, a.y], 
                ['l', a.width, 0], 
                ['l', 0, a.height], 
                ['l', -a.width, 0], 
                ['z']
            ]);
        },

        origin: function() {
            var x = this.props.x, 
                y = this.props.y;

            return Graph.point(x, y);
        },

        center: function(dots) {
            var x = this.props.x + this.props.width / 2,
                y = this.props.y + this.props.height / 2;

            return dots ? {x: x, y: y} : Graph.point(x, y);
        },

        corner: function() {
            var x = this.props.x + this.props.width,
                y = this.props.y + this.props.height;

            return Graph.point(x, y);
        },
        
        width: function() {
            return this.props.width;
        },
        
        height: function() {
            return this.props.height;
        },
        
        clone: function() {
            var props = _.extend({}, this.props);
            return new BBox(props);
        },

        contains: function(obj) {
            var contain = true,
                bbox = this.props,
                dots = [];

            var vbox, papa, mat, dot;

            if (Graph.isPoint(obj)) {
                dots = [
                    [obj.props.x, obj.props.y]
                ];
            } else if (Graph.isVector(obj)) {
                dots = obj.dots(true);
            } else if (Graph.isBBox(obj)) {
                dots = [
                    [obj.props.x, obj.props.y],
                    [obj.props.x2, obj.props.y2]
                ];
            } else {
                var args = _.toArray(arguments);
                if (args.length === 2) {
                    dots = [args];
                }
            }

            if (dots.length) {
                var l = dots.length;
                while(l--) {
                    dot = dots[l];
                    contain = dot[0] >= bbox.x  && 
                              dot[0] <= bbox.x2 && 
                              dot[1] >= bbox.y  && 
                              dot[1] <= bbox.y2;
                    if ( ! contain) {
                        break;
                    }
                }
            }

            return contain;
        },

        expand: function(dx, dy, dw, dh) {
            var ax, ay;
            if (_.isUndefined(dy)) {
                ax = Math.abs(dx);
                
                dx = -ax;
                dy = -ax;
                dw = 2 * ax;
                dh = 2 * ax;
            } else {
                ax = Math.abs(dx);
                ay = Math.abs(dy);

                dx = -ax;
                dy = -ay;
                dw = 2 * ax;
                dh = 2 * ay;
            }
            
            this.props.x += dx;
            this.props.y += dy;
            this.props.width  += dw;
            this.props.height += dh;

            return this;
        },

        transform: function(matrix) {
            var x = this.props.x,
                y = this.props.y;

            this.props.x = matrix.x(x, y);
            this.props.y = matrix.y(x, y);

            x = this.props.x2;
            y = this.props.y2;

            this.props.x2 = matrix.x(x, y);
            this.props.y2 = matrix.y(x, y);

            var scale = matrix.scale();

            this.props.width  *= scale.x;
            this.props.height *= scale.y;

            return this;
        },

        intersect: function(tbox) {
            var me = this,
                bdat = me.props,
                tdat = tbox.toJson();

            return tbox.contains(bdat.x, bdat.y)
                || tbox.contains(bdat.x2, bdat.y)
                || tbox.contains(bdat.x, bdat.y2)
                || tbox.contains(bdat.x2, bdat.y2)
                || me.contains(tdat.x, tdat.y)
                || me.contains(tdat.x2, tdat.y)
                || me.contains(tdat.x, tdat.y2)
                || me.contains(tdat.x2, tdat.y2)
                || (bdat.x < tdat.x2 && bdat.x > tdat.x || tdat.x < bdat.x2 && tdat.x > bdat.x)
                && (bdat.y < tdat.y2 && bdat.y > tdat.y || tdat.y < bdat.y2 && tdat.y > bdat.y);
        },

        sideNearestPoint: function(point) {
            var px = point.props.x,
                py = point.props.y,
                tx = this.props.x,
                ty = this.props.y,
                tw = this.props.width,
                th = this.props.height;

            var distToLeft = px - tx;
            var distToRight = (tx + tw) - px;
            var distToTop = py - ty;
            var distToBottom = (ty + th) - py;
            var closest = distToLeft;
            var side = 'left';

            if (distToRight < closest) {
                closest = distToRight;
                side = 'right';
            }

            if (distToTop < closest) {
                closest = distToTop;
                side = 'top';
            }
            if (distToBottom < closest) {
                closest = distToBottom;
                side = 'bottom';
            }

            return side;
        },

        pointNearestPoint: function(point) {
            if (this.contains(point)) {
                var side = this.sideNearestPoint(point);
                switch (side){
                    case 'right': return Graph.point(this.props.x + this.props.width, point.props.y);
                    case 'left': return Graph.point(this.props.x, point.props.y);
                    case 'bottom': return Graph.point(point.props.x, this.props.y + this.props.height);
                    case 'top': return Graph.point(point.props.x, this.props.y);
                }
            }
            return point.clone().adhereToBox(this);
        },

        toJson: function() {
            return this.props;
        }
    });

    ///////// STATICS /////////
    
    Graph.lang.BBox.toString = function() {
        return 'function(bounds)';
    };

    ///////// EXTENSION /////////
    
    Graph.isBBox = function(obj) {
        return obj instanceof Graph.lang.BBox;
    };

    Graph.bbox = function(bounds) {
        return new Graph.lang.BBox(bounds);
    };
    
}());