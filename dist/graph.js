
(function(){

    /**
     * Lodash polyfill
     */

    _.float = parseFloat;

    _.gcd = function(array) {
        if (array.length === 2) {
            var a = array[0], b = array[1], t;

            while (b > 0) {
                t = b;
                b = a % b;
                a = t;
            }

            return a;
        } else {
            var r = array[0], len = array.length, i;
            for (i = 1; i < len; i++) {
                r = _.gcd([r, array[i]]);
            }
            return r;
        }
    };

    _.lcm = function(array) {
        if (array.length === 2) {
            var a = array[0], b = array[1];
            return a * (b / _.gcd([a, b]));
        } else {
            var r = array[0], len = array.length, i;
            for (i = 1; i < len; i++) {
                r = _.lcm([r, array[i]]);
            }
            return r;
        }
    };

    _.format = function() {
        var params = _.toArray(arguments),
            format = params.shift();
        return format.replace(/{(\d+)}/g, function(match, number) {
            return typeof params[number] != 'undefined'
                ? params[number]
                : match;
        });
    }

    _.insert = function(array, index, insert) {
        Array.prototype.splice.apply(array, [index, 0].concat(insert));
        return array;
    };

    /**
     * Array move (swap)
     * http://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another/5306832#5306832
     */
    _.move = function(array, from, to) {
        var size = array.length;
        
        while(from < 0) {
            from += size;
        }
        
        while(to < 0) {
            to += size;
        }

        if (to >= size) {
            var k = to - size;
            while((k--) + 1) {
                array.push(undefined);
            }
        }

        array.splice(to, 0, array.splice(from, 1)[0]);
        return array;
    };

    /**
     * Array permutation
     * https://github.com/lodash/lodash/issues/1701
     */
    _.permute = function(array, permuter) {
        if(_.isFunction(permuter)) {
            return _.reduce(array, function(result, value, key){
                result[permuter(key, value)] = value;
                return result;
            }, []);
        } else if (_.isArray(permuter)) {
            return _.reduce(permuter, function(result, value, key){
                result[key] = array[permuter[key]];
                return result;
            }, []);
        }
        return array;
    };  
    
    /**
     *  Bisector
     */
    _.bisector = function(f) {
        return {
            left: function(a, x, lo, hi) {
                if (arguments.length < 3) lo = 0;
                if (arguments.length < 4) hi = a.length;
                while (lo < hi) {
                    var mid = lo + hi >>> 1;
                    if (f.call(a, a[mid], mid) < x) lo = mid + 1; else hi = mid;
                }
                return lo;
            },
            right: function(a, x, lo, hi) {
                if (arguments.length < 3) lo = 0;
                if (arguments.length < 4) hi = a.length;
                while (lo < hi) {
                    var mid = lo + hi >>> 1;
                    if (x < f.call(a, a[mid], mid)) hi = mid; else lo = mid + 1;
                }
                return lo;
            }
        };
    };
    
    /** 
     *  Sorter
     */
    _.ascendingKey = function(key) {
        return typeof key == 'function' ? function (a, b) {
            return key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : key(a) >= key(b) ? 0 : NaN;
        } : function (a, b) {
            return a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : a[key] >= b[key] ? 0 : NaN;
        };
    };

    _.isIE = function() {
        var na = global.navigator,
            ua = (na && na.userAgent || '').toLowerCase(),
            ie = ua.indexOf('MSIE ');

        if (ie > 0 || !!ua.match(/Trident.*rv\:11\./)) {
            return parseInt(ua.substring(ie + 5, ua.indexOf('.', ie)));
        }
        return false;
    };

}());

//////////////////////////////////////////////////////////////////
/*
 * Graph - SVG Library
 * Documentation visit: https://github.com/londomloto/graph
 *
 * @author londomloto <roso.sasongko@gmail.com>
 * @author londomloto <roso@kct.co.id>
 */
//////////////////////////////////////////////////////////////////

(function(){

    var GLOBAL = typeof window != 'undefined' && 
                 window.Math == Math 
                    ? window 
                    : (typeof self != 'undefined' && self.Math == Math 
                        ? self 
                        : Function('return this')());

    var DOCUMENT = document;

    /**
     * Size for cached result
     */
    var CACHE_SIZE = 100;

    /**
     * Size for memoize function
     */
    var MEMO_SIZE = 1000;

    //--------------------------------------------------------------------//
    
    var readyFn = [];

    /**
     * Banner
     */
    GLOBAL.Graph = function(ready) {
        readyFn.push(ready);
    };

    Graph.VERSION = '1.0.0';
    
    Graph.AUTHOR = 'Kreasindo Cipta Teknologi';
    
    /**
     * Config
     */
    Graph.cached = {};

    Graph.config = {
        base: './',
        svg: {
            version: '1.1'
        },
        xmlns: {
            svg: 'http://www.w3.org/2000/svg',
            xlink: 'http://www.w3.org/1999/xlink',
            html: 'http://www.w3.org/1999/xhtml'
        },
        font: {
            family: 'Segoe UI',
            size: '12px',
            line: 1
        }
    };

    Graph.setup = function(name, value) {
        if (_.isPlainObject(name)) {
            _.extend(Graph.config, name);
        } else {
            Graph.config[name] = value;
        }
    };

    /*
    Graph.toString = function() {
        return 'SVG Library presented by ' + Graph.AUTHOR;
    }
    */

    /**
     * String params
     */
    Graph.string = {
        ID_VECTOR: 'graph-vector-id',
        ID_LINK: 'graph-link-id',
        ID_PORT: 'graph-port-id',

        CLS_VECTOR_SVG: 'graph-paper',
        CLS_VECTOR_RECT: 'graph-elem graph-elem-rect',
        CLS_VECTOR_PATH: 'graph-elem graph-elem-path',
        CLS_VECTOR_TEXT: 'graph-elem graph-elem-text',
        CLS_VECTOR_LINE: 'graph-elem graph-elem-line',
        CLS_VECTOR_GROUP: 'graph-elem graph-elem-group',
        CLS_VECTOR_IMAGE: 'graph-elem graph-elem-image',
        CLS_VECTOR_CIRCLE: 'graph-elem graph-elem-circle',
        CLS_VECTOR_ELLIPSE: 'graph-elem graph-elem-ellipse',
        CLS_VECTOR_POLYGON: 'graph-elem graph-elem-polygon',
        CLS_VECTOR_POLYLINE: 'graph-elem graph-elem-polyline',
        CLS_VECTOR_VIEWPORT: 'graph-viewport',

        CLS_LINK_HEAD: 'graph-link-head',
        CLS_LINK_TAIL: 'graph-link-tail'
    };

    /**
     * Language & Core helper
     */
    Graph.isHTML = function(obj) {
        return obj instanceof HTMLElement;
    };

    Graph.isSVG = function(obj) {
        return obj instanceof SVGElement;
    };

    Graph.isElement = function(obj) {
        return obj instanceof Graph.dom.Element;
    };

    Graph.isMac = function() {
        return (/mac/i).test(navigator.platform);    
    };

    Graph.ns = function(namespace) {
        var cached = Graph.lookup('Graph', 'ns', namespace);

        if (cached.clazz) {
            return cached.clazz;
        }

        var parts = _.split(namespace, '.'),
            parent = GLOBAL,
            len = parts.length,
            current,
            i;

        for (i = 0; i < len; i++) {
            current = parts[i];
            parent[current] = parent[current] || {};
            parent = parent[current];
        }

        if (_.isFunction(parent)) {
            cached.clazz = parent;
        }

        return parent;
    };

    Graph.uuid = function() {
        // credit: http://stackoverflow.com/posts/2117523/revisions
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16|0;
            var v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    };

    /**
     * Simple hashing
     */
    Graph.hash = function(str) {
        var hash = 0, chr, len, i;
        
        if ( ! str.length) {
            return hash;
        }

        for (i = 0, len = str.length; i < len; i++) {
            chr   = str.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0;
        }

        return hash;
    };

    // prepare for prototypal factory
    Graph.create = function(superclass, props) {
        
    };

    Graph.factory = function(clazz, args) {
        args = [clazz].concat(args);
        return new (Function.prototype.bind.apply(clazz, args));
    };

    Graph.expand = function(target, source, scope) {
        var tproto = target.constructor.prototype,
            sproto = source.constructor.prototype;

        scope = _.defaultTo(source);

        _.forOwn(sproto, function(value, key){
            if (_.isFunction(value) && _.isUndefined(tproto[key])) {
                (function(key, value){
                    tproto[key] = _.bind(value, scope);
                }(key, value));    
            }
        });
    };

    Graph.extend = function(clazz, props) {
        if (_.isPlainObject(clazz)) {
            props = clazz;
            clazz = Graph.lang.Class;
        }
        return clazz.extend(props);
    };

    Graph.mixin = function(target, source) {
        this.extend(target, source, target);
    };

    Graph.lookup = function(group, token) {
        var args = _.toArray(arguments), cached, credit;

        group  = args.shift();
        token  = _.join(args, '|');
        cached = Graph.cached[group] = Graph.cached[group] || {};
        credit = group == 'Regex.event' ? null : CACHE_SIZE;

        if (cached[token]) {
            cached[token].credit = credit;
        } else {
            cached[token] = {
                credit: credit,
                remove: (function(group, token){
                    return function() {
                        delete Graph.cached[group][token];    
                    };
                }(group, token))
            }
        }

        _.debounce(function(t){
            _.forOwn(cached, function(v, k){
                if (k != t) {
                    if (cached[k].credit !== null) {
                        cached[k].credit--;
                        if (cached[k].credit <= 0) {
                            delete cached[k];
                        }
                    }
                }
            });
        })(token);

        return cached[token];
    };

    Graph.memoize = function(func) {
        return function memo() {
            var param = _.toArray(arguments),
                token = _.join(param, "\u2400"),
                cache = memo.cache = memo.cache || {},
                saved = memo.saved = memo.saved || [];

            if ( ! _.isUndefined(cache[token])) {
                for (var i = 0, ii = saved.length; i < ii; i++) {
                    if (saved[i] == token) {
                        saved.push(saved.splice(i, 1)[0]);
                        break;
                    }
                }
                return cache[token];
            }

            if (saved.length >= MEMO_SIZE) {
                delete cache[saved.shift()];
            }

            saved.push(token);
            cache[token] = func.apply(this, param);

            return cache[token];
        }
    };

    Graph.defer = function() {
        return $.Deferred();
    };

    Graph.when = $.when;

    /**
     * Expand namespaces
     */
    Graph.ns('Graph.lang');
    Graph.ns('Graph.collection');
    Graph.ns('Graph.registry');
    Graph.ns('Graph.data');
    Graph.ns('Graph.diagram');
    Graph.ns('Graph.popup');
    

    /**
     * Vector
     */
    Graph.paper = function(width, height, options) {
        return Graph.factory(Graph.svg.Paper, [width, height, options]);
    };

    Graph.svg = function(type) {
        var args = _.toArray(arguments), svg;

        type = args.shift();
        svg = Graph.factory(Graph.svg[_.capitalize(type)], args);
        args = null;
        
        return svg;
    };

    Graph.shape = function(names, options) {
        var clazz, shape, chunk;

        chunk = names.lastIndexOf('.');
        names = names.substr(0, chunk) + '.' + _.capitalize(names.substr(chunk + 1));
        clazz = Graph.ns('Graph.shape.' + names);
        shape = Graph.factory(clazz, options);

        chunk = names = clazz = null;
        return shape;
    };

    Graph.ns('Graph.shape.activity');

    /**
     * Layout
     */
    Graph.layout = function(type) {

    };

    /**
     * Router
     */
    Graph.router = function(type) {

    };

    /**
     * Link / Connector
     */
    Graph.link = function(type) {

    };

    /**
     * Plugin
     */
    Graph.plugin = function(proto) {

    };
    
    /**
     * Topic
     */
    Graph.topic = {
        subscribers: {

        },
        topics: {

        },
        publish: function(topic, message, scope) {
            var subs = Graph.topic.subscribers,
                lsnr = subs[topic] || [];

            _.forEach(lsnr, function(handler){
                (function(){
                    handler.call(null, message, scope);
                }(handler));
            });
        },

        subscribe: function(topic, handler) {

            if (_.isPlainObject(topic)) {
                var unsub = [];

                _.forOwn(topic, function(h, t){
                    (function(t, h){
                        var s = Graph.topic.subscribe(t, h);
                        unsub.push({topic: t, sub: s});
                    }(t, h));
                });

                return {
                    unsubscribe: (function(unsub){
                        return function(topic) {
                            if (topic) {
                                var f = _.find(unsub, function(u){
                                    return u.topic == topic;
                                });
                                f && f.sub.unsubscribe();
                            } else {
                                _.forEach(unsub, function(u){
                                    u.sub.unsubscribe();
                                });
                            }
                        };
                    }(unsub))
                };
            }

            var subs = Graph.topic.subscribers, data;

            subs[topic] = subs[topic] || [];
            subs[topic].push(handler);

            return {
                unsubscribe: (function(topic, handler){
                    return function() {
                        Graph.topic.unsubscribe(topic, handler);
                    };
                }(topic, handler))
            };
        },

        unsubscribe: function(topic, handler) {
            var subs = Graph.topic.subscribers, 
                lsnr = subs[topic] || [];

            for (var i = lsnr.length - 1; i >= 0; i--) {
                if (lsnr[i] === handler) {
                    lsnr.splice(i, 1);
                }
            }
        }
    };

    ///////////////////////// LISTEN DOCUMENT READY ////////////////////////
    
    (function(doc, evt){
        var timer;

        var handler = function() {
            doc.removeEventListener(evt, handler, false);
            doc.readyState = 'complete';
        };

        var loaded = function() {
            _.forEach(readyFn, function(f){
                f();
            });
        };

        var inspect = function() {
            if (doc.readyState != 'complete') {
                timer = _.delay(function(){
                    clearTimeout(timer);
                    timer = null;

                    inspect();
                }, 10);
            } else {
                loaded();
            }
        };

        if (doc.readyState == null && doc.addEventListener) {
            doc.addEventListener(evt, handler, false);
            doc.readyState = 'loading';
        }

        inspect();
        
    }(document, 'DOMContentLoaded'));

    ///////////////////////////////////////////////////////////////////////
    
}());

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

(function(){

    var E = Graph.lang.Error = function(message) {
        this.message = message;

        var err = new Error();
        this.stack = err.stack;

        err = null;
    };
    
    Object.setPrototypeOf(E, Error);

    E.prototype = Object.create(Error.prototype);
    E.prototype.name = "Graph.lang.Error";
    E.prototype.message = "";
    E.prototype.constructor = E;

    ///////// SHORTCUT /////////
    
    Graph.error = function(message) {
        return new Graph.lang.Error(message);
    };

}());

(function(_, $){

    var E = Graph.lang.Event = function(type, data){
        this.type = type;
        this.init(data);
    };

    E.toString = function() {
        return 'function(type, data)';
    };

    _.extend(E.prototype, {
        
        cancelBubble: false,
        defaultPrevented: false,

        // sync with `interactjs`
        propagationStopped: false,
        immediatePropagationStopped: false,

        originalData: null,
        
        init: function(data) {
            if (data) {
                this.originalData = data;    
                _.assign(this, data || {});
            }
        },

        stopPropagation: function() {
            this.cancelBubble = this.propagationStopped = true;
        },

        stopImmediatePropagation: function() {
            this.immediatePropagationStopped = this.propagationStopped = true;
        },

        preventDefault: function() {
            this.defaultPrevented = true;
        },

        toString: function() {
            return 'Graph.lang.Event';
        }
    });

    ///////// SHORTCUT /////////
    
    Graph.event = function(type, data) {
        return new Graph.lang.Event(type, data);
    };
    
    _.extend(Graph.event, {

        ESC: 27,
        ENTER: 13,
        DELETE: 46,
        SHIFT: 16,

        fix: function(event) {
            return $.event.fix(event);
        },

        original: function(event) {
            return event.originalEvent || event;
        },

        position: function(event) {
            return {
                x: event.clientX,
                y: event.clientY
            };
        },
        
        relative: function(event, vector) {

            var position = Graph.event.position(event),
                matrix = vector.matrix().clone().invert(),
                relative = {
                    x: matrix.x(position.x, position.y),
                    y: matrix.y(position.x, position.y)
                };

            matrix = null;

            return relative;
        },

        isPrimaryButton: function(event) {
            var original = Graph.event.original(event);
            return ! original.button;
        },

        hasPrimaryModifier: function(event) {
            if ( ! Graph.event.isPrimaryButton(event)) {
                return false;
            }
            var original = Graph.event.original(event);
            return Graph.isMac() ? original.metaKey : original.ctrlKey;
        },

        hasSecondaryModifier: function(event) {
            var original = Graph.event.original(event);
            return Graph.event.isPrimaryButton(event) && original.shiftKey;
        }
    });
    
}(_, jQuery));

(function(){
    
    var initializing = false;
    // var inherit = /xyz/.test(function(){ xyz; }) ? /\$super/ : /.*/;
    var Class = Graph.lang.Class = function() {};

    Class.extend = function (config) {
        var $super, proto, name, value, defaults;
        
        $super = this.prototype;
        defaults = {};
        
        initializing = true;
        
        // proto = new this();
        proto = Object.create($super);

        initializing = false;
        
        var name;

        for (name in config) {
            value = config[name];
            if ( ! _.isFunction(value)) {

                proto[name] = value;
                defaults[name] = value;
                
            } else {
                proto[name] = value;

                // NOTE: perfomance penalty!!!
                // ---------------------------
                // proto[name] = _.isFunction($super[name])  && inherit.test(value) 
                //     ? (function(name, func){
                //         return function() {
                //             var tmp, ret;
                //             tmp = this.$super;
                //             this.$super = $super[name];
                //             ret = func.apply(this, arguments);
                //             this.$super = tmp;
                //             return ret;
                //         };
                //     }(name, value)) : value;
            }
        }

        var clazz, init;

        if ( ! _.isUndefined(proto.constructor)) {
            init = proto.constructor;
            delete proto.constructor;
        }
        
        clazz = function() {
            var me = this;
            var prop, value;

            me.listeners = {};

            var classdef = me.constructor.defaults,
                superdef = me.superclass.defaults;

            var inherits = {};

            if (superdef) {
                for(prop in superdef) {
                    me[prop] = _.cloneDeep(superdef[prop]);
                    inherits[prop] = true;
                }
            }

            if (classdef) {
                for(prop in classdef) {
                    value = _.cloneDeep(classdef[prop]);
                    if (inherits[prop]) {
                        if (_.isPlainObject(value) || _.isArray(value)) {
                            _.assign(me[prop], value);
                        }
                    } else {
                        me[prop] = value;    
                    }
                }
            }

            inherits = superdef = classdef = null;
            
            if ( ! initializing) {
                init && init.apply(me, arguments);
            }
        };

        // statics
        clazz.init = init;
        clazz.extend = Class.extend;
        clazz.defaults = defaults;

        // instance
        clazz.prototype = proto;
        clazz.prototype.constructor = clazz;
        clazz.prototype.superclass = $super.constructor;

        // `$super()` implementation, replace John Resigh implementation
        clazz.prototype.$super = function () {
            var func = clazz.prototype.$super,
                ctor = this.constructor;
                
            var fcal, fsup, near;
            
            fcal = (func && func.caller) ? func.caller : arguments.callee.caller;

            if ( ! fcal) {
                return undefined;
            }

            fsup = fcal.$super;

            if ( ! fsup) {
                near = Class.closest(fcal, ctor);
                    
                if (near) {
                    var pro = near.proto, 
                        key = near.key;

                    fsup = pro.superclass.prototype[key];
                    fcal.$super = fsup;
                }
            }

            return fsup ? fsup.apply(this, arguments) : undefined;
        };

        /**
         * Enable eventbus
         */
        
        clazz.prototype.on = function(type, handler, once) {
            var me = this, data;

            if (_.isPlainObject(type)) {
                _.forOwn(type, function(h, t){
                    if (_.isPlainObject(h)) {
                        var o = h;
                        h = o.handler;
                        s = o.once;
                        me.on(t, h, s);
                    } else {
                        me.on(t, h, false);
                    }
                });
                return me;
            }

            var part = _.split(type, '.'),
                fire = part.shift();

            me.listeners[fire] = me.listeners[fire] || [];
            
            once = _.defaultTo(once, false);

            data = {
                type: type,
                once: once,
                orig: handler,
                func: _.bind(handler, this)
            };

            me.listeners[fire].push(data);
            return this;
        };

        clazz.prototype.one = function(type, handler) {
            var me = this;

            if (_.isPlainObject(type)) {
                _.forOwn(type, function(h, t){
                    me.on(t, h, true);
                });
                return me;
            }

            return me.on(type, handler, true);
        };

        /**
         * Unregister event handler
         */
        clazz.prototype.off = function(type, handler) {
            var part, fire, lsnr, rgex;
            
            part = _.split(type, '.');
            fire = part.shift();
            lsnr = fire ? (this.listeners[fire] || []).slice() : [];

            var cached = Graph.lookup('Regex.event', type);
            
            if (cached.rgex) {
                rgex = cached.rgex;
            } else {
                rgex = new RegExp(_.escapeRegExp(type), 'i');
                cached.rgex = rgex;
            }
            
            if (lsnr.length) {
                for (var i = lsnr.length - 1; i >= 0; i--) {
                    if (handler) {
                        if (rgex.test(lsnr[i].type) && lsnr[i].orig === handler) {
                            this.listeners[fire].splice(i, 1);
                        }
                    } else {
                        if (rgex.test(lsnr[i].type)) {
                            this.listeners[fire].splice(i, 1);
                        }
                    }
                }
            } else {
                var me = this;
                for (fire in me.listeners) {
                    (function(lsnr){
                        for (var i = lsnr.length - 1; i >= 0; i--) {
                            if (handler) {
                                if (rgex.test(lsnr[i].type) && lsnr[i].orig === handler) {
                                    lsnr.splice(i, 1);
                                }
                            } else {
                                if (rgex.test(lsnr[i].type)) {
                                    lsnr.splice(i, 1);
                                }
                            }
                        }
                    }(me.listeners[fire]))
                }
            }

            rgex = null;
            lsnr = null;
            
            return this;
        };

        /**
         * Execute event handler
         */
        clazz.prototype.fire = function(type, data) {
            var func = clazz.prototype.fire;
            var args = [];
            var event, part, fire, lsnr, rgex;

            if (_.isString(type)) {
                event = new Graph.lang.Event(type, data);
            } else {
                event = type;
                event.originalData = event.originalData || {};
                type = event.originalType || event.type;
            }

            // add default publisher props for later use
            event.publisher = this;
            
            args.push(event);

            part = _.split(type, '.');
            fire = part.shift();
            lsnr = this.listeners[fire] || [];

            var cached = Graph.lookup('Regex.event', type);

            if (cached.rgex) {
                rgex = cached.rgex;
            } else {
                rgex = new RegExp(_.escapeRegExp(type), 'i');
                cached.rgex = rgex;
            }

            var onces = [];

            if (lsnr.length) {
                for (var i = 0, ii = lsnr.length; i < ii; i++) {
                    if (fire != type) {
                        if (rgex.test(lsnr[i].type)) {
                            if (lsnr[i].once) {
                                onces.push(lsnr[i]);
                            }
                            lsnr[i].func.apply(lsnr[i].func, args);
                        }
                    } else {
                        if (lsnr[i].once) {
                            onces.push(lsnr[i]);
                        }

                        lsnr[i].func.apply(lsnr[i].func, args);
                    }
                }
            }

            if (onces.length) {
                var me = this;
                _.forEach(onces, function(lsnr){
                    me.off(lsnr.type, lsnr.orig);
                });
            }

            rgex = null;
            return event;
        };

        return clazz;
    };

    Class.closest = function(method, clazz) {
        var proto = clazz.prototype, inherited;

        if (method === clazz.init) {
            inherited = proto.superclass ? method === proto.superclass.init : false;

            if ( ! inherited) {
                return { proto: proto, key: 'constructor' };
            }
        } else {
            for (var key in proto) {
                if (proto[key] === method) {

                    inherited = proto.superclass ? proto[key] === proto.superclass.prototype[key]  : false;

                    if ( ! inherited) {
                        return { proto: proto, key: key };
                    }
                }
            }
        }

        if (proto.superclass) {
            return Class.closest(method, proto.superclass);
        } else {
            return null;
        }
    };

}());

(function(){

    var Point = Graph.lang.Point = Graph.extend({

        props: {
            x: 0,
            y: 0
        },

        constructor: function(x, y) {
            var tmp;

            if (_.isPlainObject(x)) {
                tmp = x;
                x = tmp.x;
                y = tmp.y;
            } else if (_.isString(x)) {
                tmp = _.split(_.trim(x), ',');
                x = _.toNumber(tmp[0]);
                y = _.toNumber(tmp[1]);
            }

            this.props.x = x;
            this.props.y = y;
        },

        x: function(x) {
            if (_.isUndefined(x)) {
                return this.props.x;
            }
            this.props.x = x;
            return this;
        },

        y: function(y) {
            if (_.isUndefined(y)) {
                return this.props.y;
            }
            this.props.y = y;
            return this;
        },

        distance: function(b) {
            var dx = this.props.x - b.props.x,
                dy = this.props.y - b.props.y;

            return Math.sqrt(Math.pow(dy, 2) + Math.pow(dx, 2));
        },

        /**
         * Manhattan (taxi-cab) distance
         */
        manhattan: function(p) {
            return Math.abs(p.props.x - this.props.x) + Math.abs(p.props.y - this.props.y);
        },

        angle: function(b) {
            return Graph.util.angle(a.toJson(), b.toJson());
        },
        
        triangle: function(b, c) {
            return this.angle(c) - b.angle(c);
        },

        theta: function(p) {
            return Graph.util.theta(this.toJson(), p.toJson());
        },

        difference: function(p) {
            return new Graph.lang.Point(this.props.x - p.props.x, this.props.y - p.props.y);
        },

        alignment: function(p) {
            return Graph.util.pointAlign(this.toJson(), p.toJson());
        },

        bbox: function() {
            var x = this.props.x,
                y = this.props.y;
                
            return Graph.bbox({
                x: x,
                y: y,
                x2: x,
                y2: y,
                width: 0,
                height: 0
            });
        },

        bearing: function(p) {
            var line = new Graph.lang.Line(this, p),
                bear = line.bearing();
            line = null;
            return bear;
        },

        /**
         * Snap to grid
         */
        snap: function(x, y) {
            y = _.defaultTo(y, x);

            this.props.x = snap(this.props.x, x);
            this.props.y = snap(this.props.y, y);

            return this;
        },

        move: function(to, distance) {
            var rad = Graph.util.rad(to.theta(this));
            this.expand(Math.cos(rad) * distance, -Math.sin(rad) * distance);
            return this;
        },

        expand: function(dx, dy) {
            this.props.x += dx;
            this.props.y += dy;

            return this;
        },

        round: function(dec) {
            this.props.x = dec ? this.props.x.toFixed(dec) : Math.round(this.props.x);
            this.props.y = dec ? this.props.y.toFixed(dec) : Math.round(this.props.y);
            return this;
        },

        equals: function(p) {
            return this.props.x == p.props.x && this.props.y == p.props.y;
        },

        rotate: function(angle, origin) {
            var rd = Graph.util.rad(angle), 
                dx = this.props.x - (origin ? origin.props.x : 0),
                dy = this.props.y - (origin ? origin.props.y : 0),
                si = Math.sin(rd),
                co = Math.cos(rd);

            var rx = dx *  co + dy * si,
                ry = dx * -si + dy * co;

            this.props.x = this.props.x + rx;
            this.props.y = this.props.y + ry;

            return this;
        },

        transform: function(matrix) {
            var x = this.props.x,
                y = this.props.y;

            this.props.x = matrix.x(x, y);
            this.props.y = matrix.y(x, y);

            return this;
        },

        comply: function(bbox) {

        },  

        /**
         * Export to polar
         */
        polar: function() {

        },

        adhereToBox: function(box) {
            if (box.contains(this)) {
                return this;
            }

            this.props.x = Math.min(Math.max(this.props.x, box.props.x), box.props.x + box.props.width);
            this.props.y = Math.min(Math.max(this.props.y, box.props.y), box.props.y + box.props.height);
            
            return this;
        },

        stringify: function(sep) {
            sep = _.defaultTo(sep, ',');
            return this.props.x + sep + this.props.y;
        },

        toString: function() {
            return this.stringify();
        },

        toJson: function() {
            return {
                x: this.props.x, 
                y: this.props.y
            };
        },

        clone: function(){
            return new Point(this.props.x, this.props.y);
        }
    });

    ///////// STATIC /////////
    Graph.lang.Point.toString = function() {
        return 'function(x, y)';
    };

    ///////// HELPER /////////
    
    function snap(value, size) {
        return size * Math.round(value / size);
    }

    ///////// EXTENSION /////////
    
    Graph.isPoint = function(obj) {
        return obj instanceof Graph.lang.Point;
    };

    Graph.point = function(x, y) {
        return new Graph.lang.Point(x, y);
    };
    
}());

(function(){

    Graph.lang.Line = Graph.extend({

        props: {
            start: {
                x: 0,
                y: 0
            },
            end: {
                x: 0,
                y: 0
            }
        },

        constructor: function() {
            var args = _.toArray(arguments), start, end;

            if (args.length === 4) {
                _.assign(this.props.start, {
                    x: args[0],
                    y: args[1]
                })

                _.assign(this.props.end, {
                    x: args[2],
                    y: args[3]
                });

                start = Graph.point(args[0], args[1]);
                end = Graph.point(args[2], args[3]);
            } else {
                this.props.start = args[0].toJson();
                this.props.end = args[1].toJson();
                
                start = args[0];
                end = args[1];
            }
        },

        start: function() {
            return Graph.point(this.props.start.x, this.props.start.y);
        },

        end: function() {
            return Graph.point(this.props.end.x, this.props.end.y);
        },

        bearing: function() {
            var data = ['NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];

            var x1 = this.props.start.x,
                y1 = this.props.start.y,
                x2 = this.props.end.x,
                y2 = this.props.end.y,
                lat1 = Graph.util.rad(y1),
                lat2 = Graph.util.rad(y2),
                lon1 = x1,
                lon2 = x2,
                deltaLon = Graph.util.rad(lon2 - lon1),
                dy = Math.sin(deltaLon) * Math.cos(lat2),
                dx = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
                index = Graph.util.deg(Math.atan2(dy, dx)) - 22.5;

            if (index < 0) {
                index += 360;
            }

            index = parseInt(index / 45);
            return data[index];
        },

        intersect: function(line) {
            return this.intersection(line) !== null;
        },

        intersection: function(line, dots) {
            var x1 = this.props.start.x,
                y1 = this.props.start.y,
                x2 = this.props.end.x,
                y2 = this.props.end.y,
                x3 = line.props.start.x,
                y3 = line.props.start.y,
                x4 = line.props.end.x,
                y4 = line.props.end.y;

            var result = Graph.util.lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4);

            if (result) {
                return dots ? result : Graph.point(result.x, result.y);
            }

            return result;
        },

        toString: function() {
            return 'Graph.lang.Line';
        }

    });

    ///////// STATIC /////////
    
    Graph.lang.Line.toString = function() {
        return "function(from, to)";
    };  

    ///////// SHORTCUT /////////
    
    Graph.line = function(command) {
        var args = _.toArray(arguments);
        return Graph.factory(Graph.lang.Line, args);
    };

}());

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
(function(){

    var Path = Graph.lang.Path = Graph.extend({

        __CLASS__: 'Graph.lang.Path',
        
        segments: [],

        constructor: function(command) {
            var segments = [];
            
            if (Graph.isPath(command)) {
                segments = _.cloneDeep(command.segments);
            } else if (_.isArray(command)) {
                segments = _.cloneDeep(command);
            } else {
                segments = _.cloneDeep(Graph.util.path2segments(command));
            }

            this.segments = segments;
        },

        command: function() {
            return Graph.util.segments2path(this.segments);
        },

        absolute: function() {
            if ( ! this.segments.length) {
                return new Path([['M', 0, 0]]);
            }

            var cached = Graph.lookup(this.__CLASS__, 'absolute', this.toString()),
                segments = this.segments;

            if (cached.absolute) {
                return cached.absolute;
            }

            var result = [],
                x = 0,
                y = 0,
                mx = 0,
                my = 0,
                start = 0;

            if (segments[0][0] == 'M') {
                x = +segments[0][1];
                y = +segments[0][2];
                mx = x;
                my = y;
                start++;
                result[0] = ['M', x, y];
            }

            var z = segments.length == 3 && 
                    segments[0][0] == 'M' && 
                    segments[1][0].toUpperCase() == 'R' && 
                    segments[2][0].toUpperCase() == 'Z';
            
            for (var dots, seg, itm, i = start, ii = segments.length; i < ii; i++) {
                result.push(seg = []);
                itm = segments[i];

                if (itm[0] != _.toUpper(itm[0])) {
                    seg[0] = _.toUpper(itm[0]);

                    switch(seg[0]) {
                        case 'A':
                            seg[1] = itm[1];
                            seg[2] = itm[2];
                            seg[3] = itm[3];
                            seg[4] = itm[4];
                            seg[5] = itm[5];
                            seg[6] = +(itm[6] + x);
                            seg[7] = +(itm[7] + y);
                            break;
                        case 'V':
                            seg[1] = +itm[1] + y;
                            break;
                        case 'H':
                            seg[1] = +itm[1] + x;
                            break;
                        case 'R':
                            dots = _.concat([x, y], itm.slice(1));
                            for (var j = 2, jj = dots.length; j < jj; j++) {
                                dots[j] = +dots[j] + x;
                                dots[++j] = +dots[j] + y;
                            }
                            result.pop();
                            result = _.concat(result, [['C'].concat(cat2bezier(dots, z))])
                            break;
                        case 'M':
                            mx = +itm[1] + x;
                            my = +itm[2] + y;
                        default:
                            for (var k = 1, kk = itm.length; k < kk; k++) {
                                seg[k] = +itm[k] + ((k % 2) ? x : y);
                            }
                    }

                } else if (itm[0] == 'R') {
                    dots = _.concat([x, y], itm.slice(1));
                    result.pop();
                    result = _.concat(result, [['C'].concat(cat2bezier(dots, z))]);
                    seg = _.concat(['R'], itm.slice(-2));
                } else {
                    for (var l = 0, ll = itm.length; l < ll; l++) {
                        seg[l] = itm[l];
                    }
                }

                switch (seg[0]) {
                    case 'Z':
                        x = mx;
                        y = my;
                        break;
                    case 'H':
                        x = seg[1];
                        break;
                    case 'V':
                        y = seg[1];
                        break;
                    case 'M':
                        mx = seg[seg.length - 2];
                        my = seg[seg.length - 1];
                    default:
                        x = seg[seg.length - 2];
                        y = seg[seg.length - 1];
                }
            }
            
            cached.absolute = result = new Path(result);
            return result;
        },

        start: function() {
            return this.pointAt(0);
        },

        end: function() {
            return this.pointAt(this.length());
        },

        head: function() {

        },

        tail: function() {

        },

        relative: function() {
            var cached = Graph.lookup(this.__CLASS__, 'relative', this.toString()),
                segments = this.segments;

            if (cached.relative) {
                return cached.relative;
            }

            var result = [],
                x = 0,
                y = 0,
                mx = 0,
                my = 0,
                start = 0;

            if (segments[0][0] == 'M') {
                x = segments[0][1];
                y = segments[0][2];
                mx = x;
                my = y;
                start++;
                result.push(['M', x, y]);
            }

            for (var i = start, ii = segments.length; i < ii; i++) {
                var seg = result[i] = [], itm = segments[i];

                if (itm[0] != _.toLower(itm[0])) {
                    seg[0] = _.toLower(itm[0]);

                    switch (seg[0]) {
                        case 'a':
                            seg[1] = itm[1];
                            seg[2] = itm[2];
                            seg[3] = itm[3];
                            seg[4] = itm[4];
                            seg[5] = itm[5];
                            seg[6] = +(itm[6] - x).toFixed(3);
                            seg[7] = +(itm[7] - y).toFixed(3);
                            break;
                        case 'v':
                            seg[1] = +(itm[1] - y).toFixed(3);
                            break;
                        case 'm':
                            mx = itm[1];
                            my = itm[2];
                        default:
                            for (var j = 1, jj = itm.length; j < jj; j++) {
                                seg[j] = +(itm[j] - ((j % 2) ? x : y)).toFixed(3);
                            }
                    }
                } else {
                    seg = res[i] = [];
                    if (itm[0] == 'm') {
                        mx = itm[1] + x;
                        my = itm[2] + y;
                    }
                    for (var k = 0, kk = itm.length; k < kk; k++) {
                        res[i][k] = itm[k];
                    }
                }

                var len = result[i].length;

                switch (result[i][0]) {
                    case 'z':
                        x = mx;
                        y = my;
                        break;
                    case 'h':
                        x += +result[i][len - 1];
                        break;
                    case 'v':
                        y += +result[i][len - 1];
                        break;
                    default:
                        x += +result[i][len - 2];
                        y += +result[i][len - 1];
                }
            }

            cached.relative = result = new Path(result);
            return result;
        },

        curve: function() {
            var cached = Graph.lookup(this.__CLASS__, 'curve', this.toString());
            
            if (cached.curve) {
                return cached.curve;
            }

            var p = _.cloneDeep(this.absolute().segments),
                a = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
                com = [],
                init = '',
                prev = '';

            var fix;

            for (var i = 0, ii = p.length; i < ii; i++) {
                p[i] && (init = p[i][0]);
                
                if (init != 'C') {
                    com[i] = init;
                    i && (prev = com[i - 1]);
                }
                
                p[i] = fixsegment(p[i], a, prev);

                if (com[i] != 'A' && init == 'C') com[i] = 'C';

                fixarc(p, i);

                var s = p[i], l = s.length;

                a.x = s[l - 2];
                a.y = s[l - 1];
                a.bx = _.float(s[l - 4]) || a.x;
                a.by = _.float(s[l - 3]) || a.y;
            }

            cached.curve = new Path(p);
            return cached.curve;

            ///////// HELPER /////////
            
            function fixarc(segments, i) {
                if (segments[i].length > 7) {
                    segments[i].shift();

                    var pi = segments[i];

                    while (pi.length) {
                        com[i] = 'A';
                        segments.splice(i++, 0, ['C'].concat(pi.splice(0, 6)));
                    }
                    
                    segments.splice(i, 1);
                    ii = p.length;
                }
            }
        },

        curve2curve: function(to){
            var p1 = _.cloneDeep(this.absolute().segments),
                p2 = _.cloneDeep((new Path(to)).absolute().segments) ,
                a1 = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
                a2 = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
                com1 = [],
                com2 = [],
                init = '',
                prev = '';

            for (var i = 0, ii = _.max([p1.length, p2.length]); i < ii; i++) {
                // fix p1
                p1[i] && (init = p1[i][0]);
                
                if (init != 'C') {
                    com1[i] = init;
                    i && (prev = com1[i - 1]);
                }
                
                p1[i] = fixsegment(p1[i], a1, prev);
                
                if (com1[i] != 'A' && init == 'C') com1[i] = 'C';
                
                fixarc2(p1, i);

                // fix p2
                p2[i] && (init = p2[i][0]);

                if (init != 'C') {
                    com2[i] = init;
                    i && (prev = com2[i - 1]);
                }

                p2[i] = fixsegment(p2[i], attrs2, pcom);
                
                if (com2[i] != 'A' && init == 'C') com2[i] = 'C';

                // fix p1 & p2
                fixArc2(p2, i);

                fixmove2(p1, p2, a1, a2, i);
                fixmove2(p2, p1, a2, a1, i);

                var s1 = p1[i],
                    s2 = p2[i],
                    l1 = s1.length,
                    l2 = s2.length;

                a1.x = s1[l1 - 2];
                a1.y = s1[l1 - 1];
                a1.bx = _.float(s1[l1 - 4]) || a1.x;
                a1.by = _.float(s1[l1 - 3]) || a1.y;

                a2.bx = _.float(s2[l2 - 4]) || a2.x;
                a2.by = _.float(s2[l2 - 3]) || a2.y;
                a2.x = s2[l2 - 2];
                a2.y = s2[l2 - 1];

            }

            return [new Path(p1), new Path(p2)];

            ///////// HELPER /////////
            
            function fixarc2(segments, i) {
                if (segments[i].length > 7) {
                    segments[i].shift();
                    var pi = segments[i];

                    while (pi.length) {
                        com1[i] = 'A';
                        com2[i] = 'A';
                        segments.splice(i++, 0, ['C'].concat(pi.splice(0, 6)));
                    }
                    
                    segments.splice(i, 1);
                    ii = _.max([p1.length, p2.length]);
                }
            }

            function fixmove2(segments1, segments2, a1, a2, i) {
                if (segments1 && segments2 && segments1[i][0] == 'M' && segments2[i][0] != 'M') {
                    segments2.splice(i, 0, ['M', a2.x, a2.y]);
                    a1.bx = 0;
                    a1.by = 0;
                    a1.x = segments1[i][1];
                    a1.y = segments1[i][2];
                    ii = _.max([p1.length, p2 && p2.length || 0]);
                }
            }

        },

        bbox: function(){
            if ( ! this.segments.length) {
                return Graph.bbox({x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0});
            }

            var cached = Graph.lookup(this.__CLASS__, 'bbox', this.toString());

            if (cached.bbox) {
                return cached.bbox;
            }

            var segments = this.curve().segments,
                x = 0,
                y = 0,
                X = [],
                Y = [],
                p;

            for (var i = 0, ii = segments.length; i < ii; i++) {
                p = segments[i];
                if (p[0] == 'M') {
                    x = p[1];
                    y = p[2];
                    X.push(x);
                    Y.push(y);
                } else {
                    var box = Graph.util.curvebox(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                    X = X.concat(box.min.x, box.max.x);
                    Y = Y.concat(box.min.y, box.max.y);
                    x = p[5];
                    y = p[6];
                }
            }

            var xmin = _.min(X),
                ymin = _.min(Y),
                xmax = _.max(X),
                ymax = _.max(Y),
                width = xmax - xmin,
                height = ymax - ymin,
                bounds = {
                    x: xmin,
                    y: ymin,
                    x2: xmax,
                    y2: ymax,
                    width: width,
                    height: height,
                    cx: xmin + width / 2,
                    cy: ymin + height / 2
                };

            cached.bbox = Graph.bbox(bounds);
            return cached.bbox;
        },
        
        transform: function(matrix) {
            if ( ! matrix) {
                return;
            }

            var cached = Graph.lookup(this.__CLASS__, 'transform', this.toString(), matrix.toString());

            if (cached.transform) {
                return cached.transform;
            }

            var segments = _.cloneDeep(this.curve().segments);
            var x, y, i, ii, j, jj, seg;
            
            for (i = 0, ii = segments.length; i < ii; i++) {
                seg = segments[i];
                for (j = 1, jj = seg.length; j < jj; j += 2) {
                    x = matrix.x(seg[j], seg[j + 1]);
                    y = matrix.y(seg[j], seg[j + 1]);
                    seg[j] = x;
                    seg[j + 1] = y;
                }
            }
            
            cached.transform = new Path(segments);
            return cached.transform;
        },

        lengthAt: function(point) {

        },

        pointAt: function(length, dots) {
            var ps = this.curve().segments;
            var point, s, x, y, l, c, d;

            dots = _.defaultTo(dots, false);

            l = 0;

            for (var i = 0, ii = ps.length; i < ii; i++) {
                s = ps[i];
                if (s[0] == 'M') {
                    x = s[1];
                    y = s[2];
                } else {
                    c = Graph.curve([['M', x, y], s]);
                    d = c.length();
                    if (l + d > length) {
                        point = c.pointAt(c.t(length - l), dots);
                        c = null;
                        return point;
                    }

                    l += d;
                    x = s[5];
                    y = s[6];

                    c = null;
                }
            }

            c = Graph.curve([['M', x, y], s]);
            point = c.pointAt(1, dots);

            c = null;
            return point;
        },

        segmentAt: function(length) {
            var segments = this.curve().segments,
                index = -1,
                total = 0;
            
            var x, y, l, c;

            _.forEach(segments, function(s, i){
                if (s[0] == 'M') {
                    x = s[1];
                    y = s[2];
                } else {
                    c = Graph.curve([['M', x, y], s]);
                    x = c.x();
                    y = c.y();
                    l = c.length();

                    if (l + total > length) {
                        index = i;
                        return false;
                    }

                    total += l;
                    c = null;
                }
            });

            return index;
        },

        length: function() {
            var ps = this.curve().segments;
            var point, s, x, y, l, c;

            l = 0;

            for (var i = 0, ii = ps.length; i < ii; i++) {
                s = ps[i];
                if (s[0] == 'M') {
                    x = s[1];
                    y = s[2];
                } else {
                    c = Graph.curve([['M', x, y], s]);
                    l = l + c.length();
                    x = s[5];
                    y = s[6];
                    c = null;
                }
            }
            return l;
        },

        slice: function(from, to) {
            var ps = this.curve().segments;
            var sub = {};
            var point, sp, s, x, y, l, c, d;

            l = 0;
            sp = '';

            for (var i = 0, ii = ps.length; i < ii; i++) {
                s = ps[i];
                if (s[0] == 'M') {
                    x = s[1];
                    y = s[2];
                } else {
                    c = Graph.curve([['M', x, y], s]);
                    d = c.length();
                    
                    if (l + d > length) {
                        point = c.pointAt(c.t(length - l));
                        sp += ['C' + point.start.x, point.start.y, point.m.x, point.m.y, point.props.x, point.props.y];
                        sub.start = Graph.path(sp);
                        sp = ['M' + point.props.x, point.props.y + 'C' + point.n.x, point.n.y, point.end.x, point.end.y, s[5], s[6]].join();
                    }

                    l += d;
                    x = s[5];
                    y = s[6];

                    c = null;
                }
                sp += s.shift() + s;
            }

            sub.end = Graph.path(sp);
            return sub;
        },

        vertices: function() {
            var cached = Graph.lookup(this.__CLASS__, 'vertices', this.toString());
            
            if (cached.vertices) {
                return cached.vertices;
            }

            var ps = this.segments,
                vs = [];

            _.forEach(ps, function(s){
                var l = s.length, x, y;
                if (s[0] != 'Z') {
                    if (s[0] == 'M') {
                        x = s[1];
                        y = s[2];
                    } else {
                        x = s[l - 2];
                        y = s[l - 1];
                    }
                    vs.push(Graph.point(x, y));
                }
            });

            cached.vertices = vs;
            return cached.vertices;
        },

        addVertext: function(vertext) {
            var simple = this.isSimple(),
                segments = simple ? _.cloneDeep(this.segments) : this.curve().segments,
                index = -1,
                vx = vertext.props.x,
                vy = vertext.props.y,
                l1 = 0,
                l2 = 0;

            var x, y, c1, c2;

            _.forEach(segments, function(s, i){
                if (s[0] != 'Z') {
                    if (s[0] == 'M') {
                        x = s[1];
                        y = s[2];
                    } else {
                        if (s[0] == 'L') {
                            c1 = Graph.curve([['M', x, y], ['C', x, y, x, y, s[1], s[2]]]);
                            x = s[1];
                            y = s[2];
                        } else {
                            c1 = Graph.curve([['M', x, y], s]);
                            x = c1.x();
                            y = c1.y();
                        }

                        c2 = c1.clone();
                        c2.segments[1][5] = vx;
                        c2.segments[1][6] = vy;  

                        l1 += c1.length();
                        l2 += c2.length();

                        if (l2 <= l1) {
                            index = i;
                            return false;
                        }
                    }
                }
            });

            if (index > -1) {
                if (simple) {
                    segments.splice(index, 0, ['L', vx, vy]);
                } else {
                    segments.splice(index, 0, ['C', vx, vy, vx, vy, vx, vy]);    
                }
                this.segments = segments;
            }

            return this;
        },

        intersect: function(path) {
            return intersection(this, path, true) > 0;
        },

        intersection: function(path, json) {
            var result = intersection(this, path);
            
            return json ? result : _.map(result, function(d){
                var p = Graph.point(d.x, d.y);
                
                p.segment1 = d.segment1;
                p.segment2 = d.segment2;
                p.bezier1  = d.bezier1;
                p.bezier2  = d.bezier2;

                return p;
            });
        },

        intersectnum: function(path) {
            return intersection(this, path, true);
        },

        alpha: function(point) {

        },

        contains: function(point) {
            var b, p, d, x, y;

            x = point.props.x;
            y = point.props.y;
            b = this.bbox();
            d = b.toJson();
            
            p = new Path([['M', x, y], ['H', d.x2 + 10]]);

            return b.contains(point) && this.intersectnum(p) % 2 == 1;
        },

        /**
         * Get point on path that closest to target point
         */
        nearest: function(point) {
            var length  = this.length(),
                tolerance = 20,
                bestdist = Infinity,
                taxicab = Graph.util.taxicab;

            var best, bestlen, currpoint, currdist, i;
            
            if (Graph.isPoint(point)) {
                point = point.toJson();
            }
            
            for (i = 0; i < length; i += tolerance) {
                currpoint = this.pointAt(i, true);
                currdist  = taxicab(currpoint, point);

                if (currdist < bestdist) {
                    bestdist = currdist;
                    best = currpoint;
                    bestlen = i;
                }
            }

            tolerance /= 2;

            var prev, next, prevlen, nextlen, prevdist, nextdist;
            
            while(tolerance > .5) {
                if ((prevlen = bestlen - tolerance) >= 0 && (prevdist = taxicab((prev = this.pointAt(prevlen, true)), point)) < bestdist) {
                    best = prev;
                    bestlen = prevlen;
                    bestdist = prevdist;
                } else if ((nextlen = bestlen + tolerance) <= length && (nextdist = taxicab((next = this.pointAt(nextlen, true)), point)) < bestdist) {
                    best = next;
                    bestlen = nextlen;
                    bestdist = nextdist;
                } else {
                    tolerance /= 2;
                }
            }

            best.distance = bestlen;
            return best;
        },  

        isSimple: function() {
            var simple = true;

            _.forEach(this.segments, function(s){
                if ( ! /[MLZ]/i.test(s[0])) {
                    simple = false;
                    return false;
                }
            });

            return simple;
        },

        moveTo: function(x, y) {
            var segments = this.segments;
            
            if (segments.length) {
                segments[0][0] = 'M';
                segments[0][1] = x;
                segments[0][2] = y;
            } else {
                segments = [['M', x, y]];
            }

            return this;
        },

        lineTo: function(x, y, append) {
            var segments = this.segments;
                
            append = _.defaultTo(append, true);

            if (segments) {
                var maxs = segments.length - 1;
                
                if (segments[maxs][0] == 'M' || append) {
                    segments.push(['L', x, y]);
                } else {
                    segments[maxs][1] = x;
                    segments[maxs][2] = y;
                }
            }

            return this;
        },

        toString: function() {
            return Graph.util.segments2path(this.segments);
        },

        toArray: function() {
            return this.segments;
        },

        clone: function() {
            var segments = _.cloneDeep(this.segments);
            return new Path(segments);
        }
    });
    
    ///////// STATIC /////////
    
    Graph.lang.Path.toString = function() {
        return "function(command)";
    };

    ///////// EXTENSION /////////
    
    Graph.isPath = function(obj) {
        return obj instanceof Graph.lang.Path;
    };

    Graph.path = function(command) {
        return new Graph.lang.Path(command);
    };

    ///////// HELPERS /////////
    
    function fixsegment(segment, attr, prev) {
        var nx, ny, tq = {T:1, Q:1};

        if ( ! segment) {
            return ['C', attr.x, attr.y, attr.x, attr.y, attr.x, attr.y];
        }

        ! ( segment[0] in tq) && (attr.qx = attr.qy = null);
        
        switch (segment[0]) {
            case 'M':
                attr.X = segment[1];
                attr.Y = segment[2];
                break;
            case 'A':
                segment = ['C'].concat(arc2curve.apply(0, [attr.x, attr.y].concat(segment.slice(1))));
                break;
            case 'S':
                if (prev == 'C' || prev == 'S') {
                    nx = attr.x * 2 - attr.bx;
                    ny = attr.y * 2 - attr.by;
                } else {
                    nx = attr.x;
                    ny = attr.y;
                }
                segment = ['C', nx, ny].concat(segment.slice(1));
                break;
            case 'T':
                if (prev == 'Q' || prev == 'T') {
                    attr.qx = attr.x * 2 - attr.qx;
                    attr.qy = attr.y * 2 - attr.qy;
                } else {
                    attr.qx = attr.x;
                    attr.qy = attr.y;
                }
                segment = ['C'].concat(quad2curve(attr.x, attr.y, attr.qx, attr.qy, segment[1], segment[2]));
                break;
            case 'Q':
                attr.qx = segment[1];
                attr.qy = segment[2];
                segment = ['C'].concat(quad2curve(attr.x, attr.y, segment[1], segment[2], segment[3], segment[4]));
                break;
            case 'L':
                segment = ['C'].concat(line2curve(attr.x, attr.y, segment[1], segment[2]));
                break;
            case 'H':
                segment = ['C'].concat(line2curve(attr.x, attr.y, segment[1], attr.y));
                break;
            case 'V':
                segment = ['C'].concat(line2curve(attr.x, attr.y, attr.x, segment[1]));
                break;
            case 'Z':
                segment = ['C'].concat(line2curve(attr.x, attr.y, attr.X, attr.Y));
                break;
        }
        return segment;
    }

    /**
     * Convert catmull-rom to bezier segment
     * https://advancedweb.hu/2014/10/28/plotting_charts_with_svg/
     */
    function cat2bezier(dots, z) {  
        var segments = [],
            def = _.defaultTo;

        for (var i = 0, ii = dots.length; ii - 2 * !z > i; i += 2) {
            var p = [
                {x: def(dots[i - 2], 0), y: def(dots[i - 1], 0)},
                {x: def(dots[i], 0),     y: def(dots[i + 1], 0)},
                {x: def(dots[i + 2], 0), y: def(dots[i + 3], 0)},
                {x: def(dots[i + 4], 0), y: def(dots[i + 5], 0)}
            ];  

            if (z) {
                if (!i) {
                    p[0] = {x: def(dots[ii - 2], 0), y: def(dots[ii - 1], 0)};
                } else if (ii - 4 == i) {
                    p[3] = {x: def(dots[0], 0), y: def(dots[1], 0)};
                } else if (ii - 2 == i) {
                    p[2] = {x: def(dots[0], 0), y: def(dots[1], 0)};
                    p[3] = {x: def(dots[2], 0), y: def(dots[3], 0)};
                }
            } else {
                if (ii - 4 == i) {
                    p[3] = p[2];
                } else if (!i) {
                    p[0] = {x: def(dots[i], 0), y: def(dots[i + 1], 0)};
                }
            }

            segments = [
                (-p[0].x + 6 * p[1].x + p[2].x) / 6,
                (-p[0].y + 6 * p[1].y + p[2].y) / 6,
                ( p[1].x + 6 * p[2].x - p[3].x) / 6,
                ( p[1].y + 6 * p[2].y - p[3].y) / 6,
                p[2].x,
                p[2].y
            ];
        }

        return segments;
    }

    function line2curve(x1, y1, x2, y2) {
        return [x1, y1, x2, y2, x2, y2];
    }

    function quad2curve (x1, y1, ax, ay, x2, y2) {
        var _13 = 1 / 3, 
            _23 = 2 / 3;
            
        return [
            _13 * x1 + _23 * ax,
            _13 * y1 + _23 * ay,
            _13 * x2 + _23 * ax,
            _13 * y2 + _23 * ay,
            x2,
            y2
        ];
    }

    function arc2curve (x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
        var 
            _120 = Math.PI * 120 / 180,
            rad = Math.PI / 180 * (+angle || 0),
            res = [],
            xy,
            rotate = Graph.memoize(function (x, y, rad) {
                var X = x * Math.cos(rad) - y * Math.sin(rad),
                    Y = x * Math.sin(rad) + y * Math.cos(rad);
                return {x: X, y: Y};
            });

        if ( ! recursive) {
            xy = rotate(x1, y1, -rad);
            x1 = xy.x;
            y1 = xy.y;
            xy = rotate(x2, y2, -rad);
            x2 = xy.x;
            y2 = xy.y;
            var cos = Math.cos(Math.PI / 180 * angle),
                sin = Math.sin(Math.PI / 180 * angle),
                x = (x1 - x2) / 2,
                y = (y1 - y2) / 2;
            var h = (x * x) / (rx * rx) + (y * y) / (ry * ry);
            if (h > 1) {
                h = Math.sqrt(h);
                rx = h * rx;
                ry = h * ry;
            }
            var rx2 = rx * rx,
                ry2 = ry * ry,
                k = (large_arc_flag == sweep_flag ? -1 : 1) *
                    Math.sqrt(Math.abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x))),
                cx = k * rx * y / ry + (x1 + x2) / 2,
                cy = k * -ry * x / rx + (y1 + y2) / 2,
                f1 = Math.asin(((y1 - cy) / ry).toFixed(9)),
                f2 = Math.asin(((y2 - cy) / ry).toFixed(9));

            f1 = x1 < cx ? Math.PI - f1 : f1;
            f2 = x2 < cx ? Math.PI - f2 : f2;
            f1 < 0 && (f1 = Math.PI * 2 + f1);
            f2 < 0 && (f2 = Math.PI * 2 + f2);
            if (sweep_flag && f1 > f2) {
                f1 = f1 - Math.PI * 2;
            }
            if (!sweep_flag && f2 > f1) {
                f2 = f2 - Math.PI * 2;
            }
        } else {
            f1 = recursive[0];
            f2 = recursive[1];
            cx = recursive[2];
            cy = recursive[3];
        }
        var df = f2 - f1;
        if (Math.abs(df) > _120) {
            var f2old = f2,
                x2old = x2,
                y2old = y2;
            f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
            x2 = cx + rx * Math.cos(f2);
            y2 = cy + ry * Math.sin(f2);
            res = arc2curve(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy]);
        }
        df = f2 - f1;
        var c1 = Math.cos(f1),
            s1 = Math.sin(f1),
            c2 = Math.cos(f2),
            s2 = Math.sin(f2),
            t =  Math.tan(df / 4),
            hx = 4 / 3 * rx * t,
            hy = 4 / 3 * ry * t,
            m1 = [x1, y1],
            m2 = [x1 + hx * s1, y1 - hy * c1],
            m3 = [x2 + hx * s2, y2 - hy * c2],
            m4 = [x2, y2];

        m2[0] = 2 * m1[0] - m2[0];
        m2[1] = 2 * m1[1] - m2[1];

        if (recursive) {
            return [m2, m3, m4].concat(res);
        } else {
            res = [m2, m3, m4].concat(res).join().split(",");
            var result = [];
            for (var i = 0, ii = res.length; i < ii; i++) {
                result[i] = i % 2 ? rotate(res[i - 1], res[i], rad).y : rotate(res[i], res[i + 1], rad).x;
            }
            return result;
        }
    }

    function intersection(path1, path2, count) {
        var ss1 = path1.curve().segments,
            ln1 = ss1.length,
            ss2 = path2.curve().segments,
            ln2 = ss2.length,
            res = count ? 0 : [];

        var x1, y1, x2, y2, x1m, y1m, x2m, y2m, bz1, bz2, cv1, cv2;
        var si, sj, i, j;
        var inter;  

        for (i = 0; i < ln1; i++) {
            si = ss1[i];
            if (si[0] == 'M') {
                x1 = x1m = si[1];
                y1 = y1m = si[2];
            } else {
                if (si[0] == 'C') {
                    bz1 = [['M', x1, y1], si];
                    cv1 = [x1, y1].concat(si.slice(1));
                    x1 = si[5];
                    y1 = si[6];
                } else {
                    bz1 = [['M', x1, y1], ['C', x1, y1, x1m, y1m, x1m, x1m]];
                    cv1 = [x1, y1, x1, y1, x1m, y1m, x1m, y1m];
                    x1 = x1m;
                    y1 = y1m;
                }

                for (j = 0; j < ln2; j++) {
                    sj = ss2[j];
                    if (sj[0] == 'M') {
                        x2 = x2m = sj[1];
                        y2 = y2m = sj[2];
                    } else {
                        if (sj[0] == 'C') {
                            bz2 = [['M', x2, y2], sj];
                            cv2 = [x2, y2].concat(sj.slice(1));
                            x2 = sj[5];
                            y2 = sj[6];
                        } else {
                            bz2 = [['M', x2, y2],['C', x2, y2, x2m, y2m, x2m, y2m]];
                            cv2 = [x2, y2, x2, y2, x2m, y2m, x2m, y2m];
                            x2 = x2m;
                            y2 = y2m;
                        }

                        if (count) {
                            res += Graph.util.curveIntersection(cv1, cv2, true);
                        } else {
                            inter = Graph.util.curveIntersection(cv1, cv2);

                            for (var k = 0, kk = inter.length; k < kk; k++) {
                                inter[k].segment1 = i;
                                inter[k].segment2 = j;
                                inter[k].bezier1 = bz1;
                                inter[k].bezier2 = bz2;
                            }

                            res = res.concat(inter);
                        }
                    }
                }
            }
        }

        return res;
    }

}());

(function(){
    
    var Matrix = Graph.lang.Matrix = Graph.extend({

        props: {
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: 0,
            f: 0    
        },

        constructor: function(a, b, c, d, e, f) {
            this.props.a = _.defaultTo(a, 1);
            this.props.b = _.defaultTo(b, 0);
            this.props.c = _.defaultTo(c, 0);
            this.props.d = _.defaultTo(d, 1);
            this.props.e = _.defaultTo(e, 0);
            this.props.f = _.defaultTo(f, 0);
        },

        x: function(x, y) {
            return x * this.props.a + y * this.props.c + this.props.e;
        },

        y: function(x, y) {
            return x * this.props.b + y * this.props.d + this.props.f;
        },
        
        get: function(chr) {
            return +this.props[chr].toFixed(4);
        },

        multiply: function(a, b, c, d, e, f) {
            var 
                result = [[], [], []],
                source = [
                    [this.props.a, this.props.c, this.props.e], 
                    [this.props.b, this.props.d, this.props.f], 
                    [0, 0, 1]
                ],
                matrix = [
                    [a, c, e], 
                    [b, d, f], 
                    [0, 0, 1]
                ];

            var x, y, z, tmp;

            if (Graph.isMatrix(a)) {
                matrix = [
                    [a.props.a, a.props.c, a.props.e], 
                    [a.props.b, a.props.d, a.props.f], 
                    [0, 0, 1]
                ];
            }

            for (x = 0; x < 3; x++) {
                for (y = 0; y < 3; y++) {
                    tmp = 0;
                    for (z = 0; z < 3; z++) {
                        tmp += source[x][z] * matrix[z][y];
                    }
                    result[x][y] = tmp;
                }
            }

            this.props.a = result[0][0];
            this.props.b = result[1][0];
            this.props.c = result[0][1];
            this.props.d = result[1][1];
            this.props.e = result[0][2];
            this.props.f = result[1][2];

            return this;
        },

        invert: function(clone) {
            var x = this.props.a * this.props.d - this.props.b * this.props.c;
            var a, b, c, d, e, f;

            clone = _.defaultTo(clone, false);

            a =  this.props.d / x;
            b = -this.props.b / x;
            c = -this.props.c / x;
            d =  this.props.a / x;
            e = (this.props.c * this.props.f - this.props.d * this.props.e) / x;
            f = (this.props.b * this.props.e - this.props.a * this.props.f) / x;

            if (clone) {
                return new Graph.matrix(a, b, c, d, e, f);
            } else {
                this.props.a = a;
                this.props.b = b;
                this.props.c = c;
                this.props.d = d;
                this.props.e = e;
                this.props.f = f;    

                return this;
            }
        },

        translate: function(x, y) {
            x = _.defaultTo(x, 0);
            y = _.defaultTo(y, 0);
            this.multiply(1, 0, 0, 1, x, y);

            return this;
        },

        rotate: function(angle, cx, cy) {
            if (angle === undefined) {
                
                var px = this.delta(0, 1),
                    py = this.delta(1, 0),
                    deg = 180 / Math.PI * Math.atan2(px.y, px.x) - 90,
                    rad = Graph.util.rad(deg);

                return {
                    deg: deg,
                    rad: rad
                };
            }

            angle = Graph.util.rad(angle);
            cx = _.defaultTo(cx, 0);
            cy = _.defaultTo(cy, 0);

            var cos = +Math.cos(angle).toFixed(9),
                sin = +Math.sin(angle).toFixed(9);

            this.multiply(cos, sin, -sin, cos, cx, cy);
            this.multiply(1, 0, 0, 1, -cx, -cy);

            return this;
        },

        scale: function(sx, sy, cx, cy) {
            if (sx === undefined) {
                var prop = this.props,
                    sx = Graph.util.hypo(prop.a, prop.b),
                    sy = Graph.util.hypo(prop.c, prop.d);

                if (this.determinant() < 0) {
                    sx = -sx;
                }

                return {
                    x: sx,
                    y: sy
                };
            }

            sy = _.defaultTo(sy, sx);

            if (cx || cy) {
                cx = _.defaultTo(cx, 0);
                cy = _.defaultTo(cy, 0);
            }

            (cx || cy) && this.multiply(1, 0, 0, 1, cx, cy);
            this.multiply(sx, 0, 0, sy, 0, 0);
            (cx || cy) && this.multiply(1, 0, 0, 1, -cx, -cy);
            
            return this;
        },
        
        determinant: function() {
            return this.props.a * this.props.d - this.props.b * this.props.c;
        },

        delta: function(x, y) {
            return {
                x: x * this.props.a + y * this.props.c + 0,
                y: x * this.props.b + y * this.props.d + 0
            };
        },

        data: function() {
            var px = this.delta(0, 1),
                py = this.delta(1, 0),
                skewX = 180 / Math.PI * Math.atan2(px.y, px.x) - 90,
                radSkewX = Graph.util.rad(skewX),
                cosSkewX = Math.cos(radSkewX),
                sinSkewX = Math.sin(radSkewX),
                scaleX = Graph.util.hypo(this.props.a, this.props.b),
                scaleY = Graph.util.hypo(this.props.c, this.props.d),
                radian = Graph.util.rad(skewX);

            if (this.determinant() < 0) {
                scaleX = -scaleX;
            }

            return {
                x: this.props.e,
                y: this.props.f,
                dx: (this.props.e * cosSkewX + this.props.f *  sinSkewX) / scaleX,
                dy: (this.props.f * cosSkewX + this.props.e * -sinSkewX) / scaleY,
                skewX: -skewX,
                skewY: 180 / Math.PI * Math.atan2(py.y, py.x),
                scaleX: scaleX,
                scaleY: scaleY,
                rotate: skewX,
                rad: radian,
                sin: Math.sin(radian),
                cos: Math.cos(radian),
                a: this.props.a,
                b: this.props.b,
                c: this.props.c,
                d: this.props.d,
                e: this.props.e,
                f: this.props.f
            };
        },

        /**
         * Convert to `matrix(...)` toString
         */
        toString: function() {
            var array = [
                this.get('a'),
                this.get('b'),
                this.get('c'),
                this.get('d'),
                this.get('e'),
                this.get('f')
            ];

            return 'matrix(' + _.join(array, ',') + ')';
        },

        toFilter: function() {
            return "progid:DXImageTransform.Microsoft.Matrix(" + 
               "M11=" + this.get('a') + ", " + 
               "M12=" + this.get('c') + ", " + 
               "M21=" + this.get('b') + ", " + 
               "M22=" + this.get('d') + ", " + 
               "Dx="  + this.get('e') + ", " + 
               "Dy="  + this.get('f') + ", " + 
               "sizingmethod='auto expand'"  + 
            ")";
        },

        toArray: function() {
            return [
                [this.get('a'), this.get('c'), this.get('e')], 
                [this.get('b'), this.get('d'), this.get('f')], 
                [0, 0, 1]
            ];
        },

        clone: function() {
            return new Matrix(
                this.props.a, 
                this.props.b, 
                this.props.c, 
                this.props.d, 
                this.props.e, 
                this.props.f
            );
        }

    });

    ///////// STATIC /////////
    
    Graph.lang.Matrix.toString = function() {
        return "function(a, b, c, d, e, f)";
    };  

    ///////// EXTENSION /////////
    
    Graph.isMatrix = function(obj) {
        return obj instanceof Graph.lang.Matrix;
    };

    Graph.matrix = function(a, b, c, d, e, f) {
        return new Graph.lang.Matrix(a, b, c, d, e, f);
    };
    
}());

(function(){

    var Collection = Graph.collection.Point = function(items) {
        this.items = items || [];
    };

    Collection.prototype.constructor = Collection;
    Collection.prototype.items = [];

    Collection.prototype.nth = function(index) {
        return _.nth(this.items, index);
    };

    Collection.prototype.push = function(item) {
        this.items.push(item);
        return item;
    };

    Collection.prototype.pop = function() {
        var item = this.items.pop();
        return item;
    };

    Collection.prototype.shift = function() {
        var item = this.items.shift();
        return item;
    };

    Collection.prototype.first = function() {
        return _.head(this.items);
    };

    Collection.prototype.last = function() {
        return _.last(this.items);
    };

    Collection.prototype.clear = function() {
        this.items = [];
        return this;
    },

    Collection.prototype.modify = function(index, x, y) {
        var item = this.items[index];
        item.props.x = x;
        item.props.y = y;
        return item;
    };

    Collection.prototype.each = function(iteratee) {
        _.forEach(this.items, iteratee);
    };

    Collection.prototype.toArray = function() {
        return this.items;
    };

    Collection.prototype.toJson = function() {
        return _.map(this.items, function(item){
            return item.toJson();
        });
    };

}());

(function(){

    var Collection = Graph.collection.Vector = Graph.extend({

        items: [],

        constructor: function(vectors) {
            this.items = _.map(vectors, function(v){
                return v.guid();
            });
        },

        has: function(vector) {
            var id = vector.guid();
            return _.indexOf(this.items, id) > -1;
        },
        
        not: function(vector) {
            var guid = vector.guid();

            var items = _.filter(this.items, function(o) {
                return o != guid;
            });

            return new Collection(items);
        },

        count: function() {
            return this.items.length;
        },

        index: function(vector) {
            var id = vector.guid();
            return _.indexOf(this.items, id);
        },
        
        push: function(vector) {
            var id = vector.guid();

            this.items.push(id);
            this.fire('push', {vector: vector});

            return this;
        },

        pop: function() {
            this.items.pop();
        },

        shift: function() {
            this.items.shift();
        },

        unshift: function(vector) {
            var id = vector.guid();

            this.items.unshift(id);
            this.fire('unshift', {vector: vector});

            return this;
        },

        pull: function(vector) {
            var id = vector.guid();

            _.pull(this.items, id);
            this.fire('pull', {vector: vector});

            return this;
        },

        clear: function() {
            this.items = [];
        },

        each: function(handler) {
            _.forEach(this.items, function(id){
                var vector = Graph.registry.vector.get(id);
                handler.call(vector, vector);
            });
        },
        
        bbox: function() {
            var x = [], y = [], x2 = [], y2 = [];
            var vector, box;

            for (var i = this.items.length - 1; i >= 0; i--) {
                vector = Graph.registry.vector.get(this.items[i]);
                box = vector.bbox().toJson();

                x.push(box.x);
                y.push(box.y);
                x2.push(box.x + box.width);
                y2.push(box.y + box.height);
            }   

            x  = _.min(x);
            y  = _.min(y);
            x2 = _.max(x2);
            y2 = _.max(y2);

            return Graph.bbox({
                x: x,
                y: y,
                x2: x2,
                y2: y2,
                width: x2 - x,
                height: y2 - y
            });
        },

        toArray: function() {
            return _.map(this.items, function(id){
                return Graph.registry.vector.get(id);
            });
        },

        toString: function() {
            return 'Graph.collection.Vector';
        }
    });

    Graph.collection.Vector.toString = function() {
        return 'function(vectors)';
    };

    ///////// COLLECTIVE METHOD /////////
    var methods = ['attr', 'remove'];

    _.forEach(methods, function(method){
        (function(method){
            Collection.prototype[method] = function() {
                var args = _.toArray(arguments);
                this.each(function(vector){
                    vector[method].apply(vector, args);
                });
                return this;
            };
        }(method));
    });
    
}());

(function(_, $){
    
    var REGEX_SVG_BUILDER = /^<(svg|g|rect|text|path|line|tspan|circle|polygon|defs|marker)/i;

    var domParser;

    ///////// BUILDER /////////
    
    Graph.dom = function(selector, context, query) {
        var fragment, element;

        if (domParser === undefined) {
            try {
                domParser = new DOMParser();
            } catch(e){
                domParser = null;
            }
        }

        query = _.defaultTo(query, false);

        if (_.isString(selector)) {
            if (REGEX_SVG_BUILDER.test(selector)) {
                if (domParser) {
                    fragment = '<g xmlns="'+ Graph.config.xmlns.svg +'">' + selector + '</g>';
                    element  = domParser.parseFromString(fragment, 'text/xml').documentElement.childNodes[0];
                    fragment = null;
                    element  = query ? $(element) : element;
                }
            } else {
                element = query ? $(selector, context) : $(selector, context)[0];
            }
        } else {
            if (Graph.isHTML(selector) || Graph.isSVG(selector)) {
                element = query ? $(selector) : selector;
            } else if (Graph.isElement(selector)) {
                element = query ? selector.query : selector.query[0];
            } else {
                // document, window, ...etc
                element = query ? $(selector) : selector;
            }
        }

        return element;
    };  

    Graph.dom.clone = function(node, deep) {
        return node.cloneNode(deep);
    };

    ///////// ELEMENT /////////
    
    var E = Graph.dom.Element = function(query) {
        this.query = $(query);
    };

    E.prototype.node = function() {
        return this.query[0];
    };

    E.prototype.length = function() {
        return this.query.length;
    };

    E.prototype.group = function(name) {
        if (name === undefined) {
            return this.query.data('component-group');
        }
        this.query.data('component-group', name);
        return this;
    };

    E.prototype.belong = function(group) {
        return this.group() == group;
    };

    E.prototype.attr = function(name, value) {
        var me = this, node = this.query[0];

        if (Graph.isHTML(node)) {
            this.query.attr(name, value);
        } else if (Graph.isSVG(node)) {

            if (_.isPlainObject(name)) {
                _.forOwn(name, function(v, k){
                    me.attr(k, v);
                });
                return this;
            }

            if (name.substring(0, 6) == 'xlink:') {
                node.setAttributeNS(Graph.config.xmlns.xlink, name.substring(6), _.toString(value));
            } else {
                node.setAttribute(name, _.toString(value));
            }
        }

        return this;
    };

    E.prototype.width = function(value) {
        if (value === undefined) {
            return this.query.width();
        }
        this.query.width(value);
        return this;
    };

    E.prototype.outerHeight = function(margin) {
        return this.query.outerHeight(margin);
    };

    E.prototype.height = function(value) {
        if (value === undefined) {
            return this.query.height();
        }
        this.query.height(value);
        return this;
    };

    E.prototype.show = function() {
        this.query.show();
        return this;
    };

    E.prototype.hide = function() {
        this.query.hide();
        return this;
    };

    E.prototype.offset = function() {
        return this.query.offset();
    };

    E.prototype.position = function() {
        return this.query.position();
    };

    E.prototype.css = function(name, value) {
        if (value === undefined) {
            return this.query.css(name);
        }
        this.query.css(name, value);
        return this;
    };

    E.prototype.addClass = function(classes) {
        var node = this.query[0];
        if (Graph.isHTML(node)) {
            this.query.addClass(classes);
        } else if (Graph.isSVG(node)) {
            var currentClasses = _.split(node.className.baseVal || '', ' ');
            classes = _.split(classes, ' ');
            classes = _.concat(currentClasses, classes);
            classes = _.uniq(classes);
            classes = _.join(classes, ' ');
            node.className.baseVal = _.trim(classes);
        }
        return this;
    };

    E.prototype.removeClass = function(classes) {
        var node = this.query[0];
        if (Graph.isHTML(node)) {
            this.query.removeClass(classes);
        }
        return this;
    };

    E.prototype.hasClass = function(clazz) {
        var node = this.query[0];

        if (Graph.isHTML(node)) {
            return this.query.hasClass(clazz); 
        } else if (Graph.isSVG(node)) {
            var classes = _.split(node.className.baseVal, ' ');
            return classes.indexOf(clazz) > -1;
        }

        return false;
    };

    E.prototype.find = function(selector) {
        return new Graph.dom.Element(this.query.find(selector));
    };

    E.prototype.parent = function() {
        return new Graph.dom.Element(this.query.parent());
    };

    E.prototype.closest = function(element) {
        return new Graph.dom.Element(this.query.closest(element));
    };

    E.prototype.append = function(element) {
        this.query.append(element.query);
        return this;
    };

    E.prototype.prepend = function(element) {
        this.query.prepend(element.query);
        return this;
    };

    E.prototype.appendTo = function(element) {
        this.query.appendTo(element.query);
        return this;
    };

    E.prototype.prependTo = function(element) {
        this.query.prependTo(element.query);
        return this;
    };

    E.prototype.before = function(element) {
        this.query.before(element.query);
        return this;
    };

    E.prototype.remove = function() {
        this.query.remove();
        this.query = null;
        return this;
    };

    E.prototype.detach = function() {
        this.query = this.query.detach();
        return this;
    };

    E.prototype.on = function(types, selector, data, fn, /*INTERNAL*/ one) {
        this.query.on.call(this.query, types, selector, data, fn, one);
        return this;
    };

    E.prototype.off = function(types, selector, fn) {
        this.query.off.call(this.query, types, selector, fn);
        return this;
    };

    E.prototype.trigger = function(type, data) {
        this.query.trigger(type, data);
        return this;
    };

    E.prototype.text = function(text) {
        if (text === undefined) {
            return this.query.text();
        }
        this.query.text(text);
        return this;
    };

    E.prototype.html = function(html) {
        if (html === undefined) {
            return this.query.html();
        }
        this.query.html(html);
        return this;
    };

    E.prototype.focus = function() {
        this.query.focus();
        return this;
    };

    E.prototype.contextmenu = function(state) {
        state = _.defaultTo(state, true);
        if ( ! state) {
            this.query.on('contextmenu', function(e){
                return false;
            });
        }
    };

    E.prototype.each = function(iteratee) {
        this.query.each(iteratee);
        return this;
    };

    E.prototype.empty = function() {
        this.query.empty();
        return this;
    };

    E.prototype.data = function(key, value) {
        if (value === undefined) {
            return this.query.data(key);
        }
        this.query.data(key, value);
        return this;
    };

    E.prototype.prop = function(name, value) {
        if (value === undefined) {
            return this.query.data(name);
        }
        this.query.prop(name, value);
        return this;
    };

    E.prototype.scrollTop = function(value) {
        if (value === undefined) {
            return this.query.scrollTop();
        }
        this.query.scrollTop(value);
        return this;
    };

    E.prototype.scrollLeft = function(value) {
        if (value === undefined) {
            return this.query.scrollLeft();
        }
        this.query.scrollLeft(value);
        return this;
    };

    E.prototype.toString = function() {
        return 'Graph.dom.Element';
    };
    
    /// HELPERS ///

    Graph.$ = function(selector, context) {
        var query = Graph.dom(selector, context, true);
        return new Graph.dom.Element(query);
    };

}(_, jQuery));

(function(){

    var Vector = Graph.svg.Vector = Graph.extend({

        tree: {
            container: null,
            paper: null, // root
            parent: null,
            children: null,
            next: null,
            prev: null
        },

        props: {
            id: null,
            guid: null,
            type: null,
            text: null,
            rotate: 0,
            scaleX: 1,
            scaleY: 1,
            traversable: true,
            selectable: true,
            focusable: false,
            snappable: false,
            selected: false,
            rendered: false,
            state: null
        },

        attrs: {
            // 'stroke': '#4A4D6E',
            // 'stroke-width': 1,
            // 'fill': 'none',
            'style': '',
            'class': ''
        },

        plugins: {
            transformer: null,
            collector: null,
            animator: null,
            resizer: null,
            reactor: null,
            dragger: null,
            dropper: null,
            network: null,
            history: null,
            sorter: null,
            panzoom: null,
            toolmgr: null,
            editor: null
        },

        utils: {
            collector: null,
            spotlight: null,
            definer: null,
            toolpad: null
        },

        graph: {
            matrix: null,
            layout: null
        },

        cached: {
            bbox: null,
            originalBBox: null,
            position: null,
            offset: null
        },

        elem: null,

        constructor: function(type, attrs) {
            var me = this;

            me.graph.matrix = Graph.matrix();
            me.tree.children = new Graph.collection.Vector();
            
            me.tree.children.on({
                push:    _.bind(me.onAppendChild, me),
                pull:    _.bind(me.onRemoveChild, me),
                unshift: _.bind(me.onPrependChild, me)
            });

            attrs = _.extend({
                id: 'graph-vector-' + (++Vector.guid)
            }, me.attrs, attrs || {});

            me.elem = Graph.$(document.createElementNS(Graph.config.xmlns.svg, type));
            
            // apply initial attributes
            me.attr(attrs);

            me.props.guid = me.props.id = me.attrs.id; // Graph.uuid();
            me.props.type = type;
            
            me.elem.data(Graph.string.ID_VECTOR, me.props.guid);

            // me.plugins.history = new Graph.plugin.History(me);
            me.plugins.transformer = (new Graph.plugin.Transformer(me))
                .on('translate', _.bind(me.onTransformTranslate, me))
                .on('rotate', _.bind(me.onTransformRotate, me))
                .on('scale', _.bind(me.onTransformScale, me));

            if (me.isPaper()) {
                me.plugins.toolmgr = (new Graph.plugin.ToolManager(me))
                    .on('activate', _.bind(me.onActivateTool, me))
                    .on('deactivate', _.bind(me.onDeactivateTool, me));    
            }
            
            Graph.registry.vector.register(this);
        },

        matrix: function(global) {
            var matrix, ctm;

            global = _.defaultTo(global, false);

            if (global) {
                ctm = this.node().getCTM();
                matrix = ctm ? Graph.matrix(
                    ctm.a,
                    ctm.b,
                    ctm.c,
                    ctm.d,
                    ctm.e,
                    ctm.f
                ) : this.graph.matrix;
            } else {
                matrix = this.graph.matrix;
            }

            return matrix;
        },
        
        layout: function(options) {
            if (options === undefined) {
                return this.graph.layout;
            }

            var clazz, layout;

            options = options == 'default' ? 'layout' : options;

            if (_.isString(options)) {
                clazz = Graph.layout[_.capitalize(options)];
                layout = Graph.factory(clazz, [this]);
            } else if (_.isPlainObject(options)) {
                if (options.name) {
                    clazz = Graph.layout[_.capitalize(options.name)];
                    delete options.name;   
                    layout = Graph.factory(clazz, [this, options]);
                }
            }
            
            layout.refresh();
            this.graph.layout = layout;

            return this;
        },

        reset: function() {
            this.graph.matrix = Graph.matrix();
            this.removeAttr('transform');
            this.props.rotate = 0;
            this.props.scale = 0;

            this.dirty(true);
            this.fire('reset', this.props);

            // invoke core plugins
            if (this.dragger) {
                this.dragger.rotate(0);
            }
        },

        invalidate: function(cache) {
            this.cached[cache] = null;
        },

        state: function(name) {
            if (name === undefined) {
                return this.props.state;    
            }
            this.props.state = name;
            return this;
        },

        dirty: function(state) {
            var me = this;

            if (state === undefined) {
                return me.cached.bbox === null;
            }
            
            if (state) {
                // invalidates
                for (var name in this.cached) {
                    me.cached[name] = null;
                }

                // update core plugins
                var plugins = ['resizer', 'network'];

                _.forEach(plugins, function(name){
                    if (me.plugins[name]) {
                        me.plugins[name].invalidate();
                    }
                });
            }
            
            return this;
        },

        /**
         * Get or set reactor plugin
         */
        interactable: function(options) {
            if ( ! this.plugins.reactor) {
                this.plugins.reactor = new Graph.plugin.Reactor(this, options);
            }
            return this.plugins.reactor;
        },

        /**
         * Get or set animator plugin
         */
        animable: function() {
            var me = this;

            if ( ! me.plugins.animator) {
                me.plugins.animator = new Graph.plugin.Animator(me);
                me.plugins.animator.on({
                    animstart: function(e) {
                        me.fire(e);
                    },
                    animating: function(e) {
                        me.fire(e);
                    },
                    animend: function(e) {
                        me.fire(e);
                    }
                })
            }
            return me.plugins.animator;
        },
        
        /**
         * Get or set resizer plugin
         */
        resizable: function(config) {
            if ( ! this.plugins.resizer) {
                this.plugins.resizer = new Graph.plugin.Resizer(this, config);
                this.plugins.resizer.on({
                    resize: _.bind(this.onResizerResize, this)
                });
            }
            return this.plugins.resizer;
        },

        /**
         * Get or set dragger plugin
         */
        draggable: function(config) {
            if ( ! this.plugins.dragger) {
                this.plugins.dragger = new Graph.plugin.Dragger(this, config);

                this.plugins.dragger.on({
                    dragstart: _.bind(this.onDraggerStart, this),
                    dragmove: _.bind(this.onDraggerMove, this),
                    dragend: _.bind(this.onDraggerEnd, this)
                });
            }
            return this.plugins.dragger;
        },

        /**
         * Get or set panzoom plugin
         */
        zoomable: function() {
            if ( ! this.plugins.panzoom) {
                this.plugins.panzoom = new Graph.plugin.Panzoom(this);
                this.plugins.toolmgr.register('panzoom');
            }
            return this.plugins.panzoom;
        },

        /**
         * Get or set dropzone/dropper plugin
         */
        droppable: function() {
            if ( ! this.plugins.dropper) {
                this.plugins.dropper = new Graph.plugin.Dropper(this);

                this.plugins.dropper.on({
                    dropenter: _.bind(this.onDropperEnter, this),
                    dropleave: _.bind(this.onDropperLeave, this)
                });
            }
            return this.plugins.dropper;
        },

        /**
         * Get or set sortable plugin
         */
        sortable: function(config) {
            if ( ! this.plugins.sorter) {
                this.plugins.sorter = new Graph.plugin.Sorter(this, config);
            }
            return this.plugins.sorter;
        },

        /**
         * Get or set network plugin
         */
        connectable: function(config) {
            if ( ! this.plugins.network) {
                this.plugins.network = new Graph.plugin.Network(this, config);
            }
            return this.plugins.network;
        },

        traversable: function(traversable) {
            traversable = _.defaultTo(traversable, true);
            this.props.traversable = traversable;

            return this;
        },

        selectable: function(selectable) {
            selectable = _.defaultTo(selectable, true);
            this.props.selectable = selectable;

            return this;
        },

        /**
         * Get or set clickable state
         */
        clickable: function(value) {
            var me = this;

            if (value === undefined) {
                return me.attrs['pointer-events'] || 'visiblePainted';
            }
            
            if (value) {
                this.attr('pointer-events', '');
            } else {
                this.attr('pointer-events', 'none');
            }
            
            return this;
        },

        /**
         * Get or set label editor plugin
         */
        editable: function(options) {
            var me = this;
            if ( ! this.plugins.editor) {
                this.plugins.editor = new Graph.plugin.Editor(this, options);
                this.plugins.editor.on({
                    beforeedit: function(e){
                        me.fire(e);
                    },
                    edit: function(e) {
                        me.fire(e);
                    }
                });
            }
            return this.plugins.editor;
        },

        snappable: function(options) {
            var me = this;
            var enabled;

            if (_.isBoolean(options)) {
                options = {
                    vector: me,
                    shield: me,
                    enabled: options
                };
            } else {
                options = _.extend({
                    vector: me,
                    shield: me,
                    enabled: true
                }, options || {});
            }

            me.props.snappable = options.enabled;

            if (me.props.rendered) {
                me.paper().snapping(options);
            } else {
                me.on('render', function(){
                    me.paper().snapping(options);
                });
            }
            
            return me;
        },

        id: function() {
            return this.props.id;
        },

        guid: function() {
            return this.props.guid;
        },  

        node: function() {
            return this.elem.node();
        },

        data: function(name, value) {
            var me = this;

            if (_.isPlainObject(name)) {
                _.forOwn(name, function(v, k){
                    me.props[k] = v;
                });
                return this;
            }

            if (name === undefined && value === undefined) {
                return me.props;
            }

            if (value === undefined) {
                return me.props[name];
            }

            me.props[name] = value;
            return this;
        },

        /**
         * Element properties
         */
        attr: function(name, value) {

            var me = this, node = me.node();

            if (_.isPlainObject(name)) {
                _.forOwn(name, function(v, k){
                    (function(v, k){
                        me.attr(k, v);
                    }(v, k));
                });
                return me;
            }

            if (name === undefined) {
                return me.attrs;
            }

            if (value === undefined) {
                return me.attrs[name] || '';
            }

            me.attrs[name] = value;

            if (value !== null) {
                if (name.substring(0, 6) == 'xlink:') {
                    node.setAttributeNS(Graph.config.xmlns.xlink, name.substring(6), _.toString(value));
                } else if (name == 'class') {
                    node.className.baseVal = _.toString(value);
                } else {
                    node.setAttribute(name, _.toString(value));
                }    
            }

            return me;
        },

        removeAttr: function(name) {
            this.node().removeAttribute(name);

            if (this.attrs[name]) {
                delete this.attrs[name];
            }
            return this;
        },

        style: function(name, value) {
            var me = this;
            
            if (_.isPlainObject(name)) {
                _.forOwn(name, function(v, k){
                    me.style(k, v);
                });
                return this;
            }

            this.elem.css(name, value);
            return this;
        },

        // set/get pointer style
        cursor: function(style) {
            this.elem.css('cursor', style);
        },

        hasClass: function(predicate) {
            return _.indexOf(_.split(this.attrs['class'], ' '), predicate) > -1;
        },

        addClass: function(added) {
            var classes = _.chain(this.attrs['class']).split(' ').concat(_.split(added, ' ')).uniq().join(' ').trim().value();
            this.attr('class', classes);
            return this;
        },

        removeClass: function(removed) {
            var classes = _.split(this.attrs['class'], ' '),
                removal = _.isArray(removed) ? removed : _.split(removed, ' ');

            _.pullAll(classes, removal);

            this.attr('class', _.join(classes, ' '));
            return this;
        },

        hide: function() {
            this.elem.hide();
        },

        show: function() {
            this.elem.show();
        },

        pathinfo: function() {
            return new Graph.lang.Path([]);
        },

        vertices: function() {
            return [];
        },

        dots: function(absolute) {
            var ma, pa, ps, dt;

            absolute = _.defaultTo(absolute, false);

            ma = this.matrix(absolute);
            pa = this.pathinfo().transform(ma);
            ps = pa.segments;
            dt = [];

            _.forEach(ps, function(seg){
                var x, y;
                if (seg[0] != 'Z') {
                    x = seg[seg.length - 2];
                    y = seg[seg.length - 1];
                    dt.push([x, y]);
                }
            });

            return dt;
        },

        dotval: function(x, y) {
            var mat = this.graph.matrix;
            return {
                x: mat.x(x, y), 
                y: mat.y(x, y)
            };
        },

        dimension: function() {
            var size = {},
                node = this.node();
                     
            try {
                size = node.getBBox();
            } catch(e) {
                size = {
                    x: node.clientLeft,
                    y: node.clientTop,
                    width: node.clientWidth,
                    height: node.clientHeight
                };
            } finally {
                size = size || {};
            }

            return size;
        },

        /**
         * Get absolute position
         */
        offset: function() {
            var node = this.node(),
                bbox = node.getBoundingClientRect();
            
            var offset = {
                top: bbox.top,
                left: bbox.left,
                bottom: bbox.bottom,
                right: bbox.right,
                width: bbox.width,
                height: bbox.height
            }
            
            return offset;
        },

        /**
         * Get relative posisition to canvas
         */
        position: function() {
            if ( ! this.cached.position) {
                var node = this.node(),
                    nbox = node.getBoundingClientRect(),
                    pbox = position(node);

                this.cached.position = {
                    top: nbox.top - pbox.top,
                    left: nbox.left - pbox.left,
                    bottom: nbox.bottom - pbox.top,
                    right: nbox.right - pbox.left,
                    width: nbox.width,
                    height: nbox.height
                };
            }

            return this.cached.position;
        },

        bbox: function(original) {
            var path, bbox;

            original = _.defaultTo(original, false);
            
            if (original) {
                bbox = this.cached.originalBBox;
                if ( ! bbox) {
                    path = this.pathinfo();
                    bbox = path.bbox();
                    this.cached.originalBBox = bbox;
                }
            } else {
                bbox = this.cached.bbox;
                if ( ! bbox) {
                    path = this.pathinfo().transform(this.matrix());
                    bbox = path.bbox();
                    this.cached.bbox = bbox;
                } 
            }
            
            path = null;
            return bbox;
        },

        find: function(selector) {
            var elems = this.elem.find(selector),
                vectors = [];

            elems.each(function(i, node){
                vectors.push(Graph.registry.vector.get(node));
            });

            return new Graph.collection.Vector(vectors);
        },

        holder: function() {
            return this.isPaper()
                ? Graph.$(this.node().parentNode) 
                : Graph.$(this.paper().node().parentNode);
        },
        
        append: function(vector) {
            var me = this;

            if (_.isArray(vector)) {
                _.forEach(vector, function(v){
                    me.append(v);
                });
                return me;
            }

            if (_.isString(vector)) {
                var clazz = Graph.svg[_.capitalize(vector)];
                vector = Graph.factory(clazz, []);
            }

            vector.render(this, 'append');

            return me;
        },

        prepend: function(vector) {
            vector.render(this, 'prepend');
            return vector;
        },

        render: function(container, method) {
            var me = this,
                guid = me.guid(),
                traversable = me.props.traversable;
            
            if (me.props.rendered) {
                return me;
            }

            container = _.defaultTo(container, me.paper());
            method = _.defaultTo(method, 'append');

            if (container) {
                
                if (container.isPaper()) {
                    container = container.viewport();
                }

                me.tree.paper = container.tree.paper;

                if (traversable) {
                    me.tree.parent = container.guid();
                }

                switch(method) {
                    case 'append':
                        container.elem.append(me.elem);
                        
                        if (traversable) {
                            container.children().push(me);
                        }

                        break;

                    case 'prepend':
                        container.elem.prepend(me.elem);

                        if (traversable) {
                            container.children().unshift(me);
                        }

                        break;
                }

                // broadcast
                if (container.props.rendered) {
                    me.props.rendered = true;
                    me.fire('render');

                    var paper = container.isViewport() ? container.paper() : null;

                    if (paper) {
                        Graph.registry.vector.setContext(guid, me.tree.paper);
                    }

                    me.cascade(function(c){
                        if (c !== me && ! c.props.rendered) {
                            c.props.rendered = true;
                            c.tree.paper = me.tree.paper;
                            c.fire('render');

                            if (paper) {
                                Graph.registry.vector.setContext(c.props.guid, me.tree.paper);
                            }
                        }
                    });
                }
            }

            return me;
        },

        children: function() {
            return this.tree.children;
        },

        ancestors: function() {
            var me = this, ancestors = [], papa;
            
            while((papa = me.parent()) && ! papa.isPaper()) {
                ancestors.push(papa);
                papa = papa.parent();
            }

            return new Graph.collection.Vector(ancestors);
        },

        descendants: function() {
            var me = this, descendants = [];
            
            me.cascade(function(v){
                if (v !== me) {
                    descendants.push(v);
                }
            });

            return new Graph.collection.Vector(descendants);
        },

        paper: function() {
            if (this.isPaper()) {
                return this;
            } else {
                return Graph.registry.vector.get(this.tree.paper);
            }
        },  

        parent: function() {
            return Graph.registry.vector.get(this.tree.parent);
        },

        prev: function() {
            return Graph.registry.vector.get(this.tree.prev);
        },
        
        next: function() {
            return Graph.registry.vector.get(this.tree.next);
        },

        cascade: function(handler) {
            cascade(this, handler);
        },

        bubble: function(handler) {
            return bubble(this, handler);
        },

        remove: function() {
            var parent = this.parent();

            if (this.$collector) {
                this.$collector.decollect(this);
            }

            // destroy plugins
            for (var name in this.plugins) {
                if (this.plugins[name]) {
                    this.plugins[name].destroy();
                    this.plugins[name] = null;    
                }
            }

            if (parent) {
                parent.children().pull(this);
            }
            
            if (this.elem) {
                this.elem.remove();
                this.elem = null;
            }
            
            Graph.registry.vector.unregister(this);
            
            this.fire('remove');
        },

        empty: function() {
            var me = this;

            me.cascade(function(c){
                if (c !== me) {
                    Graph.registry.vector.unregister(c);    
                }
            });

            this.children().clear();
            this.elem.empty();

            return this;
        },

        select: function() {
            this.addClass('graph-selected');
            this.props.selected = true;
            this.fire('select');

            // invoke core plugins to increase performance
            if (this.plugins.resizer) {
                this.plugins.resizer.resume();
            }

            // publish
            Graph.topic.publish('vector/select', {vector: this});

            return this;
        },

        deselect: function() {
            this.removeClass('graph-selected');
            this.props.selected = false;
            this.fire('deselect');

            // invoke core plugins to increase performance
            if (this.plugins.resizer) {
                if ( ! this.plugins.resizer.props.suspended) {
                    this.plugins.resizer.suspend();
                }
            }

            if ( ! this.$collector) {
                Graph.topic.publish('vector/deselect', {vector: this});
            }

            return this;
        },

        transform: function(command) {
            return this.plugins.transformer.transform(command);
        },

        translate: function(dx, dy) {
            return this.plugins.transformer.translate(dx, dy);
        },

        scale: function(sx, sy, cx, cy) {
            if (sx === undefined) {
                return this.matrix(true).scale();
            }
            return this.plugins.transformer.scale(sx, sy, cx, cy);
        },

        rotate: function(deg, cx, cy) {
            return this.plugins.transformer.rotate(deg, cx, cy);
        },

        animate: function(params, duration, easing, callback) {
            if (this.plugins.animator) {
                this.plugins.animator.animate(params, duration, easing, callback);
                return this.plugins.animator;
            }
            return null;
        },

        label: function(label) {
            this.elem.text(label);
            return this;
        },

        /**
         * Difference matrix between local and global
         */
        deltaMatrix: function() {
            
        },

        backward: function() {
            var papa = this.parent();
            if (papa) {
                papa.elem.prepend(this.elem);
            }
        },

        forward: function() {
            var papa = this.parent();
            if (papa) {
                papa.elem.append(this.elem);
            }
        },

        front: function() {
            if ( ! this.tree.paper) {
                return this;
            }
            this.paper().elem.append(this.elem);
            return this;
        },  

        back: function() {
            if ( ! this.tree.paper) {
                return this;
            }
            this.paper().elem.prepend(this.elem);
            return this;
        },

        focus: function(state) {
            var paper = this.paper(), timer;
            if (paper && paper.utils.spotlight) {
                state = _.defaultTo(state, true);
                timer = _.delay(function(vector, state){
                    clearTimeout(timer);
                    paper.utils.spotlight.focus(vector, state);
                }, 0, this, state);
            }
        },

        resize: function(sx, sy, cx, cy, dx, dy) {
            return this;
        },

        isGroup: function() {
            return this.props.type == 'g';
        },

        isPaper: function() {
            return this.props.type == 'svg';
        },

        isViewport: function() {
            return this.props.viewport === true;
        },

        isTraversable: function() {
            return this.props.traversable;
        },  

        isSelectable: function() {
            return this.props.selectable;
        },

        isDraggable: function() {
            return this.plugins.dragger !== null;
        },

        isResizable: function() {
            return this.plugins.resizer !== null;
        },

        isConnectable: function() {
            return this.plugins.network ? true : false;
        },

        isSnappable: function() {
            return this.props.snappable;
        },

        isRendered: function() {
            return this.props.rendered;
        },

        ///////// TOOLS //////////
        
        tool: function() {
            return this.plugins.toolmgr;
        },

        toString: function() {
            return 'Graph.svg.Vector';
        },

        ///////// OBSERVERS /////////

        onResizerResize: function(e) {
            this.dirty(true);
            // forward
            this.fire(e);

            // publish
            Graph.topic.publish('vector/resize', e);
        },

        onDraggerStart: function(e) {
            // forward event
            this.fire(e);

            if (this.$collector) {
                this.$collector.syncDragStart(this, e);
            }

            // invoke core plugins
            if (this.plugins.resizer) {
                this.plugins.resizer.suspend();
            }

            if (this.plugins.editor) {
                this.plugins.editor.suspend();
            }
        },

        onDraggerMove: function(e) {
            // forward event
            this.fire(e);

            if (this.$collector) {
                this.$collector.syncDragMove(this, e);
            }
        },

        onDraggerEnd: function(e) {
            this.dirty(true);
            // forward
            this.fire(e);

            // publish
            Graph.topic.publish('vector/dragend', e);

            if (this.$collector) {
                this.$collector.syncDragEnd(this, e);
            }

            // invoke plugins
            if (this.plugins.resizer) {
                this.plugins.resizer.resume();
                if ( ! this.props.selected) {
                    this.plugins.resizer.suspend();
                }
            }

        },

        onDropperEnter: function(e) {
            this.fire(e);
        },

        onDropperLeave: function(e) {
            this.fire(e);
        },

        onTransformRotate: function(e) {
            this.dirty(true);

            this.props.rotate = e.deg;
            this.fire('rotate', {deg: e.deg});

            // invoke core plugins
            if (this.plugins.dragger) {
                var rotate = this.matrix(true).rotate();
                this.plugins.dragger.rotate(rotate.deg);
            }
        },

        onTransformTranslate: function(e) {
            this.dirty(true);
            this.fire('translate', {dx: e.dx, dy: e.dy});
        },

        onTransformScale: function(e) {
            this.dirty(true);
            this.props.scaleX = e.sx;
            this.props.scaleY = e.sy;

            this.fire('scale', {sx: e.sx, sy: e.sy});

            if (this.plugins.dragger) {
                var scale = this.matrix(true).scale();
                this.plugins.dragger.scale(scale.x, scale.y);
            }
        },

        onActivateTool: function(e) {
            var data = e.originalData;
            this.fire('activatetool', data);
        },

        onDeactivateTool: function(e) {
            var data = e.originalData
            this.fire('deactivatetool', data);
        },

        onAppendChild: function(e) {
            // forward
            this.fire('appendchild', {child: e.vector});
        },

        onRemoveChild: function(e) {
            // forward
            this.fire('removechild', {child: e.vector});
        },

        onPrependChild: function(e) {
            // forwad
            this.fire('prependchild', {child: e.vector});
        }

    });

    ///////// STATICS /////////
    
    Vector.toString = function() {
        return 'function(tag)';
    };

    Vector.guid = 0;

    ///////// LANGUAGE CHECK /////////
    Graph.isVector = function(obj) {
        return obj instanceof Graph.svg.Vector;
    };
    
    ///////// HELPERS /////////
    
    function cascade(vector, handler) {
        var child = vector.children().toArray();

        handler.call(vector, vector);
        
        if (child.length) {
            _.forEach(child, function(c){
                cascade(c, handler);
            });    
        }
    }

    function bubble(vector, handler) {
        var parent = vector.parent();
        var result;

        result = handler.call(vector, vector);
        result = _.defaultTo(result, true);
        
        if (result && parent) {
            return bubble(parent, handler);
        }
    }

    function position(node) {
        if (node.parentNode) {
            if (node.parentNode.nodeName == 'svg') {
                return node.parentNode.getBoundingClientRect();
            }
            return position(node.parentNode);
        }

        return {
            top: 0,
            left: 0
        };  
    }

}());

(function(){

    Graph.svg.Ellipse = Graph.extend(Graph.svg.Vector, {
        attrs: {
            // 'stroke': '#696B8A',
            // 'stroke-width': 1,
            // 'fill': '#ffffff',
            // 'style': '',
            'class': Graph.string.CLS_VECTOR_ELLIPSE
        },

        constructor: function(cx, cy, rx, ry) {
            
            // this.$super('ellipse', {
            //     cx: cx,
            //     cy: cy,
            //     rx: rx,
            //     ry: ry
            // });

            this.superclass.prototype.constructor.call(this, 'ellipse', {
                cx: cx,
                cy: cy,
                rx: rx,
                ry: ry
            });
        },

        pathinfo: function() {
            var a = this.attrs;

            return Graph.path([
                ['M', a.cx, a.cy],
                ['m', 0, -a.ry],
                ['a', a.rx, a.ry, 0, 1, 1, 0,  2 * a.ry],
                ['a', a.rx, a.ry, 0, 1, 1, 0, -2 * a.ry],
                ['z']
            ]);
        },
        
        resize: function(sx, sy, cx, cy, dx, dy) {
            var matrix = this.graph.matrix.clone().scale(sx, sy, cx, cy),
                rotate = this.props.rotate;

            var mx = matrix.x(this.attrs.cx, this.attrs.cy),
                my = matrix.y(this.attrs.cx, this.attrs.cy),
                rx = this.attrs.rx * sx,
                ry = this.attrs.ry * sy;

            var gx, gy;

            this.reset();

            this.attr({
                cx: mx,
                cy: my,
                rx: rx,
                ry: ry
            });

            if (rotate) {
                this.rotate(rotate, mx, my).commit();    
            }

            var bb = this.bbox().toJson();

            gx = mx - rx - dx;
            gy = my - ry - dy;

            gx = bb.x;
            gy = bb.y;

            return  {
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
                    cx: mx,
                    cy: my
                },
                magnify: {
                    cx: gx,
                    cy: gy
                }
            };
        },
        toString: function() {
            return 'Graph.svg.Ellipse';
        }
    });

    ///////// STATIC /////////
    
    Graph.svg.Ellipse.toString = function() {
        return "function(cx, cy, rx, ry)";
    };

}());

(function(){

    Graph.svg.Circle = Graph.extend(Graph.svg.Vector, {

        attrs: {
            // 'stroke': '#696B8A',
            // 'stroke-width': 1,
            // 'fill': '#ffffff',
            'style': '',
            'class': Graph.string.CLS_VECTOR_CIRCLE
        },
        
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

        pathinfo: function() {
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
    
    Graph.svg.Circle.toString = function() {
        return "function(cx, cy, r)";
    };  

}());

(function(){

    Graph.svg.Rect = Graph.extend(Graph.svg.Vector, {

        attrs: {
            // 'stroke': '#333333',
            // 'stroke-width': 1,
            // 'fill': '#ffffff',
            'style': '',
            // 'shape-rendering': 'crispEdges',
            'class': Graph.string.CLS_VECTOR_RECT
        },

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
            
            me.origpath = me.pathinfo();
        },

        attr: function(name, value) {
            var result = this.superclass.prototype.attr.apply(this, [name, value]);

            if (name == 'rx' && value !== undefined) {
                this.attrs.r = this.attrs.rx;    
            }

            return result;
        },

        pathinfo: function() {
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
    
    Graph.svg.Rect.toString = function() {
        return 'function(x, y, width, height, r)';
    };

}());

(function(){

    Graph.svg.Path = Graph.extend(Graph.svg.Vector, {

        attrs: {
            // 'stroke': '#696B8A',
            // 'stroke-width': 1,
            // 'fill': 'none',
            'style': '',
            'class': Graph.string.CLS_VECTOR_PATH
        },

        constructor: function(d) {
            if ( ! d) {
                d = [['M', 0, 0]];
            }

            if (_.isArray(d)) {
                d = Graph.path(Graph.util.segments2path(d)).absolute().toString();
            } else if (d instanceof Graph.lang.Path) {
                d = d.toString();
            } else {
                d = Graph.path(d).absolute().toString();
            }

            this.superclass.prototype.constructor.call(this, 'path', {
                d: d
            });
        },

        pathinfo: function() {
            return Graph.path(this.attrs.d)
        },

        segments: function() {
            return this.pathinfo().segments;
        },

        intersection: function(path, dots) {
            return this.pathinfo().intersection(path.pathinfo(), dots);
        },

        intersectnum: function(path) {
            return this.pathinfo().intersectnum(path.pathinfo());
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
            return this.pathinfo().slice(from, to);
        },

        pointAt: function(length) {
            return this.pathinfo().pointAt(length);
        },

        length: function() {
            return this.pathinfo().length();
        },

        addVertext: function(vertext) {
            var path = this.pathinfo();

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
                pa = this.pathinfo(),
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
            var path = this.pathinfo();
            
            path.moveTo(x, y);
            this.attr('d', path.command());

            return this;
        },

        lineTo: function(x, y, append) {
            var path = this.pathinfo();
            
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
    
    Graph.svg.Path.toString = function() {
        return 'function(d)';
    };

}());
(function(){

    Graph.svg.Polyline = Graph.extend(Graph.svg.Vector, {
        attrs: {
            // 'stroke': '#696B8A',
            // 'stroke-width': 1,
            // 'fill': '#ffffff',
            'style': '',
            'class': Graph.string.CLS_VECTOR_POLYLINE
        },

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
            
            this.superclass.prototype.constructor.call(this, 'polyline', {
                points: points
            });
        },

        pathinfo: function() {
            var command = Graph.util.polygon2path(this.attrs.points);
            command = command.replace(/Z/i, '');
            return Graph.path(command);
        },

        attr: function(name, value) {
            if (name == 'points' && _.isArray(value)) {
                value = _.join(_.map(value, function(p){
                    return p[0] + ',' + p[1];
                }), ' ');
            }
            
            return this.superclass.prototype.attr.call(this, name, value); // this.$super(name, value);
        },
        toString: function() {
            return 'Graph.svg.Polyline';
        }
    });

    ///////// STATIC /////////
    
    Graph.svg.Polyline.toString = function() {
        return 'function(points)';
    };

}());

(function(){

    Graph.svg.Polygon = Graph.extend(Graph.svg.Vector, {
        
        attrs: {
            // 'stroke': '#696B8A',
            // 'stroke-width': 1,
            // 'fill': '#ffffff',
            'style': '',
            'class': Graph.string.CLS_VECTOR_POLYGON
        },

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

        pathinfo: function() {
            var command = Graph.util.polygon2path(this.attrs.points);
            return Graph.path(command);
        },
        
        resize: function(sx, sy, cx, cy, dx, dy) {
            var matrix = this.graph.matrix.clone(),
                origin = this.graph.matrix.clone(),
                rotate = this.props.rotate,
                ps = this.pathinfo().segments,
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
    
    Graph.svg.Polygon.toString = function() {
        return 'function(points)';
    };

}());

(function(){

    Graph.svg.Group = Graph.extend(Graph.svg.Vector, {

        attrs: {
            'stroke': null,
            'stroke-width': null,
            'class': null,
            'fill': null,
            'style': null
        },
        
        constructor: function(x, y) {
            // this.$super('g');
            this.superclass.prototype.constructor.call(this, 'g');

            if (x !== undefined && y !== undefined) {
                this.graph.matrix.translate(x, y);
                this.attr('transform', this.graph.matrix.toString());
            }
        },

        pathinfo: function() {
            var size = this.dimension();

            return new Graph.lang.Path([
                ['M', size.x, size.y], 
                ['l', size.width, 0], 
                ['l', 0, size.height], 
                ['l', -size.width, 0], 
                ['z']
            ]);
        },

        toString: function() {
            return 'Graph.svg.Group';
        }
        
    });

    ///////// STATIC /////////
    
    Graph.svg.Group.toString = function() {
        return 'function(x, y)';
    };

}());

(function(){

    Graph.svg.Text = Graph.extend(Graph.svg.Vector, {
        
        attrs: {
            // 'stroke': '#000000',
            // 'stroke-width': .05,
            // 'fill': '#000000',
            // 'font-size': '12px',
            // 'font-family': 'Arial',
            'text-anchor': 'middle',
            'class': Graph.string.CLS_VECTOR_TEXT
        },  

        props: {
            id: '',
            guid: '',
            text: '',
            type: 'text',
            rotate: 0,
            lineHeight: 1,
            fontSize: 12,
            traversable: true,
            focusable: false,
            selectable: true,
            selected: false,
            rendered: false
        },

        rows: [],

        constructor: function(x, y, text) {
            // this.$super('text', {
            //     x: _.defaultTo(x, 0),
            //     y: _.defaultTo(y, 0)
            // });

            this.superclass.prototype.constructor.call(this, 'text', {
                x: _.defaultTo(x, 0),
                y: _.defaultTo(y, 0)
            });

            this.attr({
                'font-size': Graph.config.font.size,
                'font-family': Graph.config.font.family
            });

            if (text) {
                this.write(text);
            }
            
            this.on('render', _.bind(this.onTextRender, this));
        },

        attr: function(name, value) {
            var result = this.superclass.prototype.attr.apply(this, [name, value]);
            
            if (name == 'font-size' && value !== undefined) {
                this.props.fontSize = _.parseInt(value) || 12;
            }

            return result;
        },

        write: function(text) {
            var me = this, parts, span;

            if (text === undefined) {
                return me.props.text;
            }

            parts = (text || '').split("\n");

            me.empty();
            me.rows = [];

            _.forEach(parts, function(t, i){
                me.addSpan(t);
            });

            me.props.text = text;
            me.cached.bbox = null;
        },

        addSpan: function(text) {
            var me = this, span;

            text = _.defaultTo(text, '');

            span = Graph.$('<tspan/>');
            span.text(text);

            me.elem.append(span);
            me.rows.push(span);

            return span;
        },

        /**
         * Arrange position
         */
        arrange: function() {
            var rows = this.rows,
                size = this.props.fontSize,
                line = this.props.lineHeight,
                bbox = this.bbox().toJson();

            if (rows.length) {
                for (var i = 0, ii = rows.length; i < ii; i++) {
                    if (i) {
                        rows[i].attr('x', this.attrs.x);
                        rows[i].attr('dy', size * line);
                    }
                }

                rows[0].attr('dy', 0);

                // var box = this.bbox().toJson(),
                //     off = this.attrs.y - (box.y + box.height / 2);

                // if (off) {
                //     rows[0].setAttribute('dy', off);    
                // }
                
            }
        },

        wrap: function(width) {
            var text = this.props.text,
                words = text.split(/\s+/).reverse(),
                lines = [],
                lineNo = 0,
                lineHeight = this.props.lineHeight,
                ax = this.attrs.x,
                ay = this.attrs.y,
                dy = 0;

            var word, span;

            this.empty();

            span = this.addSpan();
            span.attr({
                x: ax, 
                y: ay, 
                dy: dy + 'em'
            });

            while((word = words.pop())) {
                lines.push(word);
                span.text(lines.join(' '));
                if (span.node().getComputedTextLength() > width) {
                    lines.pop();
                    span.text(lines.join(' '));
                    lines = [word];
                    span = this.addSpan(word);
                    span.attr({
                        x: ax, 
                        y: ay, 
                        dy: (++lineNo * lineHeight) + 'em'
                    });
                }
            }
        },

        center: function(target) {
            if (target) {
                var targetBox = target.bbox().toJson(),
                    matrix = this.graph.matrix.data();

                var textBox, dx, dy, cx, cy;

                this.reset();

                textBox = this.bbox().toJson();   

                dx = targetBox.width / 2;
                dy = targetBox.height / 2;
                cx = textBox.x + textBox.width / 2;
                cy = textBox.y + textBox.height / 2;

                if (matrix.rotate) {
                    this.translate(dx, dy).rotate(matrix.rotate).commit();
                } else {
                    this.translate(dx, dy).commit();
                }

            }
        },

        pathinfo: function() {
            var size = this.dimension();

            return new Graph.lang.Path([
                ['M', size.x, size.y], 
                ['l', size.width, 0], 
                ['l', 0, size.height], 
                ['l', -size.width, 0], 
                ['z']
            ]);

        },

        toString: function() {
            return 'Graph.svg.Text';
        },

        onTextRender: function() {
            var me = this;
            me.arrange();
        }
    });

    ///////// STATIC /////////
    
    Graph.svg.Text.toString = function() {
        return 'function(x, y, text)';
    };

}());

(function(){

    Graph.svg.Image = Graph.extend(Graph.svg.Vector, {

        attrs: {
            preserveAspectRatio: 'none',
            class: Graph.string.CLS_VECTOR_IMAGE
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

        pathinfo: function() {
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
                ro = this.graph.matrix.data().rotate;

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
    
    Graph.svg.Image.toString = function() {
        return 'function(src, x, y, width, height)';
    };

}());

(function(){

    Graph.svg.Line = Graph.extend(Graph.svg.Vector, {

        attrs: {
            // 'stroke': '#696B8A',
            // 'stroke-width': 1,
            // 'stroke-linecap': 'butt',
            'class': Graph.string.CLS_VECTOR_LINE
        },

        constructor: function(x1, y1, x2, y2) {
            var args = _.toArray(arguments);

            if (args.length === 1) {
                var start = args[0].start().toJson(),
                    end = args[0].end().toJson();

                x1 = start.x;
                y1 = start.y;
                x2 = end.x;
                y2 = end.y;
            } else if (args.length === 2) {
                if (Graph.isPoint(args[0])) {
                    x1 = args[0].props.x;
                    y1 = args[0].props.y;
                    x2 = args[1].props.x;
                    y2 = args[1].props.y;
                } else {
                    x1 = args[0].x;
                    y1 = args[0].y;
                    x2 = args[1].x;
                    y2 = args[1].y;
                }
                
            }

            // this.$super('line', {
            //     x1: _.defaultTo(x1, 0),
            //     y1: _.defaultTo(y1, 0),
            //     x2: _.defaultTo(x2, 0),
            //     y2: _.defaultTo(y2, 0)
            // });
            
            this.superclass.prototype.constructor.call(this, 'line', {
                x1: _.defaultTo(x1, 0),
                y1: _.defaultTo(y1, 0),
                x2: _.defaultTo(x2, 0),
                y2: _.defaultTo(y2, 0)
            });
        },

        toString: function() {
            return 'Graph.svg.Line';
        }

    });

    ///////// STATIC /////////
    
    Graph.svg.Line.toString = function() {
        return "function(x1, y1, x2, y2)";
    };

}());

(function(){

    /**
     * Paper - root viewport
     */

    var Paper = Graph.svg.Paper = Graph.extend(Graph.svg.Vector, {

        attrs: {
            'class': Graph.string.CLS_VECTOR_SVG
        },

        props: {
            id: null,
            guid: null,
            type: 'paper',
            text: null,
            rotate: 0,

            traversable: false,
            selectable: false,
            selected: false,
            focusable: false,

            rendered: false,
            showOrigin: true,
            zoomable: true
        },

        components: {
            viewport: null
        },

        constructor: function(width, height, options) {
            var me = this;

            me.superclass.prototype.constructor.call(me, 'svg', {
                'xmlns': Graph.config.xmlns.svg,
                'xmlns:link': Graph.config.xmlns.xlink,
                'version': Graph.config.svg.version
                // 'width': _.defaultTo(width, 200),
                // 'height': _.defaultTo(height, 200)
            });

            _.assign(me.props, options || {});

            me.style({
                overflow: 'hidden',
                position: 'relative'
            });

            me.interactable();
            me.initLayout();

            me.plugins.collector = new Graph.plugin.Collector(me);
            me.plugins.toolmgr.register('collector', 'plugin');

            me.plugins.linker = new Graph.plugin.Linker(me);
            me.plugins.toolmgr.register('linker', 'plugin');

            me.plugins.pencil = new Graph.plugin.Pencil(me);
            me.plugins.definer = new Graph.plugin.Definer(me);

            me.plugins.snapper = new Graph.plugin.Snapper(me);

            me.utils.spotlight = new Graph.util.Spotlight(me);
            me.utils.toolpad = new Graph.util.Toolpad(me);
            
            me.on('pointerdown', _.bind(me.onPointerDown, me));
            me.on('keynavdown', _.bind(me.onKeynavDown, me));
            me.on('keynavup', _.bind(me.onKeynavUp, me));

            // subscribe topics
            Graph.topic.subscribe('link/update', _.bind(me.listenLinkUpdate, me));
            Graph.topic.subscribe('link/remove', _.bind(me.listenLinkRemove, me));
            Graph.topic.subscribe('shape/draw',  _.bind(me.listenShapeDraw, me));
        },

        initLayout: function() {
            // create viewport
            var viewport = (new Graph.svg.Group())
                .addClass(Graph.string.CLS_VECTOR_VIEWPORT)
                .selectable(false);

            viewport.props.viewport = true;
            
            this.components.viewport = viewport.guid();

            if (this.props.showOrigin) {
                var origin = Graph.$(
                    '<g class="graph-origin">' + 
                        '<rect class="x" rx="1" ry="1" x="-16" y="-2" height="2" width="30"></rect>' + 
                        '<rect class="y" rx="1" ry="1" x="-2" y="-16" height="30" width="2"></rect>' + 
                        '<text class="t" x="-40" y="-10">(0, 0)</text>' + 
                    '</g>'
                );
                
                origin.appendTo(viewport.elem);
                origin = null;
            }

            // render viewport
            viewport.tree.paper = viewport.tree.parent = this.guid();
            viewport.translate(0.5, 0.5).commit();

            this.elem.append(viewport.elem);
            this.children().push(viewport);

            viewport.on('render', function(){
                viewport.cascade(function(c){
                    if (c !== viewport && ! c.props.rendered) {
                        c.props.rendered = true;
                        c.tree.paper = viewport.tree.paper;
                        c.fire('render');
                    }
                });
            });

            this.layout('default');
        },

        layout: function(options) {
            var viewport = this.viewport();

            if (options === undefined) {
                return viewport.graph.layout;
            }1
            
            viewport.layout(options);
            return this;
        },

        shape: function(names, options) {
            var shape = Graph.shape(names, options);
            shape.render(this);
            
            return shape;
        },

        render: function(container) {
            var me = this, 
                vp = me.viewport(),
                id = me.guid();

            if (me.props.rendered) {
                return;
            }

            container = Graph.$(container);
            container.append(me.elem);

            me.tree.container = container;
            
            me.elem.css({
                width: '100%',
                height: '100%'
            });
            
            me.props.rendered = true;
            me.fire('render');

            vp.props.rendered = true;
            vp.fire('render');

            if (me.props.zoomable) {
                me.zoomable();
                
                var debounce = _.debounce(function(){
                    debounce.flush();
                    debounce = null;
                    
                    me.tool().activate('panzoom');
                }, 1000);
                
                debounce();
            }

            return me;
        },

        container: function() {
            return this.tree.container;
        },

        viewport: function() {
            return Graph.registry.vector.get(this.components.viewport);
        },

        // @Override
        scale: function(sx, sy, cx, cy) {
            if (sx === undefined) {
                return this.viewport().matrix().scale();
            }
            return this.plugins.transformer.scale(sx, sy, cx, cy);
        },

        snapping: function(options) {
            if (Graph.isVector(options)) {
                options = {
                    vector: options,
                    shield: options,
                    enabled: true
                };
            }

            var snapper = this.plugins.snapper;
            snapper.subscribe(options);
        },

        connect: function(source, target, start, end, options) {
            var layout, router, link;

            if (start) {
                if ( ! Graph.isPoint(start)) {
                    options = start;
                    start = null;
                    end = null;    
                }
            }

            source = Graph.isShape(source) ? source.hub() : source;
            target = Graph.isShape(target) ? target.hub() : target;
            layout = this.layout();
            router = layout.createRouter(source, target, options);
            
            link = layout.createLink(router);
            
            link.connect(start, end);
            link.render(this);

            return link;
        },

        parse: function(json) {
            var paper  = this;
            var shapes = {};

            _.forEach(json.shapes, function(o){
                (function(o){
                    var s = Graph.shape(o.type, o.data);
                    s.render(paper);
                    shapes[o.data.id] = s;    
                }(o));
            });

            _.forEach(json.links, function(o){
                (function(o){
                    paper.connect(shapes[o.source], shapes[o.target]);
                }(o))
            });

        },

        save: function() {
            alert('save');
        },

        toString: function() {
            return 'Graph.svg.Paper';
        },

        ///////// OBSERVERS /////////
        
        onPointerDown: function(e) {
            if (e.target === this.node()) {
                var tool = this.tool().current();
                if (tool != 'collector') {
                    this.tool().activate('panzoom');    
                }
            }
        },

        onKeynavDown: function(e) {
            var me = this, key = e.keyCode;

            switch(key) {
                case Graph.event.DELETE:

                    var selections = me.plugins.collector.collection;
                    
                    for (var v, i = selections.length - 1; i >= 0; i--) {
                        if ((v = selections[i])) {
                            v.remove();
                            selections.splice(i, 1);
                        }
                    }

                    e.preventDefault();
                    break;

                case Graph.event.SHIFT:
                    
                    break;

                case Graph.event.ESC:

                    break;
            }   

        },

        onKeynavUp: function(e) {
            var me = this, key = e.keyCode;

            switch(key) {
                case Graph.event.SHIFT:

                    break;
            }
        },

        saveAsImage: function(filename) {
            var exporter = new Graph.data.Exporter(this);
            exporter.exportPNG(filename);
            exporter = null;
        },

        /**
         * save workspace
         */
        save: function() {

        },

        ///////// TOPIC LISTENERS /////////
        
        listenLinkUpdate: _.debounce(function() {
            this.layout().arrangeLinks();
        }, 300),
        
        listenLinkRemove: _.debounce(function(){
            this.layout().arrangeLinks();
        }, 10),

        listenShapeDraw: _.debounce(function() {
            this.layout().arrangeShapes();
        }, 1)

    });

    ///////// STATICS /////////
    
    Paper.toString = function() {
        return 'function( width, height )';
    };

    ///////// EXTENSIONS /////////

    var vectors = {
        ellipse: 'Ellipse',
        circle: 'Circle',
        rect: 'Rect',
        path: 'Path',
        polyline: 'Polyline',
        polygon: 'Polygon',
        group: 'Group',
        text: 'Text',
        image: 'Image',
        line: 'Line',
        connector: 'Connector'
    };

    _.forOwn(vectors, function(name, method){
        (function(name, method){
            Paper.prototype[method] = function() {
                var arg = [name].concat(_.toArray(arguments)),
                    svg = Graph.svg.apply(null, arg);

                svg.tree.paper = this.guid();
                svg.render(this);

                arg = null;
                return svg;
            };
        }(name, method));
    });


}());

(function(){
    
    var storage = {},
        context = {};
    
    var Registry = Graph.extend({
        
        context: {},

        constructor: function() {
            this.context = context;
        },

        register: function(vector) {
            var id = vector.guid(), found = this.get(id);
            
            if (found !== vector) {
                // vector.on('resize', function(){
                //     if (vector.isConnectable()) {
                //         var delay = _.delay(function(){
                //             clearTimeout(delay);
                //             Graph.registry.link.synchronize(vector);
                //         }, 1);
                //     }
                // });

                // vector.on('translate', function(){
                //     if (vector.isConnectable()) {
                //         var delay = _.delay(function(){
                //             clearTimeout(delay);
                //             Graph.registry.link.synchronize(vector);
                //         }, 1);
                //     }
                // });
            }

            storage[id] = vector;
        },

        unregister: function(vector) {
            var id = vector.guid();
            if (storage[id]) {
                delete storage[id];
            }

            if (context[id]) {
                delete context[id];
            }
        },

        setContext: function(id, scope) {
            if (storage[id]) {
                context[id] = scope;
            }
        },

        count: function() {
            return _.keys(storage).length;
        },

        toArray: function() {
            var keys = _.keys(storage);
            return _.map(keys, function(k){
                return storage[k];
            });
        },

        get: function(key) {

            if (_.isUndefined(key)) {
                return this.toArray();
            }

            if (key instanceof SVGElement) {
                if (key.tagName == 'tspan') {
                    // we only interest to text
                    key = key.parentNode;
                }
                key = Graph.$(key).data(Graph.string.ID_VECTOR);
            } else if (key instanceof Graph.dom.Element) {
                key = key.data(Graph.string.ID_VECTOR);
            }
            return storage[key];
        },

        wipe: function(paper) {
            var pid = paper.guid();

            for (var id in storage) {
                if (storage.hasOwnProperty(id)) {
                    if (storage[id].tree.paper == pid) {
                        delete storage[id];
                    }
                }
            }

            if (storage[pid]) {
                delete storage[pid];
            }
        },
        
        toString: function() {
            return 'Graph.registry.Vector';
        }

    });

    /**
     * Singleton vector manager
     */
    Graph.registry.vector = new Registry();

}());

(function(){

    var storage = {},
        context = {};

    var Registry = Graph.extend({

        context: {},

        constructor: function() {
            this.context = context;
        },

        register: function(link) {
            var id = link.guid();
            storage[id] = link;
        },

        unregister: function(link) {
            var id = link.guid();
            
            if (storage[id]) {
                delete storage[id];
            }

            if (context[id]) {
                delete context[id];
            }
        },

        setContext: function(id, scope) {
            if (storage[id]) {
                context[id] = scope;
            }
        },

        count: function() {
            return _.keys(storage).length;
        },

        get: function(key) {
            if (_.isUndefined(key)) {
                return this.toArray();
            }

            if (key instanceof SVGElement) {
                key = Graph.$(key).data(Graph.string.ID_LINK);
            } else if (key instanceof Graph.dom.Element) {
                key = key.data(Graph.string.ID_LINK);
            }

            return storage[key];
        },

        collect: function(scope) {
            var links = [];
            for (var id in context) {
                if (context[id] == scope && storage[id]) {
                    links.push(storage[id]);
                }
            }
            return links;
        },
        
        toArray: function() {
            var keys = _.keys(storage);
            return _.map(keys, function(k){
                return storage[k];
            });
        },

        toString: function() {
            return 'Graph.registry.Link';
        }

    });

    /**
     * Singleton link manager
     */
    Graph.registry.link = new Registry();

}());

(function(){

    var storage = {};

    var Registry = Graph.extend({
        
        storage: {},

        constructor: function() {
            this.storage = storage;        
        },

        register: function(shape) {
            var id = shape.guid();
            storage[id] = shape;
        },

        unregister: function(shape) {
            var id = shape.guid();
            if (storage[id]) {
                storage[id] = null;
                delete storage[id];
            }
        },

        count: function() {
            return _.keys(storage).length;
        },

        toArray: function() {
            var keys = _.keys(storage);
            return _.map(keys, function(k){
                return storage[k];
            });
        },

        get: function(key) {

            if (_.isUndefined(key)) {
                return this.toArray();
            }

            if (key instanceof SVGElement) {
                if (key.tagName == 'tspan') {
                    // we only interest to text
                    key = key.parentNode;
                }
                key = Graph.$(key).data(Graph.string.ID_SHAPE);
            } else if (key instanceof Graph.dom.Element) {
                key = key.data(Graph.string.ID_SHAPE);
            }
            return storage[key];
        },

        toString: function() {
            return 'Graph.registry.Shape';
        }

    });

    Graph.registry.shape = new Registry();

}());

(function(){

    Graph.layout.Layout = Graph.extend({
        
        props: {
            // view config
            fit: true,
            view: null,
            width: 0,
            height: 0,

            // router config
            router: {
                type: 'orthogonal'
            },

            link: {
                smooth: true,
                smootness: 6
            }
        },
        
        view: null,

        cached: {
            offset: null
        },

        constructor: function(view, options) {
            _.assign(this.props, options || {});
            this.props.view = view.guid();
        },

        view: function() {
            return Graph.registry.vector.get(this.props.view);
        },

        offset: function() {
            var offset = this.cached.offset;
            var view, node;

            if ( ! offset) {
                view = this.view();
                node = view.isViewport() ? view.parent().node() : view.node();
                offset = node.getBoundingClientRect();
                this.cached.offset = offset;
            }

            return offset;
        },

        invalidate: function() {
            this.cached.offset = null;
        },

        width: function() {

        },

        height: function() {
            
        },

        fit: function() {

        },

        grabVector: function(event) {
            return Graph.registry.vector.get(event.target);
        },

        grabLocation: function(event) {
            var x = event.clientX,
                y = event.clientY,
                offset = this.offset(),
                matrix = this.view().matrix(),
                invert = matrix.clone().invert(),
                scale  = matrix.scale(),
                location = {
                    x: invert.x(x, y),
                    y: invert.y(x, y)
                };

            location.x -= offset.left / scale.x;
            location.y -= offset.top / scale.y;

            matrix = invert = null;

            return location;
        },

        currentScale: function() {
            return this.view().matrix().scale();
        },

        dragSnapping: function() {
            return {
                mode: 'anchor',
                x: 1,
                y: 1
            };
        },
        
        createRouter: function(source, target, options) {
            var clazz, router;

            clazz   = Graph.router[_.capitalize(this.props.router.type)];
            options = _.extend({}, this.props.router, options || {});
            router  = Graph.factory(clazz, [this.view(), source, target, options]);

            return router;
        },

        createLink: function(router, options) {
            var clazz, link;

            clazz   = Graph.link[_.capitalize(this.props.router.type)];
            options = _.extend({}, this.props.link, options || {});
            link    = Graph.factory(clazz, [router, options]);

            return link;
        },

        refresh: function(vector) {
            this.fire('refresh');
        },

        arrangeLinks: function() {
            var scope = this.view().paper().guid(),
                links = Graph.registry.link.collect(scope);
            
            if (links.length) {
                
                var inspect = [];
                
                _.forEach(links, function(link){
                    if (link.cached.convex) {
                        inspect.push(link.guid());
                    }
                });
                
                // TODO: research for sweepline algorithm
                
                var sweeper = new Graph.util.Sweeplink(links),
                    convex = sweeper.findConvex();
                
                var key, link, idx;
                
                for (key in convex) {
                    link = Graph.registry.link.get(key);
                    
                    link.updateConvex(convex[key]);
                    link.refresh(true);
                    
                    idx = _.indexOf(inspect, key);
                    
                    if (idx > -1) {
                        inspect.splice(idx, 1);
                    }
                }
                
                if (inspect.length) {
                    _.forEach(inspect, function(key){
                        var link = Graph.registry.link.get(key);
                        
                        link.removeConvex();
                        link.refresh(true);
                    });
                }
                
                sweeper.destroy();
                sweeper = null;
            }
        },

        arrangeShapes: function() {
            
        }
        
    });

}());

(function(){

    var Router = Graph.router.Router = Graph.extend({

        props: {
            domain: null,
            source: null,
            target: null
        },

        values: {
            start: null,
            end: null,
            waypoints: null
        },

        cached: {
            command: null,
            segments: null,
            pathinfo: null,
            bendpoints: null,
            bending: null,
            connect: null
        },

        constructor: function(domain, source, target, options) {
            _.assign(this.props, options || {});

            this.props.domain = domain.guid();
            this.props.source = source.guid();
            this.props.target = target.guid();

            this.values.waypoints = [];
        },

        invalidate: function() {
            this.cached.command = null;
            this.cached.segments = null;
            this.cached.pathinfo = null;
            this.cached.bendpoints = null;
        },

        domain: function() {
            return Graph.registry.vector.get(this.props.domain);
        },

        source: function(source) {
            if (source === undefined) {
                return Graph.registry.vector.get(this.props.source);
            }
            this.props.source = source.guid();
            return this;
        },

        target: function(target) {
            if (target === undefined) {
                return Graph.registry.vector.get(this.props.target);
            }
            this.props.target = target.guid();
            return this;
        },

        layout: function() {
            return this.domain().layout();
        },

        tail: function() {
            var tail = _.first(this.values.waypoints);
            return tail ? _.extend({}, tail) : null;
        },

        head: function() {
            var head = _.last(this.values.waypoints);
            return head ? _.extend({}, head) : null;
        },
        
        center: function() {
            var path = this.pathinfo(),
                center = path.pointAt(path.length() / 2, true);
            path = null;
            return center;
        },
        

        /**
         * Get compiled waypoints, or
         * set waypoint with extracted command strings
         */
        command: function(command) {
            var segments, points;

            if (command === undefined) {
                command = this.cached.command;
                if ( ! command) {
                    segments = this.segments();
                    command  = Graph.util.segments2path(segments);
                    this.cached.command = command;
                }
                return command;
            }

            segments = Graph.util.path2segments(command);

            points = _.map(segments, function(s){
                return {
                    x: s[1], 
                    y: s[2]
                };
            });

            this.values.waypoints = points;
            this.invalidate();

            segments = points = null;

            return this;
        },

        segments: function() {
            var segments = this.cached.segments;
            if ( ! segments) {
                segments = [];
                
                _.forEach(this.values.waypoints, function(p, i){
                    var cmd = i === 0 ? 'M' : 'L';
                    segments.push([cmd, p.x, p.y]);
                });

                this.cached.segments = segments;
            }
            return segments;
        },
        
        waypoints: function() {
            return this.values.waypoints;
        },

        bendpoints: function() {
            var points = this.cached.bendpoints;

            if ( ! points) {
                points = (this.values.waypoints || []).slice();
                this.cached.bendpoints = points;
            }

            return points;
        },
        
        pathinfo: function() {
            var path = this.cached.pathinfo;
            if ( ! path) {
                path = Graph.path(this.command());
                this.cached.pathinfo = path;
            }
            return path;
        },

        modify: function(index, x, y) {
            this.values.waypoints[index].x = x;
            this.values.waypoints[index].y = y;
            return this;
        },

        commit: function() {
            // reset cache;
            this.invalidate();

            // update cache;
            // this.segments();
            // this.command();
            // this.pathinfo();
            // this.bendpoints();

            return this;
        },

        route: function() {
            return this;
        },

        repair: function(component, port) {
            
        },
        
        relocate: function(dx, dy) {
            _.forEach(this.values.waypoints, function(p){
                p.x += dx;
                p.y += dy;
            });

            this.commit();
            return this;
        },

        ///////// ROUTER TRANS /////////

        initTrans: function(context) {

        },

        updateTrans: function(trans) {

        },

        bending: function() {

        },

        connecting: function() {

        },

        stopTrans: function(context) {

        },

        destroy: function() {
            for (var key in this.cached) {
                this.cached[key] = null;
            }
        }
        
    });
    
    ///////// HELPERS /////////
    
    Router.portCentering = function(port, center, axis) {
        if (axis == 'x') {
            port.y = center.y;
        }
        
        if (axis == 'y') {
            port.x = center.x;
        }
        
        return port;
    }

    Router.porting = function(routes, shape, source) {
        var index = source ? 0 : routes.length - 1,
            cable = Graph.path(Graph.util.points2path(routes)),
            inter = shape.intersection(cable, true);
        
        var point, port;

        point = routes[index];

        if (inter.length) {
            inter = Router.sortIntersection(inter);
            port  = source ? inter[0] : inter[inter.length - 1];
        }

        return {
            index: index,
            point: point,
            port:  port || point
        };
    };

    Router.isRepairable = function(routes) {
        var count = routes.length;
        
        if (count < 3) {
            return false;
        }
        
        if (count > 4) {
            return true;
        }
        
        return !_.find(routes, function(p, i){
            var q = routes[i - 1];
            return q && Graph.util.pointDistance(p, q) <= 5;
        });
    };

    Router.getSegmentIndex = function(routes, vertext) {
        var segment = 0;

        _.forEach(routes, function(p, i){
            if (Graph.util.isPointOnLine(p, routes[i + 1], vertext)) {
                segment = i;
                return false;
            }
        });
        
        return segment;
    };

    Router.sortIntersection = function(intersection) {
        return _.sortBy(intersection, function(p){
            var d = Math.floor(p.t2 * 100) || 1;
            d = 100 - d;
            d = (d < 10 ? '0' : '') + d;
            return p.segment2 + '#' + d;
        });
    };

    Router.getClosestIntersect = function(routes, shape, offset) {
        var cable = Graph.path(Graph.util.points2path(routes)),
            inter = shape.intersection(cable, true),
            distance = Infinity;

        var closest;

        if (inter.length) {
            inter = Router.sortIntersection(inter);
            _.forEach(inter, function(p){
                var t = Graph.util.taxicab(p, offset);
                if (t <= distance) {
                    distance = t;
                    closest = p;
                }
            });
        }

        return closest;
    };

    Router.repairBendpoint = function(bend, oldport, newport) {
        var align = Graph.util.pointAlign(oldport, bend);
        
        switch(align) {
            case 'v':
                return {
                    x: bend.x,
                    y: newport.y
                };
            case 'h':
                return {
                    x: newport.x,
                    y: bend.y
                };
        }
        
        return {
            x: bend.x,
            y: bend.y
        };
    };

    Router.repairRoutes = function(bound1, bound2, newport, routes) {
        var oldport = routes[0],
            clonedRoutes = routes.slice();
        
        var slicedRoutes;
        
        clonedRoutes[0] = newport;
        clonedRoutes[1] = Router.repairBendpoint(clonedRoutes[1], oldport, newport);
        
        return clonedRoutes;
    };

    Router.tidyRoutes = function(routes) {
        return _.filter(routes, function(p, i){
            if (Graph.util.isPointOnLine(routes[i - 1], routes[i + 1], p)) {
                return false;
            }
            return true;
        });
    };

}());

(function(){
    
    var Router = Graph.router.Router;
    
    Graph.router.Directed = Graph.extend(Router, {
        
        bendpoints: function() {
            var points = this.cached.bendpoints;

            if ( ! points) {
                var segments = this.pathinfo().curve().segments;
                var segment, curve, length, point, x, y;

                points = [];

                for (var i = 0, ii = segments.length; i < ii; i++) {
                    segment = segments[i];
                    
                    if (i === 0) {
                        
                        x = segment[1];
                        y = segment[2];
                        
                        curve = Graph.curve([['M', x, y], ['C', x, y, x, y, x, y]]);
                        point = curve.pointAt(curve.t(0), true);
                        
                        point.index = i;
                        point.range = [0, 0];
                        point.space = 0;
                        
                        points.push(point);
                    } else {
                        
                        curve = Graph.curve([['M', x, y], segment]);
                        
                        x = segment[5];
                        y = segment[6];
                        
                        length = curve.length();
                        
                        // half
                        point = curve.pointAt(curve.t(length / 2), true);
                        point.index = i;
                        point.range = [i - 1, i];
                        point.space = 0;
                        
                        points.push(point);
                            
                        // full
                        point = curve.pointAt(curve.t(length), true);
                        point.index = i;
                        point.range = [i - 1, i + 1];
                        point.space = 1;
                        
                        points.push(point);
                    }
                }

                this.cached.bendpoints = points;
            }

            return points;
        },
        
        route: function(start, end) {
            var source = this.source(),
                srcnet = source.connectable(),
                srcbox = srcnet.bbox(),
                sbound = srcbox.toJson(),
                target = this.target(),
                tarnet = target.connectable(),
                tarbox = tarnet.bbox(),
                tbound = tarbox.toJson(),
                orient = srcnet.orientation(tarnet),
                direct = srcnet.direction(tarnet),
                tuneup = false,
                routes = [];
            
            if ( ! start) {
                start = srcbox.center(true);
            }
            
            if ( ! end) {
                end = tarbox.center(true);
            }
            
            var sdot, edot;
            
            if (direct) {
                if (direct == 'h:h') {
                    switch (orient) {
                        case 'top-right':
                        case 'right':
                        case 'bottom-right':
                            sdot = { 
                                x: sbound.x, 
                                y: start.y 
                            };
                            
                            edot = { 
                                x: tbound.x + tbound.width, 
                                y: end.y 
                            };

                            break;
                        case 'top-left':
                        case 'left':
                        case 'bottom-left':
                            sdot = { 
                                x: sbound.x + sbound.width, 
                                y: start.y 
                            };

                            edot = { 
                                x: tbound.x, 
                                y: end.y 
                            };

                            break;
                    }
                    tuneup = true;
                }
                
                if (direct == 'v:v') {
                    switch(orient) {
                        case 'top-left':
                        case 'top':
                        case 'top-right':
                            sdot = {
                                x: start.x, 
                                y: sbound.y + sbound.height
                            };

                            edot = { 
                                x: end.x, 
                                y: tbound.y
                            };
                            break;
                        case 'bottom-left':
                        case 'bottom':
                        case 'bottom-right':
                            sdot = { 
                                x: start.x, 
                                y: sbound.y
                            };

                            edot = { 
                                x: end.x, 
                                y: tbound.y + tbound.height
                            };
                            break;
                    }
                    tuneup = true;
                }
            }
            
            if (tuneup) {
                routes = [sdot, edot];
            } else {
                routes = [start, end];
            }
            
            var cable = Graph.path(Graph.util.points2path(routes));
            var inter;
            
            inter = srcnet.pathinfo().intersection(cable, true);
            
            if (inter.length) {
                routes[0] = inter[0];
            }
            
            inter = tarnet.pathinfo().intersection(cable, true);
            
            if (inter.length) {
                routes[1] = inter[inter.length - 1];
            }
            
            this.values.waypoints = routes;
            this.commit();
             
            this.fire('route', {
                command: this.command()
            });
            
            return this;
        },
        
        repair: function(component, port) {
            var source = this.source(),
                srcnet = source.connectable(),
                srcbox = srcnet.bbox(),
                target = this.target(),
                tarnet = target.connectable(),
                tarbox = tarnet.bbox(),
                routes = this.values.waypoints,
                maxlen = routes.length - 1;
            
            if (component === source) {
                routes[0] = port;
            } else if (component === target) {
                routes[maxlen] = port;
            }
            
            var closest;
            
            closest = Router.getClosestIntersect(routes, srcnet.pathinfo(), tarbox.center(true));
            
            if (closest) {
                routes[0] = closest;
            }
            
            closest = Router.getClosestIntersect(routes, tarnet.pathinfo(), srcbox.center(true));
            
            if (closest) {
                routes[maxlen] = closest;
            }
            
            this.commit();
            this.fire('route', {command: this.command()});
        },
        
        initTrans: function(context) {
            var source = this.source(),
                target = this.target(),
                srcnet = source.connectable(),
                tarnet = target.connectable(),
                sourcePath = srcnet.pathinfo(),
                targetPath = tarnet.pathinfo(),
                waypoints = this.waypoints(),
                rangeStart = context.range.start,
                rangeEnd = context.range.end,
                segmentStart = waypoints[rangeStart],
                segmentEnd = waypoints[rangeEnd];
            
            var snaps = [];

            if (context.trans == 'BENDING') {
                snaps = [
                    waypoints[rangeStart],
                    waypoints[rangeEnd]
                ];
            }

            var offset  = this.layout().offset();
            
            context.snap.hor = [];
            context.snap.ver = [];
            
            _.forEach(snaps, function(p){
                if (p) {
                    context.snap.hor.push(p.y + offset.top);
                    context.snap.ver.push(p.x + offset.left);
                }
            });
            
            if (context.trans == 'BENDING') {
                this.cached.bending = {
                    source: source,
                    target: target,
                    rangeStart: rangeStart,
                    rangeEnd: rangeStart,
                    segmentStart: segmentStart,
                    segmentEnd: segmentEnd,
                    original: waypoints.slice(),
                    sourcePath: sourcePath,
                    targetPath: targetPath
                };
            } else {
                this.cached.connect = {
                    valid: false,
                    source: null,
                    target: null,
                    sourcePath: null,
                    targetPath: null,
                    original: waypoints.slice()
                };
            }
            
        },

        updateTrans: function(trans, data) {
            if (trans == 'CONNECT') {
                var connect = this.cached.connect,
                    oldSource = connect.source,
                    oldTarget = connect.target;
                    
                _.assign(connect, data);
                
                if (oldSource && connect.source) {
                    if (oldSource.guid() != connect.source.guid()) {
                        connect.sourcePath = connect.source.connectable().pathinfo();
                    }
                } else if ( ! oldSource && connect.source) {
                    connect.sourcePath = connect.source.connectable().pathinfo();
                }
                
                if (oldTarget && connect.target) {
                    if (oldTarget.guid() != connect.target.guid()) {
                        connect.targetPath = connect.target.connectable().pathinfo();
                    }
                } else if ( ! oldTarget && connect.target) {
                    connect.targetPath = connect.target.connectable().pathinfo();
                }
                
            }
        },
        
        bending: function(context, callback) {
            var bending = this.cached.bending,
                routes = bending.original.slice(),
                rangeStart = bending.rangeStart,
                rangeEnd = bending.rangeEnd,
                segmentStart = bending.segmentStart,
                segmentEnd = bending.segmentEnd;
            
            var segment = {
                x: context.point.x + context.delta.x,
                y: context.point.y + context.delta.y
            };
            
            var align1 = Graph.util.pointAlign(segmentStart, segment, 10),
                align2 = Graph.util.pointAlign(segmentEnd, segment, 10);
                
            if (align1 == 'h' && align2 == 'v') {
                segment.x = segmentStart.x;
                segment.y = segmentEnd.y;
            } else if (align1 == 'v' && align2 == 'h') {
                segment.y = segmentStart.y;
                segment.x = segmentEnd.x;
            } else if (align1 == 'h') {
                segment.x = segmentStart.x;
            } else if (align1 == 'v') {
                segment.y = segmentStart.y;
            } else if (align2 == 'h') {
                segment.x = segmentEnd.x;
            } else if (align2 == 'v') {
                segment.y = segmentEnd.y;
            }
            
            context.event.x = segment.x;
            context.event.y = segment.y;
            
            routes.splice(rangeStart + 1, context.space, segment);
            bending.routes = routes;
            
            this.cropBinding(context, callback);
        },
        
        cropBinding: _.debounce(function(context, callback){
            var bending = this.cached.bending,
                routes  = bending.routes,
                srcport = Router.porting(routes, bending.sourcePath, true),
                tarport = Router.porting(routes, bending.targetPath),
                cropped = routes.slice(srcport.index + 1, tarport.index);
            
            var command;
            
            cropped.unshift(srcport.port);
            cropped.push(tarport.port);
            
            bending.waypoints = cropped;
            
            if (callback) {
                command = Graph.util.points2path(cropped);
                callback({command: command});
            }
            
        }, 0),
        
        connecting: function(context, callback) {
            var connect = this.cached.connect,
                routes = connect.original.slice();
                
            var segment, command;
            
            segment = {
                x: context.point.x + context.delta.x,
                y: context.point.y + context.delta.y
            };
            
            routes[context.index] = segment;
            
            context.event.x = segment.x;
            context.event.y = segment.y;
            
            connect.routes = routes;
            
            this.cropConnect(context, callback);
        },

        cropConnect: _.debounce(function(context, callback) {
            var connect = this.cached.connect,
                routes = connect.routes;

            var command, shape, cable, inter;
            
            if (context.index === 0) {
                if (connect.source) {
                    shape = connect.sourcePath;
                }
            } else {
                if (connect.target) {
                    shape = connect.targetPath;
                }
            }

            if (shape) {
                cable = Graph.path(Graph.util.points2path(routes));
                inter = shape.intersection(cable, true);

                if (inter.length) {
                    routes[context.index] = inter[0];
                }
            }
            
            connect.waypoints = routes;

            if (callback) {
                command = Graph.util.points2path(routes);
                callback({command: command});
            }
        }, 0),
        
        stopTrans: function(context) {
            var connect, bending, points, changed, concised;
            
            if (context.trans == 'CONNECT') {
                connect = this.cached.connect;
                points = connect.waypoints;
                
                if (this.cached.connect.valid) {
                    changed = true;
                    
                    this.source(connect.source);
                    this.target(connect.target);
                    
                    this.fire('reroute', {
                        source: connect.source,
                        target: connect.target
                    });

                } else {
                    points = connect.original.slice();
                    changed = false;
                }
            } else if (context.trans == 'BENDING') {
                bending = this.cached.bending;
                points = bending.waypoints;
                changed = true;
            }
            
            if (changed) {
                this.values.waypoints = Router.tidyRoutes(points);;
            } else {
                this.values.waypoints = points;
            }
            
            this.commit();
            
            this.cached.connect = null;
            this.cached.bending = null;
        },
        
        toString: function() {
            return 'Graph.router.Directed';
        }
        
    });

}());

(function(){

    var Router = Graph.router.Router;

    Graph.router.Orthogonal = Graph.extend(Router, {
        
        bendpoints: function() {
            var points = this.cached.bendpoints;

            if ( ! points) {
                var segments = this.pathinfo().curve().segments,
                    maxlen = segments.length - 1;
                    
                var segment, curve, length, point, x, y;

                points = [];
                
                for (var i = 0, ii = segments.length; i < ii; i++) {
                    segment = segments[i];
                    
                    if (i === 0) {
                        
                        x = segment[1];
                        y = segment[2];
                        
                        curve = Graph.curve([['M', x, y], ['C', x, y, x, y, x, y]]);
                        point = curve.pointAt(curve.t(0), true);
                        
                        point.index = i;
                        point.range = [i, i + 1];
                        point.space = 0;
                        
                        points.push(point);
                    } else {
                        
                        curve = Graph.curve([['M', x, y], segment]);
                        
                        x = segment[5];
                        y = segment[6];
                        
                        length = curve.length();
                        
                        point = curve.pointAt(curve.t(length / 2), true);
                        point.index = i;
                        point.range = [i - 1, i];
                        point.space = 0;
                        
                        points.push(point);
                        
                        if (i === maxlen) {
                            point = curve.pointAt(curve.t(length), true);
                            point.index = i;
                            point.range = [i - 1, i];
                            point.space = 0;
                            
                            points.push(point);
                        }
                    }
                }

                this.cached.bendpoints = points;
            }

            return points;
        },
        
        route: function(start, end) {

            var source = this.source(),
                target = this.target(),
                srcnet = source.connectable(),
                tarnet = target.connectable(),
                srcbox = srcnet.bbox(),
                sbound = srcbox.data(),
                tarbox = tarnet.bbox(),
                tbound = tarbox.data(),
                orient = srcnet.orientation(tarnet),
                direct = srcnet.direction(tarnet),
                tuneup  = false;
            
            if ( ! start) {
                start = srcbox.center(true);
            }

            if ( ! end) {
                end = tarbox.center(true);
            }

            var sdot, edot;
            
            if (direct) {
                if (direct == 'h:h') {
                    switch (orient) {
                        case 'top-right':
                        case 'right':
                        case 'bottom-right':
                            sdot = { 
                                x: sbound.x + 1, 
                                y: start.y 
                            };
                            
                            edot = { 
                                x: tbound.x + tbound.width - 1, 
                                y: end.y 
                            };

                            break;
                        case 'top-left':
                        case 'left':
                        case 'bottom-left':
                            sdot = { 
                                x: sbound.x + sbound.width - 1, 
                                y: start.y 
                            };

                            edot = { 
                                x: tbound.x + 1, 
                                y: end.y 
                            };

                            break;
                    }
                    tuneup = true;
                }

                if (direct == 'v:v') {
                    switch (orient) {
                        case 'top-left':
                        case 'top':
                        case 'top-right':
                            sdot = {
                                x: start.x, 
                                y: sbound.y + sbound.height - 1 
                            };

                            edot = { 
                                x: end.x, 
                                y: tbound.y + 1
                            };
                            break;
                        case 'bottom-left':
                        case 'bottom':
                        case 'bottom-right':
                            sdot = { 
                                x: start.x, 
                                y: sbound.y + 1
                            };

                            edot = { 
                                x: end.x, 
                                y: tbound.y + tbound.height - 1
                            };
                            break;
                    }
                    tuneup = true;
                }
                
            }
            
            var routes, bends, shape, cable, inter;
            
            if (tuneup) {
                
                shape = srcnet.pathinfo();
                cable = Graph.path(Graph.util.points2path([sdot, edot]));
                inter = shape.intersection(cable, true);
                
                if (inter.length) {
                    inter = inter[0];
                    if ( ! Graph.util.isPointEquals(inter, sdot)) {
                        sdot = inter;
                    }
                }
                
                shape = tarnet.pathinfo();
                inter = shape.intersection(cable, true);
                
                if (inter.length) {
                    inter = inter[inter.length - 1];
                    if ( ! Graph.util.isPointEquals(inter, edot)) {
                        edot = inter;
                    }
                }
                
                bends  = Graph.util.lineBendpoints(sdot, edot, direct);
                routes = [sdot].concat(bends).concat([edot]);
                
                this.values.waypoints = Router.tidyRoutes(routes);
            } else {
                
                sdot = start;
                edot = end;
                
                // get bending point from center
                bends = Graph.util.lineBendpoints(sdot, edot, direct);
                cable = Graph.path(Graph.util.points2path([sdot].concat(bends).concat([edot])));
                shape = srcnet.pathinfo();
                
                // get source inter
                inter = shape.intersection(cable, true);
                
                if (inter.length) {
                    sdot = inter[0];
                }
                
                shape = tarnet.pathinfo();
                inter = shape.intersection(cable, true);
                
                if (inter.length) {
                    edot = inter[inter.length - 1];
                }
                
                routes = [sdot].concat(bends).concat([edot]);
                this.values.waypoints = Router.tidyRoutes(routes);
            }
            
            this.commit();
            
            this.fire('route', { command: this.command() });
            
            return this;
        },
        
        repair: function(component, port) {
            var routes = this.values.waypoints.slice();
            
            if ( ! Router.isRepairable(routes)) {
                return this.route();
            }
            
            var target = this.target(),
                tarnet = target.connectable(),
                tarbox = tarnet.bbox(),
                source = this.source(),
                srcnet = source.connectable(),
                srcbox = srcnet.bbox();
                
            var bound1, bound2, center, points, axis, repaired;
            
            if (component === source) {
                bound1 = srcbox.toJson();
                bound2 = tarbox.toJson();
                center = srcbox.center(true);
                points = routes;
            } else {
                bound1 = tarbox.toJson();
                bound2 = srcbox.toJson();
                center = tarbox.center(true);
                points = routes.slice();
                points.reverse();
            }
            
            axis = Graph.util.pointAlign(points[0], points[1]) == 'h' ? 'x' : 'y';
            Router.portCentering(port, center, axis);

            repaired = Router.repairRoutes(
                bound1,
                bound2,
                port,
                points
            );
            
            var cropped, closest, rangeStart, rangeEnd;

            if (repaired) {

                if (component === target) {
                    repaired.reverse();
                }
                
                cropped = repaired.slice();
                closest = Router.getClosestIntersect(repaired, srcnet.pathinfo(), tarbox.center(true));

                if (closest) {
                    rangeStart = Router.getSegmentIndex(repaired, closest);
                    cropped = cropped.slice(rangeStart + 1);
                    cropped.unshift(closest);
                }

                closest = Router.getClosestIntersect(cropped, tarnet.pathinfo(), srcbox.center(true));

                if (closest) {
                    rangeEnd = Router.getSegmentIndex(cropped, closest);
                    cropped = cropped.slice(0, rangeEnd + 1);
                    cropped.push(closest);

                    if (cropped.length === 2) {
                        var align = Graph.util.pointAlign(cropped[0], cropped[1]);
                        if (align == 'h') {
                            cropped[1].x = cropped[0].x;
                        } else if (align == 'v') {
                            cropped[1].y = cropped[0].y;
                        }
                    }
                }

                this.values.waypoints = cropped;
                this.commit();
                this.fire('route', {command: this.command()});

                return this;
            } else {
                return this.route();
            }
        },
        
        initTrans: function(context) {
            var waypoints = this.waypoints(),
                source = this.source(),
                target = this.target(),
                rangeStart = context.ranges.start,
                rangeEnd = context.ranges.end,
                srcnet = source.connectable(),
                tarnet = target.connectable(),
                sourceBox = srcnet.bbox(),
                targetBox = tarnet.bbox(),
                segmentStart = waypoints[rangeStart],
                segmentEnd = waypoints[rangeEnd];
                
            var snaps = [];
            
            if (context.trans == 'BENDING') {
                // force start & end to center
                if (rangeStart === 0) {
                    Router.portCentering(segmentStart, sourceBox.center(true), context.axis);
                }
                
                if (rangeEnd === waypoints.length - 1) {
                    Router.portCentering(segmentEnd, targetBox.center(true), context.axis);
                }
                
                snaps = [
                    waypoints[rangeStart - 1],
                    segmentStart,
                    segmentEnd,
                    waypoints[rangeEnd + 1]
                ];
                
                if (rangeStart < 2) {
                    snaps.unshift(sourceBox.center(true));
                }
                
                if (rangeEnd > waypoints.length - 3) {
                    snaps.unshift(targetBox.center(true));
                }
            }
            
            var offset = this.layout().offset(),
                snapH = [],
                snapV = [];
            
            context.snap.hor = [];
            context.snap.ver = [];
            
            _.forEach(snaps, function(p){
                if (p) {
                    
                    if (context.axis == 'y') {
                        snapH.push(p.y);
                        context.snap.hor.push(p.y + offset.top);
                    }
                    
                    if (context.axis == 'x') {
                        snapV.push(p.x);
                        context.snap.ver.push(p.x + offset.left);
                    }
                }
            });
            
            this.cached.connect = null;
            this.cached.bending = null;
            
            if (context.trans == 'BENDING') {
                this.cached.bending = {
                    source: source,
                    target: target,
                    original: waypoints,
                    rangeStart: rangeStart,
                    rangeEnd: rangeEnd,
                    segmentStart: segmentStart,
                    segmentEnd: segmentEnd,
                    sourceBound: sourceBox.toJson(),
                    targetBound: targetBox.toJson(),
                    sourcePath: srcnet.pathinfo(),
                    targetPath: tarnet.pathinfo(),
                    snapH: snapH,
                    snapV: snapV
                };
            } else {
                var original = waypoints.slice(),
                    segmentAlign = Graph.util.pointAlign(segmentStart, segmentEnd, 10);
                
                if (original.length === 2) {
                    var q1, q2;
                    
                    q1 = {
                        x: (segmentStart.x + segmentEnd.x) / 2,
                        y: (segmentStart.y + segmentEnd.y) / 2
                    };
                    
                    q2 = {
                        x: q1.x,
                        y: q1.y
                    };
                    
                    original.splice(1, 0, q1, q2);
                    
                    if (context.index !== 0) {
                        rangeStart += 2;
                        rangeEnd   += 2;
                        
                        segmentStart = original[rangeStart];
                        segmentEnd   = original[rangeEnd];
                        
                        context.index += 2;
                        
                        context.point = _.extend({}, segmentEnd);
                        context.event = _.extend({}, segmentEnd);
                    } else {
                        segmentEnd = original[rangeEnd];
                    }
                }
                
                this.cached.connect = {
                    valid: false,
                    source: null,
                    target: null,
                    sourcePath: null,
                    targetPath: null,
                    rangeStart: rangeStart,
                    rangeEnd: rangeEnd,
                    segmentStart: segmentStart,
                    segmentEnd: segmentEnd,
                    segmentAlign: segmentAlign,
                    original: original
                };
            }
        },
        
        updateTrans: function(trans, data) {
            if (trans == 'CONNECT') {
                var connect = this.cached.connect,
                    oldSource = connect.source,
                    oldTarget = connect.target;
                    
                _.assign(connect, data);
                
                if (oldSource && connect.source) {
                    if (oldSource.guid() != connect.source.guid()) {
                        connect.sourcePath = connect.source.connectable().pathinfo();
                    }
                } else if ( ! oldSource && connect.source) {
                    connect.sourcePath = connect.source.connectable().pathinfo();
                }
                
                if (oldTarget && connect.target) {
                    if (oldTarget.guid() != connect.target.guid()) {
                        connect.targetPath = connect.target.connectable().pathinfo();
                    }
                } else if ( ! oldTarget && connect.target) {
                    connect.targetPath = connect.target.connectable().pathinfo();
                }
                
            }
        },
        
        /**
         * Segment bending
         */
        bending: function(trans, callback) {
            
            var bending = this.cached.bending,
                routes = bending.original.slice(),
                segmentStart = bending.segmentStart,
                segmentEnd = bending.segmentEnd,
                rangeStart = bending.rangeStart,
                rangeEnd = bending.rangeEnd;
            
            var newStart, newEnd;
            
            newStart = {
                x: segmentStart.x + trans.delta.x,
                y: segmentStart.y + trans.delta.y
            };
            
            newEnd = {
                x: segmentEnd.x + trans.delta.x,
                y: segmentEnd.y + trans.delta.y
            };
            
            // snapping //
            
            if (trans.axis == 'x') {
                trans.event.x = (newStart.x + newEnd.x) / 2;
            }
            
            if (trans.axis == 'y') {
                trans.event.y = (newStart.y + newEnd.y) / 2;
            }
            
            var sx = Graph.util.snapValue(trans.event.x, bending.snapV),
                sy = Graph.util.snapValue(trans.event.y, bending.snapH);
                
            trans.event.x = sx;
            trans.event.y = sy;
            
            if (trans.axis == 'x') {
                newStart.x = sx;
                newEnd.x = sx;
            }
            
            if (trans.axis == 'y') {
                newStart.y = sy;
                newEnd.y = sy;
            }
            
            routes[rangeStart] = newStart;
            routes[rangeEnd]   = newEnd;
            
            var dotlen = routes.length,
                offset = 0;
                
            var sourceOrient, targetOrient;
            
            if (rangeStart < 2) {
                sourceOrient = Graph.util.boxOrientation(
                    bending.sourceBound,
                    Graph.util.pointbox(newStart)
                );
                
                if (rangeStart === 1) {
                    if (sourceOrient == 'intersect') {
                        routes.shift();
                        routes[0] = newStart;
                        offset--;
                    }
                } else {
                    if (sourceOrient != 'intersect') {
                        routes.unshift(segmentStart);
                        offset++;
                    }
                }
            }
            
            if (rangeEnd > dotlen - 3) {
                
                targetOrient = Graph.util.boxOrientation(
                    bending.targetBound,
                    Graph.util.pointbox(newEnd)
                );

                if (rangeEnd === dotlen - 2) {
                    if (targetOrient == 'intersect') {
                        routes.pop();
                        routes[routes.length - 1] = newEnd;
                    }
                } else {
                    if (targetOrient != 'intersect') {
                        routes.push(segmentEnd);
                    }
                }
            }
            
            
            bending.routes = routes;
            bending.newRangeStart = rangeStart + offset;  
            
            this.cropBending(callback);
        },
        
        cropBending: _.debounce(function(callback) {
            
            var bending = this.cached.bending,
                routes  = bending.routes,
                srcport = Router.porting(routes, bending.sourcePath, true),
                tarport = Router.porting(routes, bending.targetPath),
                cropped = routes.slice(srcport.index + 1, tarport.index);
            
            var command;
            
            cropped.unshift(srcport.port);
            cropped.push(tarport.port);
            
            bending.waypoints = cropped;
            
            if (callback) {
                command = Graph.util.points2path(cropped);
                callback({
                    command: command
                });
            }
        }, 0),
        
        connecting: function(context, callback) {
            var connect = this.cached.connect,
                routes = connect.original.slice(),
                segmentAlign = connect.segmentAlign,
                segmentStart = connect.segmentStart,
                segmentEnd = connect.segmentEnd,
                rangeStart = connect.rangeStart,
                rangeEnd = connect.rangeEnd;
                
            var point, command;
            
            point = {
                x: context.point.x + context.delta.x,
                y: context.point.y + context.delta.y
            };
            
            var newStart, newEnd;
            
            if (context.index === 0) {
                newStart = {
                    x: context.point.x + context.delta.x,
                    y: context.point.y + context.delta.y
                };
                
                if (segmentAlign == 'v') {
                    newEnd = {
                        x: segmentEnd.x,
                        y: newStart.y
                    };
                } else {
                    newEnd = {
                        x: newStart.x,
                        y: segmentEnd.y
                    };
                }
            } else {
                newEnd = {
                    x: context.point.x + context.delta.x,
                    y: context.point.y + context.delta.y
                };
                
                if (segmentAlign == 'h') {
                    newStart = {
                        x: newEnd.x,
                        y: segmentStart.y
                    };
                } else {
                    newStart = {
                        x: segmentStart.x,
                        y: newEnd.y
                    };
                }
            }
            
            routes[rangeStart] = newStart;
            routes[rangeEnd]   = newEnd;
            
            context.event.x = point.x;
            context.event.y = point.y;
            
            connect.routes  = routes;
            
            this.cropConnect(context, callback);
        },
        
        cropConnect: _.debounce(function(context, callback) {
            var connect = this.cached.connect,
                routes = connect.routes;
            
            if (connect.valid) {
                var command, shape, cable, inter, align;
            
                if (context.index === 0) {
                    if (connect.source) {
                        shape = connect.sourcePath;
                    }
                } else {
                    if (connect.target) {
                        shape = connect.targetPath;
                    }
                }
        
                if (shape) {
                    cable = Graph.path(Graph.util.points2path(routes));
                    inter = shape.intersection(cable, true);
                    
                    if (inter.length) {
                        routes[context.index] = inter[0];
                    }
                }
            }
            
            connect.waypoints = routes;

            if (callback) {
                command = Graph.util.points2path(routes);
                callback({command: command});
            }
        }, 0),
        
        stopTrans: function (context) {
            var connect, bending, points, changed, concised;
            
            if (context.trans == 'CONNECT') {
                connect = this.cached.connect;
                points = connect.waypoints;
                
                if (this.cached.connect.valid) {
                    changed = true;
                    
                    this.source(connect.source);
                    this.target(connect.target);
                    
                    this.fire('reroute', {
                        source: connect.source,
                        target: connect.target
                    });
                } else {
                    points = connect.original.slice();
                    changed = false;
                }
            } else if (context.trans == 'BENDING') {
                bending = this.cached.bending;
                points = bending.waypoints;
                changed = true;
            }
            
            if (changed) {
                this.values.waypoints = Router.tidyRoutes(points);
            } else {
                this.values.waypoints = points;
            }
            
            this.commit();
        },
        
        toString: function() {
            return 'Graph.router.Orthogonal';
        }

    });

}());

(function(){

    var Link = Graph.link.Link = Graph.extend({
        
        props: {
            id: null,
            guid: null,
            rendered: false,
            selected: false,
            label: '',
            labelDistance: null,
            labelX: null,
            labelY: null,
            source: null,
            target: null
        },

        components: {
            block: null,
            coat: null,
            path: null,
            label: null,
            editor: null
        },

        cached: {
            bendpoints: null,
            controls: null,
            convex: null
        },
        
        handlers: {
            source: null,
            target: null
        },
        
        router: null,

        constructor: function(router, options) {
            options = _.extend({
                id: 'graph-link-' + (++Link.guid)
            }, options || {});

            _.assign(this.props, options);

            this.props.guid = this.props.id; // Graph.uuid();
            this.router = router;

            this.initComponent();
            this.bindResource('source', router.source());
            this.bindResource('target', router.target());

            this.router.on('route', _.bind(this.onRouterRoute, this));
            this.router.on('reroute', _.bind(this.onRouterReroute, this));
            
            Graph.registry.link.register(this);
        },

        initComponent: function() {
            var comp = this.components;
            var block, coat, path, editor, label;

            block = (new Graph.svg.Group())
                .addClass('graph-link')
                .selectable(false);
                
            block.elem.data(Graph.string.ID_LINK, this.props.guid);

            coat = (new Graph.svg.Path())
                .removeClass(Graph.string.CLS_VECTOR_PATH)
                .addClass('graph-link-coat')
                // .selectable(false)
                .render(block);

            coat.data('text', this.props.label);
            coat.elem.data(Graph.string.ID_LINK, this.props.guid);

            coat.draggable({
                ghost: true,
                single: false,
                manual: true
            });
            
            coat.editable({
                width: 150,
                height: 80,
                offset: 'pointer'
            });

            coat.on('select.link', _.bind(this.onCoatSelect, this));
            coat.on('deselect.link', _.bind(this.onCoatDeselect, this));
            coat.on('dragstart.link', _.bind(this.onCoatDragStart, this));
            coat.on('dragend.link', _.bind(this.onCoatDragEnd, this));
            coat.on('edit.link', _.bind(this.onCoatEdit, this));
            coat.on('beforeedit.link', _.bind(this.onCoatBeforeEdit, this));
            coat.on('remove.link', _.bind(this.onCoatRemove, this));

            path = (new Graph.svg.Path())
                .removeClass(Graph.string.CLS_VECTOR_PATH)
                .addClass('graph-link-path')
                .selectable(false)
                .clickable(false)
                .attr('marker-end', 'url(#marker-arrow)')
                .render(block);

            path.elem.data(Graph.string.ID_LINK, this.props.guid);

            label = (new Graph.svg.Text(0, 0, ''))
                .addClass('graph-link-label')
                .selectable(false)
                // .attr('text-anchor', 'left')
                .render(block);
            
            label.draggable({ghost: true});
            
            label.on('render.link', _.bind(this.onLabelRender, this));
            label.on('dragend.link', _.bind(this.onLabelDragend, this));

            // enable label doubletap
            var labelVendor = label.interactable().vendor();
            labelVendor.on('doubletap', _.bind(this.onLabelDoubletap, this));
                
            editor = (new Graph.svg.Group())
                .selectable(false)
                .render(block);
                
            comp.block = block.guid();
            comp.coat = coat.guid();
            comp.path = path.guid();
            comp.label = label.guid();
            comp.editor = editor.guid();
        },
        
        bindResource: function(type, resource) {
            var router = this.router,
                existing = this.props[type],
                handlers = this.handlers[type];
            
            if (existing && handlers) {
                existing = Graph.registry.vector.get(existing);
                if (existing) {
                    var name, ns;
                    for (name in handlers) {
                        ns = name + '.link';
                        existing.off(ns, handlers[name]);
                        ns = null;
                    }
                }
            }
            
            handlers = {};

            handlers.resize    = _.bind(getHandler(this, type, 'resize'), this);
            handlers.rotate    = _.bind(getHandler(this, type, 'rotate'), this);
            handlers.dragstart = _.bind(getHandler(this, type, 'dragstart'), this, _, resource);
            handlers.dragmove  = _.bind(getHandler(this, type, 'dragmove'), this);
            handlers.dragend   = _.bind(getHandler(this, type, 'dragend'), this);

            this.handlers[type] = handlers;
            this.props[type] = resource.guid();
            
            resource.on('resize.link', handlers.resize);
            resource.on('rotate.link', handlers.rotate);
            
            // VERY EXPENSIVE!!!
            if (resource.isDraggable()) {
                resource.on('dragstart.link', handlers.dragstart);
                if ( ! resource.draggable().ghost()) {
                    resource.on('dragmove.link', handlers.dragmove);
                } else {
                    resource.on('dragend.link', handlers.dragend);
                }
            }

            return this;
        },

        bindSource: function(source) {
            return this.bindResource('source', source);
        },

        bindTarget: function(target) {
            return this.bindResource('target', target);
        },

        component: function(name) {
            if (name === undefined) {
                return Graph.registry.vector.get(this.components.block);
            }
            return Graph.registry.vector.get(this.components[name]);
        },
        
        invalidate: function() {
            this.cached.bendpoints = null;
        },

        render: function(container) {
            var paper;

            this.component().render(container);
            paper = container.paper();

            if (paper) {
                Graph.registry.link.setContext(this.guid(), paper.guid());
            }
        },

        id: function() {
            return this.props.id;
        },

        guid: function() {
            return this.props.guid;
        },

        connect: function(/*start, end*/) {
            this.router.route();
        },
        
        update: function(command, silent) {
            
            silent = _.defaultTo(silent, false);
            
            this.component('coat').attr('d', command).dirty(true);
            this.component('path').attr('d', command);
            this.invalidate();
            
            if ( ! silent) {
                this.redraw();
                this.fire('update');
                Graph.topic.publish('link/update');
            }
        },
        
        refresh: function(silent) {
            var command = this.router.command();
            this.update(command, silent);
        },

        updateConvex: function(convex) {
            this.cached.convex = convex;
        },
        
        removeConvex: function() {
            this.cached.convex = null;
        },
        
        redraw: function() {
            // TODO: update label position
            
            if (this.props.label) {
                var label = this.component('label'),
                    bound = label.bbox().toJson(),
                    distance = this.props.labelDistance || .5,
                    scale = this.router.layout().currentScale(),
                    path = this.router.pathinfo(),
                    dots = path.pointAt(distance * path.length(), true),
                    align = Graph.util.pointAlign(dots.start, dots.end, 10);
                
                if (align == 'h') {
                    dots.x += ((10 + bound.width / 2) / scale.x);
                } else {
                    dots.y -= ((10 + bound.height / 2) / scale.y);
                }
                
                label.attr({
                    x: dots.x,
                    y: dots.y
                });
                
                path = null;
                dots = null;

                label.dirty(true);
            }
            
        },
        
        label: function(text, x, y) {
            var path, distance, point, align;
            
            if (text === undefined) {
                return this.props.label;
            }

            this.props.label = text;
            
            if (x !== undefined && y !== undefined) {
                path = this.router.pathinfo();
                point = path.nearest({x: x, y: y});
                distance = point.distance / path.length();
            } else if (_.isNull(this.props.labelDistance)) {
                path = this.router.pathinfo();
                distance = 0.5;
                point = path.pointAt(path.length() / 2, true);
            }
            
            if (point) {
                this.props.labelDistance = distance;
                path = point = null;
            }
            
            this.component('label').write(text);
            this.component('coat').data('text', text);
            
            this.redraw();
            return this;
        },

        select: function() {
            this.props.selected = true;
            this.component('block').addClass('selected');
            this.sendToFront();
            this.resumeControl();
        },

        deselect: function() {
            this.props.selected = false;
            this.component('block').removeClass('selected');
            this.suspendControl();
        },
        
        renderControl: function() {
            // TODO: render bends control
        },
        
        resumeControl: function() {
            var me = this, editor = me.component('editor');

            if ( ! me.cached.bendpoints) {
                me.cached.bendpoints = me.router.bendpoints();
                me.renderControl();
            }

            editor.elem.appendTo(this.component('block').elem);
        },
        
        suspendControl: function() {
            this.component('editor').elem.detach();
        },

        sendToFront: function() {
            var container = this.component().parent();
            this.component().elem.appendTo(container.elem);
        },

        toString: function() {
            return 'Graph.link.Link';
        },

        ///////// OBSERVERS /////////
        
        onRouterRoute: function(e) {
            var command = e.command;
            this.update(command);
        },
        
        onRouterReroute: function(e) {
            var source = e.source,
                target = e.target;

            this.bindResource('source', source);
            this.bindResource('target', target);
            this.sendToFront();
        },
        
        onLabelRender: function(e) {
            if (this.props.label) {
                this.label(this.props.label);
            }
        },
        
        onLabelDragend: function(e) {
            var label = this.component('label'),
                matrix = label.matrix(),
                x = label.attrs.x,
                y = label.attrs.y,
                p = {
                    x: matrix.x(x, y),
                    y: matrix.y(x, y)
                }
            
            label.attr({
                x: p.x,
                y: p.y
            });
            
            // update label distance
            var path = this.router.pathinfo(),
                near = path.nearest(p);
            
            this.props.labelDistance = near.distance / path.length();
            
            label.reset();
            
            matrix = path = null;
        },

        onLabelDoubletap: function(e) {
            var coat = this.component('coat');
            coat.editable().startEdit(e);
        },

        onCoatBeforeEdit: function(e) {
            this.component('label').hide();
            this.component().addClass('editing');
        },

        onCoatEdit: function(e) {
            this.component().removeClass('editing');
            this.component('label').show();
            this.label(e.text, e.left, e.top);
        },

        onCoatSelect: function(e) {
            this.select();
        },

        onCoatDeselect: function(e) {
            this.deselect();
        },

        onCoatDragStart: function(e) {
            this.suspendControl();
        },

        onCoatDragEnd: function(e) {
            var dx = e.dx,
                dy = e.dy;
            this.router.relocate(dx, dy);
            this.update(this.router.command());
        },

        onCoatRemove: function(e) {
            this.destroy();
        },

        ///////// OBSERVERS /////////
        
        onSourceRotate: function() {
    
        },

        onSourceDragstart: function(e, source) {
            var lasso = this.component('coat').$collector;
            if ( ! source.$collector) {
                if (lasso) {
                    lasso.decollect(this.component('coat'));
                }
            }

            // remove convex
            this.cached.convex = null;
        },

        onSourceDragmove: function() {
            this.router.repair('source');
        },

        onSourceDragend: function(e) {
            var lasso = this.component('coat').$collector;
            if ( ! lasso) {
                var port = this.router.tail();
                port.x += e.dx;
                port.y += e.dy;
                this.router.repair(this.router.source(), port);
            }
        },

        onSourceResize: function(e) {
            var port = this.router.tail();
            
            port.x += e.translate.dx;
            port.y += e.translate.dy;
            
            this.router.repair(this.router.source(), port);
        },

        onTargetRotate: function() {
            
        },

        onTargetDragstart: function(e, target) {
            var lasso = this.component('coat').$collector;

            if ( ! target.$collector) {
                if (lasso) {
                    lasso.decollect(this.component('coat'));
                }
            }

            // remove convex
            this.cached.convex = null;
        },

        onTargetDragmove: function() {
            this.router.repair('target');
        },

        onTargetDragend: function(e) {
            var lasso = this.component('coat').$collector;
            if ( ! lasso) {
                var port = this.router.head();
                port.x += e.dx;
                port.y += e.dy;
                    
                this.router.repair(this.router.target(), port);
            }
        },

        onTargetResize: function(e) {
            var port = this.router.head();
            
            port.x += e.translate.dx;
            port.y += e.translate.dy;
            
            this.router.repair(this.router.target(), port);
        },

        destroy: function() {
            var me = this;
            var prop;

            // remove label
            me.component('label').remove();

            // remove vertexs
            if (me.cached.controls) {
                _.forEach(me.cached.controls, function(id){
                    var c = Graph.registry.vector.get(id);
                    c && c.remove();
                });
                me.cached.controls = null;
            }

            // remove editor
            me.component('editor').remove();

            // remove path
            me.component('path').remove();

            // remove block
            me.component('block').remove();
            
            for (prop in me.components) {
                me.components[prop] = null;
            }

            // unbind resource
            _.forEach(['source', 'target'], function(res){
                var handlers = me.handlers[res],
                    resource = me.router[res]();
                
                var key, ns;

                if (handlers && resource) {
                    for (key in handlers) {
                        ns = key + '.link';
                        resource.off(ns, handlers[key]);
                    }
                }
                
                handlers = null;
            });

            // clear cache
            for (prop in me.cached) {
                me.cached[prop] = null;
            }

            me.router.destroy();
            me.router = null;

            // unregister
            Graph.registry.link.unregister(me);
            
            // publish
            Graph.topic.publish('link/remove');
        }

    });

    ///////// STATICS /////////
    
    Link.guid = 0;

    ///////// HELPERS /////////
    
    function getHandler(scope, resource, handler) {
        var name = 'on' + _.capitalize(resource) + _.capitalize(handler),
            func = scope[name];
        name = null;
        return func;
    }

}());

(function(){
    
    var Link = Graph.link.Link;
    
    Graph.link.Directed = Graph.extend(Link, {
        
        renderControl: function() {
            var me = this, editor = me.component('editor');

            if (me.cached.controls) {
                _.forEach(me.cached.controls, function(c){
                    c = Graph.registry.vector.get(c);
                    c.remove();
                });
                me.cached.controls = null;
            }

            var points = this.cached.bendpoints,
                maxlen = points.length - 1,
                linkid = me.guid(),
                controls = [];

            _.forEach(points, function(dot, i){
                
                var control = (new Graph.svg.Image(
                    Graph.config.base + 'img/resize-control.png',
                    dot.x - 17 / 2,
                    dot.y - 17 / 2,
                    17,
                    17
                ));
                
                control.selectable(false);
                control.removeClass(Graph.string.CLS_VECTOR_IMAGE);
                
                if (i === 0) {
                    control.addClass(Graph.string.CLS_LINK_TAIL);
                    control.elem.data('pole', 'tail');
                } else if (i === maxlen) {
                    control.addClass(Graph.string.CLS_LINK_HEAD);
                    control.elem.data('pole', 'head');
                }
                
                control.elem.group('graph-link');
                control.elem.data(Graph.string.ID_LINK, linkid);
                
                var context = {
                    trans: (i === 0 || i === maxlen) ? 'CONNECT' : 'BENDING',
                    index: dot.index,
                    space: dot.space,
                    point: {
                        x: dot.x,
                        y: dot.y
                    },
                    event: {
                        x: dot.x,
                        y: dot.y
                    },
                    range: {
                        start: dot.range[0],
                        end:   dot.range[1]
                    },
                    delta: {
                        x: 0,
                        y: 0
                    },
                    snap: {
                        hor: [],
                        ver: []
                    }
                };
                
                control.draggable();
                control.cursor('default');
                
                control.on('dragstart', _.bind(me.onControlStart, me, _, context, control));
                control.on('dragmove',  _.bind(me.onControlMove,  me, _, context, control));
                control.on('dragend',   _.bind(me.onControlEnd,   me, _, context, control));
                
                control.render(editor);
                controls.push(control.guid());
            });
            
            me.cached.controls = controls;
            controls = null;
        },
        
        onControlStart: function(e, context, control) {
            this.router.initTrans(context);
            
            var snaphor = context.snap.hor,
                snapver = context.snap.ver;
            
            control.draggable().snap([
                function(x, y){
                    var sx = Graph.util.snapValue(x, snapver),
                        sy = Graph.util.snapValue(y, snaphor);
                    
                    return {
                        x: sx,
                        y: sy,
                        range: 10
                    };
                }
            ]);
            
            _.forEach(this.cached.controls, function(id){
                var c = Graph.registry.vector.get(id);
                if (c && c !== control) {
                    c.hide();
                }
            });
            
            control.show();
        },
        
        onControlMove: function(e, context, control) {
            var me = this;
            
            context.delta.x += e.dx;
            context.delta.y += e.dy;
            
            var x1, y1, x2, y2;
            
            x1 = context.event.x,
            y1 = context.event.y;
            
            if (context.trans == 'BENDING') {
                me.router.bending(context, function(result){
                    me.update(result.command, true);
                });
            } else {
                me.router.connecting(context, function(result){
                    me.update(result.command, true);
                });
            }
            
            x2 = context.event.x,
            y2 = context.event.y;
            
            // update dragger
            e.originalData.dx = (x2 - x1);
            e.originalData.dy = (y2 - y1);
        },
        
        onControlEnd: function(e, context, control) {
            this.router.stopTrans(context);
            this.update(this.router.command());
            this.invalidate();
            this.resumeControl();
        }

    });

}());

(function(){

    Graph.link.Orthogonal = Graph.extend(Graph.link.Link, {
        
        update: function(command, silent) {
            var convex, smooth, radius, routes, maxlen, segments;
            
            silent = _.defaultTo(silent, false);
            
            convex = this.cached.convex;
            smooth = this.props.smooth;
            
            if (convex) {
                
                routes = this.router.waypoints().slice();
                maxlen = routes.length - 1;

                segments = [];
                
                _.forEach(routes, function(curr, i){
                    var prev = curr,
                        next = routes[i + 1];
                        
                    var item;
                    
                    if (i === 0) {
                        item = ['M', curr.x, curr.y];
                    } else {
                        item = ['L', curr.x, curr.y];
                    }
                    
                    segments.push(item);

                    if (convex[i]) {
                        _.forEach(convex[i], function(c){
                            var conseg = Graph.util.convexSegment(c, prev, next);
                            if (conseg) {
                                segments.push(conseg[0], conseg[1]);
                            }
                        });
                    }
                });

                command = Graph.util.segments2path(segments);
            }
            
            if (smooth) {
                radius = this.props.smootness || 6;
                segments = segments || Graph.util.path2segments(command).slice();
                
                var item, prev, next, curr, i;
                var bend;
                
                for (i = 0; i < segments.length; i++) {
                    item = segments[i];
                    next = segments[i + 1];
                    
                    bend = !!(item[0] == 'L' && next && next[0] != 'Q');
                    
                    if (bend) {
                        curr = {
                            x: item[item.length - 2],
                            y: item[item.length - 1]
                        };
                        
                        prev = segments[i - 1];
                        
                        if (prev && next) {
                            var ss = Graph.util.smoothSegment(
                                curr, 
                                { x: prev[prev.length - 2], y: prev[prev.length - 1] },
                                { x: next[next.length - 2], y: next[next.length - 1] },
                                radius
                            );
                            
                            if (ss) {
                                segments.splice(i, 1, ss[0], ss[1]);
                                i++;
                            }
                        }
                    }
                }
                command = Graph.util.segments2path(segments);
                // var p = Graph.path(command);
                // this.router.source().paper().path(p).style('stroke', 'red');
                
            }

            this.component('coat').attr('d', command).dirty(true);
            this.component('path').attr('d', command);
            
            this.invalidate();
            
            if ( ! silent) {
                
                this.redraw();
                
                this.fire('update');
                Graph.topic.publish('link/update');
            }
        },
        
        renderControl: function() {
            var me = this, editor = me.component('editor');

            if (me.cached.controls) {
                _.forEach(me.cached.controls, function(c){
                    c = Graph.registry.vector.get(c);
                    c.remove();
                });
                me.cached.controls = null;
            }

            var points = this.cached.bendpoints,
                linkid = me.guid(),
                maxlen = points.length - 1,
                controls = [];

            _.forEach(points, function(dot, i){
                var control, cursor, align, axis, drag;
                
                control = (new Graph.svg.Image(
                    Graph.config.base + 'img/resize-control.png',
                    dot.x - 17 / 2,
                    dot.y - 17 / 2,
                    17,
                    17
                ));
                
                control.selectable(false);
                control.removeClass(Graph.string.CLS_VECTOR_IMAGE);
                control.elem.group('graph-link');
                control.elem.data(Graph.string.ID_LINK, linkid);
                
                drag = {};
                axis = null;
                cursor = 'default';
                
                if (i === 0) {
                    control.addClass(Graph.string.CLS_LINK_TAIL);
                    control.elem.data('pole', 'tail');
                } else if (i === maxlen) {
                    control.addClass(Graph.string.CLS_LINK_HEAD);
                    control.elem.data('pole', 'head');
                } else {
                    align  = Graph.util.pointAlign(dot.start, dot.end);
                    axis   = align == 'v' ? 'y' : 'x';
                    cursor = axis  == 'x' ? 'ew-resize' : 'ns-resize';
                    
                    drag = {axis: axis};
                }
                
                var context = {
                    
                    trans: (i === 0 || i === maxlen) ? 'CONNECT' : 'BENDING',
                    index: dot.index,
                    axis: axis,
                    cursor: cursor,
                    point: {
                        x: dot.x,
                        y: dot.y
                    },
                    
                    ranges: {
                        start: dot.range[0],
                        end:   dot.range[1]
                    },
                    
                    event: {
                        x: dot.x,
                        y: dot.y
                    },
                    
                    snap: {
                        hor: [],
                        ver: []
                    },
                    
                    delta: {
                        x: 0,
                        y: 0
                    }
                };
                
                
                control.draggable(drag);
                control.cursor(cursor);
                
                control.on('dragstart', _.bind(me.onControlStart, me, _, context, control));
                control.on('dragmove',  _.bind(me.onControlMove,  me, _, context));
                control.on('dragend',   _.bind(me.onControlEnd,   me, _, context, control));
 
                control.render(editor);
                controls.push(control.guid());
            });
            
            me.cached.controls = controls;
            controls = null;
        },

        onControlStart: function(e, context, control) {
            this.component('coat').cursor(context.cursor);
            this.router.initTrans(context);
            
            // snapping
            var snaphor = context.snap.hor,
                snapver = context.snap.ver;
                
            control.draggable().snap([
                function(x, y) {
                    var sx = Graph.util.snapValue(x, snapver),
                        sy = Graph.util.snapValue(y, snaphor);
                    
                    return {
                        x: sx,
                        y: sy,
                        range: 10
                    };
                }
            ]);
            
            _.forEach(this.cached.controls, function(id){
                var c = Graph.registry.vector.get(id);
                if (c && c !== control) {
                    c.hide();
                }
            });
            
            control.show();
            this.removeConvex();
        },

        onControlMove: function(e, context) {
            var me = this;
            
            context.delta.x += e.dx;
            context.delta.y += e.dy;
            
            var x1, y1, x2, y2, dx, dy;
            
            x1 = context.event.x;
            y1 = context.event.y;
            
            if (context.trans == 'BENDING') {
                me.router.bending(context, function(result){
                    me.update(result.command, true);
                });
            } else {
                me.router.connecting(context, function(result){
                    me.update(result.command, true);
                });
            }

            x2 = context.event.x;
            y2 = context.event.y;
            
            dx = x2 - x1;
            dy = y2 - y1;
            
            // update dragger
            e.originalData.dx = dx;
            e.originalData.dy = dy;
        },

        onControlEnd: function(e, context, control) {
            this.component('coat').cursor('pointer');
            this.router.stopTrans(context);
            this.update(this.router.command());
            this.invalidate();
            this.resumeControl();
        },

        toString: function() {
            return 'Graph.link.Orthogonal';
        }

    });
    
}());

(function(){

    Graph.util.Spotlight = Graph.extend({
        props: {
            suspended: true,
            rendered: false
        },
        
        components: {
            G: null,
            N: null,
            E: null,
            S: null,
            W: null
        },

        paper: null,
        
        constructor: function(paper) {
            var me = this, comp = me.components;

            me.paper = paper;

            comp.G = (new Graph.svg.Group())
                .traversable(false)
                .selectable(false)
                .addClass('graph-util-spotlight');

            _.forEach(['N', 'E', 'S', 'W'], function(name){
                comp[name] = (new Graph.svg.Line(0, 0, 0, 0))
                    .removeClass(Graph.string.CLS_VECTOR_LINE)
                    .traversable(false)
                    .selectable(false)
                    .render(comp.G);
            });

            // paper.on('pointerdown', function(e){
            //     var vector = Graph.registry.vector.get(e.target);
            //     me.focus(vector);
            // })
        },
        
        component: function() {
            return this.components.G;
        },
        
        render: function() {
            if (this.props.rendered) {
                return;
            }

            this.components.G.render(this.paper);
            this.props.rendered = true;
        },

        suspend: function() {
            this.props.suspended = true;
            this.components.G.elem.detach();
            // this.components.G.removeClass('visible');
        },

        resume: function() {
            this.props.suspended = false;

            if ( ! this.props.rendered) {
                this.render();
            } else {
                this.paper.viewport().elem.append(this.components.G.elem);
                // this.components.G.addClass('visible');    
            }
        },

        focus: function(target, state) {
            state = _.defaultTo(state, true);

            if ( ! state) {
                this.suspend();
                return;
            }

            var tbox = target.bbox().toJson(),
                dots = target.dots(true),
                comp = this.components,
                root = this.paper;

            var x, y, h, w;

            x = tbox.x,
            y = tbox.y,
            h = root.elem.height() || 0;
            w = root.elem.width() || 0;

            this.resume();

            comp.W.attr({
                x1: x,
                y1: 0,
                x2: x,
                y2: h
            });

            comp.E.attr({
                x1: x + tbox.width,
                y1: 0,
                x2: x + tbox.width,
                y2: h
            });

            comp.N.attr({
                x1: 0,
                y1: y,
                x2: w,
                y2: y
            });

            comp.S.attr({
                x1: 0,
                y1: y + tbox.height,
                x2: w,
                y2: y + tbox.height
            });
        },
        toString: function() {
            return 'Graph.util.Spotlight';
        }
    });

}());

(function(){

    Graph.util.Toolpad = Graph.extend({

        props: {
            vector: null,

            rendered: false,
            suspended: true,
            
            tools: [

            ]
        },

        components: {
            block: null
        },

        paper: null,

        constructor: function(paper) {
            this.paper = paper;
            this.initComponent();

            Graph.topic.subscribe('vector/select', _.bind(this.onVectorSelect, this));
            Graph.topic.subscribe('vector/deselect', _.bind(this.onVectorDeselect, this));
        },

        initComponent: function() {
            var comp = this.components;
            comp.block = Graph.$('<div class="graph-util-toolpad">');
        },

        render: function() {
            if (this.props.rendered) {
                this.redraw();
                return;
            }

            this.paper.container().append(this.components.block);
            this.rendered = true;

            this.redraw();
        },

        vector: function() {
            return Graph.registry.vector.get(this.props.vector);
        },

        resume: function() {
            this.props.suspended = false;

            if ( ! this.props.rendered) {
                this.render();
            } else {
                this.paper.container().append(this.components.block);
            }

            this.redraw();
        },

        redraw: function() {
            var vector = this.vector(),
                box = vector.bbox().toJson(),
                pos = vector.position();

            this.components.block.css({
                top: pos.top,
                left: pos.left + box.width + 12
            });
        },

        suspend: function()  {
            this.props.suspended = true;
            this.components.block.detach();
        },

        onVectorSelect: function(e) {
            // var vector = e.vector;
            // this.props.vector = vector.guid();
            // this.resume();
        },

        onVectorDeselect: function(e) {
            // this.suspend();
        }

    });

}());

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
        var segments = link.router.pathinfo().curve().segments, 
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

(function(){

    Graph.plugin.Plugin = Graph.extend({

        props: {
            shield: null,
            vector: null,
            activator: 'tool'
        },

        cached: {
            bboxMatrix: null,
            pathMatrix: null
        },

        vector: function() {
            return Graph.registry.vector.get(this.props.vector);
        },

        shield: function() {
            if (this.props.shield == this.props.vector) {
                return this.vector();
            }
            return Graph.registry.vector.get(this.props.shield);
        },

        invalidate: function() {
            this.cached.bboxMatrix = null;
            this.cached.pathMatrix = null;
        },

        bboxMatrix: function() {
            var matrix = this.cached.bboxMatrix;

            if ( ! matrix) {
                if (this.props.vector == this.props.shield) {
                    matrix = this.vector().matrix().clone();
                } else {
                    matrix = this.shield().matrix().clone();
                }

                this.cached.bboxMatrix = matrix;
            }
            
            return matrix;
        },
        
        pathMatrix: function() {
            var matrix = this.cached.pathMatrix;

            if ( ! matrix) {
                matrix = Graph.matrix();

                if (this.props.vector == this.props.shield) {
                    matrix = matrix.multiply(this.vector().matrix());
                } else {
                    var shield = this.shield(),
                        vector = this.vector();

                    vector.bubble(function(curr){
                        matrix.multiply(curr.matrix());
                        if (curr == shield) {
                            return false;
                        }
                    });
                }
                this.cached.pathMatrix = matrix;
            }

            return matrix;
        },

        bbox: function() {
            var matrix = this.bboxMatrix(),
                path = this.vector().pathinfo().transform(matrix),
                bbox = path.bbox();
            
            matrix = path = null;
            
            return bbox;
        },

        pathinfo: function() {
            var matrix = this.pathMatrix(),
                path = this.vector().pathinfo().transform(matrix);
            
            matrix = null;
            
            return path;
        },

        hasShield: function() {
            return this.props.vector != this.props.shield;
        },

        enable: function(activator) {},

        disable: function() {},

        destroy: function() {}

    });

}());

(function(){

    Graph.plugin.Definer = Graph.extend(Graph.plugin.Plugin, {
        props: {
            vector: null
        },

        definitions: {

        },

        components: {
            holder: null
        },

        constructor: function(vector) {
            this.props.vector = vector.guid();

            this.components.holder = Graph.$('<defs/>');
            this.components.holder.prependTo(vector.elem);

            if (vector.isPaper()) {
                this.defineArrowMarker('marker-arrow');
            }

        },
        
        defineArrowMarker: function(id) {
            if (this.definitions[id]) {
                return this.definitions[id];
            }

            var marker = Graph.$(_.format(
                '<marker id="{0}" refX="{1}" refY="{2}" viewBox="{3}" markerWidth="{4}" markerHeight="{5}" orient="{6}">' + 
                    '<path d="{7}" fill="{8}" stroke-width="{9}" stroke-linecap="{10}" stroke-dasharray="{11}">' + 
                    '</path>'+
                '</marker>',
                id, '11', '10', '0 0 20 20', '10', '10', 'auto',
                'M 1 5 L 11 10 L 1 15 Z', '#000000', '1', 'round', '10000, 1'
            ));

            this.definitions[id] = marker;
            this.components.holder.append(marker);

            return marker;
        },

        toString: function() {
            return 'Graph.plugin.Definer';
        }
    });

}());

(function(){
    
    var Reactor = Graph.plugin.Reactor = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null
        },

        plugin: null,
        
        navigationKeys: [
            Graph.event.ENTER,
            Graph.event.DELETE,
            Graph.event.SHIFT,
            Graph.event.CTRL,
            Graph.event.ESC
        ],

        constructor: function(vector, listeners) {
            var me = this;

            this.props.vector = vector.guid();
            this.plugin = interact(vector.node());
            this.listeners = listeners || {};

            this.plugin.on('down', function(e){
                e.originalType = 'pointerdown';
                vector.fire(e);
            }, true);

            vector.elem.on({
                mouseenter: function(e) {
                    e.type = 'pointerin'
                    vector.fire(e);
                },
                mouseleave: function(e) {
                    e.type = 'pointerout';
                    vector.fire(e);
                }
            });

            if (vector.isPaper()) {
                Graph.$(document).on('keydown', function(e){
                    if (me.isNavigation(e)) {
                        e.originalType = 'keynavdown';
                        vector.fire(e);    
                    }
                });

                Graph.$(document).on('keyup', function(e){
                    if (me.isNavigation(e)) {
                        e.originalType = 'keynavup';
                        vector.fire(e);
                    }
                });
            }
        },

        isNavigation: function(e) {
            var key = e.keyCode;
            return _.indexOf(this.navigationKeys, key) > -1;
        },
        
        vendor: function() {
            return this.plugin;
        },

        draggable: function(options) {
            return this.plugin.draggable(options);
        },

        dropzone: function(options) {
            return this.plugin.dropzone(options);
        },

        gesturable: function(options) {
            return this.plugin.gesturable(options);
        },

        destroy: function() {
            this.plugin.unset();
            this.plugin = null;
        },

        toString: function() {
            return 'Graph.plugin.Reactor';
        }
    });

    var on  = Reactor.prototype.on,
        off = Reactor.prototype.off;

    /**
     * Override
     */
    Reactor.prototype.on = function(event, handler) {
        var vector = this.vector();
        return on.apply(vector, [event, handler]);
    };

    /**
     * Override
     */
    Reactor.prototype.off = function(event, handler) {
        var vector = this.vector();
        return off.apply(vector, [event, handler]);
    };

}());

(function(){

    Graph.plugin.Transformer = Graph.extend(Graph.plugin.Plugin, {
        
        props: {
            scale: 1,
            rotate: 0
        },

        constructor: function(vector) {
            this.actions = [];
            this.props.vector = vector.guid();
        },

        transform: function(command) {
            var me = this, segments = Graph.util.transform2segments(command);

            _.forEach(segments, function(args){
                var method = args.shift();
                if (me[method] && _.isFunction(me[method])) {
                    (function(){
                        me[method].apply(me, args);
                    }(method, args));    
                }
            });

            return this;
        },
        queue: function() {
            var args = _.toArray(arguments);
            
            this.actions.push({
                name: args.shift(),
                args: args,
                sort: this.actions.length
            });

            return this;
        },
        translate: function(dx, dy) {
            dx = _.defaultTo(dx, 0);
            dy = _.defaultTo(dy, 0);
            this.queue('translate', dx, dy);
            return this;
        },
        rotate: function(deg, cx, cy) {
            if ( ! _.isUndefined(cx) && ! _.isUndefined(cy)) {
                this.queue('rotate', deg, cx, cy);    
            } else {
                this.queue('rotate', deg);    
            }
            return this;
        },
        scale: function(sx, sy, cx, cy) {
            sy = _.defaultTo(sy, sx);

            if ( ! _.isUndefined(cx) && ! _.isUndefined(cy)) {
                this.queue('scale', sx, sy, cx, cy);
            } else {
                this.queue('scale', sx, sy);
            }
            return this;
        },

        matrix: function(a, b, c, d, e, f) {
            this.queue('matrix', a, b, c, d, e, f);
            return this;
        },

        commit: function(absolute, simulate) {
            var me = this,
                actions = me.actions,
                vector = me.vector(),
                events = {
                    translate: false,
                    rotate: false,
                    scale: false
                };

            if ( ! actions.length) {
                return;
            }
            
            absolute = _.defaultTo(absolute, false);
            simulate = _.defaultTo(simulate, false);
            
            var deg = 0, 
                dx = 0, 
                dy = 0, 
                sx = 1, 
                sy = 1;
                
            var mat = vector.matrix().clone();
            
            _.forEach(actions, function(act){
                var arg = act.args,
                    cmd = act.name,
                    len = arg.length,
                    inv = false;

                if (absolute) {
                    inv = mat.invert(true);
                }
                
                var x1, y1, x2, y2, bb;
                
                if (cmd == 'translate' && len === 2) {
                    if (absolute) {
                        x1 = inv.x(0, 0);
                        y1 = inv.y(0, 0);
                        x2 = inv.x(arg[0], arg[1]);
                        y2 = inv.y(arg[0], arg[1]);
                        mat.translate(x2 - x1, y2 - y1);
                    } else {
                        mat.translate(arg[0], arg[1]);
                    }
                    events.translate = true;
                } else if (cmd == 'rotate') {
                    if (len == 1) {
                        bb = bb || vector.bbox(true).toJson();
                        mat.rotate(arg[0], bb.x + bb.width / 2, bb.y + bb.height / 2);
                        deg += arg[0];
                    } else if (len == 3) {
                        if (absolute) {
                            x2 = inv.x(arg[1], arg[2]);
                            y2 = inv.y(arg[1], arg[2]);
                            mat.rotate(arg[0], x2, y2);
                        } else {
                            mat.rotate(arg[0], arg[1], arg[2]);
                        }
                        deg += arg[0];
                    }
                    events.rotate = true;
                } else if (cmd == 'scale') {
                    if (len === 1 || len === 2) {
                        bb = bb || vector.bbox(true).toJson();
                        mat.scale(arg[0], arg[len - 1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                        sx *= arg[0];
                        sy *= arg[len - 1];
                    } else if (len === 4) {
                        if (absolute) {
                            x2 = inv.x(arg[2], arg[3]);
                            y2 = inv.y(arg[2], arg[3]);
                            mat.scale(arg[0], arg[1], x2, y2);
                        } else {
                            mat.scale(arg[0], arg[1], arg[2], arg[3]);
                        }
                        sx *= arg[0];
                        sy *= arg[1];
                    }
                    events.scale = true;
                } else if (cmd == 'matrix') {
                    mat.multiply(arg[0], arg[1], arg[2], arg[3], arg[4], arg[5]);
                }
            });

            if (simulate) {
                this.actions = [];
                return mat;
            }
            
            vector.graph.matrix = mat;
            vector.attr('transform', mat);

            if (events.translate) {
                events.translate = {
                    dx: mat.e,
                    dy: mat.f
                };
                this.fire('translate', events.translate);
            }

            if (events.rotate) {
                events.rotate = {
                    deg: deg
                };
                this.fire('rotate', events.rotate);
            }

            if (events.scale) {
                events.scale = {
                    sx: sx,
                    sy: sy
                };
                this.fire('scale', events.scale);
            }

            this.actions = [];
        },

        toString: function() {
            return 'Graph.plugin.Transformer';
        }
    });
    
}());

(function(){
    var global = this;

    var Animator = Graph.plugin.Animator = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null,

            // default duration
            duration: 1000,

            // default easing
            easing: 'linier'
        },

        stacks: [],

        constructor: function(vector) {
            this.props.vector = vector.guid();
        },
        
        create: function(keyframes, duration, easing, callback) {
            return new Animation(keyframes, duration, easing, callback);
        },

        animate: function(params, duration, easing, callback) {
            var vector = this.vector(),
                reset = _.extend({}, vector.attrs);

            var scenes, animation;

            if (params instanceof Animation ) {
                animation = params;
            } else {
                duration = _.defaultTo(duration, this.props.duration);

                if (_.isFunction(easing)) {
                    callback = easing;
                    easing = this.props.easing;
                }

                if ( ! easing) {
                    easing = this.props.easing;
                }

                scenes = {
                    100: params
                };

                animation = new Animation(scenes, duration, easing, callback);
            }

            if ( ! animation.count()) {
                animation = null;
                return;
            }

            reset.transform = vector.attrs.transform;
            reset.matrix = vector.matrix().clone();

            this.start(
                animation, 
                animation.frame(0), 
                reset, 
                null
            );

            animation = null;

            return this;
        },

        resume: function() {

        },

        pause: function() {

        },

        stop: function() {

        },

        start: function(animation, frame, reset, status) {
            var asize = animation.count();

            if ( ! asize) {
                animation = null;
                return;
            }

            var vector = this.vector(),
                ssize = this.stacks.length,
                origin = {},
                delta = {},
                from = {},
                to = {};

            var scene, queue, last, time, playing, applied, p, i;

            if (status) {
                for (i = 0; i < ssize; i++) {
                    p = this.stacks[i];
                    if (p.animation == animation) {
                        if (p.frame != frame) {
                            this.stacks.splice(i, 1);
                            applied = 1;
                        } else {
                            playing = p;
                        }
                        vector.attr(p.reset);
                        break;
                    }
                }
            } else {
                status = +to;
            }

            queue = {
                animation: animation,
                vector: vector
            };

            time = animation.duration();
            last = animation.at(asize - 1).frame;

            for (i = 0; i < asize; i++) {
                scene = animation.at(i);
                if (scene.frame == frame || scene.frame > status * last) {

                    queue.prev = animation.at(i - 1);
                    queue.prev = queue.prev ? queue.prev.frame : 0;

                    queue.frame = scene.frame;
                    queue.duration = time / last * (queue.frame - queue.prev);

                    queue.next = animation.at(i + 1);
                    queue.next = queue.next ? queue.next.frame : undefined;

                    queue.last = last;
                    break;
                } else if (status) {
                    vector.attr(scene.params);
                }
            }

            if ( ! playing) {

                time = queue.duration;

                _.forOwn(scene.params, function(v, k){
                    
                    var able = Animation.animable[k];
                    var plugin, matrix, inverse, segments;
                    var i, j, ii, jj;

                    if (able) {
                        from[k] = vector.attrs[k];
                        from[k] = _.defaultTo(from[k], able.defaults);
                        to[k]   = v;

                        switch(able.type) {
                            case 'number':
                                delta[k] = (to[k] - from[k]) / time;
                                break;

                            case 'transform':
                                var eq = equalizeTransform(vector.attrs[k], v);

                                if (eq.equal) {
                                    from[k]  = eq.from;
                                    to[k]    = eq.to;
                                    delta[k] = [];
                                    delta[k].semantic = true;
                                    for (i = 0, ii = from[k].length; i < ii; i++) {
                                        delta[k][i] = [from[k][i][0]];
                                        for (j = 1, jj = from[k][i].length; j < jj; j++) {
                                            delta[k][i][j] = (to[k][i][j] - from[k][i][j]) / time;
                                        }
                                    }
                                } else {
                                    plugin = vector.plugins.transformer;
                                    segments = Graph.util.transform2segments(to[k]);

                                    matrix = vector.matrix();

                                    from[k] = matrix.clone();
                                    inverse = matrix.invert(true);

                                    vector.graph.matrix = matrix.multiply(inverse);

                                    _.forEach(segments, function(s){
                                        var cmd = s[0], args = s.slice(1);
                                        plugin[cmd].apply(plugin, args);
                                    });

                                    matrix = plugin.commit(false, true);
                                    to[k] = matrix.clone();

                                    delta[k] = {
                                        a: (to[k].props.a - from[k].props.a) / time,
                                        b: (to[k].props.b - from[k].props.b) / time,
                                        c: (to[k].props.c - from[k].props.c) / time,
                                        d: (to[k].props.d - from[k].props.d) / time,
                                        e: (to[k].props.e - from[k].props.e) / time,
                                        f: (to[k].props.f - from[k].props.f) / time
                                    };

                                    segments = null;
                                    plugin = null;
                                    matrix = null;
                                }

                                break;
                        }
                    }

                });

                var timestamp = +new Date;

                _.extend(queue, {
                    scene: scene,
                    timestamp: timestamp,
                    start: timestamp + animation.delay(),

                    reset: reset,
                    from: from,
                    to: to,
                    delta: delta,

                    status: 0,
                    initstatus: status || 0,

                    stop: false
                });

                this.stacks.push(queue);

                if (status && ! playing && ! applied) {
                    queue.stop = true;
                    queue.start = new Date - scene.duration * status;
                    if (this.stacks.length === 1) {
                        return this.player();
                    }
                }

                if (applied) {
                    queue.start = new Date - scene.duration * status;
                }

                if (this.stacks.length === 1) {
                    Animator.play(_.bind(this.player, this));
                }
            } else {
                playing.initstatus = status;
                playing.start = new Date - playing.duration * status;
            }

            this.fire('animstart');

        },

        player: function() {
            var timestamp = +new Date, tick = 0;
            var vector, curr, from, prog, anim, time, able, value, key, type, scene, matrix;
            var plugin, matrix, method, args;
            var key, to, ii, jj, i, j;

            for (; tick < this.stacks.length; tick++) {
                curr = this.stacks[tick];

                if (curr.paused) {
                    continue;
                }
                
                prog   = timestamp - curr.start;

                time   = curr.duration;
                vector = curr.vector;
                scene  = curr.scene;
                from   = curr.from;
                to     = curr.to;
                delta  = curr.delta;
                anim   = curr.animation;

                if (curr.initstatus) {
                    prog = (curr.initstatus * curr.last - curr.prev) / (curr.frame - curr.prev) * time;
                    curr.status = curr.initstatus;
                    delete curr.initstatus;
                    curr.stop && this.stacks.splice(tick--, 1);
                } else {
                    curr.status = (curr.prev + (curr.frame - curr.prev) * (prog / time)) / curr.last;
                }

                if (prog < 0) {
                    continue;
                }

                if (prog < time) {

                    ease = scene.easing(prog / time);

                    for (key in from) {
                        
                        able = Animation.animable[key];

                        switch(able.type) {
                            case 'number':

                                value = +from[key] + ease * time * delta[key];
                                vector.attr(name, value);

                                break;
                            case 'transform':

                                // semantic `rotate,scale,translate`
                                if (delta[key].semantic) {
                                    plugin = vector.plugins.transformer;

                                    for (i = 0, ii = from[key].length; i < ii; i++) {
                                        method = from[key][i][0];
                                        args = [];

                                        for (j = 1, jj = from[key][i].length; j < jj; j++) {
                                            args.push(from[key][i][j] + ease * time * delta[key][i][j]);
                                        }

                                        plugin[method].apply(plugin, args);
                                    }

                                    matrix = plugin.commit(false, true);

                                    vector.attr('transform', matrix.toString());


                                    matrix = null;
                                    plugin = null;

                                } else {
                                    matrix = Graph.matrix(
                                        from[key].props.a + ease * time * delta[key].a,
                                        from[key].props.b + ease * time * delta[key].b,
                                        from[key].props.c + ease * time * delta[key].c,
                                        from[key].props.d + ease * time * delta[key].d,
                                        from[key].props.e + ease * time * delta[key].e,
                                        from[key].props.f + ease * time * delta[key].f
                                    );
                                    vector.attr('transform', matrix.toString());
                                    matrix = null;
                                }

                                break;
                        }
                    }

                } else {

                    for (key in to) {
                        
                        able = Animation.animable[key];

                        switch(able.type) {

                            case 'transform':

                                if (delta[key].semantic) {
                                    plugin = vector.plugins.transformer;

                                    _.forEach(to[key], function(v){
                                        var cmd = v[0], args = v.slice(1);
                                        plugin[cmd].apply(plugin, args);
                                    });

                                    matrix = plugin.commit(false, true);

                                    vector.graph.matrix = matrix;
                                    vector.attr('transform', matrix.toString());
                                    
                                    matrix = null;
                                    plugin = null;
                                } else {
                                    matrix = to[key].clone();

                                    vector.graph.matrix = matrix;
                                    vector.attr('transform', matrix.toString());

                                    matrix = null;
                                }
                                break;
                            
                            default:
                                vector.attr(key, to[key]);
                                break;
                        }
                    }
                    
                    scene.played++;

                    this.stacks.splice(tick--, 1);

                    var repeat = anim.repeat(), 
                        played = scene.played;

                    if ((repeat > 1 && played < repeat) && ! curr.next ) {
                        _.forOwn(anim.scenes, function(s, k){
                            for (var key in s.params) {
                                if (key == 'transform') {
                                    vector.graph.matrix = curr.reset.matrix;
                                    vector.attr('transform', curr.reset.transform);
                                } else {
                                    vector.attr(k, curr.reset[k]);    
                                }
                            }
                        });

                        this.start(
                            anim,
                            anim.frame(0),
                            curr.reset,
                            null
                        );
                    }

                    if (curr.next && ! curr.stop) {
                        this.start(
                            anim,
                            curr.next,
                            curr.reset,
                            null
                        );
                    }

                    if (played >= repeat) {
                        // ___DONE___?
                        curr = null;
                    }
                }
            }

            if (this.stacks.length) {
                Animator.play(_.bind(this.player, this));
            } else {
                // ___DONE___
            }
        },

        toString: function() {
            return 'Graph.plugin.Animator';
        }

    });

    ///////// STATICS /////////

    Animator.play = (function(g){
        var func = g.requestAnimationFrame || 
                   g.webkitRequestAnimationFrame || 
                   g.mozRequestAnimationFrame || 
                   g.oRequestAnimationFrame || 
                   g.msRequestAnimationFrame || 
                   function (callback) { 
                        setTimeout(callback, 16); 
                   };

        return _.bind(func, g);
    }(global));

    ///////// INTERNAL ANIMATION /////////
    
    var Animation = Graph.extend({

        props: {
            easing: 'linier',
            duration: 1000,
            repeat: 1,
            delay: 0
        },
        
        scenes: {},
        frames: [],

        constructor: function(keyframes, duration, easing, callback) {
            this.props.guid = 'graph-anim-' + (++Animation.guid);
            this.props.duration = duration = _.defaultTo(duration, 1000);

            if (_.isFunction(easing)) {
                if (callback) {
                    this.props.easing = 'function';
                } else {
                    callback = easing;
                    easing = this.props.easing;
                }
            }

            if ( ! easing) {
                easing = this.props.easing;
            }

            if (keyframes) {
                var easing = _.isString(easing) ? Animation.easing[easing] : easing,
                    repeat = this.props.repeat,
                    scenes = this.scenes,
                    frames = this.frames;

                _.forOwn(keyframes, function(f, key){
                    var params = {}, frame, scene;

                    frame = _.toNumber(key);

                    params = _.pickBy(f, function(v, k){
                        return !!Animation.animable[k];
                    });

                    scene = {
                        frame: frame,
                        params: params,
                        easing: easing,
                        callback: callback,
                        played: 0
                    };

                    frames.push(frame);
                    scenes[frame] = scene;
                });

                frames.sort(function(a, b){ return a - b });
            }
        },

        guid: function() {
            return this.props.guid;
        },

        duration: function() {
            return this.props.duration;
        },

        easing: function() {
            return this.props.easing;
        },

        delay: function(delay) {

            if (delay === undefined) {
                return this.props.delay;
            }

            var anim = new Animation();

            anim.frames = this.frames;
            anim.scenes = _.cloneDeep(this.scenes);
            anim.props  = _.cloneDeep(this.props);
            anim.props.delay = delay || 0;
            
            return anim;
        },

        repeat: function(times) {

            if (times === undefined) {
                return this.props.repeat;
            }

            var anim = new Animation();

            anim.frames = this.frames.slice();
            anim.scenes = _.cloneDeep(this.scenes);
            anim.props  = _.cloneDeep(this.props);
            anim.props.repeat = Math.floor(Math.max(times, 0)) || 1;

            // reset to scenes
            _.forOwn(anim.scenes, function(s, f){
                s.played = 0;
            });

            return anim;
        },

        count: function() {
            return this.frames.length;
        },

        at: function(index) {
            var frame = this.frame(index);
            return this.scene(frame);
        },

        frame: function(index) {
            return this.frames[index];
        },

        scene: function(frame) {
            return this.scenes[frame];
        },

        destroy: function() {
            this.scenes = null;
            this.frames = null;
        }

    });

    ///////// STATICS /////////

    _.extend(Animation, {
        guid: 0,

        animable: {
             x: { type: 'number', defaults: 0 },
             y: { type: 'number', defaults: 0 },
            cx: { type: 'number', defaults: 0 },
            cy: { type: 'number', defaults: 0 },
            transform: { type: 'transform', defaults: '' }
        },

        easing: {
            linier: function(n) {
                return n;
            },

            easeIn: function(n) {
                return Math.pow(n, 1.7);
            },

            easeOut: function(n) {
                return Math.pow(n, .48);
            },

            easeInOut: function(n) {
                var q = .48 - n / 1.04,
                    Q = Math.sqrt(.1734 + q * q),
                    x = Q - q,
                    X = Math.pow(Math.abs(x), 1 / 3) * (x < 0 ? -1 : 1),
                    y = -Q - q,
                    Y = Math.pow(Math.abs(y), 1 / 3) * (y < 0 ? -1 : 1),
                    t = X + Y + .5;
                return (1 - t) * 3 * t * t + t * t * t;
            },

            backIn: function(n) {
                var s = 1.70158;
                return n * n * ((s + 1) * n - s);
            },

            backOut: function (n) {
                n = n - 1;
                var s = 1.70158;
                return n * n * ((s + 1) * n + s) + 1;
            },

            elastic: function (n) {
                if (n == !!n) {
                    return n;
                }
                return pow(2, -10 * n) * math.sin((n - .075) * (2 * PI) / .3) + 1;
            },

            bounce: function (n) {
                var s = 7.5625,
                    p = 2.75,
                    l;
                if (n < (1 / p)) {
                    l = s * n * n;
                } else {
                    if (n < (2 / p)) {
                        n -= (1.5 / p);
                        l = s * n * n + .75;
                    } else {
                        if (n < (2.5 / p)) {
                            n -= (2.25 / p);
                            l = s * n * n + .9375;
                        } else {
                            n -= (2.625 / p);
                            l = s * n * n + .984375;
                        }
                    }
                }
                return l;
            }
        }
    });

    ///////// HELPERS /////////
    
    function equalizeTransform (t1, t2) {
        t2 = _.toString(t2).replace(/\.{3}|\u2026/g, t1);
        t1 = Graph.util.transform2segments(t1) || [];
        t2 = Graph.util.transform2segments(t2) || [];
        
        var maxlength = Math.max(t1.length, t2.length),
            from = [],
            to = [],
            i = 0, j, jj,
            tt1, tt2;

        for (; i < maxlength; i++) {
            tt1 = t1[i] || emptyTransform(t2[i]);
            tt2 = t2[i] || emptyTransform(tt1);

            if ((tt1[0] != tt2[0]) ||
                (tt1[0].toLowerCase() == "rotate" && (tt1[2] != tt2[2] || tt1[3] != tt2[3])) ||
                (tt1[0].toLowerCase() == "scale" && (tt1[3] != tt2[3] || tt1[4] != tt2[4]))) {
                return {
                    equal: false,
                    from: tt1,
                    to: tt2
                }
            }
            from[i] = [];
            to[i] = [];
            for (j = 0, jj = Math.max(tt1.length, tt2.length); j < jj; j++) {
                j in tt1 && (from[i][j] = tt1[j]);
                j in tt2 && (to[i][j] = tt2[j]);
            }
        }
        return {
            equal: true,
            from: from,
            to: to
        };
    }

    function emptyTransform(item) {
        var l = item[0];
        switch (l.toLowerCase()) {
            case "translate": return [l, 0, 0];
            case "matrix": return [l, 1, 0, 0, 1, 0, 0];
            case "rotate": if (item.length == 4) {
                return [l, 0, item[2], item[3]];
            } else {
                return [l, 0];
            }
            case "scale": if (item.length == 5) {
                return [l, 1, 1, item[3], item[4]];
            } else if (item.length == 3) {
                return [l, 1, 1];
            } else {
                return [l, 1];
            }
        }
    }

}());

(function(){
    
    Graph.plugin.Resizer = Graph.extend(Graph.plugin.Plugin, {
        
        props: {
            shield: null,
            vector: null,
            enabled: true,
            suspended: true,
            handleImage: Graph.config.base + 'img/resize-control.png',
            handleSize: 17,
            rendered: false
        },

        components: {
            holder: null,
            helper: null,
            handle: null
        },

        trans: {
            // original offset
            ox: 0,
            oy: 0,

            // original
            ow: 0,
            oh: 0,

            // current
            cw: 0,
            ch: 0,

            // translation
            dx: 0,
            dy: 0
        },

        constructor: function(vector, options) {
            var me = this, guid = vector.guid();
            
            options = options || {};

            if (options.shield) {
                options.shield = options.shield.guid();
            } else {
                options.shield = guid;
            }

            _.assign(me.props, options);

            vector.addClass('graph-resizable');

            me.props.handleImage = Graph.config.base + 'img/resize-control.png';

            me.props.vector = guid;

            me.cached.snapping = null;
            me.cached.vertices = null;

            me.initComponent();
        },
        
        holder: function() {
            return Graph.registry.vector.get(this.components.holder);
        },

        helper: function() {
            return Graph.registry.vector.get(this.components.helper);
        },

        handle: function(dir) {
            return Graph.registry.vector.get(this.components.handle[dir]);
        },

        initComponent: function() {
            var me = this, comp = me.components;
            var holder, helper;

            holder = (new Graph.svg.Group())
                .addClass('graph-resizer')
                .removeClass('graph-elem graph-elem-group');

            holder.elem.group('graph-resizer');

            holder.on({
                render: _.bind(me.onHolderRender, me)
            });
            
            helper = (new Graph.svg.Rect(0, 0, 0, 0, 0))
                .addClass('graph-resizer-helper')
                .removeClass('graph-elem graph-elem-rect')
                .selectable(false)
                .clickable(false)
                .render(holder);

            helper.elem.group('graph-resizer');

            comp.handle = {};

            var handle = {
                ne: {cursor: 'nesw-resize'},
                se: {cursor: 'nwse-resize'},
                sw: {cursor: 'nesw-resize'},
                nw: {cursor: 'nwse-resize'},
                 n: {cursor: 'ns-resize', axis: 'y'},
                 e: {cursor: 'ew-resize', axis: 'x'},
                 s: {cursor: 'ns-resize', axis: 'y'},
                 w: {cursor: 'ew-resize', axis: 'x'}
            };

            _.forOwn(handle, function(c, dir){
                (function(dir){
                    var h = (new Graph.svg.Image(
                        me.props.handleImage,
                        0,
                        0,
                        me.props.handleSize,
                        me.props.handleSize
                    ))
                    .selectable(false)
                    .removeClass('graph-elem graph-elem-image')
                    .addClass('graph-resizer-handle handle-' + dir);

                    h.elem.group('graph-resizer');
                    h.props.dir = dir;
                    h.draggable(c);
                    
                    h.on('dragstart', _.bind(me.onHandleMoveStart, me));
                    h.on('dragmove', _.bind(me.onHandleMove, me));
                    h.on('dragend', _.bind(me.onHandleMoveEnd, me));

                    h.render(holder);

                    comp.handle[dir] = h.guid();
                    h = null;
                }(dir));
            });

            comp.holder = holder.guid();
            comp.helper = helper.guid();

            holder = null;
            helper = null;
            handle = null;
        },

        invalidate: function()  {
            this.superclass.prototype.invalidate.call(this);
            this.cached.vertices = null;
        },

        render: function() {
            var me = this;

            if (me.props.rendered) {
                me.redraw();
                return;
            }
            
            me.holder().render(me.vector().parent());
            me.props.rendered = true;

            me.redraw();
        },

        snap: function(snap) {
            this.cached.snapping = snap;
        },

        vertices: function() {
            var me = this,
                vector = me.vector(),
                vertices = me.cached.vertices;

            if ( ! vertices) {
                // get original bounding
                var path = vector.pathinfo(),
                    bbox = path.bbox().toJson(),
                    rotate = vector.matrix(true).rotate();

                var ro, cx, cy, ox, oy, hs, hw, hh;

                ro = rotate.deg;
                cx = 0;
                cy = 0;
                ox = bbox.x;
                oy = bbox.y;
                hs = me.props.handleSize / 2;

                if (ro) {
                    var rmatrix = Graph.matrix(),
                        path = me.pathinfo();

                    cx = bbox.x + bbox.width / 2,
                    cy = bbox.y + bbox.height / 2;

                    rmatrix.rotate(-ro, cx, cy);

                    path = path.transform(rmatrix);
                    bbox = path.bbox().toJson();
                } else {
                    if ( ! this.hasShield()) {
                        path = me.pathinfo();
                        bbox = path.bbox().toJson();
                    }
                }

                hw = bbox.width / 2;
                hh = bbox.height / 2;

                vertices = {
                    ne: {
                        x: bbox.x + bbox.width - hs,
                        y: bbox.y - hs
                    },

                    se: {
                        x: bbox.x + bbox.width - hs,
                        y: bbox.y + bbox.height - hs
                    },

                    sw: {
                        x: bbox.x - hs,
                        y: bbox.y + bbox.height - hs
                    },

                    nw: {
                        x: bbox.x - hs,
                        y: bbox.y - hs
                    },

                    n: {
                        x: bbox.x + hw - hs,
                        y: bbox.y - hs
                    },
                    e: {
                        x: bbox.x + bbox.width - hs,
                        y: bbox.y + hh - hs
                    },
                    s: {
                        x: bbox.x + hw - hs,
                        y: bbox.y + bbox.height - hs
                    },
                    w: {
                        x: bbox.x - hs,
                        y: bbox.y + hh - hs
                    },

                    rotate: {
                        deg: ro,
                        cx: cx,
                        cy: cy
                    },

                    box: {
                        x: bbox.x,
                        y: bbox.y,
                        width: bbox.width,
                        height: bbox.height
                    },

                    offset: {
                        x: ox,
                        y: oy
                    }
                };

                this.cached.vertices = vertices;
            }

            return vertices;
        },

        redraw: function() {
            var me = this,
                helper = me.helper(),
                holder = me.holder();

            var vx;

            if ( ! holder) {
                return;
            }

            vx = this.vertices();

            if ( ! vx) {
                return;
            }
            
            helper.reset();

            helper.attr({
                x: vx.box.x,
                y: vx.box.y,
                width: vx.box.width,
                height: vx.box.height
            });
            
            helper.rotate(vx.rotate.deg, vx.rotate.cx, vx.rotate.cy).commit();

            _.forOwn(me.components.handle, function(id, dir){
                (function(id, dir){
                    var h = me.handle(dir);
                    h.show();
                    h.reset();
                    h.attr(vx[dir]);
                    h.rotate(vx.rotate.deg, vx.rotate.cx, vx.rotate.cy).commit();
                }(id, dir));
            });

            me.trans.ox = vx.offset.x;
            me.trans.oy = vx.offset.y;
            me.trans.ow = this.trans.cw = vx.box.width;
            me.trans.oh = this.trans.ch = vx.box.height;
            me.trans.dx = 0;
            me.trans.dy = 0;
        },

        suspend: function() {
            this.props.suspended = true;
            this.holder().elem.detach();
        },

        resume: function() {
            if ( ! this.props.enabled) {
                return;
            }

            if (this.props.suspended) {

                this.props.suspended = false;

                if ( ! this.props.rendered) {
                    this.render();
                } else { 
                    this.vector().parent().elem.append(this.holder().elem);
                    this.redraw();
                }
            }
        },

        onHolderRender: function(e) {
            
        },

        onHandleMoveStart: function(e) {
            var me = this, handle = e.publisher;

            _.forOwn(me.components.handle, function(id, dir){
                var h = me.handle(dir);
                if (h !== handle) {
                    h.hide();
                }
            });

            var snapping = this.cached.snapping;

            if (snapping && handle.draggable().snap() !== snapping) {
                handle.draggable().snap(snapping);    
            }
            
            handle.show();
            handle.removeClass('dragging');
        },

        onHandleMove: function(e) {
            var me = this, 
                helper = me.helper(), 
                handle = e.publisher;
            
            var tr = this.trans,
                dx = e.dx,
                dy = e.dy;

            switch(handle.props.dir) {
                case 'ne':
                    tr.cw += dx;
                    tr.ch -= dy;

                    me.trans.dy += dy;
                    helper.translate(0, dy).commit();
                    break;

                case 'se':
                    tr.cw += dx;
                    tr.ch += dy;

                    break;

                case 'sw':
                    tr.cw -= dx;
                    tr.ch += dy;

                    me.trans.dx += dx;
                    helper.translate(dx, 0).commit();
                    break;

                case 'nw':
                    tr.cw -= dx;
                    tr.ch -= dy;

                    me.trans.dx += dx;
                    me.trans.dy += dy;
                    helper.translate(dx, dy).commit();
                    break;

                case 'n':
                    tr.cw += 0;
                    tr.ch -= dy;

                    me.trans.dy += dy;
                    helper.translate(0, dy).commit();
                    break;

                case 'e':
                    tr.cw += dx;
                    tr.ch += 0;

                    break;

                case 's':
                    tr.cw += 0;
                    tr.ch += dy;
                    break;

                case 'w':
                    tr.cw -= dx;
                    tr.ch += 0;

                    me.trans.dx += dx;
                    helper.translate(dx, 0).commit();
                    break;
            }

            helper.attr({
                width:  tr.cw,
                height: tr.ch
            });

        },

        onHandleMoveEnd: function(e) {
            var me = this,
                tr = this.trans,
                handle = e.publisher;

            var sx, sy, cx, cy, dx, dy;

            sx = tr.ow > 0 ? (tr.cw / tr.ow) : 1;
            sy = tr.oh > 0 ? (tr.ch / tr.oh) : 1;
            dx = tr.dx;
            dy = tr.dy;

            switch(handle.props.dir) {
                case 'ne':
                    cx = tr.ox;
                    cy = tr.oy + tr.oh;
                    break;
                case 'se':
                    cx = tr.ox;
                    cy = tr.oy;
                    break;
                case 'sw':
                    cx = tr.ox + tr.ow;
                    cy = tr.oy;
                    break;
                case 'nw':
                    cx = tr.ox + tr.ow;
                    cy = tr.oy + tr.oh;
                    break;
                case 'n':
                    cx = tr.ox + tr.ow / 2;
                    cy = tr.oy + tr.oh;
                    break;
                case 'e':
                    cx = tr.ox;
                    cy = tr.oy + tr.oh / 2;
                    break;
                case 's':
                    cx = tr.ox + tr.ow / 2;
                    cy = tr.oy;
                    break;
                case 'w':
                    cx = tr.ox + tr.ow;
                    cy = tr.oy + tr.oh / 2;
                    break;
            }

            // track translation
            var vector = me.vector(),
                oldcen = vector.bbox().center().toJson(),
                resize = vector.resize(sx, sy, cx, cy, dx, dy),
                newcen = vector.bbox().center().toJson();

            var vdx = newcen.x - oldcen.x,
                vdy = newcen.y - oldcen.y;

            resize.translate.dx = vdx;
            resize.translate.dy = vdy;
            
            me.redraw();
            me.fire('resize', resize);
        },

        destroy: function() {
            // remove handles
            var me = this

            _.forOwn(me.components.handle, function(id, dir){
                var h = me.handle(dir);
                h.remove();
            });

            me.components.handle = null;

            // remove helper
            me.helper().remove();
            me.components.helper = null;

            // remove holder
            me.holder().remove();
            me.components.holder = null;

            // remove listeners
            me.listeners = null;
        }
        
    });

}());

(function(){

    Graph.plugin.Collector = Graph.extend(Graph.plugin.Plugin, {

        props: {
            x: 0,
            y: 0,
            x2: 0,
            y2: 0,
            dir: null,
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            offset: [0, 0],
            enabled: false,
            suspended: true,
            rendered: false,
            activator: 'tool'
        },

        paper: null,
        collection: [],

        components: {
            rubber: null
        },

        constructor: function(paper) {
            var me = this;

            if ( ! paper.isPaper()) {
                throw Graph.error('Lasso tool only available for paper !');
            }
            
            me.paper = paper;
            me.components.rubber = Graph.$('<div class="graph-rubberband">');

            paper.on('keynavdown', _.bind(me.onKeynavDown, me));
            paper.on('keynavup', _.bind(me.onKeynavUp, me));

            if (me.paper.props.rendered) {
                me.setup();
            } else {
                me.paper.on('render', function(){
                    me.setup();
                });
            }
        },

        enable: function(activator) {
            this.props.enabled = true;
            this.props.activator = activator;

            this.paper.cursor('crosshair');
            this.paper.state('collecting');
        },

        disable: function() {
            this.props.enabled = false;
            this.paper.cursor('default');
        },

        setup: function() {
            var me = this, paper = me.paper;

            if (me.plugin) {
                return;
            }
            // me.tree.container.on('scroll', function(){
            //     var top = me.tree.container.scrollTop(),
            //         left = me.tree.container.scrollLeft(),
            //         dy = top - me.props.top,
            //         dx = left - me.props.left;

            //     me.props.height += dy;
            //     me.props.width += dx;

            //     me.props.top = top;
            //     me.props.left = left;
            // });

            me.plugin = paper.interactable().draggable({
                manualStart: true,

                onstart: function(e) {
                    me.reset();
                    me.resize(0, 0);

                    var offset = paper.tree.container.offset(),   
                        x = e.pageX - offset.left,
                        y = e.pageY - offset.top;

                    me.translate(x, y);
                    me.props.offset = [x, y];
                },
                
                onmove: function(e) {
                    var dw = 0,
                        dh = 0,
                        dx = 0,
                        dy = 0;

                    if ( ! me.props.dir) {
                        switch(true) {
                            case (e.dx > 0 && e.dy > 0):
                                me.props.dir = 'nw';
                                break;
                            case (e.dx < 0 && e.dy < 0):
                                me.props.dir = 'se';
                                break;
                            case (e.dx < 0 && e.dy > 0):
                                me.props.dir = 'ne';
                                break;
                            case (e.dx > 0 && e.dy < 0):
                                me.props.dir = 'sw';
                                break;
                        }
                    } else {
                        switch(me.props.dir) {
                            case 'nw':
                                dw = e.dx;
                                dh = e.dy;
                                dx = 0;
                                dy = 0;
                                break;
                            case 'ne':
                                dw = -e.dx;
                                dh =  e.dy;
                                dx =  e.dx;
                                dy =  0;
                                break;
                            case 'se':
                                dw = -e.dx;
                                dh = -e.dy;
                                dx =  e.dx;
                                dy =  e.dy;
                                break;
                            case 'sw':
                                dw =  e.dx;
                                dh = -e.dy;
                                dx =  0;
                                dy =  e.dy;
                                break;
                        }
                        
                        me.props.width  += dw;
                        me.props.height += dh;

                        if (me.props.width >= 0 && me.props.height >= 0) {
                            me.translate(dx, dy); 
                            me.resize(me.props.width, me.props.height);
                        } else {
                            me.props.width  -= dw;
                            me.props.height -= dh;
                        }
                        
                    }
                },

                onend: function() {
                    var bbox

                    me.props.x2 = me.props.x + me.props.width;
                    me.props.y2 = me.props.y + me.props.height;

                    bbox = me.bbox();
                    
                    paper.cascade(function(c){
                        if (c !== paper && c.isSelectable() && ! c.isGroup()) {
                            if (bbox.contains(c)) {
                                me.collect(c);
                            }
                        }
                    });

                    if (me.props.activator == 'tool') {
                        paper.tool().activate('panzoom');    
                    }

                    me.resize(0, 0);
                    me.suspend();
                }
            })
            .on('down', function(e){
                var single = ! (e.ctrlKey || e.shiftKey),
                    vector = Graph.registry.vector.get(e.target);

                if (vector) {
                    if ( ! vector.isSelectable()) {
                        if ( ! vector.elem.belong('graph-resizer') && ! vector.elem.belong('graph-link')) {
                            single && me.clearCollection();    
                        }
                    }
                }
            })
            .on('tap', function(e){
                var vector = Graph.registry.vector.get(e.target),
                    single = ! (e.ctrlKey || e.shiftKey);
                
                if (vector && vector.isSelectable()) {
                    if (vector.paper().state() == 'linking') {
                        me.clearCollection();
                        return;
                    }

                    if (single) {
                        me.clearCollection();
                    }
                    
                    me.collect(vector);
                }

            }, true)
            .on('move', function(e){
                var i = e.interaction;

                if (me.props.enabled) {
                    if (i.pointerIsDown && ! i.interacting()) {
                        if (e.currentTarget === paper.node()) {
                            if (me.props.suspended) {
                                me.resume();
                            }
                            i.start({name: 'drag'}, e.interactable, me.components.rubber.node());        
                        }
                    }
                }
            });

            me.plugin.styleCursor(false);
        },

        render: function() {
            var me = this;

            if (me.props.rendered) {
                return;
            }

            me.paper.container().append(me.components.rubber);
            me.props.rendered = true;
        },

        bbox: function() {
            var props = this.props;
            
            return Graph.bbox({
                x: props.x,
                y: props.y,
                x2: props.x2,
                y2: props.y2,
                width: props.width,
                height: props.height
            });
        },

        collect: function(vector, silent) {
            var me = this, offset;

            vector.$collector = this;
            vector.select();

            silent = _.defaultTo(silent, false);
            offset = _.indexOf(this.collection, vector);

            if (offset === -1) {
                this.collection.push(vector);
                if ( ! silent) {
                    vector.fire('collect');
                }
            }
        },

        decollect: function(vector) {
            var offset;
            
            vector.$collector = null;
            vector.deselect();

            offset = _.indexOf(this.collection, vector);

            if (offset > -1) {
                this.collection.splice(offset, 1);
                vector.fire('decollect');
            }
        },

        clearCollection: function(except) {
            var me = this;
            me.paper.cascade(function(c){
                if (c !== me.paper && c !== except && c.props.selected) {
                    me.decollect(c);
                }
            });
        },

        suspend: function() {
            this.props.suspended = true;
            this.components.rubber.detach();
            // this.components.rubber.removeClass('visible');
        },

        resume: function() {
            this.props.suspended = false;

            if ( ! this.props.rendered) {
                this.render();
            } else {
                this.paper.container().append(this.components.rubber);
                // this.components.rubber.addClass('visible');
            }
        },

        reset: function() {
            var top = this.paper.container().scrollTop(),
                left = this.paper.container().scrollLeft();

            this.props.x = 0;
            this.props.y = 0;
            this.props.x2 = this.props.x,
            this.props.y2 = this.props.y,
            this.props.top = top;
            this.props.left = left;
            this.props.dir = null;
            this.props.width = 0;
            this.props.height = 0;
            this.props.offset = [0, 0];
        },

        translate: function(dx, dy) {
            this.props.x += dx;
            this.props.y += dy;
            
            this.components.rubber.css({
                transform: 'translate(' + this.props.x + 'px,' + this.props.y + 'px)'
            });
        },

        resize: function(width, height) {
            this.components.rubber.width(width).height(height);
        },

        syncDragStart: function(origin, e) {
            var me = this;

            _.forEach(me.collection, function(v){
                if (v.plugins.dragger && v.plugins.dragger.props.enabled && v !== origin) {
                    (function(){
                        var mat = v.graph.matrix.data(),
                            sin = mat.sin,
                            cos = mat.cos;

                        if (v.plugins.resizer) {
                            v.plugins.resizer.redraw();
                            v.plugins.resizer.suspend();
                        }

                        if (v.plugins.dragger.components.helper) {
                            v.plugins.dragger.resume();
                        }

                        v.syncdrag = {
                            sin: sin,
                            cos: cos,
                            tdx: 0,
                            tdy: 0
                        };

                        v.addClass('dragging');
                        
                        v.fire('dragstart', {
                            dx: e.dx *  cos + e.dy * sin,
                            dy: e.dx * -sin + e.dy * cos
                        });

                    }());
                }
            });

            me.fire('beforedrag');
        },

        syncDragMove: function(origin, e) {
            var me = this, dx, dy;

            _.forEach(me.collection, function(v){
                if (v.plugins.dragger && v.plugins.dragger.props.enabled && v !== origin) {
                    (function(v, e){
                        var dx = e.ox *  v.syncdrag.cos + e.oy * v.syncdrag.sin,
                            dy = e.ox * -v.syncdrag.sin + e.oy * v.syncdrag.cos;

                        if (v.plugins.dragger.components.helper) {
                            v.plugins.dragger.helper().translate(e.ox, e.oy).commit();
                        } else {
                            v.translate(dx, dy).commit();
                        }

                        v.syncdrag.tdx += dx;
                        v.syncdrag.tdy += dy;

                        v.fire('dragmove', {
                            dx: dx,
                            dy: dy
                        });

                    }(v, e));    
                }
            });

        },

        syncDragEnd: function(origin, e) {
            var me = this;

            _.forEach(me.collection, function(v){
                if (v.plugins.dragger && v.plugins.dragger.props.enabled && v !== origin) {
                    (function(v, e){
                        var manual = v.plugins.dragger.props.manual,
                            helper = v.plugins.dragger.components.helper;

                        if (helper) {
                            if ( ! manual) {
                                v.translate(v.syncdrag.tdx, v.syncdrag.tdy).commit();    
                            }
                            v.plugins.dragger.suspend();
                        }
                        
                        if ( ! manual) {
                            v.dirty(true);    
                        }

                        if (v.plugins.resizer) {
                            v.plugins.resizer.resume();
                        }

                        v.fire('dragend', {
                            dx: v.syncdrag.tdx,
                            dy: v.syncdrag.tdy
                        });
                        
                        v.removeClass('dragging');
                        
                        delete v.syncdrag;

                    }(v, e));
                }
            });

            e.origin = origin;
            e.type = 'afterdrag';
            
            me.fire(e);
        },

        toString: function() {
            return 'Graph.plugin.Collector';
        },

        onKeynavDown: function(e) {
            if (e.keyCode == Graph.event.SHIFT && this.props.activator != 'key') {
                var tool = this.paper.tool(),
                    curr = tool.current();

                if (curr != 'collector') {
                    tool.activate('collector', 'key');
                }
            }
        },

        onKeynavUp: function(e) {
            if (e.keyCode == Graph.event.SHIFT) {
                var tool = this.paper.tool(),
                    curr = tool.current();

                if (curr == 'collector') {
                    this.props.activator = 'tool';
                    tool.activate('panzoom');
                }
            }
        }

    });

}());

(function(){

    Graph.plugin.Dragger = Graph.extend(Graph.plugin.Plugin, {
        
        props: {
            manual: false,
            single: true,
            ghost: false,
            vector: null,
            enabled: true,
            rendered: false,
            suspended: true,
            inertia: false,
            bound: false,
            // grid: [1, 1],
            grid: null,
            axis: false,
            cursor: 'move',
            snappable: false
        },

        rotation: {
            deg: 0,
            rad: 0,
            sin: 0,
            cos: 1
        },

        scaling: {
            x: 1,
            y: 1
        },

        trans: {
            vector: null,
            paper: null,
            helper: null,
            dx: 0,
            dy: 0
        },

        components: {
            holder: null,
            helper: null
        },
        
        constructor: function(vector, options) {
            var me = this;

            vector.addClass('graph-draggable');
            me.props.vector = vector.guid();

            options = _.extend({
                inertia: false
            }, options || {});

            _.forEach(['axis', 'grid', 'bbox', 'ghost'], function(name){
                if (options[name] !== undefined) {
                    me.props[name] = options[name];
                }
            });
            
            _.assign(me.props, options);

            me.cached.snapping = null;
            me.cached.origin = null;

            me.initComponent();

            vector.on('render.dragger', _.bind(me.onVectorRender, me));
            
            if (vector.props.rendered) {
                me.setup();
            }
        },
        
        holder: function() {
            return Graph.registry.vector.get(this.components.holder);
        },

        helper: function() {
            return Graph.registry.vector.get(this.components.helper);
        },

        initComponent: function() {
            var me = this, comp = me.components;
            var holder, helper;

            if (me.props.ghost) {
                holder = (new Graph.svg.Group())
                    .addClass('graph-dragger')
                    .removeClass('graph-elem graph-elem-group')
                    .traversable(false)
                    .selectable(false);

                helper = (new Graph.svg.Rect(0, 0, 0, 0, 0))
                    .addClass('graph-dragger-helper')
                    .removeClass('graph-elem graph-elem-rect')
                    .traversable(false)
                    .selectable(false)
                    .clickable(false)
                    .render(holder);

                comp.holder = holder.guid();
                comp.helper = helper.guid();

                holder = null;
                helper = null;
            }
        },

        setup: function() {
            var me = this, 
                vector = me.vector(),
                paper = vector.paper(),
                options = {};

            if (me.plugin) {
                return;
            }

            if (paper.utils.scroller) {
                // options.autoScroll = {
                //     container: paper.utils.scroller.node()
                // };
            }

            _.extend(options, {
                manualStart: true,
                onstart: _.bind(me.onDragStart, me),
                onmove: _.bind(me.onDragMove, me),
                onend: _.bind(me.onDragEnd, me)
            });

            var vendor = vector.interactable().vendor();
            
            vendor.draggable(options);
            vendor.styleCursor(false);

            me.cached.origin   = vendor.origin();
            me.cached.snapping = [];
            
            vendor.on('down', function(e){
                e.preventDefault();
            });

            if (me.props.single) {
                vendor.on('move', _.bind(me.onPointerMove, me, _, vector));    
            }
            
            var matrix = vector.matrix(true),
                rotate = matrix.rotate(),
                scale  = matrix.scale();

            me.rotate(rotate.deg);
            me.scale(scale.x, scale.y);
            
            if (me.props.grid) {
                me.snap({
                    mode: 'grid',
                    x: me.props.grid[0],
                    y: me.props.grid[1]
                });
            }
        },

        enable: function() {
            this.props.enabled = true;
        },

        disable: function() {
            this.props.enabled = false;
        },

        ghost: function(ghost) {
            if (ghost === undefined) {
                return this.props.ghost;
            }
            this.props.ghost = ghost;
            return this;
        },

        render: function() {
            var me = this, vector = me.vector();

            if ( ! me.props.rendered) {
                me.props.rendered = true;
                me.holder().render(vector.parent());
            }

            if (me.props.ghost) {
                me.redraw();
            }   
            
        },

        suspend: function() {
            this.props.suspended = true;
            this.holder().elem.detach();
        },

        resume: function() {
            this.props.suspended = false;

            if ( ! this.props.rendered) {
                this.render();
            } else {
                this.vector().parent().elem.append(this.holder().elem);
                this.redraw();
            }
        },

        redraw: function() {
            var vector = this.vector(),
                helper = this.helper();

            if (helper) {
                var vbox = vector.bbox().toJson(),
                    hbox = helper.bbox().toJson();

                var dx = vbox.x - hbox.x,
                    dy = vbox.y - hbox.y;

                helper.translate(dx, dy).commit();

                helper.attr({
                    width: vbox.width,
                    height: vbox.height
                });
            }
        },

        rotate: function(deg) {
            var rad = Graph.util.rad(deg);
            this.rotation.deg = deg;
            this.rotation.rad = rad;
            this.rotation.sin = Math.sin(rad);
            this.rotation.cos = Math.cos(rad);
        },

        scale: function(sx, sy) {
            sy = _.defaultTo(sy, sx);
            this.scaling.x = sx;
            this.scaling.y = sy;
        },

        origin: function(origin) {
            if (origin === undefined) {
                return this.cached.origin;
            }

            this.cached.origin = origin;

            var vendor = this.vector().interactable().vendor();

            if (vendor) {
                vendor.origin(origin);
            }
        },

        snap: function(snap, end) {

            if (snap === undefined) {
                return this.cached.snapping;
            }

            if (end === undefined) {
                end = false;
            }

            var me = this, snaps = [];

            // save original request
            this.cached.snapping = snap;

            if (_.isArray(snap)) {
                _.forEach(snap, function(s){
                    snaps.push(fixsnap(s));
                });
            } else {
                snaps.push(fixsnap(snap));
            }

            var vendor = this.vector().interactable().vendor();

            if (vendor) {
                vendor.setOptions('snap', {
                    targets: snaps,
                    endOnly: end
                });
            }

            // if (this.plugin) {
            //     this.plugin.setOptions('snap', {
            //         targets: snaps
            //     });
            // }

            /////////
            
            function fixsnap(snap) {
                
                if (_.isFunction(snap)) {
                    return snap;
                }
                
                snap.mode = _.defaultTo(snap.mode, 'anchor');
                
                if (snap.mode == 'grid') {
                    if (me.props.axis == 'x') {
                        snap.y = 0;
                    } else if (me.props.axis == 'y') {
                        snap.x = 0;
                    }
                    snap = interact.createSnapGrid({x: snap.x, y: snap.y});
                } else {
                    snap.range = _.defaultTo(snap.range, 20);
                }
                return snap;
            }
        },

        resetSnap: function() {
            this.snaps = [];

            this.snap({
                mode: 'grid',
                x: this.props.grid[0],
                y: this.props.grid[1]
            });
        },

        bound: function(bound) {
            /*if ( ! this.plugin) {
                return;
            }

            if (_.isBoolean(bound) && bound === false) {
                this.props.bound = false;
                this.plugin.setOptions('restrict', null);
                return;
            }

            bound = _.extend({
                top: Infinity,
                right: Infinity,
                bottom: Infinity,
                left: Infinity
            }, bound || {});
            
            this.props.bound = _.extend({}, bound);

            this.plugin.setOptions('restrict', {
                restriction: bound
            });

            return;*/
        },

        onVectorRender: function() {
            this.setup();
        },

        onPointerMove: function(e, vector) {
            var i = e.interaction;

            if (this.props.enabled) {
                if (i.pointerIsDown && ! i.interacting()) {
                    var paper = vector.paper(),
                        node = vector.node(),
                        action = {name: 'drag'};

                    // -- workaround for a bug in v1.2.6 of interact.js
                    i.prepared.name = action.name;
                    i.setEventXY(i.startCoords, i.pointers);

                    if (e.currentTarget === node) {
                        if (paper) {
                            var state = paper.state();
                            
                            if (state == 'collecting') {
                                if (vector.elem.belong('graph-resizer')) {
                                    paper.tool().activate('panzoom');    
                                } else {
                                    return;
                                }
                            } else if (state == 'linking') {
                                return;
                            }
                        }
                        
                        if (this.props.ghost) {
                            if (this.props.suspended) {
                                this.resume();
                            }
                            i.start(action, e.interactable, this.helper().node());
                        } else {
                            i.start(action, e.interactable, node);
                        }

                    }
                }    
            }

            e.preventDefault();

        },

        onDragStart: function(e) {
            var vector = this.vector(), 
                paper = vector.paper(),
                helper = this.helper();

            vector.addClass('dragging');
            paper.cursor(this.props.cursor);

            this.trans.vector = vector;
            this.trans.paper = paper;
            this.trans.helper = helper;

            this.trans.dx = 0;
            this.trans.dy = 0;

            var edata = {
                x: e.clientX,
                y: e.clientY,
                dx: 0,
                dy: 0,
                ghost: this.props.ghost
            };

            this.fire('dragstart', edata);
        },

        onDragMove: function(e) {
            
            var trans = this.trans,
                paper = trans.paper,
                vector = trans.vector,
                helper = trans.helper,
                axs = this.props.axis,
                deg = this.rotation.deg,
                sin = this.rotation.sin,
                cos = this.rotation.cos,
                scaleX = this.scaling.x,
                scaleY = this.scaling.y;

            // check current scaling
            var scaling = vector.matrix(true).scale();
            
            if (scaling.x !== scaleX || scaling.y !== scaleY) {
                this.scale(scaling.x, scaling.y);
                scaleX = scaling.x;
                scaleY = scaling.y;
            }
            
            var edx = _.defaultTo(e.dx, 0),
                edy = _.defaultTo(e.dy, 0);
            
            var dx, dy, hx, hy, tx, ty;
            
            dx = dy = hx = hy = tx = ty = 0;
                
            edx /= scaleX;
            edy /= scaleY;

            if (axs == 'x') {
                dx = hx = edx;
                dy = hy = 0;

                tx = edx *  cos + 0 * sin;
                ty = edx * -sin + 0 * cos;
            } else if (axs == 'y') {
                dx = hx = 0;
                dy = hy = edy;

                tx = 0 *  cos + edy * sin;
                ty = 0 * -sin + edy * cos;
            } else {
                hx = edx;
                hy = edy;
                
                dx = tx = edx *  cos + edy * sin;
                dy = ty = edx * -sin + edy * cos;  
            }

            this.trans.dx += tx;
            this.trans.dy += ty;
            
            var pageX = _.defaultTo(e.pageX, e.x0),
                pageX = _.defaultTo(e.pageY, e.y0);

            pageX /= scaleX;
            pageX /= scaleY;
            
            var event = {
                pageX: pageX,
                pageY: pageX,
                
                ex: edx,
                ey: edy,

                dx: dx,
                dy: dy,
                
                hx: hx,
                hy: hy,
                
                ox: hx,
                oy: hy,
                
                ghost: this.props.ghost
            };

            this.fire('dragmove', event);
            
            if (helper) {
                helper.translate(event.hx, event.hy).commit();
            } else {
                vector.translate(event.dx, event.dy).commit();
            }
        },

        onDragEnd: function(e) {
            var trans = this.trans,
                paper = trans.paper,
                vector = trans.vector,
                helper = trans.helper,
                dx = trans.dx,
                dy = trans.dy;

            if (helper) {
                vector.translate(dx, dy).commit();
                this.redraw();
                this.suspend();
            }

            vector.removeClass('dragging');
            paper.cursor('default');

            var edata = {
                dx: dx,
                dy: dy,
                ghost: this.props.ghost
            };
            
            this.fire('dragend', edata);
            
            this.trans.vector = null;
            this.trans.paper = null;
            this.trans.helper = null;
            this.trans.dx = 0;
            this.trans.dy = 0;

        },

        destroy: function() {
            var me = this;

            if (me.components.helper) {
                me.helper().remove();
            }

            me.components.helper = null;

            if (me.components.holder) {
                me.holder().remove();
            }

            me.components.holder = null;
            me.listeners = {};
        }
    });

}());

(function(){

    Graph.plugin.Dropper = Graph.extend(Graph.plugin.Plugin, {

        props: {
            overlap: 'center',
            accept: '.graph-draggable'
        },

        constructor: function(vector, options) {
            var me = this;

            _.assign(me.props, options || {});
            vector.addClass('graph-dropzone').removeClass('graph-draggable');

            me.props.vector = vector.guid();    
            
            vector.on({
                render: _.bind(me.onVectorRender, me)
            });

            if (vector.props.rendered) {
                me.setup();
            }
        },

        setup: function() {
            var me = this;

            if (me.plugin) {
                return;
            }

            var config = _.extend({}, me.props, {
                checker: _.bind(me.onDropValidate, me),

                ondropactivate: _.bind(me.onDropActivate, me),
                ondropdeactivate: _.bind(me.onDropDeactivate, me),
                ondragenter: _.bind(me.onDragEnter, me),
                ondragleave: _.bind(me.onDragLeave, me),
                ondrop: _.bind(me.onDrop, me)
            });

            me.plugin = me.vector.interactable().dropzone(config);
        },

        onDropValidate: function( edrop, edrag, dropped, dropzone, dropel, draggable, dragel ) {
            return dropped;
            /*if (dropped) {
                if (this.config.validate) {
                    var args = _.toArray(arguments);
                    dropped = this.config.validate.apply(this, args);
                }    
            }
            
            return dropped;*/
        },

        onVectorRender: function() {
            this.setup();
        },

        onDropActivate: function(e) {
            this.vector().addClass('drop-activate');
        },

        onDropDeactivate: function(e) {
            this.vector().removeClass('drop-activate');
        },

        onDragEnter: function(e) {
            this.vector().removeClass('drop-activate').addClass('drop-enter');
            e.type = 'dropenter';
            this.fire(e);
        },

        onDragLeave: function(e) {
            this.vector().removeClass('drop-enter').addClass('drop-activate');
            e.type = 'dropleave';
            this.fire(e);
        },

        onDrop: function(e) {
            this.vector().removeClass('drop-activate drop-enter');
        }
    });

}());

(function(){

    Graph.plugin.Sorter = Graph.extend(Graph.plugin.Plugin, {

        props: {
            height: 0,
            width: 0,
            suspended: true,
            enabled: true,
            offsetTop: 0,
            offsetLeft: 0
        },

        sortables: [],
        origins: [],
        guests: [],
        batch: [],
        
        trans: {
            sorting: false,
            valid: false,
            drag: null,
            drop: null
        },

        components: {
            helper: null
        },

        constructor: function(vector) {
            var me = this;

            me.vector = vector;
            me.vector.addClass('graph-sorter');

            me.components.helper = new Graph.svg.Rect(0, 0, 0, 0);
            me.components.helper.addClass('graph-sorter-helper');
            me.components.helper.removeClass('graph-elem graph-elem-rect');
            me.components.helper.props.selectable = false;
            me.components.helper.render(me.vector);
            me.components.helper.$sorter = me;
            
            me.sortables.push(me.components.helper);

            me.vector.on({
                render: _.bind(me.onVectorRender, me),
                appendchild: _.bind(me.onItemAdded, me),
                prependchild: _.bind(me.onItemAdded, me)
            });

            if (me.vector.props.rendered) {
                me.setup();
            }
        },

        // setup plugin
        setup: function() {
            var me = this,
                vector = me.vector,
                paper = vector.paper(),
                context = vector.node();

            if (me.plugin) {
                return;
            }
            
            me.plugin = interact('.graph-sortable', {context: context}).dropzone({
                accept: '.graph-sortable',
                // overlap: 'center',
                overlap: .1,
                // checker: _.bind(me.snapping, me),
                ondropactivate: _.bind(me.onSortActivate, me),
                ondropdeactivate: _.bind(me.onSortDeactivate, me),
                ondragenter: _.bind(me.onSortEnter, me),
                ondragleave: _.bind(me.onSortLeave, me),
                ondrop: _.bind(me.onSort, me)
            });

            me.plugin.styleCursor(false);

            if (paper.plugins.collector) {
                paper.plugins.collector.on({
                    afterdrag: function(e) {
                        var origin = e.origin;
                        if (_.indexOf(me.sortables, origin) > -1) {
                           me.props.offsetTop += e.dy;
                        }
                    }
                });
            }
        },

        snapping: function(drage, pointe, dropped, dropzone, dropel, draggable, dragel) {
            return dropped;
        },

        suspend: function() {
            this.props.suspended = true;

            if (this.components.helper) {
                this.components.helper.focus(false);
                this.components.helper.removeClass('visible');
            }
        },

        resume: function() {
            var me = this;

            me.props.suspended = false;

            if (me.components.helper) {
                me.components.helper.addClass('visible');
            }
        },

        redraw: function() {
            var me = this;

            if (me.trans.valid) {

                if (me.props.suspended) {
                    me.resume();    
                }

                me.swap(me.components.helper, me.trans.drop);
                me.components.helper.focus();
            }
        },

        commit: function() {
            var me = this;

            _.forEach(me.guests, function(g){
                me.vector.elem.append(g.node());
            });

            _.forEach(me.sortables, function(s){
                s.$master  = false;
                s.$sorter  = null;
                s.$sorting = false;
            });

            me.components.helper.attr('height', 0);
            
            if (me.batch.length) {
                me.permute();
            } else {
                me.swap(me.trans.drag, me.components.helper);
            }

            _.forEach(me.origins, function(o){
                o.components.helper.attr('height', 0);
                o.reset();
                o.arrange();
                o.suspend();
            });

            me.reset();
            me.suspend();
            me.resumeBatch(me.batch);
        },

        revert: function() {
            var me = this;
            
            _.forEach(me.guests, function(g){
                me.vector.elem.append(g.node());
            });

            _.forEach(me.sortables, function(s){
                s.$sorting = false;
                s.$sorter  = null;
                s.$master  = false;
            });

            _.forEach(me.origins, function(o){
                o.components.helper.attr('height', 0);
                o.reset();
                o.arrange();
                o.suspend();
            });

            me.components.helper.attr('height', 0);
            me.reset();
            me.arrange();
            me.suspend();
            me.resumeBatch(me.batch);
        },  

        permute: function() {
            var me = this,
                target = _.indexOf(me.sortables, me.components.helper),
                stacks = _.map(me.sortables, function(s, i){ return i; });

            me.batch.sort(function(a, b){
                var ta = a.offset().top,
                    tb = b.offset().top;
                return ta === tb ? 0 : (ta < tb ? -1 : 1);
            });

            orders = _.map(me.batch, function(b){
                return _.indexOf(me.sortables, b);
            });

            var swaps  = _.difference(stacks, orders),
                repos = _.indexOf(swaps, target);

            _.insert(swaps, repos, orders);

            me.sortables = _.permute(me.sortables, swaps);
            me.arrange();
        },

        swap: function(source, target) {
            var me = this,
                from = _.indexOf(me.sortables, source),
                to = _.indexOf(me.sortables, target);

            _.move(me.sortables, from, to);
            me.arrange();
        },

        arrange: function() {
            var me = this;

            me.props.height = 0;
            me.props.width  = 0;

            _.forEach(me.sortables, function(s){
                if ( ! s.$sorting) {
                    var sbox = s.bbox().toJson(),
                        dy = me.props.height- sbox.y + me.props.offsetTop;

                    s.translate(0, dy).commit();
                    me.props.height += sbox.height;

                    if (sbox.width > me.props.width) {
                        me.props.width = sbox.width;
                    }
                }
            });
        },

        suspendBatch: function(batch, predicate) {
            _.forEach(batch, function(b){
                b.cascade(function(c){
                    if (c.props.selected && c.resizer) {
                        c.resizer.suspend();
                    }
                });

                if (predicate) {
                    predicate.call(b, b);
                }
            });
        },

        resumeBatch: function(batch) {
            var me = this, timer;
            timer = _.delay(function(){
                clearTimeout(timer);
                _.forEach(batch, function(b){
                    b.cascade(function(c){
                        if (c.props.selected && c.resizer) {
                            c.resizer.resume();
                        }
                    });
                })
            }, 0);
        },

        reset: function() {
            this.guests = [];
            this.origins = [];
            this.trans.drag = null;
            this.trans.sorting = false;
            this.trans.valid = false;
            this.trans.drop = null;
        },

        enroll: function(item) {
            var me = this, sorter;

            if (_.indexOf(me.sortables, item) === -1)  {
                sorter = item.$sorter;
                sorter.release(item);

                if (_.indexOf(me.origins, sorter) === -1) {
                    me.origins.push(sorter);
                }

                item.$sorter  = me;

                if (item.$master) {
                    me.trans.drag = item;
                }
                
                item.off('.sorter');
                item.tree.parent = me.vector;
                me.vector.children().push(item);
                me.guests.push(item);    
            }
            
        },

        release: function(item) {
            var me = this, 
                sorter = item.$sorter || me;

            var offset;

            item.off('.sorter');
            item.$sorter = null;
            item.tree.parent = null;

            if (item.$master) {
                sorter.trans.drag = null;
            }

            sorter.vector.children().pull(item);
            
            if ((offset = _.indexOf(sorter.sortables, item)) > -1) {
                sorter.sortables.splice(offset, 1);
            }

            if ((offset = _.indexOf(sorter.batch, item)) > -1) {
                sorter.batch.splice(offset, 1);
            }

            if ((offset = _.indexOf(sorter.guests, item)) > -1) {
                sorter.guests.splice(offset, 1);
            }
        },

        onVectorRender: function() {
            this.setup();
        },

        onItemAdded: function(item) {
            var me = this, delay;

            if (_.indexOf(me.sortables, item) > -1) {
                return;
            }

            if (item.hasClass('graph-sorter-helper')) {
                return;
            }

            item.$sorter = this;
            item.addClass('graph-sortable');
            
            item.off('.sorter');

            item.on('render.sorter',    _.bind(me.onItemRender, me));
            item.on('resize.sorter',    _.bind(me.onItemResize, me));
            item.on('dragstart.sorter', _.bind(me.onItemDragStart, me));
            item.on('dragend.sorter',   _.bind(me.onItemDragEnd, me));
            item.on('collect.sorter',   _.bind(me.onItemCollect, me));
            item.on('decollect.sorter', _.bind(me.onItemDecollect, me));

            me.sortables.push(item);

            if (item.props.rendered && ! item.$sorting) {
                delay = _.delay(function(){
                    clearTimeout(delay);
                    me.arrange();
                }, 0);
            }
        },

        onItemRender: function(e) {
            var me = this, delay;
            delay = _.delay(function(){
                clearTimeout(delay);
                me.arrange();
            }, 0);
        },

        onItemResize: function(e) {
            var item = e.publisher,
                sorter = item.$sorter || this, defer;

            suppress(item, true);

            _.forEach(sorter.sortables, function(s){
                if (s !== item) {
                    e.type = 'resize.sortable';
                    s.fire(e);
                }
            });

            defer = _.defer(function(item){
                clearTimeout(defer);
                sorter.arrange();
                suppress(item, false);
            }, item);

            /////////
            
            function suppress(item, state) {
                item.cascade(function(c){
                    if (c.props.selected && c.resizer) {
                        var method = state ? 'suspend' : 'resume';
                        c.resizer[method].call(c.resizer);
                    }
                });
            }
        },

        onItemDragStart: function(e) {
            var me = this, 
                item = e.publisher,
                bsize = me.batch.length;

            var bbox;
            
            me.props.enabled = bsize && (bsize + 1) === me.sortables.length ? false : true;

            if ( ! me.props.enabled) {
                return;
            }

            item.$sorter = me;
            item.$master = true;
            item.$sorting = true;

            me.trans.drag = item;
            me.trans.sorting = true;

            bbox = item.bbox().toJson();  
            width = me.props.width;
            height = bbox.height;

            if (bsize) {
                if ( ! item.$collector) {
                    me.batch.pop().$collector.clearCollection();
                    me.batch = [];
                } else {
                    height = 0;
                    me.suspendBatch(me.batch, function(b){
                        var box = b.bbox().toJson();
                        height += box.height;

                        b.$sorter = me;
                        b.$sorting = true;
                    });
                }
            }

            me.components.helper.attr({
                width: width,
                height: height
            });   
        },

        onItemDragEnd: function(e) {
            var me = this;

            if ( ! me.props.enabled) {
                return;
            }

            if (me.trans.sorting) {
                if ( ! me.trans.valid) {
                    me.revert();
                }
            } else {
                me.revert();
            }
        },

        onItemCollect: function(e) {
            var item = e.publisher,
                sorter = item.$sorter || this;

            sorter.batch.push(item);
        },

        onItemDecollect: function(e, item) {
            var item = e.publisher,
                sorter = item.$sorter || this, offset;

            offset = _.indexOf(sorter.batch, item);
            
            if (offset > -1) {
                sorter.batch.splice(offset, 1);
            }
        },

        onSortActivate: function() {},

        onSortDeactivate: function() {},

        onSortEnter: function(e) {
            var me = this;
            var drag, drop, bbox, width, height;
            
            if ( ! me.props.enabled) {
                return;
            }

            drag = Graph.registry.vector.get(e.relatedTarget);
            drop = Graph.registry.vector.get(e.target);

            if (drag.$collector) {
                
                height = 0;
                width  = me.props.width;

                _.forEach(drag.$collector.collection, function(v){
                    var box;

                    if (v.$sorter) {

                        if (v.$sorter !== me) {
                            me.enroll(v);
                            me.batch.push(v);
                        }
                        
                        box = v.bbox().toJson();
                        height += box.height;

                        if (box.width > width) {
                            width = box.width;
                        }
                    }
                });

                me.components.helper.attr({
                    width: width,
                    height: height
                });
            } else {
                if (drag.$sorter) {
                    if (drag.$sorter !== me) {
                        if (me.batch.length) {
                            me.suspendBatch(me.batch);
                        }

                        me.enroll(drag);

                        bbox = drag.bbox().toJson();
                        height = bbox.height;
                        width = me.props.width;

                        me.components.helper.attr({
                            width: width,
                            height: height    
                        });
                    }
                }
            }

            me.trans.drop  = drop;
            me.trans.valid = true;

            me.redraw();
        },

        onSortLeave: function() {
            var me = this;

            if ( ! me.props.enabled) {
                return;
            }

            me.trans.drop = null;
            me.trans.valid = false;
            me.suspend();
        },

        onSort: function() {
            var me = this;

            if ( ! me.props.enabled) {
                return;
            }

            me.commit();
        }
    });

}());

(function(){
    
    var CLS_CONNECT_VALID = 'connect-valid',
        CLS_CONNECT_INVALID = 'connect-invalid',
        CLS_CONNECT_HOVER = 'connect-hover';
    
    Graph.plugin.Network = Graph.extend(Graph.plugin.Plugin, {

        props: {
            shield: null,
            vector: null,
            wiring: 'h:h'
        },

        links: [],
        
        linking: {
            valid: false,
            router: null,
            source: null,
            target: null,
            link: null,
            pole: null
        },

        constructor: function(vector, options) {
            var me = this, guid = vector.guid();
            
            options = options || {};

            if (options.shield) {
                options.shield = options.shield.guid();
            } else {
                options.shield = guid;
            }

            _.assign(me.props, options);

            me.props.vector = guid;

            vector.addClass('graph-connectable');
            
            // setup link droppable
            
            var vendor = vector.interactable().vendor();
            
            vendor.dropzone({
                accept: _.format('.{0}, .{1}', Graph.string.CLS_LINK_HEAD, Graph.string.CLS_LINK_TAIL),
                overlap: .2
            })
            .on('dropdeactivate', function(e){
                var v = Graph.registry.vector.get(e.target);
                
                if (v) {
                    v.removeClass([CLS_CONNECT_VALID, CLS_CONNECT_INVALID, CLS_CONNECT_HOVER]);
                }
                me.invalidateTrans();
            })
            .on('dropactivate', function(e){
                var v = Graph.registry.vector.get(e.target);
                
                if (v) {
                    v.addClass(CLS_CONNECT_HOVER);
                }
                
                me.invalidateTrans();
            })
            .on('dragenter', function(e){
                var link = Graph.registry.link.get(e.relatedTarget);

                if (link) {
                    var pole = Graph.$(e.relatedTarget).data('pole');
                    var valid, source, target;

                    if (pole == 'head') {
                        source = link.router.source();
                        target = vector;
                    } else {
                        source = vector;
                        target = link.router.target();
                    }
                    
                    valid  = source.connectable().canConnect(target.connectable(), link);
                    
                    if (valid) {
                        vector.removeClass(CLS_CONNECT_INVALID);
                        vector.addClass(CLS_CONNECT_VALID);
                    } else {
                        vector.removeClass(CLS_CONNECT_VALID);
                        vector.addClass(CLS_CONNECT_INVALID);
                    }
                    
                    _.assign(me.linking, {
                        valid: valid,
                        router: link.router,
                        source: source,
                        target: target,
                        pole: pole
                    });

                    link.router.updateTrans('CONNECT', {
                        valid: valid,
                        source: source,
                        target: target
                    });
                }
            })
            .on('dragleave', function(e){
                var v = Graph.registry.vector.get(e.target);
                if (v) {
                    v.removeClass([CLS_CONNECT_VALID, CLS_CONNECT_INVALID]);
                }
                
                me.linking.valid = false;
                
                if (me.linking.pole == 'head') {
                    me.linking.router.updateTrans('CONNECT', {
                        valid: false,
                        target: null
                    });    
                } else {
                    me.linking.router.updateTrans('CONNECT', {
                        valid: false,
                        source: null
                    });
                }
                
            })
            .on('drop', function(e){
                if (me.linking.valid) {
                    if (me.linking.pole == 'head') {
                        me.linking.router.updateTrans('CONNECT', {
                            target: vector
                        });
                    } else {
                        me.linking.router.updateTrans('CONNECT', {
                            source: vector
                        });
                    }
                }
            });
        },
        
        invalidateTrans: function() {
            for (var name in this.linking) {
                this.linking[name] = null;
            }
        },  
        
        wiring: function() {
            return this.props.wiring;
        },

        treshold: function() {
            var wiring = this.props.wiring;

            switch(wiring) {
                case 'h:h':
                case 'v:v':
                    return 20;
                case 'h:v':
                case 'v:h':
                    return -10;
            }

            return 0;
        },
        
        direction: function (network) {
            var orient = this.orientation(network);
            
            switch(orient) {
                case 'intersect':
                    return null;
                case 'top':
                case 'bottom':
                    return 'v:v';
                case 'left':
                case 'right':
                    return 'h:h';
                default:
                    return this.props.wiring;
            }
        },
        
        orientation: function(network) {
            var srcbox = this.bbox().toJson(),
                refbox = network.bbox().toJson(),
                orient = Graph.util.boxOrientation(srcbox, refbox, this.treshold());
            
            srcbox = refbox = null;
            
            return orient;
        },
        
        isSource: function(link) {
            return link.source().guid() == this.vector().guid();
        },
        
        isTarget: function(link) {
            return link.target().guid() == this.vector().guid();
        },
        
        ///////// RULES /////////
        
        /**
         * Can connect to target network
         */
        canConnect: function(network, link) {
            var a = this.vector().guid(),
                b = network.vector().guid();
            
            if (a != b) {
                return true;
            }

            return false;
        }

    });

}());

(function(){

    Graph.plugin.History = Graph.extend(Graph.plugin.Plugin, {
        
        props: {
            limit: 1,
            index: 0
        },

        items: {},

        constructor: function(vector) {
            this.props.vector = vector.guid();
        },

        save: function(prop, data) {
            var lim = this.props.limit, len;

            if (len > lim) {
                _.drop(this.items, len - lim);
            }

            this.items[prop] = this.items[prop] || [];

            if ((len = this.items[prop].length) > lim - 1) {
                this.items[prop].splice(0, len - lim);
            }

            this.items[prop].push(data);

            console.log(this);
        },

        last: function(prop) {

        },

        go: function() {

        },

        back: function() {

        },

        next: function() {

        },

        clear: function() {

        }
    });

}());

(function(){

    Graph.plugin.Panzoom = Graph.extend(Graph.plugin.Plugin, {

        props: {
            panEnabled: false,
            zoomEnabled: true,
            showToolbox: true,
            vector: null
        },

        caching: {
            offset: {x: 0, y: 0}
        },

        scrolling: {
            steps: 10
        },

        zooming: {
            scale: 1,
            zoom: 1,
            origin: null,
            range: {min: 0.2, max: 4}
        },

        components: {
            toolbox: null
        },

        panning: {
            start: {x: 0, y: 0},
            moveHandler: null,
            stopHandler: null
        },

        constructor: function(vector) {
            var me = this, vendor, viewport, scale, bound;

            // validate vector
            if ( ! vector.isPaper()) {
                throw Graph.error('Panzoom only available for paper !');
            }

            viewport = vector.viewport();
            scale    = Math.round(viewport.matrix().scale().x, 1000);
            vendor   = vector.interactable().vendor();

            _.assign(me.props, {
                vector: vector.guid()
            });

            _.assign(me.zooming, {
                scale: scale,
                zoom: scale
            });

            me.initComponent(vector);

            // use native engine
            vendor.on('wheel', _.bind(me.onMouseWheel, me, _, vector, viewport));
            vendor.on('down', _.bind(me.onPointerDown, me, _, vector, viewport));

            if (vector.props.rendered) {
                me.revalidate(vector);

                if (me.props.showToolbox) {
                    me.components.toolbox.appendTo(vector.container());
                }
            } else {
                vector.on('render', function(){
                    me.revalidate(vector);

                    if (me.props.showToolbox) {
                        me.components.toolbox.appendTo(vector.container());
                    }
                });
            }

            vendor = null;
            vector = null;
        },

        initComponent: function(vector) {
            var me = this;
            var container, toolbox;

            if (me.props.showToolbox) {
                container = vector.container();

                toolbox = me.components.toolbox = Graph.$('<div class="graph-zoom-toolbox">');
                toolbox.html(
                    '<div>' + 
                        '<a data-tool="zoom-reset" href="#"><i class="ion-pinpoint"></i></a>'+
                        '<div class="splitter"></div>'+
                        '<a data-tool="zoom-in" href="#"><i class="ion-android-add"></i></a>'+
                        '<div class="splitter"></div>'+
                        '<a data-tool="zoom-out" href="#"><i class="ion-android-remove"></i></a>'+
                    '</div>'
                );

                toolbox.on('click', '[data-tool]', function(e){
                    e.preventDefault();
                    var tool = Graph.$(this).data('tool');
                    switch(tool) {
                        case 'zoom-reset':
                            me.zoomReset();
                            break;
                        case 'zoom-in':
                            me.zoomIn();
                            break;
                        case 'zoom-out':
                            me.zoomOut();
                            break;
                    }
                });
            }
        },

        revalidate: function(vector) {
            var bound = vector.node().getBoundingClientRect();

            this.caching.offset = {
                x: bound.left,
                y: bound.top
            };
        },
        
        enable: function() {
            var vector = this.vector();

            this.props.panEnabled = true;
            this.props.zoomEnabled = true;

            vector.cursor('default');
            vector.state('panning');
        },

        disable: function() {
            this.props.panEnabled = false;
        },

        zoomReset: function() {
            var viewport = this.vector().viewport();
            var matrix;

            this.zooming.zoom = 1;
            this.zooming.scale = 1;

            viewport.reset();

            matrix = Graph.matrix();
            matrix.translate(.5, .5);

            viewport.attr('transform', matrix.toString());
            viewport.graph.matrix = matrix;
        },

        zoomIn: function() {
            var paper = this.vector(),
                viewport = paper.viewport(),
                direction = 0.1,
                origin = viewport.bbox().center(true);

            this.zoom(paper, viewport, direction, origin);
        },

        zoomOut: function() {
            var paper = this.vector(),
                viewport = paper.viewport(),
                direction = -0.1,
                origin = viewport.bbox().center(true);

            this.zoom(paper, viewport, direction, origin);
        },

        zoom: function(paper, viewport, direction, origin) {
            var range = this.zooming.range,
                currentZoom = this.zooming.zoom,
                zoomType = direction > 0 ? 'in' : 'out',
                factor = Math.pow(1 + Math.abs(direction), zoomType == 'in' ? 1 : -1),
                zoom = (zoomRange(range, currentZoom * factor)),
                matrix = viewport.matrix(),
                currentScale = matrix.props.a,
                scale = 1 / currentScale * zoom,
                matrixScale = matrix.clone();

            this.onBeforeZoom(paper);

            matrixScale.scale(scale, scale, origin.x, origin.y);

            viewport.attr('transform', matrixScale.toString());
            viewport.graph.matrix = matrixScale;

            this.zooming.zoom  = zoom;
            this.zooming.scale = matrixScale.props.a;
            
            if (paper.state() == 'panning') {
                paper.cursor(zoomType == 'in' ? 'zoom-in' : 'zoom-out');    
            }

            this.onZoom(paper);
        },

        scroll: function(paper, viewport, dx, dy) {
            var matrix = viewport.matrix().clone(),
                scale = this.zooming.scale;

            this.onBeforeScroll(paper);

            dx /= scale;
            dy /= scale;
            
            matrix.translate(dx, dy);

            viewport.attr('transform', matrix.toString());
            viewport.graph.matrix = matrix;

            if (this.zooming.origin) {
                this.zooming.origin.x += dx;
                this.zooming.origin.y += dy;
            }

            this.onScroll();
        },

        onMouseWheel: function(e, paper, viewport) {

            e = Graph.event.fix(e);
            e.preventDefault();

            var vscroll = Graph.event.hasPrimaryModifier(e),
                hscroll = Graph.event.hasSecondaryModifier(e),
                event   = Graph.event.original(e);

            var factor, delta, origin, offset, box;

            if (vscroll || hscroll) {

                if (Graph.isMac()) {
                    factor = event.deltaMode === 0 ? 1.25 : 50;
                } else {
                    // factor = event.deltaMode === 0 ? 1/40 : 1/2;
                    factor = event.deltaMode === 0 ? 1 : 20;
                }

                delta = {};

                if (hscroll) {
                    delta.dx = (factor * (event.deltaX || event.deltaY));
                    delta.dy = 0;
                } else {
                    delta.dx = 0;
                    delta.dy = (factor * event.deltaY);
                }

                this.scroll(paper, viewport, delta.dx, delta.dy);

            } else {
                factor = (event.deltaMode === 0 ? 1/40 : 1/2);
                offset = this.caching.offset;

                origin = {
                    x: event.clientX - offset.x,
                    y: event.clientY - offset.y    
                };

                this.zooming.origin = origin;

                this.zoom(
                    paper,
                    viewport,
                    // event.deltaY * factor / (-5), 
                    event.deltaY * factor / (-8), 
                    origin
                );
            }
        }, 

        onPointerDown: function(e, paper, viewport, vendor) {
            var target = Graph.$(e.target),
                vector = Graph.registry.vector.get(target),
                vendor = paper.interactable().vendor(),
                tool   = paper.tool().current();

            var offset;

            if (tool == 'collector') {
                return;
            }

            if (vector) {
                // already has drag feature
                if (vector.isDraggable()) {
                    return;
                }

                // reject non primary button
                if (e.button || e.ctrlKey || e.shiftKey || e.altKey) {
                    return;
                }

                this.revalidate(paper);

                offset = this.caching.offset;

                this.panning.start = {
                    x: e.clientX - offset.x,
                    y: e.clientY - offset.y
                };

                // install temporary events handler
                this.panning.moveHandler = _.bind(this.onPointerMove, this, _, paper, viewport);
                this.panning.stopHandler = _.bind(this.onPointerStop, this, _, paper, viewport);

                vendor.on('move', this.panning.moveHandler);
                vendor.on('up', this.panning.stopHandler);
            }
        },

        onPointerMove: function(e, paper, viewport) {
            var offset = this.caching.offset,
                start = this.panning.start,
                current = { 
                    x: e.clientX - offset.x, 
                    y: e.clientY - offset.y
                },
                dx = current.x - start.x,
                dy = current.y - start.y,
                mg = Graph.util.hypo(dx, dy);

            paper.cursor('move');

            this.scroll(paper, viewport, dx, dy);

            this.panning.start = {
                x: e.clientX - offset.x,
                y: e.clientY - offset.y
            };

            // prevent select
            e.preventDefault();
        },

        onPointerStop: function(e, paper) {
            var me = this, vendor = paper.interactable().vendor();
            var delay, bounce;

            // wait interact to fire last posible event...
            delay = _.delay(function(){
                clearTimeout(delay);
                delay = null;

                vendor.off('move', me.panning.moveHandler);
                vendor.off('up', me.panning.stopHandler);

            }, 0);

            paper.cursor('default');
        },

        onBeforeZoom: _.debounce(function(paper){
            
            Graph.topic.publish('paper/beforezoom', null, paper);

        }, 300, {leading: true, trailing: false}),

        onZoom: _.debounce(function(paper) {
            var state = paper.state();

            if (state == 'panning') {
                paper.cursor('default');
            }

        }, 300),

        onBeforeScroll: _.debounce(function(paper){
            
            Graph.topic.publish('paper/beforescroll', null, paper);

        }, 300, {leading: true, trailing: false}),

        onScroll: _.debounce(function() {

        }, 300)

    });

    ///////// HELPERS /////////
    
    function logarithm(num, base) {
        base = base || 10;
        return Math.log(num) / Math.log(base);
    }

    function stepRange(range, steps) {
        var min = logarithm(range.min),
            max = logarithm(range.max),
            abs = Math.abs(min) + Math.abs(max);

        return abs / steps;
    }

    function zoomRange(range, scale) {
        return Math.max(range.min, Math.min(range.max, scale));
    }

    function pointerLocation(event, paper) {
        var offset = paper.node().getBoundingClientRect(),
            x = event.clientX - offset.left,
            y = event.clientY - offset.top;

        return {
            x: x, 
            y: y
        };
    }

}());

(function(){

    Graph.plugin.Linker = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null,
            enabled: false,
            suspended: true,
            rendered: false
        },

        components: {
            block: null,
            pointer: null,
            path: null
        },

        linking: {
            treshold: 10,
            enabled: false,
            moveHandler: null,
            stopHandler: null,
            source: null,
            start: null,
            target: null,
            end: null,
            visits: []
        },

        constructor: function(vector) {
            var me = this, vendor;

            if ( ! vector.isPaper()) {
                throw Graph.error('Linker plugin is only available for paper !');
            }

            vendor = vector.interactable().vendor();
            vendor.on('down', _.bind(me.onPointerDown, me, _, vector));

            vector.on('keynavdown', function(e){
                if (e.keyCode === Graph.event.ESC) {
                    me.invalidate();
                    vector.tool().activate('panzoom');
                }
            });

            me.props.vector = vector.guid();
            me.initComponent(vector);
        },
        
        initComponent: function(paper) {
            var me = this, comp = me.components;

            comp.block = (new Graph.svg.Group())
                .addClass('graph-linker-path')
                .selectable(false);

            comp.pointer = (new Graph.svg.Circle())
                .addClass('graph-linker-pointer')
                .removeClass(Graph.string.CLS_VECTOR_CIRCLE)
                .selectable(false)
                .render(comp.block);

            comp.path = (new Graph.svg.Path())
                .addClass('graph-linker-path')
                .removeClass(Graph.string.CLS_VECTOR_PATH)
                .selectable(false)
                .render(comp.block)
                .attr('marker-end', 'url(#marker-arrow)');
        },

        render: function() {
            var paper;

            if (this.props.rendered) {
                return;
            }

            paper = this.vector();
            this.components.block.render(paper);
            this.props.rendered = true;
        },

        invalidate: function() {
            var vector, vendor;

            if (this.linking.enabled) {
                vector = this.vector();
                vendor = vector.interactable().vendor();

                vector.removeClass('linking');

                if (this.linking.moveHandler) {
                    vendor.off('move', this.linking.moveHandler);
                }

                if (this.linking.stopHandler) {
                    vendor.off('up', this.linking.stopHandler);   
                }

                if (this.linking.source) {
                    this.linking.source.removeClass('disallowed');
                }

                if (this.linking.target) {
                    this.linking.target.removeClass('allowed');
                }

                _.assign(this.linking, {
                    enabled: false,
                    moveHandler: null,
                    stopHandler: null,
                    source: null,
                    start: null,
                    target: null,
                    end: null
                });
                
                if (this.linking.visits) {
                    _.forEach(this.linking.visits, function(v){
                        v.removeClass('connect-valid connect-invalid');
                    });
                }
                
                this.linking.visits = null;
            }
        },

        enable: function() {
            this.props.enabled = true;
            this.vector().state('linking');
        },

        disable: function() {
            this.props.enabled = false;
            this.invalidate();
            this.suspend();
        },

        suspend: function() {
            this.props.suspended = true;
            this.components.block.elem.detach();
        },

        resume: function() {
            var paper;

            if ( ! this.props.suspended) {
                return;
            }

            paper = this.vector();
            this.props.suspended = false;
            
            if ( ! this.props.rendered) {
                this.render();
            } else {
                paper.viewport().elem.append(this.components.block.elem);
            }
        },

        cropping: function(start, end) {
            var source = this.linking.source,
                target = this.linking.target,
                cable = new Graph.lang.Path([['M', start.x, start.y], ['L', end.x, end.y]]);

            var spath, scrop, tpath, tcrop;

            if (source) {
                spath = source.connectable().pathinfo();
                scrop = spath.intersection(cable, true);
            }

            if (target) {
                tpath = target.connectable().pathinfo();
                tcrop = tpath.intersection(cable, true);
            }

            cable = spath = tpath = null;

            return {
                start: scrop ? scrop[0] : null,
                end:   tcrop ? tcrop[0] : null
            };
        },

        build: function() {
            var tail = this.components.path.tail(),
                head = this.components.path.head();

            if (tail && head) {
                var paper = this.vector();
                paper.connect(
                    this.linking.source, 
                    this.linking.target,
                    tail,
                    head
                );
            }

            this.invalidate();
            this.suspend();
        },

        onPointerDown: function(e, paper) {
            var layout = paper.layout(),
                offset = layout.offset(),
                vector = layout.grabVector(e), 
                vendor = paper.interactable().vendor(),
                tool = paper.tool().current();

            if (tool != 'linker') {
                return;
            }

            if (this.linking.enabled) {
                if (this.linking.target) {
                    this.build();
                }
            } else {
                
                this.linking.visits = [];

                if (vector.isConnectable()) {
                    var sbox, port;

                    // track visit
                    this.linking.visits.push(vector);

                    if ( ! this.linking.source) {
                        
                        sbox = vector.connectable().bbox();
                        port = sbox.center(true);

                        this.linking.source = vector;
                        this.linking.start = port;

                        this.components.path
                            .moveTo(port.x, port.y)
                            .lineTo(port.x, port.y, false);

                        sbox = port = null;
                    }

                    if (this.props.suspended) {
                        this.resume();    
                    }

                    this.linking.enabled = true;
                    this.linking.moveHandler = _.bind(this.onPointerMove, this, _, paper);

                    paper.addClass('linking');

                    vendor = paper.interactable().vendor();
                    vendor.on('move', this.linking.moveHandler);
                }
            }
        },

        onPointerMove: function(e, paper) {
            var layout = paper.layout(),
                start = this.linking.start,
                coord = layout.grabLocation(e);

            var x = coord.x,
                y = coord.y;

            // add threshold
            var rad = Graph.util.rad(Graph.util.theta( start, {x: x, y: y} )),
                sin = Math.sin(rad),
                cos = Math.cos(rad),
                tdx = this.linking.treshold * -cos,
                tdy = this.linking.treshold *  sin;

            x += tdx;
            y += tdy;

            var current = layout.grabVector(e),
                valid = false;

            var target, crop, tbox, port;

            if (current && current.isConnectable()) {
                
                if (this.linking.visits.indexOf(current.guid()) === -1) {
                    this.linking.visits.push(current);
                }

                if (this.linking.source.connectable().canConnect(current.connectable())) {
                    valid = true;
                    target = current;

                    target.removeClass('connect-invalid');
                    target.addClass('connect-valid');
                    
                    tbox = current.connectable().bbox();
                    port = tbox.center(true);
                    
                    this.linking.target = target;
                    this.linking.end    = port;

                    crop = this.cropping(start, port);

                    if (crop.start) {
                        this.components.path.moveTo(crop.start.x, crop.start.y);
                    }

                    if (crop.end) {
                        this.components.path.lineTo(crop.end.x, crop.end.y, false);
                    } else {
                        this.components.path.lineTo(x, y, false);
                    }

                    tbox = port = null;

                } else {
                    current.removeClass('connect-valid');
                    current.addClass('connect-invalid');
                }
            }

            if ( ! valid) {

                if (this.linking.target) {
                    this.linking.target.removeClass('connect-valid connect-invalid');
                }

                this.linking.target = null;
                this.linking.end    = null;

                crop = this.cropping(start, {x: x, y: y});

                if (crop.start) {
                    this.components.path.moveTo(crop.start.x, crop.start.y);
                }

                if (crop.end) {
                    this.components.path.lineTo(crop.end.x, crop.end.y, false);
                } else {
                    this.components.path.lineTo(x, y, false);
                }
            }

        }

    });

    ///////// HELPER /////////
    


}());

(function(){

    Graph.plugin.ToolManager = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null,
            current: null
        },

        tools: {

        },

        constructor: function(vector) {
            var me = this;

            me.props.vector = vector.guid();

        },
        
        has: function(tool) {
            return !!this.tools[tool];
        },

        get: function(name) {
            var data = this.tools[name],
                vector = this.vector();

            if (data) {
                switch(data.type) {
                    case 'plugin':
                        return vector.plugins[name];
                    case 'util':
                        return vector.utils[name];
                }
            }

            return null;
        },

        current: function() {
            return this.props.current;
        },

        register: function(name, type) {
            type = _.defaultTo(type, 'plugin');

            this.tools[name] = {
                name: name,
                type: type,
                enabled: false
            };
        },

        unregister: function(name) {
            if (this.tools[name]) {
                delete this.tools[name];
            }
        },

        activate: function(name, activator) {
            if (this.props.current != name) {

                var tool = this.get(name), data;
                
                if (tool) {
                    this.deactivateAll(name);
                    this.props.current = name;

                    data = this.tools[name];
                    data.enabled = true;

                    activator = _.defaultTo(activator, 'tool');
                    tool.enable(activator);

                    this.fire('activate', {
                        name: data.name,
                        enabled: data.enabled
                    });
                }
            }
            
        },

        deactivate: function(name) {
            var tool = this.get(name), data;

            if (tool) {
                data = this.tools[name];
                data.enabled = false;
                this.props.current = null;

                tool.disable();

                this.fire('deactivate', {
                    name: data.name,
                    enabled: data.enabled
                });
            }
        },

        deactivateAll: function(except) {
            var vector = this.vector();

            for(var name in this.tools) {
                if (name != except) {
                    this.deactivate(name);
                }
            }

        },

        toggle: function(tool) {
            var data = this.tools[tool];
            if (data) {
                if (data.enabled) {
                    this.deactivate(tool);
                } else {
                    this.activate(tool);
                }
            }
        }


    });


}());

(function(){

    Graph.plugin.Pencil = Graph.extend(Graph.plugin.Plugin, {

        paper: null,

        drawing: {
            offset: {
                x: 0, 
                y: 0
            },
            moveHandler: null,
            stopHandler: null
        },

        constructor: function(paper) {
            this.paper = paper;
        },
        
        draw: function() {
            var paper, shape, vendor;
            
            // activate panzoom
            this.paper.tool().activate('panzoom');

            shape = Graph.shape.apply(null, arguments);

            if (shape) {

                shape.render(this.paper);
                shape.move(-500, -500);
                
                this.refresh(shape);
                this.paper.state('drawing');

                vendor = this.paper.interactable().vendor();

                this.drawing.offset = this.paper.layout().offset();
                this.drawing.moveHandler = _.bind(this.onPointerMove, this, _, shape);
                this.drawing.stopHandler = _.bind(this.onPointerStop, this, _, shape);

                vendor.on('move', this.drawing.moveHandler);
                vendor.on('up', this.drawing.stopHandler);    
            }

            return shape;
        },

        refresh: function(shape) {
            var snapping = this.paper.layout().dragSnapping();

            shape.component().cascade(function(comp){
                if (comp.isDraggable()) {
                    comp.draggable().snap(snapping);
                }

                if (comp.isResizable()) {
                    comp.resizable().snap(snapping);
                }
            });

        },

        onPointerMove: function(e, shape) {
            var offset = this.drawing.offset,   
                viewport = this.paper.viewport(),
                coords = Graph.event.relative(e, viewport),
                scale = viewport.scale();

            var x = coords.x - (offset.left / scale.x),
                y = coords.y - (offset.top / scale.y);

            shape.move(x, y);
        },

        onPointerStop: function(e, shape) {
            var vendor = this.paper.interactable().vendor();
            var delay;

            delay = _.delay(_.bind(function(){
                if (this.drawing.moveHandler) {
                    vendor.off('move', this.drawing.moveHandler);    
                    this.drawing.moveHandler = null;
                }

                if (this.drawing.stopHandler) {
                    vendor.off('up', this.drawing.stopHandler);    
                    this.drawing.stopHandler = null;
                }
            }, this), 0);
            
        }

    });

}());

(function(){

    var MIN_BOX_WIDTH  = 150,
        MIN_BOX_HEIGHT = 50,
        OFFSET_TRESHOLD = 10;

    Graph.plugin.Editor = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null,
            rendered: false,
            suspended: true,
            width: 'auto',
            height: 'auto',
            offset: 'auto'
        },

        editing: {
            commitHandler: null
        },

        components: {
            editor: null
        },

        constructor: function(vector, options) {
            var vendor;

            _.assign(this.props, options || {});

            this.props.vector = vector.guid();

            _.assign(this.cached, {
                left: 0,
                top: 0,
                width: 0,
                height: 0
            });

            vendor = vector.interactable().vendor();
            vendor.on('doubletap', _.bind(this.onDoubleTap, this));

            this.initComponent();
        },

        initComponent: function() {
            var me = this, comp = this.components;
            comp.editor = Graph.$('<div class="graph-editor" contenteditable="true"></div>');
            comp.editor.on('keypress', function(e){
                if (e.keyCode === Graph.event.ENTER) {
                    me.commit();
                }
            });
        },
        
        commit: function() {
            var text = this.components.editor.text();
            this.suspend();
            this.vector().props.text = text;

            this.fire('edit', {
                text: text,
                left: this.cached.left,
                top: this.cached.top
            });
        },

        render: function() {
            if (this.props.rendered) {
                this.redraw();
                return;
            }

            this.vector().paper().container().append(this.components.editor);
            this.props.rendered = true;
            this.redraw();
        },

        suspend: function() {
            this.props.suspended = true;
            this.components.editor.detach();

            if (this.editing.commitHandler) {
                Graph.topic.unsubscribe('paper/beforezoom', this.editing.commitHandler);
                Graph.topic.unsubscribe('paper/beforescroll', this.editing.commitHandler);
                this.vector().paper().off('pointerdown', this.editing.commitHandler);
                this.editing.commitHandler = null;
            }
        },

        resume: function() {
            var container;

            if ( ! this.props.rendered) {
                this.render();
            } else {
                if (this.props.suspended) {
                    this.props.suspended = false;
                    container = this.vector().paper().container();
                    container.append(this.components.editor);
                }
                this.redraw();
            }

        },

        redraw: function() {
            var editor = this.components.editor,
                vector = this.vector(),
                matrix = vector.matrix(true),
                scale  = matrix.scale();

            var vbox = vector.bbox().clone().transform(matrix).toJson();
            var left, top, width, height;
            
            width  = vbox.width;
            height = vbox.height;
            left = vbox.x;
            top  = vbox.y;

            if (this.props.width != 'auto') {
                width = Math.max(Math.min(this.props.width, width), MIN_BOX_WIDTH);
                left = vbox.x + (vbox.width - width) / 2;
            }

            if (this.props.height != 'auto') {
                height = Math.max((Math.min(this.props.height, height)), MIN_BOX_HEIGHT);
                top = vbox.y + (vbox.height - height) / 2;
            }

            left = left + 4 * scale.x;
            top = top + 4 * scale.y;
            width = width - 8 * scale.x;
            height = height - 8 * scale.y;

            editor.css({
                left: left,
                top:  top,
                width: width,
                height: height
            });

            _.assign(this.cached, {
                left: left,
                top: top,
                width: width,
                height: height
            });

            editor.text((vector.props.text || ''));
            editor.focus();

            vbox = null;
        },

        startEdit: function(e) {
            var me = this, vector = me.vector();

            if (vector.$collector) {
                vector.$collector.decollect(vector);
            }

            if (vector.paper().tool().current() == 'linker') {
                vector.paper().tool().activate('panzoom');
            }

            me.fire('beforeedit');
            me.resume();

            if (e && this.props.offset == 'pointer') {
                var editor = me.components.editor,
                    paper = vector.paper(),
                    scale = paper.layout().currentScale();

                var offset, coords, left, top;

                if (paper) {
                    offset = paper.offset();
                    coords = paper.layout().grabLocation(e);

                    left = e.clientX - offset.left + (OFFSET_TRESHOLD * scale.x);
                    top = e.clientY - offset.top + (OFFSET_TRESHOLD * scale.y);

                    editor.css({
                        left: left,
                        top: top
                    });

                    me.cached.left = coords.x;
                    me.cached.top = coords.y;
                }
            }

            me.editing.commitHandler = function() {
                me.commit();
            };

            Graph.topic.subscribe('paper/beforezoom', me.editing.commitHandler);
            Graph.topic.subscribe('paper/beforescroll', me.editing.commitHandler);

            vector.paper().on('pointerdown', me.editing.commitHandler);
            vector = null;
        },

        onDoubleTap: function(e) {
            this.startEdit(e);
            e.preventDefault();
        },

        destroy: function() {

        }

    });

}());

(function(){

    Graph.plugin.Snapper = Graph.extend(Graph.plugin.Plugin, {

        props: {
            enabled: true,
            suspended: true,
            rendered: false,
            vector: null
        },

        clients: {

        },

        components: {
            block: null,
            stubx: null,
            stuby: null
        },

        // trans
        snapping: {
            coords: null,
            vector: null,
            stubx: null,
            stuby: null
        },

        constructor: function(vector, options) {
            options = options || {};

            if ( ! vector.isPaper()) {
                throw Graph.error("Snapper plugin only available for paper");
            }

            this.props.vector = vector.guid();
            this.initComponent(vector);

            this.snapping.coords = {x: [], y: [] };
        },

        initComponent: function(vector) {
            var block, stubx, stuby;

            block = (new Graph.svg.Group())
                .selectable(false)
                .clickable(false)
                .addClass('graph-snapper');

            stubx = (new Graph.svg.Path('M 0 0 L 0 0'))
                .removeClass(Graph.string.CLS_VECTOR_PATH)
                .selectable(false)
                .clickable(false)
                .render(block);

            stuby = (new Graph.svg.Path('M 0 0 L 0 0'))
                .removeClass(Graph.string.CLS_VECTOR_PATH)
                .clickable(false)
                .selectable(false)
                .render(block);

            this.components.block = block.guid();
            this.components.stuby = stuby.guid();
            this.components.stubx = stubx.guid();

        },

        component: function(name) {
            if (name === undefined) {
                return Graph.registry.vector.get(this.components.block);    
            }
            return Graph.registry.vector.get(this.components[name]);
        },

        render: function() {
            if (this.props.rendered) {
                return;
            }
            this.component().render(this.vector());
            this.props.rendered = true;
        },

        suspend: function() {
            this.props.suspended = true;
            this.component().elem.detach();
        },

        resume: function() {
            if (this.props.suspended) {
                this.props.suspended = false;
                if ( ! this.props.rendered) {
                    this.render();
                } else {
                    var block = this.component(),
                        viewport = this.vector().viewport();
                    block.elem.appendTo(viewport.elem);
                }
            }
        },

        subscribe: function(options) {
            var me = this,
                vector = options.vector,
                shield = options.shield,
                guid = vector.guid();

            if (me.clients[guid]) {
                vector.off('dragstart', me.clients[guid].dragStartHandler);
                vector.off('dragend', me.clients[guid].dragEndHandler);
                vector.off('remove',  me.clients[guid].removeHandler);

                delete me.clients[guid];
            }

            if (options.enabled) {

                var dragger = vector.draggable();

                me.clients[guid] = {
                    vector: guid,
                    shield: shield.guid(),
                    osnaps: dragger.snap(),
                    ostart: dragger.origin(),
                    
                    dragStartHandler: _.bind(me.onClientDragStart, me, _, vector, shield),
                    dragEndHandler: _.bind(me.onClientDragEnd, me, _, vector),
                    removeHandler: _.bind(me.onClientRemove, me, _, guid)
                };

                vector.on('dragstart', me.clients[guid].dragStartHandler);
                vector.on('dragend', me.clients[guid].dragEndHandler);
                vector.on('remove',  me.clients[guid].removeHandler);

                var center = shield.bbox().center().toJson(),
                    offset = vector.paper().offset(),
                    coords = this.snapping.coords,
                    cx = center.x,
                    cy = center.y;

                if (_.indexOf(coords.x, cx) === -1) {
                    coords.x.push((cx + offset.left));
                }

                if (_.indexOf(coords.y, cy) === -1) {
                    coords.y.push((cy + offset.top));
                }
            }
        },

        showStub: function(axis, value) {
            var snapping = this.snapping;
            var command;

            if (axis == 'x') {
                command = 'M ' + value + ' -100000 L ' + value + ' 100000';

                snapping.stubx.attr('d', command);
                snapping.stubx.addClass('visible');
            }

            if (axis == 'y') {
                command = 'M -100000 ' + value + ' L 100000 ' + value;

                snapping.stuby.attr('d', command);
                snapping.stuby.addClass('visible');
            }

            command = null;
        },

        hideStub: function(axis) {
            var stub = axis == 'x' ? 'stubx' : 'stuby';
            this.snapping[stub].removeClass('visible');
        },

        onClientDragStart: function(e, vector, shield) {
            var me = this,
                offset = vector.paper().offset(),
                center = shield.bbox().center().toJson();

            var snapping = this.snapping,
                coords = snapping.coords;

            snapping.stubx = this.component('stubx');
            snapping.stuby = this.component('stuby');

            var origX = center.x + offset.left - e.x,
                origY = center.y + offset.top - e.y,
                snapX = [],
                snapY = [];

            _.forEach(coords.x, function(v){
                snapX.push((v - origX));
            });

            _.forEach(coords.y, function(v){
                snapY.push((v - origY));
            });

            vector.draggable().origin({
                x: origX,
                y: origY
            });

            vector.draggable().snap([
                function(x, y) {
                    var sx, sy;

                    sx = snapValue(x, snapX);
                    sy = snapValue(y, snapY);

                    if (sx.snapped) {
                        me.showStub('x', sx.value - offset.left + origX);
                    } else {
                        me.hideStub('x');
                    }

                    if (sy.snapped) {
                        me.showStub('y', sy.value - offset.top + origY);
                    } else {
                        me.hideStub('y');
                    }

                    return {
                        x: sx.value,
                        y: sy.value
                    };
                }
            ]);

            me.resume();
        },

        onClientDragEnd: function(e, vector) {
            var snapping = this.snapping,
                options = this.clients[vector.guid()];

            if (options) {
                var dragger = vector.draggable();
                
                if (options.osnaps) {
                    dragger.snap(options.osnaps);
                }

                if (options.ostart) {
                    dragger.origin(options.ostart);
                }

            }

            this.suspend();

            _.assign(this.snapping, {
                stubx: null,
                stuby: null
            });
        },

        onClientRemove: function(e) {

        }

    });

    ///////// HELPERS /////////
    
    function snapValue(value, snaps, range) {
        range = _.defaultTo(range, 10);
        
        var i = snaps.length;

        while(i--) {
            if (Math.abs(snaps[i] - value) <= range) {
                return {
                    snapped: true,
                    value: snaps[i]
                };
            }
        }

        return {
            snapped: false,
            value: value
        };
    }

}());

(function(){

    var Shape = Graph.shape.Shape = Graph.extend({

        props: {
            id: null,
            guid: null,
            width: 0,
            height: 0,
            label: ''
        },

        components: {
            shape: null,
            block: null,
            label: null
        },

        plugins: {},

        constructor: function(options) {
            _.assign(this.props, options || {});

            this.props.guid = 'graph-shape-' + (++Shape.guid);
            this.initComponent();
            Graph.registry.shape.register(this);
        },

        guid: function() {
            return this.props.guid;
        },

        /**
         * Default draw function
         */
        draw: function() {

        },

        render: function(paper) {
            var component = this.component();
            component && component.render(paper);
        },

        initComponent: function() {
            var shape = (new Graph.svg.Group());
            this.components.shape = shape.guid();
            shape = null;
        },

        component: function(name) {
            var manager = Graph.registry.vector;
            if (name === undefined) {
                return manager.get(this.components.shape);
            }
            return manager.get(this.components[name]);
        },
        
        hub: function() {
            // TODO return connectable component
            return this.component('block');
        },

        redraw: _.debounce(function() {
            var label = this.component('label'),
                block = this.component('block'),
                bound = block.bbox().toJson();

            label.attr({
                x: bound.x + bound.width  / 2, 
                y: bound.x + bound.height / 2
            });

            label.wrap(bound.width - 10);

        }, 1),

        move: function(x, y) {
            var shape = this.component(),
                imatrix = shape.matrix().clone().invert();

            x -= this.props.width / 2;
            y -= this.props.height / 2;

            shape.matrix().multiply(imatrix);
            shape.translate(x, y).commit();

            imatrix = null;
        },

        onLabelEdit: function(e) {
            var text = e.text;
            this.component('label').props.text = text;
            this.redraw();
        },

        onDragEnd: function(e) {
            var block = this.component('block'),
                shape = this.component('shape'),
                matrix = block.matrix();

            block.reset();

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toString());
        },

        onResize: function() {
            this.redraw();
        },

        onRemove: function() {
            // remove label
            this.component('label').remove();

            // remove shape
            this.component('shape').remove();

            for (var name in this.components) {
                this.components[name] = null;
            }

            Graph.registry.shape.unregister(this);
        }
    });

    ///////// STATICS /////////
    
    Shape.guid = 0;

    ///////// EXTENSION /////////
    
    Graph.isShape = function(obj) {
        return obj instanceof Graph.shape.Shape;
    };

}());

(function(){

    Graph.ns('Graph.shape.activity');

    Graph.shape.activity.Start = Graph.extend(Graph.shape.Shape, {
        
        props: {
            label: 'START',
            width: 60,
            height: 60,
            left: 0,
            top: 0
        },

        initComponent: function() {
            var me = this, 
                comp = me.components;

            var shape, block, label;

            shape = (new Graph.svg.Group(me.props.left, me.props.top))
                .addClass('graph-shape-activity-start')
                .selectable(false);

            var cx = me.props.width / 2,
                cy = me.props.height / 2;

            block = (new Graph.svg.Ellipse(cx, cy, cx, cy))
                .data('text', me.props.label)
                .render(shape);

            block.draggable({ghost: true});
            block.connectable({shield: shape, wiring: 'h:v'});
            block.resizable({shield: shape});
            block.editable();

            block.on('edit',    _.bind(me.onLabelEdit, me));
            block.on('dragend', _.bind(me.onDragEnd, me));
            block.on('resize',  _.bind(me.onResize, me));
            block.on('remove',  _.bind(me.onRemove, me));

            label = (new Graph.svg.Text(cx, cy, me.props.label))
                .selectable(false)
                .clickable(false)
                .render(shape);

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();

            shape = block = label = null;
        },

        redraw: function() {
            var block = this.component('block'),
                shape = this.component('shape'),
                label = this.component('label');

            var matrix, bound, cx, cy;

            bound  = block.bbox().toJson(),
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toString());

            cx = bound.width  / 2;
            cy = bound.height / 2;

            block.attr({
                cx: cx,
                cy: cy
            });

            block.dirty(true);
            block.resizable().redraw();
            
            label.attr({
                x: cx, 
                y: cy
            });

            label.wrap(bound.width - 10);

            bound  = null;
            matrix = null;
        },

        toString: function() {
            return 'Graph.shape.activity.Start';
        }

    });

}());

(function(){

    Graph.shape.activity.Final = Graph.extend(Graph.shape.Shape, {
        
        props: {
            label: 'STOP',
            width: 60,
            height: 60,
            left: 0,
            top: 0
        }, 

        initComponent: function() {
            var me = this, 
                comp = me.components;

            var shape, block, inner, label;

            shape = (new Graph.svg.Group(me.props.left, me.props.top))
                .addClass('graph-shape-activity-final')
                .selectable(false);

            var cx = me.props.width / 2,
                cy = me.props.height / 2;

            block = (new Graph.svg.Ellipse(cx, cy, cx, cy))
                .addClass('block')
                .data('text', me.props.label)
                .render(shape);

            block.draggable({ghost: true});
            block.connectable({shield: shape});
            block.resizable({shield: shape});
            block.editable();

            block.on('edit',    _.bind(me.onLabelEdit, me));
            block.on('dragend', _.bind(me.onDragEnd, me));
            block.on('resize',  _.bind(me.onResize, me));
            block.on('remove',  _.bind(me.onRemove, me));

            inner = (new Graph.svg.Ellipse(cx, cy, cx - 6, cy - 6))
                .addClass('inner')
                .clickable(false)
                .selectable(false)
                .render(shape);

            label = (new Graph.svg.Text(cx, cy, me.props.label))
                .addClass('label')
                .selectable(false)
                .clickable(false)
                .render(shape);

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();
            comp.inner = inner.guid();

            shape = block = label = null;
        },

        redraw: function() {
            var block = this.component('block'),
                shape = this.component('shape'),
                inner = this.component('inner'),
                label = this.component('label');

            var matrix, bound, cx, cy;

            bound  = block.bbox().toJson(),
            matrix = Graph.matrix().translate(bound.x, bound.y);
            
            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toString());

            cx = bound.width / 2,
            cy = bound.height / 2;

            block.attr({
                cx: cx,
                cy: cy
            });

            block.dirty(true);
            block.resizable().redraw();

            label.attr({
                x: cx, 
                y: cy
            });

            label.wrap(bound.width - 10);

            inner.attr({
                cx: cx,
                cy: cy,
                rx: cx - 6,
                ry: cy - 6
            });
            
            bound  = null;
            matrix = null;
        },

        toString: function() {
            return 'Graph.shape.activity.Final';
        },

        onRemove: function() {
            // remove label
            this.component('label').remove();

            // remove inner
            this.component('inner').remove();

            // remove shape
            this.component('shape').remove();

            for (var name in this.components) {
                this.components[name] = null;
            }

            Graph.registry.shape.unregister(this);
        }

    });

}());

(function(){

    Graph.shape.activity.Action = Graph.extend(Graph.shape.Shape, {

        props: {
            label: 'Action',
            width: 140,
            height: 60,
            left: 0,
            top: 0
        },

        initComponent: function() {
            var me = this, comp = this.components;
            var shape, block, label;

            var cx = me.props.width / 2,
                cy = me.props.height / 2;

            shape = (new Graph.svg.Group(me.props.left, me.props.top))
                .selectable(false);

            block = (new Graph.svg.Rect(0, 0, me.props.width, me.props.height))
                .data('text', me.props.label)
                .render(shape);

            block.draggable({ghost: true});
            block.resizable({shield: shape});
            block.editable();
            block.connectable({shield: shape, wiring: 'h:v'});
            block.snappable({shield: shape, enabled: true});

            block.on('edit.shape',    _.bind(me.onLabelEdit, me));
            block.on('dragend.shape', _.bind(me.onDragEnd, me));
            block.on('resize.shape',  _.bind(me.onResize, me));
            block.on('remove.shape',  _.bind(me.onRemove, me));

            label = (new Graph.svg.Text(cx, cy, me.props.label))
                .clickable(false)
                .selectable(false)
                .render(shape);

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();

            shape = block = label = null;
        },

        redraw: function() {
            var block = this.component('block'),
                shape = this.component('shape'),
                label = this.component('label');

            var bound, matrix;

            bound = block.bbox().toJson();
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toString());

            block.attr({
                x: 0,
                y: 0
            });

            block.dirty(true);
            block.resizable().redraw();
            
            label.attr({
                x: bound.width  / 2, 
                y: bound.height / 2
            });

            label.wrap(bound.width - 10);

            bound = null;
            matrix = null;
        },

        onResize: function() {
            this.redraw();
        },

        toString: function() {
            return 'Graph.shape.activity.Action';
        }

    });

}());

(function(){

    Graph.shape.activity.Router = Graph.extend(Graph.shape.Shape, {

        props: {
            label: 'Route',
            width: 100,
            height: 100,
            left: 0,
            top: 0
        },

        initComponent: function() {
            var me = this, comp = me.components;
            var shape, block, label;

            var points = [
                me.props.width / 2, 0,
                me.props.width, me.props.height / 2,
                me.props.width / 2, me.props.height,
                0, me.props.height / 2
            ];

            var cx = points[0],
                cy = points[3];

            shape = (new Graph.svg.Group(me.props.left, me.props.top))
                .selectable(false);

            block = (new Graph.svg.Polygon(points))
                .data('text', me.props.label)
                .render(shape);

            block.draggable({ghost: true});
            block.resizable({shield: shape});
            block.editable();
            block.connectable({shield: shape});

            block.on('edit', _.bind(me.onLabelEdit, me));
            block.on('dragend', _.bind(me.onDragEnd, me));
            block.on('resize', _.bind(me.onResize, me));
            block.on('remove',  _.bind(me.onRemove, me));

            label = (new Graph.svg.Text(cx, cy, me.props.label))
                .clickable(false)
                .selectable(false)
                .render(shape);

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();

            shape = block = label = null;
        },

        redraw: function() {
            var block = this.component('block'),
                shape = this.component('shape'),
                label = this.component('label');

            var bound, matrix;

            bound = block.bbox().toJson();
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toString());

            var points = [
                bound.width / 2, 0,
                bound.width, bound.height / 2,
                bound.width / 2, bound.height,
                0, bound.height / 2
            ];

            block.attr({
                points: _.join(points, ',')
            });

            block.dirty(true);
            block.resizable().redraw();

            label.attr({
                x: bound.width  / 2, 
                y: bound.height / 2
            });

            label.wrap(bound.width - 10);

            matrix = null;
            bound  = null;
        }

    });

}());

(function(){

    Graph.shape.activity.Fork = Graph.extend(Graph.shape.Shape, {

        props: {
            width: 100,
            height: 50,
            left: 0,
            top: 0
        },

        initComponent: function() {
            var me = this, comp = this.components;
            var shape, block, label;

            shape = (new Graph.svg.Group(me.props.left, me.props.top))
                .selectable(false);

            comp.shape = shape.guid();
        }

    });

}());

(function(){

    Graph.shape.activity.Join = Graph.extend(Graph.shape.Shape, {
        props: {
            width: 140,
            height: 12,
            left: 0,
            top: 0
        },

        initComponent: function() {
            var me = this, comp = this.components;
            var shape, block, beam, label;

            shape = (new Graph.svg.Group(me.props.left, me.props.top))
                .addClass('graph-shape-activity-join')
                .selectable(false);

            block = (new Graph.svg.Rect(0, 0, me.props.width, me.props.height, 0))
                .addClass('block')
                .render(shape);

            block.draggable({ghost: true});
            block.connectable({shield: shape});
            block.on('dragend', _.bind(me.onDragEnd, me));

            comp.shape = shape.guid();
            comp.block = block.guid();
        }
    });

}());

(function(){

    Graph.shape.activity.Lane = Graph.extend(Graph.shape.Shape, {

        props: {
            label: 'Participant Role',
            width: 1000,
            height: 200,
            left: 0,
            top: 0
        },

        initComponent: function() {
            var me = this, comp = me.components;
            var shape, block, header, label;

            shape = (new Graph.svg.Group(me.props.left, me.props.top))
                .addClass('graph-shape-activity-lane')
                .selectable(false);

            block = (new Graph.svg.Rect(0, 0, me.props.width, me.props.height, 0))
                .addClass('block')
                .render(shape);

            block.resizable({shield: shape});
            block.draggable({ghost: true});

            block.on('dragend', _.bind(me.onDragEnd, me));
            block.on('resize', _.bind(me.onResize, me));
            block.on('remove',  _.bind(me.onRemove, me));

            header = (new Graph.svg.Rect(0, 0, 30, me.props.height, 0))
                .addClass('header')
                .selectable(false)
                .render(shape);

            var tx = 15,
                ty = me.props.height / 2;

            label = (new Graph.svg.Text(tx, ty, me.props.label))
                .selectable(false)
                .clickable(false)
                .render(shape);

            label.rotate(270, tx, ty).commit();

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.header = header.guid();
            comp.label = label.guid();

            shape = block = header = label = null;
        },

        onDragEnd: function() {
            var block = this.component('block'),
                shape = this.component('shape'),
                matrix = block.matrix();

            block.reset();
            block.attr('transform', '');

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toString());
        },

        redraw: function() {
            var block = this.component('block'),
                shape = this.component('shape'),
                header = this.component('header'),
                label = this.component('label');

            var matrix, bound;

            bound  = block.bbox().toJson();
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toString());

            block.attr({
                x: 0,
                y: 0
            });

            block.dirty(true);
            block.resizable().redraw();

            header.attr({
                x: 0,
                y: 0,
                height: bound.height
            });

            header.dirty(true);

            var tx = 15,
                ty = bound.height / 2;

            label.graph.matrix = Graph.matrix();
            label.attr('transform', '');

            label.attr({
                x: tx,
                y: ty
            });

            label.wrap(bound.height - 10);
            label.rotate(270, tx, ty).commit();

        },

        toString: function() {
            return 'Graph.shape.activity.Lane';
        },

        onRemove: function() {
            // remove label
            this.component('label').remove();

            // remove header
            this.component('header').remove();

            // remove shape
            this.component('shape').remove();

            for (var name in this.components) {
                this.components[name] = null;
            }

            Graph.registry.shape.unregister(this);
        }

    });

}());

(function(){
    
    var XMLDOC = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [<!ENTITY nbsp "&#160;">]>';
    
    var Exporter = Graph.data.Exporter = function(vector, options){
        
        this.options = _.extend({}, Exporter.defaults, options || {});
        this.element = vector.node();
        
        var width, height, scale;
        
        if (vector.isPaper()) {
            width  = vector.elem.width();
            height = vector.elem.height();
            scale  = vector.layout().currentScale();
        } else {
            var bounds = vector.bbox().toJson();
            
            width  = bounds.width;
            height = bounds.height;
            scale  = vector.matrix(true).scale();
        }
        
        _.assign(this.options, {
            width: width,
            height: height,
            scaleX: scale.x,
            scaleY: scale.y
        });
    };
    
    Exporter.defaults = {
        width: 0,
        height: 0,
        
        scaleX: 1,
        scaleY: 1
    };

    Exporter.prototype.exportDataURI = function() {
        
    };
    
    Exporter.prototype.exportSVG = function() {
        
    };

    Exporter.prototype.exportJPEG = function(filename, compression) {
        var options = _.extend({}, this.options);
        
        options.encoder = 'image/jpeg';
        options.compression = compression || 0.8;
        
        filename = _.defaultTo(filename, 'download.jpg');
        
        exportImage(this.element, options, function(result){
            if (result) {
                document(filename, result);
            }
        });
    };

    Exporter.prototype.exportPNG = function(filename, compression) {
        var options = _.extend({}, this.options);
        
        filename = _.defaultTo(filename, 'download.png');
        
        options.encoder = 'image/png';
        options.compression = compression || 0.8;
        
        exportImage(this.element, options, function(result){
            if (result) {
                download(filename, result);
            }
        });
    };

    ///////// HELPERS /////////
    
    function repair(data) {
        var encoded = encodeURIComponent(data);
        
        encoded = encoded.replace(/%([0-9A-F]{2})/g, function(match, p1) {
            var c = String.fromCharCode('0x'+p1);
            return c === '%' ? '%25' : c;
        });
        
        return decodeURIComponent(encoded);
    }
    
    function download(name, uri) {
        if (navigator.msSaveOrOpenBlob) {
            var blob = createBlob(uri);
            navigator.msSaveOrOpenBlob(blob, name);
            blob = null;
        } else {
            var link = Graph.dom('<a/>');
            
            if ('download' in link) {
                link.download = name;
                link.href = uri;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                window.open(uri, '_download', 'menubar=no,toolbar=no,status=no');
            }
            
            link = null;
        }
    }
    
    function createBlob(uri) {
        var byteString = window.atob(uri.split(',')[1]),
            mimeString = uri.split(',')[0].split(':')[1].split(';')[0],
            buffer = new ArrayBuffer(byteString.length),
            intArray = new Uint8Array(buffer);
        
        for (var i = 0, ii = byteString.length; i < ii; i++) {
            intArray[i] = byteString.charCodeAt(i);
        }
        
        return new Blob([buffer], {type: mimeString});
    }
    
    function exportImage(element, options, callback) {
        var data = createDataURI(element, options),
            image = new Image();
        
        image.onload = function() {
            var canvas, context, result;
            
            canvas = document.createElement('canvas');
            canvas.width  = image.width;
            canvas.height = image.height;
            
            context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            
            try {
                result = canvas.toDataURL(options.encoder, options.compression);
            } catch(e) {
                result = false;
            }
            
            canvas = context = null;
            callback(result);
        };
        
        image.onerror = function() {
            callback(false);
        };
        
        image.src = data; // DOMURL.createObjectURL(blob);
    }
    
    function createDataURI(element, options) {
        var holder = Graph.dom('<div/>'),
            cloned = element.cloneNode(true);
        
        var css, sty, svg, xml, uri;
            
        if (cloned.tagName == 'svg') {
            cloned.setAttribute('width',  options.width);
            cloned.setAttribute('height', options.height);
        } else {
            svg = Graph.dom('<svg/>');
            
            svg.setAttribute('xmlns', Graph.config.xmlns.svg);
            svg.setAttribute('xmlns:xlink', Graph.config.xmlns.xlink);
            svg.setAttribute('version', Graph.config.svg.version);
            svg.setAttribute('width',  options.width);
            svg.setAttribute('height', options.height);
            
            svg.appendChild(cloned);
            cloned = svg;
        }
        
        holder.appendChild(cloned);
        
        css = getElementStyles(element);
        sty = Graph.dom('<style/>');
        sty.setAttribute('type', 'text/css');
        sty.innerHTML = "<![CDATA[\n" + css + "\n]]>";
        
        var first = cloned.childNodes[0];
        
        if (first) {
            cloned.insertBefore(sty, first);
        } else {
            cloned.appendChild(sty);
        }
        
        xml = XMLDOC + holder.innerHTML;
        uri = 'data:image/svg+xml;base64,' + window.btoa(repair(xml));
        
        cloned = holder = null;
        return uri;
    }
    
    function getElementStyles(element) {
        var styles = document.styleSheets,
            result = '';
            
        var rules, rule, found;
        
        for (var i = 0, ii = styles.length; i < ii; i++) {
            
            rules = styles[i].cssRules;
            
            if (rules != null) {
                
                for (var j = 0, jj = rules.length; j < jj; j++, found = null) {
                    
                    rule = rules[j];
                    
                    if (rule.style !== undefined) {
                        if (rule.selectorText) {
                            
                            found = element.querySelector(rule.selectorText);
                            
                            if (found) {
                                result += rule.selectorText + " { " + rule.style.cssText + " }\n";
                            } else if(rule.cssText.match(/^@font-face/)) {
                                result += rule.cssText + '\n';
                            }
                        }
                    }
                }
            }
        }
        
        return result;
    }

}());


(function(){

    Graph.diagram.Diagram = Graph.extend({

        props: {
            name: null,
            type: ''
        },

        constructor: function(paper) {
            
        },

        destroy: function() {

        }

    });

}());

(function(){

    Graph.diagram.Command = Graph.extend({
        
        history: [],

        add: function() {
            
        },

        undo: function() {
            
        },

        redo: function() {

        }

    });

}());

(function(){

    var Modeler = Graph.diagram.Modeler = function(){};

    Modeler.prototype.export = function(diagram) {

    };

    Modeler.prototype.import = function(diagram, model) {
        
    };
}());

(function(){

    var Parser = Graph.diagram.Parser = function(){};

    Parser.prototype.parse = function(diagram, data) {
        
    };
}());

(function(){

    var Rules = Graph.diagram.Rules = function(){
        this.rules = {};
    };

    Rules.prototype.add = function() {
        
    };

}());

(function(){

    Graph.popup.Dialog = Graph.extend({

        props: {
            opened: false,
            content: null,
            buttons: null,
            baseClass: ''
        },

        components: {
            popup: null,
            container: null,
            backdrop: null
        },

        handlers: {
            backdropClick: null
        },

        constructor: function(container, options) {
            if (_.isPlainObject(container)) {
                options = container;
                container = Graph.$('body');
            }

            _.assign(this.props, options || {});

            this.components.container = container || Graph.$('body');
            this.initComponent();
        },

        initComponent: function() {
            var me = this;

            var popup = Graph.$('<div class="graph-popup-dialog"/>');
            popup.addClass(this.props.baseClass);
            console.log(this.props.baseClass);
            me.components.popup = popup;
        },

        component: function() {
            return this.components.popup;
        },

        content: function(content) {
            var me = this;

            if (content === undefined) {
                return me.props.content;
            }

            if (_.isFunction(content)) {
                Graph.when(content()).then(function(data){
                    me.props.content = data;
                    me.components.popup.html(data);
                });
            } else {
                me.props.content = content;
                me.components.popup.html(content);
            }

            return this;
        },

        open: function() {
            if (this.opened) {
                return;
            }

            this.components.container.append(this.components.popup);
            this.props.opened = true;

            this.center();
            this.backdrop();

            return this;
        },

        close: function() {
            var backdrop = this.components.backdrop;

            this.components.popup.detach();
            this.props.opened = false;

            if (this.handlers.backdropClick) {
                backdrop.off('click', this.handlers.backdropClick);
                this.handlers.backdropClick = null;

                var backdropUser = +backdrop.data('user');

                backdropUser--;

                if (backdropUser <= 0) {
                    backdropUser = 0;
                    backdrop.detach();
                }

                backdrop.data('user', backdropUser);
            }

            this.fire('close');
        },

        center: _.debounce(function() {
            var popup = this.components.popup,
                width = popup.width(),
                height = popup.height();

            popup.css({
                'top': '50%',
                'left': '50%',
                'margin-top': -height / 2,
                'margin-left': -width / 2
            });
        }, 0),

        backdrop: function() {
            var me = this,
                backdrop = Graph.$('.graph-popup-backdrop');

            if ( ! backdrop.length()) {
                backdrop = Graph.$('<div class="graph-popup-backdrop"/>');
                backdrop.data('user', 0);
                backdrop.on('click', function(e){
                    e.stopPropagation();
                });
            }

            me.handlers.backdropClick = function() {
                me.close();
            };

            backdrop.on('click', me.handlers.backdropClick);

            var backdropUser = +backdrop.data('user');

            backdropUser++;
            backdrop.data('user', backdropUser);

            me.components.popup.before(backdrop);
            me.components.backdrop = backdrop;
        },

        destroy: function() {
            this.components.popup.remove();
            this.components.popup = null;
            this.components.container = null;
        }

    });

}());