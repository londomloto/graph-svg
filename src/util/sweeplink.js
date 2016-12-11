
(function(){

    var KEY_TRESHOLD = 1e-9;
    var SLOPE_TRESHOLD = .1;
    
    var Sweeplink = Graph.util.Sweeplink = function(links) {
        
        var me = this;
        
        me.points = [];
        me.queue = [];
        me.lines = [];
        me.found = [];
        me.process = [];
        
        _.forEach(links, function(link){
            var dots = me.extract(link);
            Array.prototype.push.apply(me.points, dots);
        });

        _.forEach(me.points, function(p, i){
            if (i % 2) me.lines.push(_.sortBy( [p, me.points[i - 1]], 'y' ));
        });
        
        _.forEach(me.lines, function(d, i){
            if (d[0].x == d[1].x) {
                d[0].x += SLOPE_TRESHOLD;
                d[1].x -= SLOPE_TRESHOLD;
            }

            if (d[0].y == d[1].y) {
                d[0].y -= SLOPE_TRESHOLD;
                d[1].y += SLOPE_TRESHOLD;
            }

            d[0].line = d;
            d[1].line = d;
        });
        
    };

    Sweeplink.prototype.constructor = Sweeplink;

    Sweeplink.prototype.extract = function(link) {
        var segments = link.router.path().curve().segments, 
            dots = [];

        var x, y;
        
        _.forEach(segments, function(s, i){
            var p = i === 0 ? {x: s[1], y: s[2]} : {x: s[5], y: s[6]};
            var q = segments[i + 1];
            
            if (q) {
                
                q = {x: q[5], y: q[6]};
                
                Graph.util.movepoint(p, q, -20);
                Graph.util.movepoint(q, p, -20);

                p.x = Math.round(p.x, 3);
                p.y = Math.round(p.y, 3);

                q.x = Math.round(q.x, 3);
                q.y = Math.round(q.y, 3);

                p.link = link;
                q.link = link;

                p.range = i;
                q.range = i + 1;

                dots.push(p, q);
            }
            
        });

        return dots;
    };

    Sweeplink.prototype.findConvex = function() {
        var me = this, linesByY;
        
        me.queue = createTree(me.points.slice())
            .key(function(d){ return d.y + KEY_TRESHOLD * d.x; })
            .order();
        
        me.found = [];
        me.process = createTree([]);

        for (var i = 0; i < me.queue.length && i < 1000; i++) {
            
            var d = me.queue[i];
            var index, indexA, indexB, minIndex;
            

            if (d.line && d.line[0] == d) {
                d.type = 'insert';
                index = me.process
                    .key(function(e){ return me.intercept(e, d.y - KEY_TRESHOLD / 1000); })
                    .insert(d.line);
                
                me.validate(d.line, me.process[index + 1]);
                me.validate(d.line, me.process[index - 1]);
                
            } else if (d.line) {
                d.type = 'removal';
                index = me.process.findIndex(d.line);
                me.process.remove(d.line);
                
                me.validate(me.process[index - 1], me.process[index]);
            } else if (d.lineA && d.lineB) {
                me.process.key(function(e){ return me.intercept(e, d.y - KEY_TRESHOLD / 1000); });
                
                indexA = me.process.findIndex(d.lineA);
                indexB = me.process.findIndex(d.lineB);
                  
                if (indexA == indexB) indexA = indexA + 1
                  
                me.process[indexA] = d.lineB;
                me.process[indexB] = d.lineA;

                minIndex = indexA < indexB ? indexA : indexB

                me.validate(me.process[minIndex - 1], me.process[minIndex])
                me.validate(me.process[minIndex + 1], me.process[minIndex + 2])
            }
        }
        
        var convex = {};
        
        _.forEach(this.found, function(f){
            
            var routes, rangeStart, rangeEnd, segmentAlign, segmentStart, segmentEnd,
                alignA, alignB, line, link, guid;
            
            alignA = Graph.util.pointAlign(f.lineA[0], f.lineA[1], 10);
            alignB = Graph.util.pointAlign(f.lineB[0], f.lineB[1], 10);
            
            if (alignA != alignB) {
                segmentAlign = alignA == 'v' ? alignA : alignB;
                
                line = alignA == 'v' ? f.lineA : f.lineB;
                link = line[0].link;
                guid = link.guid();
                
                routes = link.router.waypoints();
                
                rangeStart = Math.min(line[0].range, line[1].range),
                rangeEnd   = Math.max(line[0].range, line[1].range);
                
                segmentStart = routes[rangeStart];
                segmentEnd = routes[rangeEnd];
                
                if ( ! convex[guid]) {
                    convex[guid] = {};
                }
                
                if ( ! convex[guid][rangeStart]) {
                    convex[guid][rangeStart] = createTree([])
                        .key(function(c){
                            if (c.segmentAlign == 'v') {
                                if (c.segmentStart.x < c.segmentEnd.x) {
                                    return c.x + c.segmentStart.x;
                                } else {
                                    return c.segmentStart.x - c.x;
                                }
                            } else {
                                if (c.segmentStart.y < c.segmentEnd.y) {
                                    return c.y + c.segmentStart.y;
                                } else {
                                    return c.segmentStart.y - c.y;
                                }
                            }
                        });
                }
                
                convex[guid][rangeStart].insert({
                    x: f.x,
                    y: f.y,
                    link: link.guid(),
                    rangeStart: rangeStart,
                    rangeEnd: rangeEnd,
                    segmentAlign: segmentAlign,
                    segmentStart: segmentStart,
                    segmentEnd: segmentEnd
                });
                
            }
            
        });
        
        return convex;
    };
    
    Sweeplink.prototype.intersect = function(a, b, c, d) {
        var det = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x),
            l   = a.x * b.y - a.y * b.x,
            m   = c.x * d.y - c.y * d.x,
            ix  = (l * (c.x - d.x) - m * (a.x - b.x)) / det,
            iy  = (l * (c.y - d.y) - m * (a.y - b.y)) / det,
            i   = {x: ix, y: iy};

        i.isOverlap = (ix == a.x && iy == a.y) || (ix == b.x && iy == b.y)
        i.isIntersection = ! (a.x < ix ^ ix < b.x) && ! (c.x < ix ^ ix < d.x) && ! i.isOverlap && det
        
        // if (isNaN(i.x)) debugger

        return i;
    };
    
    Sweeplink.prototype.validate = function(a, b) {
        if ( ! a || ! b ) return;
        var i = this.intersect(a[0], a[1], b[0], b[1]);
        
        i.lineA = a;
        i.lineB = b;
        
        if (i.isIntersection) {
            this.found.push(i) && this.queue.insert(i);
        }
    };

    Sweeplink.prototype.intercept = function(line, y) {
        var a = line[0], 
            b = line[1],
            m = (a.y - b.y) / (a.x - b.x);

        return (y - a.y + m * a.x) / m;
    }

    Sweeplink.prototype.destroy = function() {
        this.points = null;
        this.lines = null;
        this.found = null;
        this.queue = null;
        this.process = null;
    };

    ///////// HELPERS /////////
    
    function createTree(array) {
        var key = function(d){ return d; };
        var bisect = _.bisector(function(d){ return key(d); }).left;
        
        array.insert = function(d) {
            var i = array.findIndex(d);
            var v = key(d);
            if (array[i] && v == key(array[i])) return;
            array.splice(i, 0, d);
            return i;
        };

        array.remove = function(d) {
            var i = array.findIndex(d);
            array.splice(i, 1);
            return i;
        };

        array.findIndex = function(d) {
            return bisect(array, key(d));
        };

        array.key = function(f) {
            key = f;
            return array;
        };

        array.swap = function() {

        };

        array.order = function() {
            array.sort(_.ascendingKey(key));
            return array;
        };

        return array;
    }

}());