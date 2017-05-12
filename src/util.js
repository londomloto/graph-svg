
(function(){

    var REGEX_PATH_STR = /([achlmrqstvz])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig;
    var REGEX_PATH_VAL = /(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/ig;
    var REGEX_PATH_CMD = /,?([achlmqrstvxz]),?/gi;
    var REGEX_POLY_STR = /(\-?[0-9.]+)\s*,\s*(\-?[0-9.]+)/g;
    var REGEX_TRAN_STR = /((matrix|translate|rotate|scale|skewX|skewY)*\((\-?\d+\.?\d*e?\-?\d*[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+\))+/g;
    var REGEX_TRAN_SUB = /[\w\.\-]+/g;
    var REGEX_POLY_STR = /(\-?[0-9.]+)\s*,\s*(\-?[0-9.]+)/g;
    
    var CONVEX_RADIUS  = 10;
    var SMOOTH_RADIUS  = 6;

    /**
     * Legendre Gauss (Quadratic Curve)
     * https://pomax.github.io/bezierinfo/legendre-gauss.html
     */
    
    var LEGENDRE_N = 12;
    var LEGENDRE_T = [-0.1252, 0.1252, -0.3678, 0.3678, -0.5873, 0.5873, -0.7699, 0.7699, -0.9041, 0.9041, -0.9816, 0.9816];
    var LEGENDRE_C = [ 0.2491, 0.2491,  0.2335, 0.2335,  0.2032, 0.2032,  0.1601, 0.1601,  0.1069, 0.1069,  0.0472, 0.0472];
    
    Graph.util = {
        
        // --------MATH-------- //
        
        deg: function(rad) {
            return Math.round ((rad * 180 / Math.PI % 360) * 1000) / 1000;
        },  
        
        rad: function(deg) {
            return deg % 360 * Math.PI / 180;
        },
        
        angle: function(a, b) {
            var dx = a.x - b.x,
                dy = a.y - b.y;

            if ( ! dx && ! dy) {
                return 0;
            }

            return (180 + Math.atan2(-dy, -dx) * 180 / Math.PI + 360) % 360;
        },

        theta: function(a, b) {
            var dy = -(b.y - a.y),
                dx =   b.x - a.x;

            var rad, deg;

            if (dy.toFixed(10) == 0 && dx.toFixed(10) == 0) {
                rad = 0;
            } else {
                rad = Math.atan2(dy, dx);
            }

            if (rad < 0) {
                rad = 2 * Math.PI + rad;
            }

            deg = 180 * rad / Math.PI;
            deg = (deg % 360) + (deg < 0 ? 360 : 0);

            return deg;
        },

        taxicab: function(a, b) {
            var dx = a.x - b.x,
                dy = a.y - b.y;
            return dx * dx + dy * dy;
        },

        /**
         * Get vector hypotenuse (magnitude)
         */
        hypo: function(va, vb) {
            return Math.sqrt(va * va + vb * vb);
        },
        
        /**
         * Get sign of number
         */
        sign: function(num) {
            return num < 0 ? -1 : 1;
        },
            
        quadrant: function(x, y) {
            return x >= 0 && y >= 0 ? 1 : (x >= 0 && y < 0 ? 4 : (x < 0 && y < 0 ? 3 : 2));
        },
        
        // slope
        gradient: function(a, b) {
            // parallel
            if (b.x == a.x) {
                return b.y > a.y ? Infinity : -Infinity
            } else if (b.y == a.y) {
                return b.x > a.x ? 0 : -0;
            } else {
                return (b.y - a.y) / (b.x - a.x);
            }
        },
        
        snapValue: function (value, snaps, range) {
            range = _.defaultTo(range, 10);
            
            if (_.isArray(snaps)) {
                var i = snaps.length;
                while(i--) {
                    if (Math.abs(snaps[i] - value) <= range) {
                        return snaps[i];
                    }
                }
            } else {
                snaps = +snaps;
                
                var rem = value % snaps;
                
                if (rem < range) {
                    return value - rem;
                }
                
                if (rem > value - range) {
                    return value - rem + snaps;
                }
            }
            return value;
        },
        
        // --------POINT-------- //
        
        pointbox: function(x, y, padding) {
            if (_.isPlainObject(x)) {
                padding = y;
                y = x.y;
                x = x.x;
            }
            
            padding = padding || 0;
            
            var x1 = x - padding,
                y1 = y - padding,
                x2 = x + padding,
                y2 = y + padding,
                width = x2 - x1,
                height = y2 - y1;
            
            return {
                x: x1,
                y: y1,
                x2: x2,
                y2: y2,
                width: width,
                height: height
            };
        },
        
        pointAlign: function(a, b, treshold) {
            if ( ! a || ! b) {
                return false;
            }
            
            treshold = treshold || 2;
            
            if (Math.abs(a.x - b.x) <= treshold) {
                return 'h';
            };

            if (Math.abs(a.y - b.y) <= treshold) {
                return 'v';
            }

            return false;
        },
        
        pointDistance: function (a, b) {
            if ( ! a || ! b) {
                return -1;
            }
            return Graph.util.hypo((a.x - b.x), (a.y - b.y));
        },
        
        isPointEquals: function (a, b) {
            return a.x == b.x && a.y == b.y;
        },
        
        // http://stackoverflow.com/a/907491/412190
        isPointOnLine: function(a, b, p) {
            if ( ! a || ! b || ! p) {
                return false;
            }
            
            var det = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x),
                dis = Graph.util.pointDistance(a, b);
            
            return Math.abs(det / dis) < 2;
        },
        
        polar2point: function(distance, radian, origin) {
            var x, y, d;

            if (_.isUndefined(origin)) {
                origin = Graph.point(0, 0);
            }

            x = Math.abs(distance * Math.cos(radian));
            y = Math.abs(distance * Math.sin(radian));
            d = Graph.util.deg(radian);

            if (d < 90) {
                y = -y;
            } else if (d < 180) {
                x = -x;
                y = -y;
            } else if (d < 270) {
                x = -x;
            }

            return Graph.point(origin.props.x + x, origin.props.y + y);
        },
        
        // --------BOUNDING-------- //

        isBoxContainsPoint: function(box, p) {
            return p.x >= box.x && p.x <= box.x2 && p.y >= box.y && p.y <= box.y2;
        },

        isBoxIntersect: function(a, b) {
            var fn = Graph.util.isBoxContainsPoint;

            return fn(b, {x: a.x,  y: a.y})  ||
                   fn(b, {x: a.x2, y: a.y})  || 
                   fn(b, {x: a.x,  y: a.y2}) || 
                   fn(b, {x: a.x2, y: a.y2}) || 
                   fn(a, {x: b.x,  y: b.y})  ||
                   fn(a, {x: b.x2, y: b.y})  || 
                   fn(a, {x: b.x,  y: b.y2}) || 
                   fn(a, {x: b.x2, y: b.y2}) || 
                   (a.x < b.x2 && a.x > b.x  ||  b.x < a.x2 && b.x > a.x) && 
                   (a.y < b.y2 && a.y > b.y  ||  b.y < a.y2 && b.y > a.y);
        },

        boxOrientation: function(box1, box2, dx, dy) {
            // treshold
            dx = _.defaultTo(dx, 0);
            dy = _.defaultTo(dy, dx);
            
            var top = box1.y2 + dy <= box2.y,
                rgt = box1.x  - dx >= box2.x2,
                btm = box1.y  - dy >= box2.y2,
                lft = box1.x2 + dx <= box2.x;

            var ver = top ? 'top' : (btm ? 'bottom' : null),
                hor = lft ? 'left' : (rgt ? 'right' : null);

            if (hor && ver) {
                return ver + '-' + hor;
            } else {
                return hor || ver || 'intersect';
            }
        },

        expandBox: function(box, dx, dy) {
            dx = _.defaultTo(dx, 0);
            dy = _.defaultTo(dy, 0);

            box.x  -= dx;
            box.x2 += dx;
            box.y  -= dy;
            box.y2 += dy;
            box.width = box.x2 - box.x;
            box.height = box.y2 - box.y;

            return box;
        },

        groupBox: function(boxes) {
            var x  = [], 
                y  = [], 
                x2 = [], 
                y2 = [];

            if (boxes.length) {
                _.forEach(boxes, function(box){
                    x.push(box.x);
                    y.push(box.y);
                    x2.push(box.x + box.width);
                    y2.push(box.y + box.height);
                });

                x  = _.min(x);
                y  = _.min(y);
                x2 = _.max(x2);
                y2 = _.max(y2);

                return {
                    x: x,
                    y: y,
                    x2: x2,
                    y2: y2,
                    width: (x2 - x),
                    height: (y2 - y)
                };
            } else {
                return {
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 0,
                    width: 0,
                    height: 0
                }
            }
        },
        
        // -------LINE------ //
        
        midpoint: function(a, b) {
            return {
                x: (a.x + b.x) / 2,
                y: (a.y + b.y) / 2
            };
        },
        
        /** 
         * Move point `a` to `b` as far as distance 
         */
        movepoint: function(a, b, distance) {
            var tr =  Graph.util.rad(Graph.util.theta(b, a)),
                dx =  Math.cos(tr) * distance,
                dy = -Math.sin(tr) * distance;
            
            a.x += dx;
            a.y += dy;
            
            return a;
        },
        
        lineBendpoints: function(a, b, dir) {
            var points = [],
                x1 = a.x,
                y1 = a.y,
                x2 = b.x,
                y2 = b.y;
               
            var xm, ym;
            
            dir = dir || 'h:h';
            
            if (dir == 'h:v') {
                points = [
                    { x: x2, y: y1 }
                ];
            } else if (dir == 'v:h') {
                points = [
                    { x: x1, y: y2 }
                ];
            } else if (dir == 'h:h') {
                xm = Math.round((x2 - x1) / 2 + x1);
                points = [
                    { x: xm, y: y1 },
                    { x: xm, y: y2 }
                ];
            } else if (dir == 'v:v') {
                ym = Math.round((y2 - y1) / 2 + y1);
                points = [
                    { x: x1, y: ym },
                    { x: x2, y: ym }
                ];
            } else {
                points = [];
            }
            
            return points;
        },
        
        lineIntersection: function (x1, y1, x2, y2, x3, y3, x4, y4) {
            if (
                Math.max(x1, x2) < Math.min(x3, x4) ||
                Math.min(x1, x2) > Math.max(x3, x4) ||
                Math.max(y1, y2) < Math.min(y3, y4) ||
                Math.min(y1, y2) > Math.max(y3, y4)
            ) {
                return null;
            }

            var nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4),
                ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4),
                denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

            if ( ! denominator) {
                return null;
            }

            var px = nx / denominator,
                py = ny / denominator,
                px2 = +px.toFixed(2),
                py2 = +py.toFixed(2);

            if (
                px2 < +Math.min(x1, x2).toFixed(2) ||
                px2 > +Math.max(x1, x2).toFixed(2) ||
                px2 < +Math.min(x3, x4).toFixed(2) ||
                px2 > +Math.max(x3, x4).toFixed(2) ||
                py2 < +Math.min(y1, y2).toFixed(2) ||
                py2 > +Math.max(y1, y2).toFixed(2) ||
                py2 < +Math.min(y3, y4).toFixed(2) ||
                py2 > +Math.max(y3, y4).toFixed(2)
            ) {
                return null;
            }

            return {
                x: px, 
                y: py
            };
        },
        
        perpendicular: function(a, b, h) {
            var m1, m2, tt, hp;

            m1 = Graph.util.gradient(a, b);
            m2 = m1 === 0 ? 0 : ( -1 / m1 );
            tt = Math.atan(m2);
            // si = Math.sin(tt),
            // co = Math.cos(tt);

            var hp = h * Math.cos(tt);
            // var hy = h * si;

            // find `middle point`
            var mx = (a.x + b.x) / 2,
                my = (a.y + b.y) / 2;

            // find `y` intercept
            var iy = my - (mx * m2)

            var x3 = mx + hp,
                y3 = m2 * x3 + iy;

            return {
                from: {
                    x: mx,
                    y: my
                },
                to: {
                    x: x3,
                    y: y3
                }
            };
        },
        
        // -------SHAPE/PATH------ //
        
        points2path: function (points) {
            var segments = _.map(points, function(p, i){
                var cmd = i === 0 ? 'M' : 'L';
                return [cmd, p.x, p.y];
            });
            return Graph.util.segments2path(segments);
        },
        
        path2points: function(command) {
            var segments = Graph.util.path2segments(command);
            return _.map(segments, function(s, i){
                if (s[0] == 'M' || s[0] == 'L') {
                    return {x: s[1], y: s[2]};
                } else {
                    return {x: s[5], y: s[6]};
                }
            });
        },

        segments2path: function(segments) {
            return _.join(segments || [], ',').replace(REGEX_PATH_CMD, '$1');
        },

        path2segments: function(command) {
            if ( ! command) {
                return [];
            }

            var cached = Graph.lookup('Graph.util', 'path2segments', command),
                sizes = {a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0},
                segments = [];
            
            if (cached.segments) {
                return _.cloneDeep(cached.segments);
            }

            command.replace(REGEX_PATH_STR, function(match, cmd, val){
                var 
                    params = [],
                    name = cmd.toLowerCase();

                val.replace(REGEX_PATH_VAL, function(match, v){
                    if (v) {
                        params.push(+v);
                    }
                });

                if (name == 'm' && params.length > 2) {
                    segments.push(_.concat([cmd], params.splice(0, 2)));
                    name = 'l';
                    cmd = cmd == 'm' ? 'l' : 'L';
                }

                if (name == 'r') {
                    segments.push(_.concat([cmd], params));
                } else while (params.length >= sizes[name]) {
                    segments.push(_.concat([cmd], params.splice(0, sizes[name])));
                    if ( ! sizes[name]) {
                        break;
                    }
                }
            });
            
            cached.segments = _.cloneDeep(segments);
            return segments;
        },

        polygon2dots: function(command) {
            var array = [];
            command.replace(REGEX_POLY_STR, function($0, x, y){
                array.push([_.float(x), _.float(y)]);
            });
            return array;
        },

        polygon2path: function(command) {
            var dots = Graph.util.polygon2dots(command);

            if ( ! dots.length) {
                return 'M0,0';
            }
            
            var command = 'M' + dots[0][0] + ',' + dots[0][1];

            for (var i = 1, ii = dots.length; i < ii; i++) {
                command += 'L' + dots[i][0] + ',' + dots[i][1] + ',';
            }
            
            command  = command.substring(0, command.length - 1);
            command += 'Z';

            return command;
        },

        transform2segments: Graph.memoize(function(command) {
            var valid = {
                matrix: true,
                translate: true,
                rotate: true,
                scale: true,
                skewX: true,
                skewY: true
            };

            command += '';

            var transform = [], matches = command.match(REGEX_TRAN_STR);

            if (matches) {
                _.forEach(matches, function(sub){
                    var args = sub.match(REGEX_TRAN_SUB),
                        name = args.shift();
                    if (valid[name]) {
                        args = _.map(args, function(v){ return +v; })
                        transform.push([name].concat(args));    
                    }
                });  
            }

            return transform;
        }),
        
        // --------CURVE-------- //
        
        curvebox: Graph.memoize(function(x0, y0, x1, y1, x2, y2, x3, y3) {
            var token = _.join(arguments, '_'),
                cached = Graph.lookup('Graph.util', 'curvebox', token);

            token = null;

            if (cached.curvebox) {
                return cached.curvebox;
            }

            var tvalues = [],
                bounds  = [[], []];

            var a, b, c, t, t1, t2, b2ac, sqrtb2ac;

            for (var i = 0; i < 2; ++i) {
                if (i == 0) {
                    b =  6 * x0 - 12 * x1 + 6 * x2;
                    a = -3 * x0 +  9 * x1 - 9 * x2 + 3 * x3;
                    c =  3 * x1 -  3 * x0;
                } else {
                    b =  6 * y0 - 12 * y1 + 6 * y2;
                    a = -3 * y0 +  9 * y1 - 9 * y2 + 3 * y3;
                    c =  3 * y1 -  3 * y0;
                }

                if (Math.abs(a) < 1e-12) {
                    if (Math.abs(b) < 1e-12) {
                        continue;
                    }
                    t = -c / b;
                    if (0 < t && t < 1) {
                        tvalues.push(t);
                    }
                    continue;
                }

                b2ac = b * b - 4 * c * a;
                sqrtb2ac = Math.sqrt(b2ac);
                
                if (b2ac < 0) {
                    continue;
                }
                
                t1 = (-b + sqrtb2ac) / (2 * a);
                
                if (0 < t1 && t1 < 1) {
                    tvalues.push(t1);
                }

                t2 = (-b - sqrtb2ac) / (2 * a);
                
                if (0 < t2 && t2 < 1) {
                    tvalues.push(t2);
                }
            }

            var x, y, j = tvalues.length,
                jlen = j,
                mt;

            while (j--) {
                t = tvalues[j];
                mt = 1 - t;
                bounds[0][j] = (mt * mt * mt * x0) + (3 * mt * mt * t * x1) + (3 * mt * t * t * x2) + (t * t * t * x3);
                bounds[1][j] = (mt * mt * mt * y0) + (3 * mt * mt * t * y1) + (3 * mt * t * t * y2) + (t * t * t * y3);
            }

            bounds[0][jlen] = x0;
            bounds[1][jlen] = y0;
            bounds[0][jlen + 1] = x3;
            bounds[1][jlen + 1] = y3;
            bounds[0].length = bounds[1].length = jlen + 2;

            cached.curvebox = {
                min: {x: Math.min.apply(0, bounds[0]), y: Math.min.apply(0, bounds[1])},
                max: {x: Math.max.apply(0, bounds[0]), y: Math.max.apply(0, bounds[1])}
            };

            return cached.curvebox;
        }),
        
        curveLength: function(x1, y1, x2, y2, x3, y3, x4, y4, t) {
            t = _.defaultTo(t, 1);
            t = t > 1 ? 1 : t < 0 ? 0 : t;

            var h = t / 2,
                sum = 0;

            for (var i = 0; i < LEGENDRE_N; i++) {
                var ct = h * LEGENDRE_T[i] + h,

                    xb = Graph.util.curvePolynom(ct, x1, x2, x3, x4),
                    yb = Graph.util.curvePolynom(ct, y1, y2, y3, y4),
                    co = xb * xb + yb * yb;

                sum += LEGENDRE_C[i] * Math.sqrt(co);
            }

            return h * sum;
        },

        curvePolynom: function(t, n1, n2, n3, n4) {
            var t1 = -3 * n1 + 9 * n2 -  9 * n3 + 3 * n4,
                t2 =  t * t1 + 6 * n1 - 12 * n2 + 6 * n3;
            return t * t2 - 3 * n1 + 3 * n2;
        },
        
        curveInterval: function(x1, y1, x2, y2, x3, y3, x4, y4, length) {

            if (length < 0 || Graph.util.curveLength(x1, y1, x2, y2, x3, y3, x4, y4) < length) {
                return;
            }

            var t = 1,
                step = t / 2,
                t2 = t - step,
                l,
                e = .01;

            l = Graph.util.curveLength(x1, y1, x2, y2, x3, y3, x4, y4, t2);

            while (Math.abs(l - length) > e) {
                step /= 2;
                t2 += (l < length ? 1 : -1) * step;
                l = Graph.util.curveLength(x1, y1, x2, y2, x3, y3, x4, y4, t2);
            }

            return t2;
        },

        pointAtInterval: function(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
            var t1 = 1 - t,
                t13 = Math.pow(t1, 3),
                t12 = Math.pow(t1, 2),
                t2 = t * t,
                t3 = t2 * t,
                x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x,
                y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y,
                mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x),
                my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y),
                nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x),
                ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y),
                ax = t1 * p1x + t * c1x,
                ay = t1 * p1y + t * c1y,
                cx = t1 * c2x + t * p2x,
                cy = t1 * c2y + t * p2y,
                alpha = (90 - Math.atan2(mx - nx, my - ny) * 180 / Math.PI);
            
            alpha = (90 - Math.atan2(nx - mx, ny - my) * 180 / Math.PI);

            // (mx > nx || my < ny) && (alpha += 180);

            // if (isNaN(x) || isNaN(y)) {
            //     return null;
            // }

            return {
                x: x,
                y: y,
                m: {x: mx, y: my},
                n: {x: nx, y: ny},
                start: {x: ax, y: ay},
                end:   {x: cx, y: cy},
                alpha: alpha
            };
        },

        curveIntersection: function(a, b, count) {
            var bon1 = Graph.util.curvebox.apply(null, a),
                bon2 = Graph.util.curvebox.apply(null, b),
                nres = 0,
                ares = [];

            var box1 = {x: bon1.min.x, y: bon1.min.y, x2: bon1.max.x, y2: bon1.max.y},
                box2 = {x: bon2.min.x, y: bon2.min.y, x2: bon2.max.x, y2: bon2.max.y};
                
            if ( ! Graph.util.isBoxIntersect(box1, box2)) {
                return count ? 0 : [];
            }

            var l1 = Graph.util.curveLength.apply(null, a),
                l2 = Graph.util.curveLength.apply(null, b);
            
            var // n1 = ~~(l1 / 8),
                // n2 = ~~(l2 / 8),
                n1 = ~~(l1 / 10),
                n2 = ~~(l2 / 10),
                dots1 = [],
                dots2 = [],
                xy = {};

            var i, j, t, p;

            for (i = 0; i < n1 + 1; i++) {
                t = i / n1;
                p = Graph.util.pointAtInterval.apply(null, a.concat([t]));
                dots1.push({x: p.x, y: p.y, t: t});
            }

            for (i = 0; i < n2 + 1; i++) {
                t = i / n2;
                p = Graph.util.pointAtInterval.apply(null, b.concat([t]));
                dots2.push({x: p.x, y: p.y, t: t});
            }

            for (i = 0; i < n1; i++) {
                for (j = 0; j < n2; j++) {

                    var di  = dots1[i],
                        di1 = dots1[i + 1],
                        dj  = dots2[j],
                        dj1 = dots2[j + 1],
                        ci  = Math.abs(di1.x - di.x) < .001 ? 'y' : 'x',
                        cj  = Math.abs(dj1.x - dj.x) < .001 ? 'y' : 'x',
                        is  = Graph.util.lineIntersection(di.x, di.y, di1.x, di1.y, dj.x, dj.y, dj1.x, dj1.y);
                    
                    if (is) {
                        
                        if (xy[is.x.toFixed(4)] == is.y.toFixed(4)) {
                            continue;
                        }

                        xy[is.x.toFixed(4)] = is.y.toFixed(4);
                        
                        var t1 = di.t + Math.abs((is[ci] - di[ci]) / (di1[ci] - di[ci])) * (di1.t - di.t),
                            t2 = dj.t + Math.abs((is[cj] - dj[cj]) / (dj1[cj] - dj[cj])) * (dj1.t - dj.t);
                        
                        if (t1 >= 0 && t1 <= 1.001 && t2 >= 0 && t2 <= 1.001) {
                            nres++;
                            // ares.push(is);
                            ares.push({
                                x: is.x,
                                y: is.y,
                                t1: t1,
                                t2: t2
                            });
                        }
                    }

                }
            }

            return count ? nres : ares;
        },
        
        convexSegment: function(point, prev, next, radius) {
            if ( ! prev || ! next || ! point) {
                return null;
            }
            
            var d1 = Graph.util.pointDistance(point, prev),
                d2 = Graph.util.pointDistance(point, next);
                
            radius = radius || CONVEX_RADIUS;
            
            if (d1 > radius && d2 > radius) {
                
                var c1 = Graph.util.movepoint({x: point.x, y: point.y}, prev, -radius / 2),
                    c2 = Graph.util.movepoint({x: point.x, y: point.y}, next, -radius / 2),
                    dr = Graph.util.pointAlign(prev, next, radius / 2);
                
                var cp;
                
                if (dr == 'h') {
                    cp = {
                        x: point.x - radius, 
                        y: point.y
                    };
                } else {
                    c1.y = prev.y;
                    c2.y = next.y;
                    cp = {
                        x: point.x, 
                        y: point.y - radius
                    };
                }
                
                return [
                    ['L', c1.x, c1.y],
                    ['Q', cp.x, cp.y, c2.x, c2.y]
                ];
            }
            
            return null;
        },
        
        smoothSegment: function(point, prev, next, radius) {
            if ( ! prev || ! next || ! point) {
                return null;
            }
            
            var d1 = Graph.util.pointDistance(point, prev),
                d2 = Graph.util.pointDistance(point, next);
                
            radius = radius || SMOOTH_RADIUS;
            
            if (d1 > radius && d2 > radius) {
                var c1 = Graph.util.movepoint({x: point.x, y: point.y}, prev, -radius),
                    c2 = Graph.util.movepoint({x: point.x, y: point.y}, next, -radius);
                    
                return [
                    ['L', c1.x, c1.y],
                    ['Q', point.x, point.y, c2.x, c2.y]
                ]
            }
            
            return null;
        }
        
    };

}());