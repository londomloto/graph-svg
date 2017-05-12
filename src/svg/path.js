
(function(){

    Graph.svg.Path = Graph.extend(Graph.svg.Vector, {

        constructor: function(d) {
            if ( ! d) {
                d = [['M', 0, 0]];
            }

            if (_.isArray(d)) {
                d = Graph.path(Graph.util.segments2path(d)).absolute().toValue();
            } else if (d instanceof Graph.lang.Path) {
                d = d.toValue();
            } else {
                d = Graph.path(d).absolute().toValue();
            }

            this.superclass.prototype.constructor.call(this, 'path', {
                d: d
            });
        },

        shape: function() {
            return Graph.path(this.attrs.d)
        },

        segments: function() {
            return this.shape().segments;
        },

        intersection: function(path, dots) {
            return this.shape().intersection(path.shape(), dots);
        },

        intersectnum: function(path) {
            return this.shape().intersectnum(path.shape());
        },

        angle: function() {
            var segments = _.clone(this.segments()),
                max = segments.length - 1;

            if (segments[max][0] == 'Z') {
                max--;
                segments.pop();
            }

            if (segments.length === 1) {
                max++;
                segments.push(['L', segments[0][1], segments[0][2]]);
            }

            var dx = segments[max][1] - segments[max - 1][1],
                dy = segments[max][2] - segments[max - 1][2];

            return (180 + Math.atan2(-dy, -dx) * 180 / Math.PI + 360) % 360;
        },

        slice: function(from, to) {
            return this.shape().slice(from, to);
        },

        pointAt: function(length) {
            return this.shape().pointAt(length);
        },

        length: function() {
            return this.shape().length();
        },

        addVertext: function(vertext) {
            var path = this.shape();

            path.addVertext(vertext);
            this.attr('d', path.command());

            return this;
        },
        
        resize: function(sx, sy, cx, cy, dx, dy) {
            var ms = this.matrix().clone(),
                mr = matrix.rotate(),
                ro = mr.deg,
                rd = mr.rad,
                si = Math.sin(rd),
                co = Math.cos(rd),
                pa = this.shape(),
                ps = pa.segments,
                rx = ps[0][1],
                ry = ps[0][2];

            if (ro) {
                ms.rotate(-ro, rx, ry);    
            }
            
            rx = ms.x(ps[0][1], ps[0][2]);
            ry = ms.y(ps[0][1], ps[0][2]);

            ms.scale(sx, sy, cx, cy);

            _.forEach(ps, function(seg){
                var ox, oy, nx, ny;
                if (seg[0] != 'Z') {
                    ox = seg[seg.length - 2];
                    oy = seg[seg.length - 1];

                    nx = ms.x(ox, oy);
                    ny = ms.y(ox, oy);
                    
                    seg[seg.length - 2] = nx;
                    seg[seg.length - 1] = ny;
                }
            });

            this.reset();
            this.attr('d', pa.command());

            if (ro) {
                this.rotate(ro, rx, ry).commit(true);    
            }

            return {
                matrix: ms,
                x: rx,
                y: ry
            };
        },

        moveTo: function(x, y) {
            var path = this.shape();
            
            path.moveTo(x, y);
            this.attr('d', path.command());

            return this;
        },

        lineTo: function(x, y, append) {
            var path = this.shape();
            
            path.lineTo(x, y, append);
            this.attr('d', path.command());

            return this;
        },

        tail: function() {
            var segments = this.segments();
            if (segments.length) {
                return Graph.point(segments[0][1], segments[0][2]);
            }
            return null;
        },

        head: function() {
            var segments = this.segments(), maxs;
            if (segments.length) {
                maxs = segments.length - 1;
                return Graph.point(segments[maxs][1], segments[maxs][2]);
            }
            return null;
        },

        toString: function() {
            return 'Graph.svg.Path';
        }
    });

    ///////// STATIC /////////

}());