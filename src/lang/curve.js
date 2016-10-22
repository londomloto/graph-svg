
(function(){
    
    Graph.lang.Curve = Graph.extend({
        segments: [],
        
        constructor: function(command) {
            this.segments = _.isString(command) ? Graph.util.path2segments(command) : _.cloneDeep(command);
            
            if (this.segments[0][0] != 'M') {
                this.segments.unshift(
                    ['M', this.segments[0][1], this.segments[0][2]]
                );
            }

            if (this.segments.length === 1 && this.segments[0][0] === 'M') {
                var x = this.segments[0][1],
                    y = this.segments[0][2];
                this.segments.push(['C', x, y, x, y, x, y]);
            }
        },

        x: function() {
            return this.segments[1][5];
        },

        y: function() {
            return this.segments[1][6];
        },

        length: function(t) {
            var params = this.segments[0].slice(1).concat(this.segments[1].slice(1)).concat([t]);
            return Graph.util.curveLength.apply(null, params);
        },

        t: function(length) {
            var params = this.segments[0].slice(1).concat(this.segments[1].slice(1)).concat([length]);
            return Graph.util.curveInterval.apply(null, params);
        },

        pointAt: function(t, json) {
            var params = this.segments[0].slice(1).concat(this.segments[1].slice(1)).concat([t]),
                result = Graph.util.pointAtInterval.apply(null, params);

            if (json) {
                return result;
            } else {
                var point = Graph.point(result.x, result.y);
                result.x = result.y = undefined;
                return _.extend(point, result);
            }
        },

        intersection: function(curve, json) {
            var a = this.segments[0].slice(1).concat(this.segments[1].slice(1)),
                b = curve.segments[0].slice(1).concat(curve.segments[1].slice(1)),
                i = Graph.util.curveIntersection(a, b);

            if (json) {
                return i;
            } else {
                var points = _.map(i, function(p){ return Graph.point(p.x, p.y); });
                return points;
            }
        },

        intersectnum: function(curve) {
            var a = this.segments[0].slice(1).concat(this.segments[1].slice(1)),
                b = curve.segments[0].slice(1).concat(curve.segments[1].slice(1));

            return Graph.util.curveIntersection(a, b, true);
        },

        bbox: function() {
            var args = [this.segments[0][1], this.segments[0][2]].concat(this.segments[1].slice(1)),
                bbox = Graph.util.curvebox.apply(null, args);
            return Graph.bbox({
                x: bbox.min.x,
                y: bbox.min.y,
                x2: bbox.max.x,
                y2: bbox.max.y,
                width: bbox.max.x - bbox.min.x,
                height: bbox.max.y - bbox.min.y
            });
        },

        clone: function() {
            var segments = _.cloneDeep(this.segments);
            return new Graph.lang.Curve(segments);
        },

        toString: function() {
            return Graph.util.segments2path(this.segments);
        }
    });
    
    ///////// STATIC /////////
    
    Graph.lang.Curve.toString = function() {
        return "function(command)";
    };  

    ///////// SHORTCUT /////////
    
    Graph.curve = function(command) {
        return new Graph.lang.Curve(command);
    };

}());