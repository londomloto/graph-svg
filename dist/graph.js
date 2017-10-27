
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
     *  https://github.com/d3/d3-array/blob/master/src/bisector.js
     */
    function ascending(a, b) {
        return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    }

    function descending(a, b) {
        return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
    }

    function bisector(compare) {
        return {
            left: function(a, x, lo, hi) {
                if (arguments.length < 3) lo = 0;
                if (arguments.length < 4) hi = a.length;
                while (lo < hi) {
                    var mid = lo + hi >>> 1;
                    if (compare(a[mid], x) < 0) lo = mid + 1; else hi = mid;
                }
                return lo;
            },
            right: function(a, x, lo, hi) {
                if (arguments.length < 3) lo = 0;
                if (arguments.length < 4) hi = a.length;
                while (lo < hi) {
                    var mid = lo + hi >>> 1;
                    if (compare(a[mid], x) > 0) hi = mid; else lo = mid + 1;
                }
                return lo;
            }
        };
    }

    _.bisector = function(f) {
        return bisector(f.length === 1 ? function(d, x){
            return ascending(f(d), x);
        } : f);
    };
    
    /** 
     *  Sorter
     *  https://github.com/gka/d3-jetpack/blob/master/d3-jetpack.js
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

    var NAVIGATOR = navigator;

    /**
     * Size for cached result
     */
    var CACHE_SIZE = 100;

    /**
     * Size for memoize function
     */
    var MEMO_SIZE = 1000;

    //--------------------------------------------------------------------//
    
    /**
     * Banner
     */
    GLOBAL.Graph = function(ready) {
        Graph.BOOTSTRAPS.push(ready);
    };

    Graph.BOOTSTRAPS = [];

    Graph.VERSION = '1.0.0';
    
    Graph.AUTHOR = 'Kreasindo Cipta Teknologi';

    /**
     * Config
     */
    Graph.cached = {};

    Graph.config = {
        base: '../',
        locale: 'id',
        dom: 'light',
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
        },
        resizer: {
            image: 'resize-control.png',
            size: 17
        },
        rotator: {
            image: 'rotator.png',
            size: 21
        }
    };

    Graph.setup = function(name, value) {
        var locals = ['icons', 'string', 'styles'];
        var key, val;

        if (_.isPlainObject(name)) {
            for (key in name) {
                val = name[key];
                if (locals.indexOf(key) !== -1) {
                    _.extend(Graph[key], val);
                } else {
                    if (_.isPlainObject(val)) {
                        _.extend(Graph.config[key], val);
                    } else {
                        Graph.config[key] = val;
                    }
                }
            }
        } else {
            if (locals.indexOf(name) !== -1) {
                _.extend(Graph[name], value);
            } else {
                if (_.isPlainObject(value)) {
                    _.extend(Graph.config[name], value);
                } else {
                    Graph.config[name] = value;    
                }
            }
        }
    };

    // Graph.toString = function() {
    //     return 'SVG Library presented by ' + Graph.AUTHOR;
    // }
    

    /**
     * String params
     */
    Graph.string = {
        ID_VECTOR: 'graph-vector-id',
        ID_SHAPE: 'graph-shape-id',
        ID_LINK: 'graph-link-id',
        ID_PORT: 'graph-port-id'
    };

    /**
     * Style params
     */
    Graph.styles = {
        VECTOR: 'graph-elem',
        PAPER: 'graph-paper',
        VIEWPORT: 'graph-viewport',

        SHAPE: 'graph-shape',
        SHAPE_BLOCK: 'comp-block',
        SHAPE_LABEL: 'comp-label',
        SHAPE_HEADER: 'comp-header',
        SHAPE_CHILD: 'comp-child',
        SHAPE_DRAG: 'shape-draggable',

        LINK_HEAD: 'graph-link-head',
        LINK_TAIL: 'graph-link-tail'
    };

    /**
     * Icon params
     */
    Graph.icons = {
        ZOOM_IN: '<i class="ion-android-add"></i>',
        ZOOM_OUT: '<i class="ion-android-remove"></i>',
        ZOOM_RESET: '<i class="ion-pinpoint"></i>',

        SHAPE: '<i class="bpmn-icon-start-event-none"></i>',
        SHAPE_LANE: '<i class="bpmn-icon-participant"></i>',
        SHAPE_LINK: '<i class="ion-android-share-alt"></i>',
        SHAPE_ACTION: '<i class="bpmn-icon-task"></i>',
        SHAPE_ROUTER: '<i class="bpmn-icon-gateway-none"></i>',

        LANE_ABOVE: '<i class="bpmn-icon-lane-insert-above"></i>',
        LANE_BELOW: '<i class="bpmn-icon-lane-insert-below"></i>',

        CONFIG: '<i class="bpmn-icon-screw-wrench"></i>',
        LINK: '<i class="bpmn-icon-connection-multi"></i>',
        TRASH: '<i class="bpmn-icon-trash"></i>',

        SEND_TO_BACK: '<i class="font-icon-send-back"></i>',
        SEND_TO_FRONT: '<i class="font-icon-bring-front"></i>',

        MOVE_UP: '<i class="ion-android-arrow-up"></i>',
        MOVE_DOWN: '<i class="ion-android-arrow-down"></i>',

        ROUTER_OR: '<i class="bpmn-icon-gateway-or"></i>',
        ROUTER_XOR: '<i class="bpmn-icon-gateway-xor"></i>',
        ROUTER_NONE: '<i class="bpmn-icon-gateway-none"></i>',
        ROUTER_PARALLEL: '<i class="bpmn-icon-gateway-parallel"></i>'
    };

    Graph.doc = function() {
        
    };

    Graph.global = function() {
        
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
        return (/mac/i).test(NAVIGATOR.platform);    
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
     * http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
     */
    Graph.hash = function(str) {
        var hval = 0x811c9dc5, i, l;
        
        for (i = 0, l = str.length; i < l; i++) {
            hval ^= str.charCodeAt(i);
            hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
        }

        return ('0000000' + (hval >>> 0).toString(16)).substr(-8);

        // var hash = 0, chr, len, i;
        
        // if ( ! str.length) {
        //     return hash;
        // }

        // for (i = 0, len = str.length; i < len; i++) {
        //     chr   = str.charCodeAt(i);
        //     hash  = ((hash << 5) - hash) + chr;
        //     hash |= 0;
        // }

        // return hash;
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
     * Diagram
     */
    Graph.diagram = function(name, options) {
        var clazz, diagram;
        clazz = Graph.diagram.type[_.capitalize(name)];
        return Graph.factory(clazz, [options]);
    };

    Graph.diagram.type = {};
    Graph.diagram.util = {};
    Graph.diagram.pallet = {};

    /**
     * Pallet
     */
    Graph.pallet = function(type, options) {
        var clazz;
        clazz = Graph.diagram.pallet[_.capitalize(type)];
        return Graph.factory(clazz, [options]);
    };
    
    /**
     * Topic
     */
    Graph.topic = {
        subscribers: {

        },
        publish: function(topic, message, scope) {
            var subs = Graph.topic.subscribers,
                lsnr = subs[topic] || [];

            _.forEach(lsnr, function(handler){
                if (handler) {
                    handler.call(null, message, scope);  
                }
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

    Graph.message = function(message, type) {
        type = _.defaultTo(type, 'info');
        
        Graph.topic.publish('graph:message', {
            type: type,
            message: message
        });
    };

    ///////////////////////////// LOAD CONFIG /////////////////////////////
    
    if (GLOBAL.graphConfig) {
        Graph.setup(GLOBAL.graphConfig);
    }

    ///////////////////////////// I18N /////////////////////////////
    
    Graph._ = function(message) {
        return message;
    };

    /////////////////////////// CORE NAMESPACES ////////////////////////////
    
    Graph.ns('Graph.lang');
    Graph.ns('Graph.collection');
    Graph.ns('Graph.registry');
    Graph.ns('Graph.data');
    Graph.ns('Graph.popup');
    Graph.ns('Graph.shape.activity');
    Graph.ns('Graph.shape.common');
    
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

(function(){

    var Class = Graph.lang.Class = function() {};

    Class.options = {};

    Class.prototype.constructor = Class;
    Class.prototype.toString = function() { return 'Graph.lang.Class'; };

    Class.extend = function(config) {
        var _super, _proto, _constructor, _definition, _class, _classopt;

        _super = this.prototype;
        _proto = Object.create(_super);

        _classopt = {};

        _.forOwn(config, function(v, k){

            if (_.isFunction(v)) {
                _proto[k] = v;
                if (k == 'constructor') {
                    _constructor = v;
                }
            } else {
                _classopt[k] = v;
            }
        });

        if ( ! _constructor) {
            _constructor = _super.constructor;
        }

        _class = function() {

            if ( ! this.__initialized__) {
                this.__initialized__ = true;

                this.listeners = {};

                var _superclass = this.superclass;
                var _superopt, key, val;

                for (key in _classopt) {
                    this[key] = _.cloneDeep(_classopt[key]);
                }

                while(_superclass) {
                    _superopt = _superclass.options;

                    if (_superopt) {
                        for (key in _superopt) {
                            if (this[key] !== undefined) {
                                this[key] = _.merge(_.cloneDeep(_superopt[key]), this[key]);
                            } else {
                                this[key] = _.cloneDeep(_superopt[key]);
                            }
                        }
                    }

                    _superclass = _superclass.prototype.superclass;
                }
            }

            if (_constructor) {
                _constructor.apply(this, arguments);
            }
        }

        _definition = _constructor.toString().match(/(function)?([^\{=]+)/);
        _definition = 'function' + _definition[2];

        _class.toString = function() {
            return _definition;
        };

        _class.extend = _super.constructor.extend;
        _class.options = _classopt;

        _class.prototype = _proto;
        _class.prototype.constructor = _class;
        _class.prototype.superclass = _super.constructor;

        _class.prototype.on = function(eventType, handler, once, priority) {
            if (_.isPlainObject(eventType)) {
                var key, val;
                for (key in eventType) {
                    val = eventType[key];
                    if (_.isFunction(val)) {
                        bind(this, key, val);
                    } else {
                        bind(this, key, val['handler'], val['once'], val['priority']);
                    }
                }
            } else {
                bind(this, eventType, handler, once, priority);
            }

            return this;
        };

        _class.prototype.one = function(eventType, handler) {
            if (_.isPlainObject(eventType)) {
                var key, val;
                for (key in eventType) {
                    val = eventType[key];
                    if (_.isFunction(val)) {
                        bind(this, key, val, true);
                    } else {
                        bind(this, key, val['handler'], true, val['priority']);
                    }
                }
            } else {
                bind(this, eventType, handler, true);
            }

            return this;
        };

        _class.prototype.off = function(eventType, handler) {
            var batch = eventType.split(/\s/);

            if (batch.length > 1) {
                for (var i = 0, ii = batch.length; i < ii; i++) {
                    unbind(this, batch[i]);
                }
            } else {
                unbind(this, eventType, handler);
            }

            return this;
        };

        _class.prototype.fire = function(eventType, data) {
            var args = [], onces = [];
            var eventObject, eventNames, eventRoot, listeners,
                eventRegex, cachedRegex, ii, i;

            data = data || {};

            if (_.isString(eventType)) {
                eventObject = new Graph.lang.Event(eventType, data);
            } else {
                eventObject = eventType;
                eventObject.originalData = data;
                eventType = eventObject.originalType || eventObject.type;
            }

            eventObject.publisher = this;
            args.push(eventObject);

            eventNames = eventType.split(/\./);
            eventRoot = eventNames.shift();
            listeners = (this.listeners[eventRoot] || []).slice();

            var cachedRegex = Graph.lookup('Regex.event', eventType);

            if (cachedRegex.rgex) {
                eventRegex = cachedRegex.rgex;
            } else {
                eventRegex = new RegExp(_.escapeRegExp(eventType), 'i');
                cachedRegex.rgex = eventRegex;
            }

            if (listeners.length) {
                for (i = 0, ii = listeners.length; i < ii; i++) {
                    if (eventRoot == listeners[i].eventType) {
                        if (listeners[i].once) {
                            onces.push(listeners[i]);
                        }
                        listeners[i].handler.apply(listeners[i].handler, args);
                    } else if (eventRegex.test(listeners[i].eventType)) {
                        if (listeners[i].once) {
                            onces.push(listeners[i]);
                        }
                        listeners[i].handler.apply(listeners[i].handler, args);
                    }
                }
            }

            if (onces.length) {
                for (i = 0, ii = onces.length; i < ii; i++) {
                    this.off(onces[i].eventType, onces[i].original);
                }
            }

        };

        return _class;
    };

    /////////

    function bind(context, eventType, handler, once, priority) {
        var eventNames = eventType.split(/\./),
            eventRoot = eventNames.shift();

        once = _.defaultTo(once, false);
        priority = _.defaultTo(priority, 1500);

        context.listeners[eventRoot] = context.listeners[eventRoot] || [];

        context.listeners[eventRoot].push({
            eventType: eventType,
            priority: priority,
            original: handler,
            handler: _.bind(handler, context),
            once: once
        });
    }

    function unbind(context, eventType, handler) {
        var eventNames = eventType.split(/\./),
            eventRoot = eventNames.shift(),
            listeners = context.listeners[eventRoot] || [];

        var eventRegex, cachedRegex;

        cachedRegex = Graph.lookup('Regex.event', eventType);

        if (cachedRegex.rgex) {
            eventRegex = cachedRegex.rgex;
        } else {
            eventRegex = new RegExp(_.escapeRegExp(eventType), 'i');
            cachedRegex.rgex = eventRegex;
        }

        for (var i = listeners.length - 1; i >= 0; i--) {
            if (eventRegex.test(listeners[i].eventType)) {
                if (handler) {
                    if (handler === listeners[i].original) {
                        listeners.splice(i, 1);
                    }
                } else {
                    listeners.splice(i, 1);
                }
            }
        }

        if ( ! listeners.length) {
            delete context.listeners[eventRoot];
        }
    }

}());


(function(){

    var Err = Graph.lang.Error = function(message) {
        this.message = message;

        var err = new Error();
        this.stack = err.stack;

        err = null;
    };

    Err.options = {
        message: ''
    };
    Err.extend = Graph.lang.Class.extend;

    Err.prototype = Object.create(Error.prototype);
    Err.prototype.constructor = Err;
    Err.prototype.name = "Graph.lang.Error";
    Err.prototype.message = "";

    ///////// SHORTCUT /////////

    Graph.error = function(message) {
        return new Graph.lang.Error(message);
    };

    Graph.isError = function(obj) {
        return obj instanceof Graph.lang.Error;
    };

}());


(function(_, $){

    var Evt = Graph.lang.Event = function(type, data){
        this.type = type;
        this.originalData = null;
        this.cancelBubble = false;
        this.defaultPrevented = false;
        this.propagationStopped = false;
        this.immediatePropagationStopped = false;

        this.init(data);
    };

    Evt.options = {
        type: null,
        originalData: null,
        cancelBubble: false,
        defaultPrevented: false,
        propagationStopped: false,
        immediatePropagationStopped: false
    };

    Evt.extend = Graph.lang.Class.extend;

    Evt.prototype.constructor = Evt;

    Evt.prototype.init = function(data) {
        if (data) {
            this.originalData = data;
            _.assign(this, data || {});
        }
    };

    Evt.prototype.stopPropagation = function() {
        this.cancelBubble = this.propagationStopped = true;
    };

    Evt.prototype.stopImmediatePropagation = function() {
        this.immediatePropagationStopped = this.propagationStopped = true;
    };

    Evt.prototype.preventDefault = function() {
        this.defaultPrevented = true;
    };

    Evt.prototype.toString = function() {
        return 'Graph.lang.Event';
    };

    ///////// SHORTCUT /////////

    Graph.event = function(type, data) {
        return new Graph.lang.Event(type, data);
    };

    Graph.isEvent = function(obj) {
        return obj instanceof Graph.lang.Event;
    };

    ///////// STATIC /////////

    Graph.event.ESC = 27;
    Graph.event.ENTER = 13;
    Graph.event.DELETE = 46;
    Graph.event.SHIFT = 16;
    Graph.event.CTRL = 17;
    Graph.event.CMD = 91;

    Graph.event.C = 67;
    Graph.event.V = 86;

    Graph.event.fix = function(event) {
        return $.event.fix(event);
    };

    Graph.event.target = function(event) {
        var e = event.originalEvent || event;
        var target = e.target;

        if (Graph.config.dom == 'shadow') {
            var path = e.path || (e.composedPath && e.composedPath());
            if (path) {
                target = path[0];
            }
        }

        return target;
    }

    Graph.event.original = function(event) {
        return event.originalEvent || event;
    };

    Graph.event.position = function(event) {
        return {
            x: event.clientX,
            y: event.clientY
        };
    };

    Graph.event.relative = function(event, vector) {
        var position = Graph.event.position(event),
            matrix = vector.matrix().clone().invert(),
            relative = {
                x: matrix.x(position.x, position.y),
                y: matrix.y(position.x, position.y)
            };

        matrix = null;

        return relative;
    };

    Graph.event.isNavigation = function(e) {
        var navs = [
            Graph.event.ENTER,
            Graph.event.DELETE,
            Graph.event.SHIFT,
            Graph.event.CTRL,
            Graph.event.CMD,
            Graph.event.ESC
        ];

        var code = e.keyCode;
        return _.indexOf(navs, code) !== -1;
    };

    Graph.event.isPrimaryButton = function(event) {
        var original = Graph.event.original(event);
        return ! original.button;
    };

    Graph.event.hasPrimaryModifier = function(event) {
        if ( ! Graph.event.isPrimaryButton(event)) {
            return false;
        }
        var original = Graph.event.original(event);
        return Graph.isMac() ? original.metaKey : original.ctrlKey;
    };

    Graph.event.hasSecondaryModifier = function(event) {
        var original = Graph.event.original(event);
        return Graph.event.isPrimaryButton(event) && original.shiftKey;
    };

}(_, jQuery));


(function(){

    var Point = Graph.lang.Point = function(x, y) {
        var tmp;

        this.props = {
            x: 0,
            y: 0
        };

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
    };

    Point.options = {
        props: {
            x: 0,
            y: 0
        }
    };

    Point.extend = Graph.lang.Class.extend;

    Point.prototype = Object.create(Graph.lang.Class.prototype);
    Point.prototype.constructor = Point;
    Point.prototype.superclass = Graph.lang.Class;

    Point.prototype.x = function(x) {
        if (_.isUndefined(x)) {
            return this.props.x;
        }
        this.props.x = x;
        return this;
    };

    Point.prototype.y = function(y) {
        if (_.isUndefined(y)) {
            return this.props.y;
        }
        this.props.y = y;
        return this;
    };

    Point.prototype.distance = function(b) {
        var dx = this.props.x - b.props.x,
            dy = this.props.y - b.props.y;

        return Math.sqrt(Math.pow(dy, 2) + Math.pow(dx, 2));
    };

    /**
     * Manhattan (taxi-cab) distance
     */
    Point.prototype.manhattan = function(p) {
        return Math.abs(p.props.x - this.props.x) + Math.abs(p.props.y - this.props.y);
    };

    Point.prototype.angle = function(b) {
        return Graph.util.angle(a.toJson(), b.toJson());
    };

    Point.prototype.triangle = function(b, c) {
        return this.angle(c) - b.angle(c);
    };

    Point.prototype.theta = function(p) {
        return Graph.util.theta(this.toJson(), p.toJson());
    };

    Point.prototype.difference = function(p) {
        return new Graph.lang.Point(this.props.x - p.props.x, this.props.y - p.props.y);
    };

    Point.prototype.alignment = function(p) {
        return Graph.util.pointAlign(this.toJson(), p.toJson());
    };

    Point.prototype.bbox = function() {
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
    };

    Point.prototype.bearing = function(p) {
        var line = new Graph.lang.Line(this, p),
            bear = line.bearing();
        line = null;
        return bear;
    };

    /**
     * Snap to grid
     */
    Point.prototype.snap = function(x, y) {
        y = _.defaultTo(y, x);

        this.props.x = snap(this.props.x, x);
        this.props.y = snap(this.props.y, y);

        return this;
    };

    Point.prototype.move = function(to, distance) {
        var rad = Graph.util.rad(to.theta(this));
        this.expand(Math.cos(rad) * distance, -Math.sin(rad) * distance);
        return this;
    };

    Point.prototype.expand = function(dx, dy) {
        this.props.x += dx;
        this.props.y += dy;

        return this;
    };

    Point.prototype.round = function(dec) {
        this.props.x = dec ? this.props.x.toFixed(dec) : Math.round(this.props.x);
        this.props.y = dec ? this.props.y.toFixed(dec) : Math.round(this.props.y);
        return this;
    };

    Point.prototype.equals = function(p) {
        return this.props.x == p.props.x && this.props.y == p.props.y;
    };

    Point.prototype.rotate = function(angle, origin) {
        if (origin instanceof Graph.lang.Point) {
            origin = origin.toJson();
        }

        var rad = Math.PI / 180 * angle,
            sin = Math.sin(rad),
            cos = Math.cos(rad),
            x = this.props.x,
            y = this.props.y,
            cx = origin.x,
            cy = origin.y;

        this.props.x = (cos * (x - cx)) + (sin * (y - cy)) + cx;
        this.props.y = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    };

    // Point.prototype.rotate = function(angle, origin) {
    //     var rd = Graph.util.rad(angle),
    //         dx = this.props.x - (origin ? origin.props.x : 0),
    //         dy = this.props.y - (origin ? origin.props.y : 0),
    //         si = Math.sin(rd),
    //         co = Math.cos(rd);

    //     var rx = dx *  co + dy * si,
    //         ry = dx * -si + dy * co;

    //     this.props.x = this.props.x + rx;
    //     this.props.y = this.props.y + ry;

    //     return this;
    // };

    Point.prototype.transform = function(matrix) {
        var x = this.props.x,
            y = this.props.y;

        this.props.x = matrix.x(x, y);
        this.props.y = matrix.y(x, y);

        return this;
    };

    /**
     * Export to polar
     */
    Point.prototype.polar = function() {

    };

    Point.prototype.adhereToBox = function(box) {
        if (box.contains(this)) {
            return this;
        }

        this.props.x = Math.min(Math.max(this.props.x, box.props.x), box.props.x + box.props.width);
        this.props.y = Math.min(Math.max(this.props.y, box.props.y), box.props.y + box.props.height);

        return this;
    };

    Point.prototype.stringify = function(sep) {
        sep = _.defaultTo(sep, ',');
        return this.props.x + sep + this.props.y;
    };

    Point.prototype.toString = function() {
        return 'Graph.lang.Point';
    };

    Point.prototype.toValue = function() {
        return this.stringify();
    };

    Point.prototype.toJson = function() {
        return {
            x: this.props.x,
            y: this.props.y
        };
    };

    Point.prototype.clone = function(){
        return new Point(this.props.x, this.props.y);
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

    var Line = Graph.lang.Line = function(start, end) {
        var args = _.toArray(arguments);

        this.props = {
            start: {
                x: 0,
                y: 0
            },
            end: {
                x: 0,
                y: 0
            }
        };

        if (args.length === 4) {
            _.assign(this.props.start, {
                x: args[0],
                y: args[1]
            })

            _.assign(this.props.end, {
                x: args[2],
                y: args[3]
            });
        } else {
            this.props.start = args[0].toJson();
            this.props.end = args[1].toJson();
        }
    };

    Line.options = {
        props: {
            start: {
                x: 0,
                y: 0
            },
            end: {
                x: 0,
                y: 0
            }
        }
    };

    Line.extend = Graph.lang.Class.extend;

    Line.prototype.constructor = Line;

    Line.prototype.start = function() {
        return Graph.point(this.props.start.x, this.props.start.y);
    };

    Line.prototype.end = function() {
        return Graph.point(this.props.end.x, this.props.end.y);
    };

    Line.prototype.bearing = function() {
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
    };

    Line.prototype.intersect = function(line) {
        return this.intersection(line) !== null;
    };

    Line.prototype.intersection = function(line, dots) {
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
    };

    Line.prototype.toString = function() {
        return 'Graph.lang.Line';
    };

    ///////// SHORTCUT /////////

    Graph.line = function(command) {
        var args = _.toArray(arguments);
        return Graph.factory(Graph.lang.Line, args);
    };

    Graph.isLine = function(obj) {
        return obj instanceof Graph.lang.Line;
    };

}());


(function(){

    var Curve = Graph.lang.Curve = function(command) {
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
    };

    Curve.options = {
        segments: []
    };

    Curve.extend = Graph.lang.Class.extend;

    Curve.prototype.constructor = Curve;

    Curve.prototype.segments = [];

    Curve.prototype.x = function() {
        return this.segments[1][5];
    };

    Curve.prototype.y = function() {
        return this.segments[1][6];
    };

    Curve.prototype.length = function(t) {
        var params = this.segments[0].slice(1).concat(this.segments[1].slice(1)).concat([t]);
        return Graph.util.curveLength.apply(null, params);
    };

    Curve.prototype.t = function(length) {
        var params = this.segments[0].slice(1).concat(this.segments[1].slice(1)).concat([length]);
        return Graph.util.curveInterval.apply(null, params);
    };

    Curve.prototype.pointAt = function(t, json) {
        var params = this.segments[0].slice(1).concat(this.segments[1].slice(1)).concat([t]),
            result = Graph.util.pointAtInterval.apply(null, params);

        if (json) {
            return result;
        } else {
            var point = Graph.point(result.x, result.y);
            result.x = result.y = undefined;
            return _.extend(point, result);
        }
    };

    Curve.prototype.intersection = function(curve, json) {
        var a = this.segments[0].slice(1).concat(this.segments[1].slice(1)),
            b = curve.segments[0].slice(1).concat(curve.segments[1].slice(1)),
            i = Graph.util.curveIntersection(a, b);

        if (json) {
            return i;
        } else {
            var points = _.map(i, function(p){ return Graph.point(p.x, p.y); });
            return points;
        }
    };

    Curve.prototype.intersectnum = function(curve) {
        var a = this.segments[0].slice(1).concat(this.segments[1].slice(1)),
            b = curve.segments[0].slice(1).concat(curve.segments[1].slice(1));

        return Graph.util.curveIntersection(a, b, true);
    };

    Curve.prototype.bbox = function() {
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
    };

    Curve.prototype.clone = function() {
        var segments = _.cloneDeep(this.segments);
        return new Graph.lang.Curve(segments);
    };

    Curve.prototype.toValue = function() {
        return Graph.util.segments2path(this.segments);
    };

    Curve.prototype.toString = function() {
        return 'Graph.lang.Curve';
    };

    ///////// SHORTCUT /////////

    Graph.curve = function(command) {
        return new Graph.lang.Curve(command);
    };

    Graph.isCurve = function(obj) {
        return obj instanceof Graph.lang.Curve;
    };

}());


(function(){

    var BBox = Graph.lang.BBox = function(bounds) {
        this.props = _.extend({
            x: 0,
            y: 0,
            x2: 0,
            y2: 0,
            width: 0,
            height: 0
        }, bounds || {});
    };

    BBox.options = {
        props: {
            x: 0,
            y: 0,
            x2: 0,
            y2: 0,
            width: 0,
            height: 0
        }
    };

    BBox.extend = Graph.lang.Class.extend;

    BBox.prototype = Object.create(Graph.lang.Class.prototype);
    BBox.prototype.constructor = BBox;
    BBox.prototype.superclass = Graph.lang.Class;

    BBox.prototype.shape = function() {
        var prop = this.props;

        return new Graph.lang.Path([
            ['M', prop.x, prop.y],
            ['l', prop.width, 0],
            ['l', 0, prop.height],
            ['l', -prop.width, 0],
            ['z']
        ]);
    };

    BBox.prototype.origin = function(simple) {
        simple = _.defaultTo(simple, false);

        var x = this.props.x,
            y = this.props.y;

        return simple ? {x: x, y: y} : Graph.point(x, y);
    };

    BBox.prototype.center = function(simple) {
        simple = _.defaultTo(simple, false);

        var x = this.props.x + this.props.width  / 2,
            y = this.props.y + this.props.height / 2;

        return simple ? {x: x, y: y} : Graph.point(x, y);
    };

    BBox.prototype.corner = function(simple) {
        simple = _.defaultTo(simple, false);

        var x = this.props.x + this.props.width,
            y = this.props.y + this.props.height;

        return simple ? {x: x, y: y} : Graph.point(x, y);
    };

    BBox.prototype.width = function() {
        return this.props.width;
    };

    BBox.prototype.height = function() {
        return this.props.height;
    };

    BBox.prototype.clone = function() {
        var props = _.extend({}, this.props);
        return new BBox(props);
    };

    BBox.prototype.contains = function(obj) {
        var contain = true,
            bbox = this.props,
            dots = [];

        var vbox, papa, mat, dot;

        if (Graph.isPoint(obj)) {
            dots = [
                [obj.props.x, obj.props.y]
            ];
        } else if (Graph.isVector(obj)) {
            dots = obj.vertices(true);
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
    };

    BBox.prototype.expand = function(dx, dy, dw, dh) {
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
    };

    BBox.prototype.translate = function(dx, dy) {
        this.props.x  += dx;
        this.props.y  += dy;
        this.props.x2 += dx;
        this.props.y2 += dy;

        return this;
    };

    BBox.prototype.transform = function(matrix) {
        var x = this.props.x,
            y = this.props.y;

        this.props.x = matrix.x(x, y);
        this.props.y = matrix.y(x, y);

        x = this.props.x2;
        y = this.props.y2;

        this.props.x2 = matrix.x(x, y);
        this.props.y2 = matrix.y(x, y);

        this.props.width  = this.props.x2 - this.props.x;
        this.props.height = this.props.y2 - this.props.y;

        return this;
    };

    BBox.prototype.intersect = function(tbox) {
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
    };

    BBox.prototype.sideNearestPoint = function(point) {
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
    };

    BBox.prototype.pointNearestPoint = function(point) {
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
    };

    BBox.prototype.toJson = function() {
        return _.clone(this.props);
    };

    BBox.prototype.toString = function() {
        return 'Graph.lang.BBox';
    };

    BBox.prototype.toValue = function() {
        var p = this.props;
        return _.format(
            '{0},{1} {2},{3} {4},{5} {6},{7}',
            p.x, p.y,
            p.x + p.width, p.y,
            p.x + p.width, p.y + p.height,
            p.x, p.y + p.height
        );
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

    var Path = Graph.lang.Path = function(command) {
        var segments = [];

        if (Graph.isPath(command)) {
            segments = _.cloneDeep(command.segments);
        } else if (_.isArray(command)) {
            segments = _.cloneDeep(command);
        } else {
            segments = _.cloneDeep(Graph.util.path2segments(command));
        }

        this.segments = segments;
    };

    Path.options = {
        segments: []
    };

    Path.extend = Graph.lang.Class.extend;

    Path.prototype.constructor = Path;

    Path.prototype.command = function() {
        return Graph.util.segments2path(this.segments);
    };

    Path.prototype.absolute = function() {
        if ( ! this.segments.length) {
            return new Path([['M', 0, 0]]);
        }

        var cached = Graph.lookup(this.toString(), 'absolute', this.toValue()),
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
    };

    Path.prototype.start = function() {
        return this.pointAt(0);
    };

    Path.prototype.end = function() {
        return this.pointAt(this.length());
    };

    Path.prototype.head = function() {

    };

    Path.prototype.tail = function() {

    };

    Path.prototype.relative = function() {
        var cached = Graph.lookup(this.toString(), 'relative', this.toValue()),
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
    };

    Path.prototype.curve = function() {
        var cached = Graph.lookup(this.toString(), 'curve', this.toValue());

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
    };

    Path.prototype.curve2curve = function(to){
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

    };

    Path.prototype.bbox = function(){
        if ( ! this.segments.length) {
            return Graph.bbox({x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0});
        }

        var cached = Graph.lookup(this.toString(), 'bbox', this.toValue());

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
    };

    Path.prototype.transform = function(matrix) {
        if ( ! matrix) {
            return;
        }

        var cached = Graph.lookup(this.toString(), 'transform', this.toValue(), matrix.toValue());

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
    };

    Path.prototype.lengthAt = function(point) {

    };

    Path.prototype.pointAt = function(length, dots) {
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
    };

    Path.prototype.segmentAt = function(length) {
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
    };

    Path.prototype.length = function() {
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
    };

    Path.prototype.slice = function(from, to) {
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
    };

    Path.prototype.vertices = function() {
        var cached = Graph.lookup(this.toString(), 'vertices', this.toValue());

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
    };

    Path.prototype.addVertext = function(vertext) {
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
    };

    Path.prototype.intersect = function(path) {
        return intersection(this, path, true) > 0;
    };

    Path.prototype.intersection = function(path, json) {
        var result = intersection(this, path);

        return json ? result : _.map(result, function(d){
            var p = Graph.point(d.x, d.y);

            p.segment1 = d.segment1;
            p.segment2 = d.segment2;
            p.bezier1  = d.bezier1;
            p.bezier2  = d.bezier2;

            return p;
        });
    };

    Path.prototype.intersectnum = function(path) {
        return intersection(this, path, true);
    };

    Path.prototype.alpha = function(point) {

    };

    Path.prototype.contains = function(point) {
        var b, p, d, x, y;

        x = point.props.x;
        y = point.props.y;
        b = this.bbox();
        d = b.toJson();

        p = new Path([['M', x, y], ['H', d.x2 + 10]]);

        return b.contains(point) && this.intersectnum(p) % 2 == 1;
    };

    /**
     * Get point on path that closest to target point
     */
    Path.prototype.nearest = function(point) {
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
    };

    Path.prototype.isSimple = function() {
        var simple = true;

        _.forEach(this.segments, function(s){
            if ( ! /[MLZ]/i.test(s[0])) {
                simple = false;
                return false;
            }
        });

        return simple;
    };

    Path.prototype.moveTo = function(x, y) {
        var segments = this.segments;

        if (segments.length) {
            segments[0][0] = 'M';
            segments[0][1] = x;
            segments[0][2] = y;
        } else {
            segments = [['M', x, y]];
        }

        return this;
    };

    Path.prototype.lineTo = function(x, y, append) {
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
    };

    Path.prototype.toString = function() {
        return 'Graph.lang.Path';
    };

    Path.prototype.toValue = function() {
        return Graph.util.segments2path(this.segments);
    };

    Path.prototype.toArray = function() {
        return this.segments;
    };

    Path.prototype.clone = function() {
        var segments = [];

        _.forEach(this.segments, function(seg){
            segments.push(seg.slice());
        });

        return new Path(segments);
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

    var Matrix = Graph.lang.Matrix = function(a, b, c, d, e, f) {
        this.props = {};

        this.props.a = _.defaultTo(a, 1);
        this.props.b = _.defaultTo(b, 0);
        this.props.c = _.defaultTo(c, 0);
        this.props.d = _.defaultTo(d, 1);
        this.props.e = _.defaultTo(e, 0);
        this.props.f = _.defaultTo(f, 0);
    };

    Matrix.options = {
        props: {
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: 0,
            f: 0
        }
    };

    Matrix.extend = Graph.lang.Class.extend;

    Matrix.prototype.constructor = Matrix;

    Matrix.prototype.x = function(x, y) {
        return x * this.props.a + y * this.props.c + this.props.e;
    };

    Matrix.prototype.y = function(x, y) {
        return x * this.props.b + y * this.props.d + this.props.f;
    };

    Matrix.prototype.get = function(chr) {
        return +this.props[chr].toFixed(4);
    };

    Matrix.prototype.multiply = function(a, b, c, d, e, f) {
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
    };

    Matrix.prototype.invert = function(clone) {
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
    };

    Matrix.prototype.translate = function(x, y) {
        x = _.defaultTo(x, 0);
        y = _.defaultTo(y, 0);
        this.multiply(1, 0, 0, 1, x, y);

        return this;
    };

    // http://stackoverflow.com/questions/16359246/how-to-extract-position-rotation-and-scale-from-matrix-svg
    Matrix.prototype.rotate = function(angle, cx, cy) {
        var args = arguments;
        if ( ! args.length) {
            var px = this.delta(0, 1),
                py = this.delta(1, 0);

            var deg, rad;

            deg = 180 / Math.PI * Math.atan2(px.y, px.x) - 90;
            rad = Graph.util.rad(deg);

            return {
                deg: deg,
                rad: rad,
                sin: Math.sin(rad),
                cos: Math.cos(rad)
            };
        }

        var radian;

        radian = Graph.util.rad(angle);

        cx = _.defaultTo(cx, 0);
        cy = _.defaultTo(cy, 0);
        
        var cos = +Math.cos(radian).toFixed(9),
            sin = +Math.sin(radian).toFixed(9);
            
        this.multiply(cos, sin, -sin, cos, cx, cy);
        this.multiply(1, 0, 0, 1, -cx, -cy);
        
        return this;
    };

    Matrix.prototype.scale = function(sx, sy, cx, cy) {
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
    };

    Matrix.prototype.determinant = function() {
        return this.props.a * this.props.d - this.props.b * this.props.c;
    };

    Matrix.prototype.delta = function(x, y) {
        return {
            x: x * this.props.a + y * this.props.c + 0,
            y: x * this.props.b + y * this.props.d + 0
        };
    };

    Matrix.prototype.data = function() {
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
            // rotate: skewX,
            rotate: this.rotate().deg,
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
    };

    Matrix.prototype.toFilter = function() {
        return "progid:DXImageTransform.Microsoft.Matrix(" +
           "M11=" + this.get('a') + ", " +
           "M12=" + this.get('c') + ", " +
           "M21=" + this.get('b') + ", " +
           "M22=" + this.get('d') + ", " +
           "Dx="  + this.get('e') + ", " +
           "Dy="  + this.get('f') + ", " +
           "sizingmethod='auto expand'"  +
        ")";
    };

    Matrix.prototype.toArray = function() {
        return [
            [this.get('a'), this.get('c'), this.get('e')],
            [this.get('b'), this.get('d'), this.get('f')],
            [0, 0, 1]
        ];
    };

    Matrix.prototype.toValue = function() {
        return _.format(
            'matrix({0},{1},{2},{3},{4},{5})',
            this.get('a'),
            this.get('b'),
            this.get('c'),
            this.get('d'),
            this.get('e'),
            this.get('f')
        );
    };

    Matrix.prototype.toString = function() {
        return 'Graph.lang.Matrix';
    };

    Matrix.prototype.clone = function() {
        return new Matrix(
            this.props.a,
            this.props.b,
            this.props.c,
            this.props.d,
            this.props.e,
            this.props.f
        );
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

    var Collection = Graph.collection.Point = function(points) {
        this.items = points || [];
    };

    Collection.prototype.constructor = Collection;
    Collection.prototype.items = [];

    Collection.prototype.get = function(index) {
        return this.items[index];
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

    var Collection = Graph.collection.Vector = function(vectors) {
        this.items = _.map(vectors || [], function(v){
            return v.guid();
        });
        vectors = null;
    };

    Collection.prototype.constructor = Collection;

    Collection.prototype.has = function(vector) {
        var id = vector.guid();
        return _.indexOf(this.items, id) > -1;
    };
    
    Collection.prototype.not = function(vector) {
        var guid = vector.guid();

        var items = _.filter(this.items, function(o) {
            return o != guid;
        });

        return new Collection(items);
    };

    Collection.prototype.size = function() {
        return this.items.length;
    };
    
    Collection.prototype.index = function(vector) {
        var id = vector.guid();
        return _.indexOf(this.items, id);
    };
    
    Collection.prototype.push = function(vector) {
        var id = vector.guid();
        this.items.push(id);
        return this.items.length;
    };

    Collection.prototype.pop = function() {
        var id = this.items.pop();
        return Graph.registry.vector.get(id);
    };

    Collection.prototype.shift = function() {
        var id = this.items.shift();
        return Graph.registry.vector.get(id);
    };

    Collection.prototype.unshift = function(vector) {
        var id = vector.guid();
        this.items.unshift(id);
    };

    Collection.prototype.insert = function(vector, offset) {
        if (offset === -1) {
            offset = 0;
        }
        this.items.splice(offset, 0, vector.guid());
    };

    Collection.prototype.pull = function(vector) {
        var id = vector.guid();
        _.pull(this.items, id);
    };

    Collection.prototype.clear = function() {
        this.items = [];
    };

    Collection.prototype.reverse = function() {
        this.items.reverse();
        return this;
    };

    Collection.prototype.each = function(iteratee) {
        _.forEach(this.items, function(id){
            var vector = Graph.registry.vector.get(id);
            iteratee.call(vector, vector);
        });
    };
    
    Collection.prototype.bbox = function() {
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
    };

    Collection.prototype.toArray = function() {
        return _.map(this.items, function(id){
            return Graph.registry.vector.get(id);
        });
    };

    Collection.prototype.toString = function() {
        return 'Graph.collection.Vector';
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

(function(){

    var Collection = Graph.collection.Shape = function(shapes) {
        this.items = _.map(shapes, function(s){
            return s.guid();
        });
        shapes = null;
    };

    Collection.prototype.constructor = Collection;

    Collection.prototype.keys = function() {
        return this.items.slice();
    };

    Collection.prototype.size = function() {
        return this.items.length;
    };

    Collection.prototype.index = function(shape) {
        var id = shape.guid();
        return _.indexOf(this.items, id);
    };

    Collection.prototype.has = function(shape) {
        var id = shape.guid();
        return _.indexOf(this.items, id) !== -1;
    };

    Collection.prototype.find = function(identity) {
        var shapes = this.toArray();
        return _.find(shapes, identity);
    };

    Collection.prototype.push = function(shape) {
        var me = this;
        
        if (_.isArray(shape)) {
            _.forEach(shape, function(s){
                var id = s.guid();
                me.items.push(id);
            });
        } else {
            me.items.push(shape.guid());
        }
        
        return me.items.length;
    };

    Collection.prototype.pop = function() {
        var id = this.items.pop();
        return Graph.registry.shape.get(id);
    };

    Collection.prototype.shift = function() {
        var id = this.items.shift();
        return Graph.registry.shape.get(id);
    };

    Collection.prototype.unshift = function(shape) {
        this.items.unshift(shape);
        return shape;
    };

    Collection.prototype.pull = function(shape) {
        var id = shape.guid();
        _.pull(this.items, id);
    };

    Collection.prototype.last = function() {
        return _.last(this.items);
    };

    Collection.prototype.each = function(iteratee) {
        var me = this;
        _.forEach(me.items, function(id, i){
            var shape = Graph.registry.shape.get(id);
            if (shape) {
                iteratee.call(shape, shape, i);
            }
        });
    };

    Collection.prototype.bbox = function() {
        var x = [], y = [], x2 = [], y2 = [];
        var shape, vector, box;

        for (var i = this.items.length - 1; i >= 0; i--) {
            shape = Graph.registry.shape.get(this.items[i]);
            vector = shape.component();
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
    };

    Collection.prototype.toArray = function() {
        return _.map(this.items, function(id){
            return Graph.registry.shape.get(id);
        });
    };

    Collection.prototype.toString = function() {
        return 'Graph.collection.Shape';
    };
    
}());

(function(){

    var Tree = Graph.collection.Tree = function(nodes) {
        var me = this;

        me.nodes = nodes;
        
        me.key = function(node){ return node; };

        me.bisect = _.bisector(function(node){ 
            return me.key(node); 
        }).left;
    };

    Tree.prototype.get = function(index) {
        return this.nodes[index];
    };

    Tree.prototype.size = function() {
        return this.nodes.length;
    };

    Tree.prototype.insert = function(node) {
        var index = this.index(node),
            value = this.key(node);

        if (this.nodes[index] && value == this.key(this.nodes[index])) {
            return;
        }

        this.nodes.splice(index, 0, node);

        return index;
    };

    Tree.prototype.remove = function(node) {
        var index = this.index(node);
        this.nodes.splice(index, 1);
        
        return index;
    };

    Tree.prototype.keygen = function(keygen) {
        this.key = keygen;
        return this;
    };

    Tree.prototype.index = function(node) {
        return this.bisect(this.nodes, this.key(node));
    };

    Tree.prototype.order = function() {
        this.nodes.sort(_.ascendingKey(this.key));
        return this;
    };
    
    Tree.prototype.root = function() {
        return this.nodes[0];
    };
    
    Tree.prototype.cascade = function(node, iteratee) {
        var index = this.index(node),
            nodes = this.nodes,
            count = this.nodes.length;
        
        var start = 0;
        
        for (var n = index; n < count; n++) {
            iteratee(nodes[n], start);
            start++;
        }
    };

    Tree.prototype.bubble = function(node, iteratee) {
        var index = this.index(node),
            nodes = this.nodes;

        var start = 0;

        for (var n = index; n >= 0; n--) {
            iteratee(nodes[n], start);
            start++;
        }
    };

    Tree.prototype.toArray = function() {
        return this.nodes.slice();
    };

}());

(function(){

    var Collection = Graph.collection.Link = function(links) {
        this.items = _.map(links, function(l){
            return l.guid();
        });
        links = null;
    };

    Collection.prototype.constructor = Collection;

    Collection.prototype.keys = function() {
        return this.items.slice();
    };

    Collection.prototype.size = function() {
        return this.items.length;
    };

    Collection.prototype.index = function(link) {
        var id = link.guid();
        return _.indexOf(this.items, id);
    };

    Collection.prototype.has = function(link) {
        var id = link.guid();
        return _.indexOf(this.items, id) !== -1;
    };

    Collection.prototype.find = function(identity) {
        var links = this.toArray();
        return _.find(links, identity);
    };

    Collection.prototype.push = function(link) {
        var me = this;
        
        if (_.isArray(link)) {
            _.forEach(link, function(s){
                var id = s.guid();
                me.items.push(id);
            });
        } else {
            me.items.push(link.guid());
        }
        
        return me.items.length;
    };

    Collection.prototype.pop = function() {
        var id = this.items.pop();
        return Graph.registry.link.get(id);
    };

    Collection.prototype.shift = function() {
        var id = this.items.shift();
        return Graph.registry.link.get(id);
    };

    Collection.prototype.unshift = function(link) {
        this.items.unshift(link);
        return link;
    };

    Collection.prototype.pull = function(link) {
        var id = link.guid();
        _.pull(this.items, id);
    };

    Collection.prototype.last = function() {
        return _.last(this.items);
    };

    Collection.prototype.each = function(iteratee) {
        var me = this;
        _.forEach(me.items, function(id, i){
            var link = Graph.registry.link.get(id);
            if (link) {
                iteratee.call(link, link, i);
            }
        });
    };
    
    Collection.prototype.toArray = function() {
        return _.map(this.items, function(id){
            return Graph.registry.link.get(id);
        });
    };

    Collection.prototype.toString = function() {
        return 'Graph.collection.link';
    };
    
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

        if (context !== undefined) {
            if (Graph.isElement(context)) {
                context = context.node();
            }
        }


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
                element = query ? $(selector, context) : selector;
            }
        }

        context = null;
        return element;
    };  

    Graph.dom.clone = function(node, deep) {
        return node.cloneNode(deep);
    };

    ///////// ELEMENT /////////

    var E = Graph.dom.Element = function(node) {
        this.query = $(node);
    };

    E.prototype.is = function(pseudo) {
        return this.query.is(pseudo);
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
        if (value === undefined) {
            return this.query.attr(name);
        }
        
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
        var node = this.query[0];
        if (Graph.isSVG(node)) {
            var offset = node.getBoundingClientRect();
            return {
                left: offset.left,
                top: offset.top,
                width: offset.width,
                height: offset.height
            };
        } else {
           return this.query.offset(); 
        }
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
            var values = _.chain([])
                .concat(_.split(node.className.baseVal || '', ' '))
                .concat(_.split(classes, ' '))
                .uniq()
                .join(' ')
                .trim()
                .value();
            node.className.baseVal = values;
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
        if (element.query === undefined) {
            this.query.append(element);
        } else {
            this.query.append(element.query);
        }
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

    E.prototype.after = function(element) {
        this.query.after(element.query);
        return this;
    };
    
    E.prototype.last = function() {
        return new Graph.dom.Element(this.query.last());
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

    E.prototype.val = function(value) {
        if (value === undefined) {
            return this.query.val();
        }
        this.query.val(value);
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

    E.prototype.focus = function(select, delay) {
        var query = this.query, timer;

        delay = _.defaultTo(delay, 0);

        if (this.query.attr('contenteditable') !== undefined) {
            timer = _.delay(function(){
                clearTimeout(timer);
                timer = null;

                query[0].focus();

                if (document.createRange && window.getSelection) {
                    var range = document.createRange();
                    range.selectNodeContents(query[0]);
                    var selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                }

            }, delay);
            
        } else {
            timer = _.delay(function(){
                clearTimeout(timer);
                timer = null;

                query.focus();

                if (select) {
                    query.select();
                }
            }, delay);
        }
        
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

    /// STATICS ///
    
    E.guid = 0;
    
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
            'style': null,
            'class': null
        },

        plugins: {
            transformer: null,
            collector: null,
            definer: null,
            animator: null,
            resizer: null,
            rotator: null,
            reactor: null,
            dragger: null,
            dropper: null,
            network: null,
            history: null,
            panzoom: null,
            toolmgr: null,
            toolpad: null,
            snapper: null,
            editor: null
        },

        graph: {
            matrix: null,
            layout: null
        },

        cached: {
            bbox: null,
            bboxView: null,
            bboxPristine: null,
            bboxOriginal: null,
            matrixCurrent: null,
            matrixView: null,
            shapeOriginal: null,
            shapeView: null,
            position: null,
            offset: null
        },

        elem: null,

        constructor: function(type, attrs) {
            var me = this, guid;

            me.graph.matrix = Graph.matrix();
            me.tree.children = new Graph.collection.Vector();

            guid  = 'graph-elem-' + (++Vector.guid);
            attrs = _.extend({}, me.attrs, attrs || {});

            me.elem = Graph.$(document.createElementNS(Graph.config.xmlns.svg, type));

            if (attrs['class']) {
                attrs['class'] = Graph.styles.VECTOR + ' ' + attrs['class'];
            } else {
                attrs['class'] = Graph.styles.VECTOR;
            }

            // apply initial attributes
            me.attr(attrs);

            me.props.guid = me.props.id = guid; // Graph.uuid();
            me.props.type = type;

            guid = null;

            me.elem.data(Graph.string.ID_VECTOR, me.props.guid);
            me.elem.attr('data-elem', me.props.guid);

            // me.plugins.history = new Graph.plugin.History(me);
            me.plugins.transformer = (new Graph.plugin.Transformer(me))
                .on('aftertranslate', _.bind(me.onTransformerAfterTranslate, me))
                .on('afterrotate', _.bind(me.onTransformerAfterRotate, me))
                .on('afterscale', _.bind(me.onTransformerAfterScale, me));

            if (me.isPaper()) {
                me.plugins.toolmgr = (new Graph.plugin.ToolManager(me))
                    .on('activate', _.bind(me.onActivateTool, me))
                    .on('deactivate', _.bind(me.onDeactivateTool, me));
            }

            Graph.registry.vector.register(this);
        },

        /**
         * Get/set local matrix
         */
        matrix: function(matrix) {
            if (matrix === undefined) {
                return this.graph.matrix;
            }
            this.graph.matrix = matrix;
            return this;
        },

        /**
         * Get relative matrix (relative to viewport)
         */
        matrixView: function() {
            var matrix = this.cached.matrixView;
            if ( ! matrix) {
                var paper = this.paper();
                if (paper) {
                    var viewport = paper.viewport(),
                        viewportGuid = viewport.guid();

                    matrix = Graph.matrix();

                    // TODO: check this....
                    this.bubble(function(curr){
                        if (curr.guid() == viewportGuid) {
                            return false;
                        }
                        matrix.multiply(curr.matrix());
                    });
                } else {
                    matrix = this.matrix();
                }
                this.cached.matrix = matrix;
            }
            return matrix;
        },

        /**
         * Get global matrix
         */
        matrixCurrent: function() {
            var native = this.node().getCTM();
            var matrix;

            if (native) {
                matrix = new Graph.lang.Matrix(
                    native.a,
                    native.b,
                    native.c,
                    native.d,
                    native.e,
                    native.f
                );
                native = null;
            } else {
                matrix = this.matrix().clone();
            }

            return matrix;
        },

        /**
         * Get/set layout
         */
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
        },

        invalidate: function(cache) {
            this.cached[cache] = null;
        },

        /**
         * Get/set state
         */
        state: function(name) {
            if (name === undefined) {
                return this.props.state;
            }
            this.props.state = name;
            return this;
        },

        /**
         * Get/set dirty
         */
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
                var plugins = ['resizer', 'rotator', 'network'];

                _.forEach(plugins, function(name){
                    if (me.plugins[name]) {
                        me.plugins[name].invalidate();
                    }
                });
            }

            return this;
        },

        /**
         * Get/set reactor plugin
         */
        interactable: function(options) {
            if ( ! this.plugins.reactor) {
                this.plugins.reactor = new Graph.plugin.Reactor(this, options);
            }
            return this.plugins.reactor;
        },

        /**
         * Get/set animator plugin
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
         * Get/set resizer plugin
         */
        resizable: function(options) {
            if ( ! this.plugins.resizer) {
                this.plugins.resizer = new Graph.plugin.Resizer(this, options);
                this.plugins.resizer.on({
                    beforeresize: _.bind(this.onResizerBeforeResize, this),
                    afterresize: _.bind(this.onResizerAfterResize, this)
                });
            } else if (options !== undefined) {
                this.plugins.resizer.options(options);
            }

            return this.plugins.resizer;
        },

        rotatable: function(options) {
            if ( ! this.plugins.rotator) {
                this.plugins.rotator = new Graph.plugin.Rotator(this, options);
                this.plugins.rotator.on({
                    afterrotate: _.bind(this.onRotatorAfterRotate, this)
                });
            }
            return this.plugins.rotator;
        },

        /**
         * Get/set dragger plugin
         */
        draggable: function(config) {
            if ( ! this.plugins.dragger) {
                this.plugins.dragger = new Graph.plugin.Dragger(this, config);

                this.plugins.dragger.on({
                    beforedrag: _.bind(this.onDraggerStart, this),
                    drag: _.bind(this.onDraggerMove, this),
                    afterdrag: _.bind(this.onDraggerEnd, this)
                });
            }
            return this.plugins.dragger;
        },

        /**
         * Get/set panzoom plugin
         */
        zoomable: function() {
            if ( ! this.plugins.panzoom) {
                this.plugins.panzoom = new Graph.plugin.Panzoom(this);
                this.plugins.toolmgr.register('panzoom');
            }
            return this.plugins.panzoom;
        },

        /**
         * Get/set dropzone plugin
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
         * Get/set network plugin
         */
        connectable: function(options) {
            if ( ! this.plugins.network) {
                this.plugins.network = new Graph.plugin.Network(this, options);
            } else if (options !== undefined) {
                this.plugins.network.options(options);
            }
            return this.plugins.network;
        },

        /**
         * Get/set traversable
         */
        traversable: function(traversable) {
            if (traversable === undefined) {
                return this.props.traversable;
            }

            this.props.traversable = traversable;
            return this;
        },

        /**
         * Get/set selectable
         */
        selectable: function(selectable) {
            if (selectable === undefined) {
                return this.props.selectable;
            }

            this.props.selectable = selectable;
            return this;
        },

        /**
         * Get/set clickable
         */
        clickable: function(clickable) {
            if (clickable === undefined) {
                return this.attrs['pointer-events'] != 'none' ? true : false;
            }

            this.attr('pointer-events', (clickable ? '' : 'none'));
            return this;
        },

        /**
         * Get/set label editor plugin
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
            var me = this,
                paper = me.paper();

            var enabled, snapper;

            if (_.isBoolean(options)) {
                options = {
                    enabled: options
                };
            } else {
                options = _.extend({
                    enabled: true
                }, options || {});
            }

            me.props.snappable = options.enabled;

            if ( ! paper) {
                paper = Graph.svg.Paper.getDefaultInstance();
                snapper = paper.plugins.snapper;
                
                me.on('render', function(){
                    me.paper().plugins.snapper.setup(me, options);
                });
            } else {
                snapper = paper.plugins.snapper;
            }
            
            // still no exists?
            if ( ! paper) {
                throw Graph.error("Unable to install snapper plugin. Paper doesn't rendered yet!");
            }

            return snapper;
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

        /**
         * Get vector path (shape)
         */
        shape: function() {
            var shape = new Graph.lang.Path([]);
            return shape;
        },

        shapeOriginal: function() {
            var shape = this.cached.shapeOriginal;

            if ( ! shape) {
                var vmatrix = this.matrixView(),
                    vrotate = vmatrix.rotate().deg;

                shape = this.shape();

                if (vrotate) {
                    var rmatrix = vmatrix.clone(),
                        rcenter = this.bboxPristine().center().toJson();

                    rmatrix.rotate(-vrotate, rcenter.x, rcenter.y);
                    shape = shape.transform(rmatrix);

                } else {
                    shape = shape.transform(vmatrix);
                }

                this.cached.shapeOriginal = shape;
            }

            return shape;
        },

        /**
         * Get shape relative to viewport
         */
        shapeView: function() {
            var shape = this.cached.shapeView;
            if ( ! shape) {
                var matrix = this.matrixView();
                shape = this.shape().transform(matrix);
                this.cached.shapeView = shape;
            }
            return shape;
        },

        /**
         * Get shape relative to parent
         */
        shapeRelative: function() {
            var parent = this.parent(),
                parentMatrix = parent.matrixView().clone().invert(),
                matrix = this.matrixView().clone(),
                shape = this.shape();

            matrix.multiply(parentMatrix);
            shape = shape.transform(matrix);

            matrix = parentMatrix = parent = null;
            return shape;
        },

        vertices: function(absolute) {
            var ma, pa, ps, dt;

            absolute = _.defaultTo(absolute, false);

            ma = absolute ? this.matrixCurrent() : this.matrix(),
            pa = this.shape().transform(ma);
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

        /**
         * Get transformed local bbox
         */
        bbox: function() {
            var bbox = this.cached.bbox;
            if ( ! bbox) {
                var path = this.shape(),
                    matrix = this.matrix();

                path = path.transform(matrix);
                bbox = path.bbox();

                this.cached.bbox = bbox;

                path = matrix = null;
            }
            return bbox;
        },

        /**
         * Get untransormed local bbox
         */
        bboxPristine: function() {
            var bbox = this.cached.bboxPristine;
            if ( ! bbox) {
                var shape = this.shape();
                bbox = shape.bbox();
                this.cached.bboxPristine = bbox;
            }
            return bbox;
        },

        /**
         * Get relative bbox (relative to current viewport)
         */
        bboxView: function() {
            var bbox = this.cached.bboxView;

            if ( ! bbox) {
                var matrix = this.matrixView(),
                    shape = this.shape();

                shape = shape.transform(matrix);
                bbox = shape.bbox();
                
                this.cached.bboxView = bbox;
            }

            return bbox;
        },

        bboxOriginal: function() {
            var bbox = this.cached.bboxOriginal;
            if ( ! bbox) {
                var shape = this.shapeOriginal(),
                    rotate = this.matrixView().rotate();

                bbox = shape.bbox();
                bbox.rotate = rotate;
                
                this.cached.bboxOriginal = bbox;
            }
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

        render: function(container, method, sibling) {
            var me = this,
                guid = me.guid(),
                traversable = me.props.traversable;

            var offset;

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
                    case 'before':

                        if ( ! sibling) {
                            throw Graph.error('vector.render(): Sibling vector is undefined')
                        }

                        sibling.elem.query.before(me.elem.query);

                        if (traversable) {
                            offset = container.children().index(sibling);
                            container.children().insert(me, offset);
                        }

                        break;

                    case 'after':

                        if ( ! sibling) {
                            throw Graph.error('vector.render(): Sibling vector is undefined')
                        }

                        sibling.elem.query.after(me.elem.query);

                        if (traversable) {
                            offset = container.children().index(sibling);
                            container.children().insert(me, offset + 1);
                        }

                        break;

                    case 'append':
                        container.elem.query.append(me.elem.query);

                        if (traversable) {
                            container.children().push(me);
                        }

                        break;

                    case 'prepend':
                        container.elem.query.prepend(me.elem.query);

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

        attach: function(vector, method) {
            if ( ! this.isContainer()) {
                return this;
            }

            method = _.defaultTo(method, 'append');

            if ( ! vector.isRendered()) {
                vector.render(this, method);
            } else {
                var container = this.isPaper() ? this.viewport() : this,
                    traversable = vector.isTraversable();

                if (traversable) {
                    var parent = vector.parent();

                    if (parent) {
                        parent.children().pull(vector);
                        vector.tree.parent = null;
                    }
                }

                container.elem[method](vector.elem);

                if (traversable) {
                    switch(method) {
                        case 'append':
                            container.children().push(vector);
                            break;
                        case 'prepend':
                            container.children().unshift(vector);
                            break;
                    }

                    vector.tree.parent = this.guid();
                }
            }

            return this;
        },

        detach: function() {
            this.elem.detach();
            return this;
        },

        append: function(vector) {
            return this.attach(vector, 'append');
        },

        prepend: function(vector) {
            return this.attach(vector, 'prepend');
        },

        relocate: function(target) {
            if (target.isPaper()) {
                target = target.viewport();
            }

            var resetMatrix = this.matrixView().clone();

            this.graph.matrix = resetMatrix;
            this.attr('transform', resetMatrix.toValue());
            this.dirty(true);

            // append to target
            target.append(this);

            var targetMatrix = target.matrixView().clone(),
                applyMatrix = this.matrix().clone();

            applyMatrix.multiply(targetMatrix.invert());
            
            this.graph.matrix = applyMatrix;
            this.attr('transform', applyMatrix.toValue());

            targetMatrix = applyMatrix = null;

            // flag as dirty
            this.dirty(true);
        },

        ancestors: function() {
            var ancestors = [], guid = this.guid();

            this.bubble(function(curr){
                if (curr.guid() != guid) {
                    ancestors.push(curr);
                }
            });

            return new Graph.collection.Vector(ancestors);
        },

        descendants: function() {
            var descendants = [], guid = this.guid();

            this.cascade(function(curr){
                if (curr.guid() != guid) {
                    descendants.push(curr);
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

            if (this.props.removed) {
                return;
            }
            
            this.props.removed = true;

            this.fire('beforedestroy');
            this.deselect();

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

            // last chance
            this.fire('afterdestroy');
            this.listeners = null;
        },

        empty: function() {
            var guid = this.guid();

            this.cascade(function(curr){
                if (curr.guid() != guid) {
                    Graph.registry.vector.unregister(curr);
                }
            });

            this.children().clear();
            this.elem.empty();

            return this;
        },

        select: function() {
            var paper = this.paper(),
                initial = false;
            
            if (paper) {
                var collector = paper.collector();
                collector.add(this);

                if (collector.index(this) === 0) {
                    initial = true;
                }

            } else {
                initial = true;
            }

            this.addClass('graph-selected');
            this.props.selected = true;

            if (initial) {
                if (this.isResizable()) {
                    this.resizable().resume();
                }

                if (this.isRotatable()) {
                    this.rotatable().resume();
                }
            }

            this.fire('select', {
                initial: initial
            });

            return this;
        },

        deselect: function() {
            var paper = this.paper(),
                initial = false;

            if (paper) {
                var collector = paper.collector();
                initial = collector.index(this) === 0 ? true : false;
                collector.remove(this);
            }

            this.removeClass('graph-selected');
            this.props.selected = false;

            if (this.isResizable()) {
                this.resizable().suspend();
            }

            if (this.isRotatable()) {
                this.rotatable().suspend();
            }

            this.fire('deselect', {
                initial: initial
            });
            
            return this;
        },

        collector: function() {
            return this._collector;
        },

        transform: function(command) {
            return this.plugins.transformer.transform(command);
        },

        translate: function(dx, dy) {
            return this.plugins.transformer.translate(dx, dy);
        },

        scale: function(sx, sy, cx, cy) {
            if (sx === undefined) {
                return this.matrixCurrent().scale();
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

        sendToFront: function() {
            if ( ! this.tree.paper) {
                return this;
            }
            this.paper().elem.append(this.elem);
            return this;
        },

        sendToBack: function() {
            if ( ! this.tree.paper) {
                return this;
            }
            this.paper().elem.prepend(this.elem);
            return this;
        },

        resize: function(sx, sy, cx, cy, dx, dy) {
            return this;
        },

        isContainer: function() {
            return this.isGroup() || this.isPaper();
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

        isRotatable: function() {
            return this.plugins.rotator !== null;
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

        isSelected: function() {
            return this.props.selected === true;
        },

        ///////// TOOLS //////////

        tool: function() {
            return this.plugins.toolmgr;
        },

        toString: function() {
            return 'Graph.svg.Vector';
        },

        ///////// OBSERVERS /////////

        onResizerBeforeResize: function(e) {
            this.fire(e);
        },

        onResizerAfterResize: function(e) {
            this.dirty(true);
            // forward
            this.fire(e);

            // publish
            Graph.topic.publish('vector:afterresize', e);
        },

        onDraggerStart: function(e) {
            e.master = true;
            this.fire(e);
            
            var collector = this.collector();

            if (collector) {
                collector.syncBeforeDrag(this, e);
            }

            // invoke core plugins
            if (this.plugins.resizer) {
                this.plugins.resizer.suspend();
            }

            if (this.plugins.rotator) {
                this.plugins.rotator.suspend();
            }

            if (this.plugins.editor) {
                this.plugins.editor.suspend();
            }
        },

        onDraggerMove: function(e) {
            // forward event
            e.master = true;
            
            var collector = this.collector();

            if (collector) {
                collector.syncDrag(this, e);
            }

            this.fire(e);
        },

        onDraggerEnd: function(e) {
            this.dirty(true);

            e.master = true;
            this.fire(e);

            var collector = this.collector();

            if (collector) {
                collector.syncAfterDrag(this, e);
            }

            Graph.topic.publish('vector:afterdrag', e);
        },

        onDropperEnter: function(e) {
            this.fire(e);
        },

        onDropperLeave: function(e) {
            this.fire(e);
        },

        onTransformerAfterRotate: function(e) {
            this.dirty(true);
            this.props.rotate = e.deg;

            this.fire('afterrotate', {
                deg: e.deg
            });
        },

        onTransformerAfterTranslate: function(e) {
            this.dirty(true);
            this.fire('aftertranslate', {dx: e.dx, dy: e.dy});
        },

        onTransformerAfterScale: function(e) {
            this.dirty(true);
            this.props.scaleX = e.sx;
            this.props.scaleY = e.sy;

            this.fire('afterscale', {sx: e.sx, sy: e.sy});

            if (this.plugins.dragger) {
                var scale = this.matrixCurrent().scale();
                this.plugins.dragger.scale(scale.x, scale.y);
            }
        },

        onRotatorAfterRotate: function(e) {
            this.fire(e);
        },  

        onActivateTool: function(e) {
            var data = e.originalData;
            this.fire('activatetool', data);
        },

        onDeactivateTool: function(e) {
            var data = e.originalData
            this.fire('deactivatetool', data);
        }

    });

    ///////// STATICS /////////

    Vector.guid = 0;

    ///////// LANGUAGE CHECK /////////
    Graph.isVector = function(obj) {
        return obj instanceof Graph.svg.Vector;
    };

    ///////// HELPERS /////////

    function cascade(vector, handler) {
        var child = vector.children().toArray();
        var result;

        result = handler.call(vector, vector);
        result = _.defaultTo(result, true);

        if (result && child.length) {
            _.forEach(child, function(curr){
                cascade(curr, handler);
            });
        }
    }

    function bubble(vector, handler) {
        var parent = vector.parent();
        var result;

        result = handler.call(vector, vector);
        result = _.defaultTo(result, true);

        if (result && parent) {
            bubble(parent, handler);
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

        shape: function() {
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

}());

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
(function(){

    Graph.svg.Polyline = Graph.extend(Graph.svg.Vector, {
        
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

        shape: function() {
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

}());

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
                this.attr('transform', this.graph.matrix.toValue());
            }
        },

        shape: function() {
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

}());

(function(){

    Graph.svg.Text = Graph.extend(Graph.svg.Vector, {
        
        attrs: {
            'text-anchor': 'middle'
        },  

        props: {
            id: '',
            guid: '',
            text: '',
            type: 'text',
            rotate: 0,
            lineHeight: 1.1,
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
                'font-size': Graph.config.font.size
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
                this.dirty(true);
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
            this.rows = [];

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
                    rotate = this.matrix().rotate();

                var textBox, dx, dy, cx, cy;

                this.reset();

                textBox = this.bbox().toJson();   

                dx = targetBox.width / 2;
                dy = targetBox.height / 2;
                cx = textBox.x + textBox.width / 2;
                cy = textBox.y + textBox.height / 2;

                if (rotate.deg) {
                    this.translate(dx, dy).rotate(rotate.deg).commit();
                } else {
                    this.translate(dx, dy).commit();
                }

            }
        },

        shape: function() {
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
    

}());

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

(function(){

    Graph.svg.Line = Graph.extend(Graph.svg.Vector, {
        
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
    
}());

(function(){

    /**
     * Paper - root viewport
     */

    var Paper = Graph.svg.Paper = Graph.extend(Graph.svg.Vector, {

        attrs: {
            'class': Graph.styles.PAPER
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

        diagram: {
            enabled: true,
            manager: null
        },

        constructor: function (width, height, options) {
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
            me.plugins.toolmgr.register('pencil', 'plugin');

            me.plugins.definer = new Graph.plugin.Definer(me);

            me.plugins.snapper = new Graph.plugin.Snapper(me);
            me.plugins.toolpad = new Graph.plugin.Toolpad(me);
            me.plugins.clipper = new Graph.plugin.Clipper(me);

            // diagram feature
            me.diagram.enabled = true;
            me.diagram.manager = new Graph.diagram.Manager(me);

            // subscribe topics
            Graph.topic.subscribe('link:change', _.bind(me.listenLinkChange, me));
            Graph.topic.subscribe('link:afterdestroy', _.bind(me.listenLinkAfterDestroy, me));

            if ( ! Paper.defaultInstance) {
                Paper.defaultInstance = me.guid();
            }
        },

        initLayout: function() {
            // create viewport
            var viewport = (new Graph.svg.Group())
                .addClass(Graph.styles.VIEWPORT)
                .selectable(false);

            viewport.props.viewport = true;

            this.components.viewport = viewport.guid();

            if (this.props.showOrigin) {
                var origin = Graph.$(
                    '<g class="graph-elem graph-origin">' +
                        '<rect class="x" rx="1" ry="1" x="-16" y="-1" height="1" width="30"></rect>' +
                        '<rect class="y" rx="1" ry="1" x="-1" y="-16" height="30" width="1"></rect>' +
                        '<text class="t" x="-40" y="-10">(0, 0)</text>' +
                    '</g>'
                );

                origin.appendTo(viewport.elem);
                origin = null;
            }

            // render viewport
            viewport.tree.paper = viewport.tree.parent = this.guid();
            // viewport.translate(0.5, 0.5).commit();

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
            }

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

        collector: function() {
            return this.plugins.collector;
        },

        snapper: function() {
            return this.plugins.snapper;
        },

        viewport: function() {
            return Graph.registry.vector.get(this.components.viewport);
        },

        diagram: function() {
            return this.diagram.manager;
        },

        // @Override
        scale: function(sx, sy, cx, cy) {
            if (sx === undefined) {
                return this.viewport().matrix().scale();
            }
            return this.plugins.transformer.scale(sx, sy, cx, cy);
        },

        width: function() {
            return this.elem.width();
        },

        height: function() {
            return this.elem.height();
        },
        
        locateLink: function(guid) {
            var link = Graph.registry.link.get(guid);
            if (link) {
                link.select(false);
            }
        },

        locateShape: function(guid) {
            var shape = Graph.registry.shape.get(guid);
            if (shape) {
                shape.select(false);
            }
        },

        toString: function() {
            return 'Graph.svg.Paper';
        },

        ///////// OBSERVERS /////////
        
        ///////// TOPIC LISTENERS /////////

        listenLinkChange: _.debounce(function() {
            this.layout().arrangeLinks();
        }, 300),

        listenLinkAfterDestroy: _.debounce(function(){
            this.layout().arrangeLinks();
        }, 10)

    });

    ///////// STATICS /////////
    Paper.defaultInstance = null;
    
    Paper.getDefaultInstance = function() {
        return Graph.registry.vector.get(Paper.defaultInstance);
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
        line: 'Line'
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

    var Registry = function() {

    };

    Registry.prototype.constructor = Registry;

    Registry.prototype.register = function(vector) {
        var id = vector.guid(), found = this.get(id);
        storage[id] = vector;
    };

    Registry.prototype.unregister = function(vector) {
        var id = vector.guid();
        if (storage[id]) {
            delete storage[id];
        }

        if (context[id]) {
            delete context[id];
        }
    };

    Registry.prototype.setContext = function(id, scope) {
        if (storage[id]) {
            context[id] = scope;
        }
    };

    Registry.prototype.size = function() {
        return _.keys(storage).length;
    };

    Registry.prototype.toArray = function() {
        var keys = _.keys(storage);
        return _.map(keys, function(k){
            return storage[k];
        });
    };

    Registry.prototype.get = function(key) {

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
    };

    Registry.prototype.collect = function(scope) {
        var vectors = [];
        for (var id in context) {
            if (context[id] == scope && storage[id]) {
                vectors.push(storage[id]);
            }
        }
        return vectors;
    };

    Registry.prototype.wipe = function(paper) {
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
    };

    Registry.prototype.toString = function() {
        return 'Graph.registry.Vector';
    };
    
    Graph.registry.vector = new Registry();

}());

(function(){

    var storage = {},
        context = {};

    var Registry = function() {
        
    };

    Registry.prototype.constructor = Registry;

    Registry.prototype.register = function(link) {
        var id = link.guid();
        storage[id] = link;
    };

    Registry.prototype.unregister = function(link) {
        var id = link.guid();

        if (storage[id]) {
            delete storage[id];
        }

        if (context[id]) {
            delete context[id];
        }
    };

    Registry.prototype.setContext = function(id, scope) {
        if (storage[id]) {
            context[id] = scope;
        }
    };

    Registry.prototype.size = function() {
        return _.keys(storage).length;
    };

    Registry.prototype.has = function(key) {
        return storage[key] !== undefined;
    };

    Registry.prototype.get = function(key) {
        if (key === undefined) {
            return this.toArray();
        }
        
        if (key instanceof SVGElement) {
            key = Graph.$(key).data(Graph.string.ID_LINK);
        } else if (key instanceof Graph.dom.Element) {
            key = key.data(Graph.string.ID_LINK);
        } else if (key instanceof Graph.svg.Vector) {
            key = key.elem.data(Graph.string.ID_LINK);
        }

        return storage[key];
    };

    Registry.prototype.collect = function(scope) {
        var links = [];
        for (var id in context) {
            if (context[id] == scope && storage[id]) {
                links.push(storage[id]);
            }
        }
        return links;
    };

    Registry.prototype.toArray = function() {
        var keys = _.keys(storage);
        return _.map(keys, function(k){
            return storage[k];
        });
    };

    Registry.prototype.toString = function() {
        return 'Graph.registry.Link';
    };

    Graph.registry.link = new Registry();

}());

(function(){

    var storage = {},
        context = {};

    var Registry = function() {
        
    };

    Registry.prototype.constructor = Registry;

    Registry.prototype.register = function(shape) {
        var id = shape.guid();
        storage[id] = shape;
    };

    Registry.prototype.setContext = function(id, scope) {
        if (storage[id]) {
            context[id] = scope;
        }
    };

    Registry.prototype.collect = function(scope) {
        var shapes = [];
        for (var id in context) {
            if (context[id] == scope && storage[id]) {
                shapes.push(storage[id]);
            }
        }
        return shapes;
    };

    Registry.prototype.unregister = function(shape) {
        var id = shape.guid();
        
        if (storage[id]) {
            storage[id] = null;
            delete storage[id];
        }

        if (context[id]) {
            delete context[id];
        }
    };

    Registry.prototype.size = function() {
        return _.keys(storage).length;
    };

    Registry.prototype.toArray = function() {
        var keys = _.keys(storage);
        return _.map(keys, function(k){
            return storage[k];
        });
    };

    Registry.prototype.get = function(key) {

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
        } else if (key instanceof Graph.svg.Vector) {
            key = key.elem.data(Graph.string.ID_SHAPE);
        }
        return storage[key];
    };

    Registry.prototype.toString = function() {
        return 'Graph.registry.Shape';
    };
    
    Graph.registry.shape = new Registry();

}());

(function(){

    var storage = {};

    var Registry = function() {
        
    };
    
    Registry.prototype.constructor = Registry;

    Registry.prototype.register = function(pallet) {
        var id = pallet.guid();
        storage[id] = pallet;
    };

    Registry.prototype.unregister = function(pallet) {
        var id = pallet.guid();
        if (storage[id]) {
            delete storage[id];
        }
    };

    Registry.prototype.get = function(key) {
        if (key === undefined) {
            return this.toArray();
        }
        return storage[key];
    };

    Registry.prototype.toArray = function() {
        var keys = _.keys(storage);
        return _.map(keys, function(k){
            return storage[k];
        });
    };

    Registry.prototype.toString = function() {
        return 'Graph.registry.Pallet';
    };

    Graph.registry.pallet = new Registry();

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
                smooth: false,
                smoothness: 6
            }
        },
        
        view: null,

        cached: {
            offset: null,
            position: null
        },

        constructor: function(view, options) {
            _.assign(this.props, options || {});
            this.props.view = view.guid();
        },

        view: function() {
            return Graph.registry.vector.get(this.props.view);
        },

        paper: function() {
            return this.view().paper();
        },

        offset: function() {
            // TODO: please fix...
            return this.position();
        },

        position: function() {
            var position = this.cached.position;
            var view, node;

            if ( ! position) {
                view = this.view();
                node = view.isViewport() ? view.parent().node() : view.node();

                position = node.getBoundingClientRect();
                this.cached.position = position;
            }

            return position;
        },

        center: function() {
            var center = this.cached.center;

            if ( ! center) {
                var position = this.position();

                center = {
                    x: position.width / 2,
                    y: position.height / 2
                };

                this.cached.center = _.extend({}, center);
            }
            
            return center;
        },

        scale: function() {
            return this.view().matrix().scale();
        },

        width: function() {
            var view, bbox, width;

            view = this.view();

            if (view.isViewport()) {
                width = this.paper().width();
            } else {
                bbox  = view.bbox();
                width = bbox.width();
            }

            view = bbox = null;
            return width;
        },

        height: function() {
            var view, bbox, height;

            view = this.view();

            if (view.isViewport()) {
                height = this.paper().height();
            } else {
                bbox   = view.bbox();
                height = bbox.height();
            }

            view = bbox = null;
            return height;
        },
        
        invalidate: function() {
            this.cached.offset = null;
            this.cached.center = null;
            this.cached.position = null;
        },

        grabVector: function(event) {
            var target = Graph.event.target(event);
            return Graph.registry.vector.get(target);
        },

        grabLink: function(event) {
            var target = Graph.event.target(event);
            return Graph.registry.link.get(target);
        },

        pointerLocation: function(pointer) {
            var x = pointer.clientX,
                y = pointer.clientY,
                position = this.position(),
                matrix = this.view().matrix(),
                invert = matrix.clone().invert(),
                scale  = matrix.scale(),
                location = {
                    x: invert.x(x, y),
                    y: invert.y(x, y)
                };

            
            location.x -= position.left / scale.x;
            location.y -= position.top / scale.y;    
            
            matrix = invert = null;

            return location;
        },

        screenLocation: function(coord) {
            var screen = this.view().node().getScreenCTM();
                matrix = Graph.matrix(
                    screen.a,
                    screen.b,
                    screen.c,
                    screen.d,
                    screen.e,
                    screen.f
                );

            var x = matrix.x(coord.x, coord.y),
                y = matrix.y(coord.x, coord.y);

            coord.x = x;
            coord.y = y;
            
            return coord;
        },

        dragSnapping: function() {
            return {
                mode: 'anchor',
                x: 1,
                y: 1
            };
        },

        routerType: function() {
            return this.props.router.type;
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
                    
                    link.reloadConvex(convex[key]);
                    link.reset(true);
                    
                    idx = _.indexOf(inspect, key);
                    
                    if (idx > -1) {
                        inspect.splice(idx, 1);
                    }
                }
                
                if (inspect.length) {
                    _.forEach(inspect, function(key){
                        var link = Graph.registry.link.get(key);
                        
                        link.removeConvex();
                        link.reset(true);
                    });
                }
                
                sweeper.destroy();
                sweeper = null;
            }
        },

        arrangeShapes: function() {
            
        },

        toString: function() {
            return 'Graph.layout.Layout';
        }
        
    });

}());

(function(){

    var Router = Graph.router.Router = Graph.extend({

        props: {
            type: 'directed',
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
            path: null,
            command: null,
            segments: null,
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

        type: function() {
            return this.props.type;
        },

        invalidate: function() {
            this.cached.path = null;
            this.cached.command = null;
            this.cached.segments = null;
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
            var path = this.path(),
                center = path.pointAt(path.length() / 2, true);
            path = null;
            return center;
        },

        execute: function(command) {
            this.command(command);
            this.fire('route', { command: this.command() });
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

        path: function() {
            var path = this.cached.path;
            if ( ! path) {
                path = Graph.path(this.command());
                this.cached.path = path;
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

            return this;
        },

        route: function() {
            return this;
        },

        repair: function(component, port) {

        },

        reset: function() {
            this.invalidate();
            this.values.waypoints = null;
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
            this.reset();
        }

    });

    ///////// STATICS /////////

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
                var segments = this.path().curve().segments;
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
                sourceNetwork = source.connectable(),
                sourceBBox = source.bboxOriginal(),
                sourceBox = sourceBBox.toJson(),
                target = this.target(),
                targetNetwork = target.connectable(),
                targetBBox = target.bboxOriginal(),
                targetBox = targetBBox.toJson(),
                orient = sourceNetwork.orientation(targetNetwork),
                direct = sourceNetwork.direction(targetNetwork),
                tuneup = false,
                routes = [];
            
            if ( ! start) {
                start = sourceBBox.center(true);
            }
            
            if ( ! end) {
                end = targetBBox.center(true);
            }

            var sdot, edot;
            
            if (direct) {
                if (direct == 'h:h') {
                    switch (orient) {
                        case 'top-right':
                        case 'right':
                        case 'bottom-right':
                            sdot = { 
                                x: sourceBox.x, 
                                y: start.y 
                            };
                            
                            edot = { 
                                x: targetBox.x + targetBox.width, 
                                y: end.y 
                            };

                            break;
                        case 'top-left':
                        case 'left':
                        case 'bottom-left':
                            sdot = { 
                                x: sourceBox.x + sourceBox.width, 
                                y: start.y 
                            };

                            edot = { 
                                x: targetBox.x, 
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
                                y: sourceBox.y + sourceBox.height
                            };

                            edot = { 
                                x: end.x, 
                                y: targetBox.y
                            };
                            break;
                        case 'bottom-left':
                        case 'bottom':
                        case 'bottom-right':
                            sdot = { 
                                x: start.x, 
                                y: sourceBox.y
                            };

                            edot = { 
                                x: end.x, 
                                y: targetBox.y + targetBox.height
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
            
            inter = source.shapeView().intersection(cable, true);
            
            if (inter.length) {
                routes[0] = inter[0];
            }

            inter = target.shapeView().intersection(cable, true);
            
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
                sourceBBox = source.bboxOriginal(),
                target = this.target(),
                targetBBox = target.bboxOriginal(),
                routes = this.values.waypoints,
                maxlen = routes.length - 1;
            
            if (component === source) {
                routes[0] = port;
            } else if (component === target) {
                routes[maxlen] = port;
            }

            var closest;

            closest = Router.getClosestIntersect(routes, source.shapeView(), targetBBox.center(true));

            if (closest) {
                routes[0] = closest;
            }
            
            closest = Router.getClosestIntersect(routes, target.shapeView(), sourceBBox.center(true));
            
            if (closest) {
                routes[maxlen] = closest;
            }
            
            this.commit();
            this.fire('route', {command: this.command()});
        },
        
        initTrans: function(context) {
            var source = this.source(),
                target = this.target(),
                sourcePath = source.shapeView(),
                targetPath = target.shapeView(),
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

            var offset  = this.layout().position();
            
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
                        connect.sourcePath = connect.source.shapeView();
                    }
                } else if ( ! oldSource && connect.source) {
                    connect.sourcePath = connect.source.shapeView();
                }
                
                if (oldTarget && connect.target) {
                    if (oldTarget.guid() != connect.target.guid()) {
                        connect.targetPath = connect.target.shapeView();
                    }
                } else if ( ! oldTarget && connect.target) {
                    connect.targetPath = connect.target.shapeView();
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

    ///////// STATICS /////////

}());

(function(){

    var Router = Graph.router.Router;

    Graph.router.Orthogonal = Graph.extend(Router, {

        bendpoints: function() {
            var points = this.cached.bendpoints;

            if ( ! points) {
                var segments = this.path().curve().segments,
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
                sourceNetwork = source.connectable(),
                targetNetwork = target.connectable(),
                sourceBBox = source.bboxOriginal(),
                sourceBox = sourceBBox.toJson(),
                targetBBox = target.bboxOriginal(),
                targetBox = targetBBox.toJson(),
                orient = sourceNetwork.orientation(targetNetwork),
                direct = sourceNetwork.direction(targetNetwork),
                croping  = false;

            if ( ! start) {
                start = sourceBBox.center(true);
            }

            if ( ! end) {
                end = targetBBox.center(true);
            }

            // record initial values
            if ( ! this.values.start && ! this.values.end) {
                this.values.start = start;
                this.values.end = end;    
            }
            
            var sdot, edot;

            if (direct) {
                if (direct == 'h:h') {
                    switch (orient) {
                        case 'top-right':
                        case 'right':
                        case 'bottom-right':
                            sdot = {
                                x: sourceBox.x + 1,
                                y: start.y
                            };

                            edot = {
                                x: targetBox.x + targetBox.width - 1,
                                y: end.y
                            };
                            croping = true;
                            break;
                        case 'top-left':
                        case 'left':
                        case 'bottom-left':
                            sdot = {
                                x: sourceBox.x + sourceBox.width - 1,
                                y: start.y
                            };

                            edot = {
                                x: targetBox.x + 1,
                                y: end.y
                            };
                            croping = true;
                            break;
                    }
                }

                if (direct == 'v:v') {
                    
                    switch (orient) {
                        case 'top-left':
                        case 'top':
                        case 'top-right':
                            sdot = {
                                x: start.x,
                                y: sourceBox.y + sourceBox.height - 1
                            };

                            edot = {
                                x: end.x,
                                y: targetBox.y + 1
                            };

                            croping = true;

                            break;
                        case 'bottom-left':
                        case 'bottom':
                        case 'bottom-right':
                            sdot = {
                                x: start.x,
                                y: sourceBox.y + 1
                            };

                            edot = {
                                x: end.x,
                                y: targetBox.y + targetBox.height - 1
                            };

                            croping = true;
                            break;
                        case 'left':
                        case 'right':
                            sdot = {
                                x: start.x,
                                y: sourceBox.y + 1
                            };

                            edot = {
                                x: end.x,
                                y: targetBox.y + 1
                            };
                            break;
                        case 'right':

                            break;
                    }
                }
            }

            var groupBox, routes, bends, shape, cable, inter;

            if (croping) {

                shape = source.shapeView();
                cable = Graph.path(Graph.util.points2path([sdot, edot]));
                inter = shape.intersection(cable, true);

                if (inter.length) {
                    inter = inter[0];
                    if ( ! Graph.util.isPointEquals(inter, sdot)) {
                        sdot = inter;
                    }
                }

                shape = target.shapeView();
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
            } else if (sdot && edot) {
                switch(orient) {
                    case 'left':
                    case 'right':
                        groupBox = Graph.util.expandBox(Graph.util.groupBox([sourceBox, targetBox]), 0, 20);

                        bends = [
                            {x: sdot.x, y: groupBox.y},
                            {x: edot.x, y: groupBox.y}
                        ];

                        break;
                }

                cable = Graph.path(Graph.util.points2path([sdot].concat(bends).concat([edot])));
                routes = [sdot].concat(bends).concat([edot]);

                this.values.waypoints = Router.tidyRoutes(routes);
            } else {

                sdot = start;
                edot = end;

                // get bending point from center
                bends = Graph.util.lineBendpoints(sdot, edot, direct);
                cable = Graph.path(Graph.util.points2path([sdot].concat(bends).concat([edot])));
                shape = source.shapeView();

                // get source inter
                inter = shape.intersection(cable, true);

                if (inter.length) {
                    sdot = inter[0];
                }

                shape = target.shapeView();
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

            // TEST: force
            if ( ! Router.isRepairable(routes)) {
                return this.route();
            }

            var target = this.target(),
                targetBBox = target.bboxOriginal(),
                source = this.source(),
                sourceBBox = source.bboxOriginal();

            var bound1, bound2, center, points, axis, repaired;

            if (component === source) {
                bound1 = sourceBBox.toJson();
                bound2 = targetBBox.toJson();
                center = sourceBBox.center(true);
                points = routes;
            } else {
                bound1 = targetBBox.toJson();
                bound2 = sourceBBox.toJson();
                center = targetBBox.center(true);
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
                closest = Router.getClosestIntersect(repaired, source.shapeView(), targetBBox.center(true));

                if (closest) {
                    rangeStart = Router.getSegmentIndex(repaired, closest);
                    cropped = cropped.slice(rangeStart + 1);
                    cropped.unshift(closest);
                }

                closest = Router.getClosestIntersect(cropped, target.shapeView(), sourceBBox.center(true));

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
                sourceBBox = source.bboxView(),
                targetBBox = target.bboxView(),
                segmentStart = waypoints[rangeStart],
                segmentEnd = waypoints[rangeEnd];

            var snaps = [];

            if (context.trans == 'BENDING') {
                // force start & end to center
                if (rangeStart === 0) {
                    Router.portCentering(segmentStart, sourceBBox.center(true), context.axis);
                }

                if (rangeEnd === waypoints.length - 1) {
                    Router.portCentering(segmentEnd, targetBBox.center(true), context.axis);
                }

                snaps = [
                    waypoints[rangeStart - 1],
                    segmentStart,
                    segmentEnd,
                    waypoints[rangeEnd + 1]
                ];

                if (rangeStart < 2) {
                    snaps.unshift(sourceBBox.center(true));
                }

                if (rangeEnd > waypoints.length - 3) {
                    snaps.unshift(targetBBox.center(true));
                }
            }

            var offset = this.layout().position(),
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
                    sourceBound: sourceBBox.toJson(),
                    targetBound: targetBBox.toJson(),
                    sourcePath: source.shapeView(),
                    targetPath: target.shapeView(),
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
                        connect.sourcePath = connect.source.shapeView();
                    }
                } else if ( ! oldSource && connect.source) {
                    connect.sourcePath = connect.source.shapeView();
                }

                if (oldTarget && connect.target) {
                    if (oldTarget.guid() != connect.target.guid()) {
                        connect.targetPath = connect.target.shapeView();
                    }
                } else if ( ! oldTarget && connect.target) {
                    connect.targetPath = connect.target.shapeView();
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

    ///////// STATICS /////////

}());


(function(){

    var Link = Graph.link.Link = Graph.extend({

        props: {
            id: null,
            name: null,
            guid: null,
            type: 'normal',
            rendered: false,
            selected: false,
            label: '',
            labelDistance: .5,
            source: null,
            target: null,
            connected: false,
            removed: false,
            command: null,
            stroke: '#000',
            convex: 1,
            smooth: 0,
            smoothness: 6,
            dataSource: null
        },

        params: [],

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

        metadata: {
            icon: Graph.icons.SHAPE_LINK
        },

        constructor: function(router, options) {
            var guid;
            this.data(options || {});

            guid = 'graph-link-' + (++Link.guid);

            this.props.guid = guid;
            this.router = router;

            this.initComponent();
            this.initMetadata();

            this.bindResource('source', router.source());
            this.bindResource('target', router.target());

            this.router.on('route', _.bind(this.onRouterRoute, this));
            this.router.on('reroute', _.bind(this.onRouterReroute, this));

            Graph.registry.link.register(this);
        },

        data: function(name, value) {
            if (name === undefined && value === undefined) {
                return this.props;
            }

            var excludes = {
                type: true,
                router_type: true,
                client_id: true,
                client_source: true,
                client_target: true,
                diagram_id: true,
                source_id: true,
                target_id: true
            };

            var maps = {
                label_distance: 'labelDistance',
                data_source: 'dataSource'
            };

            var key, map;

            if (_.isPlainObject(name)) {
                for (var key in name) {
                    if ( ! excludes[key]) { 
                        map = maps[key] || key;
                        if (key == 'params') {
                            this.params = name[key];
                        } else {
                            this.props[map] = name[key];        
                        }
                    }
                }
                return this;
            }

            if (value === undefined) {
                return this.props[name];
            }

            if ( ! excludes[name]) {
                map = maps[name] || name;
                if (name == 'params') {
                    this.params = value;
                } else {
                    this.props[map] = value;        
                }
            }

            return this;
        },

        initComponent: function() {
            var comp = this.components;
            var block, coat, path, editor, label;

            block = (new Graph.svg.Group())
                .addClass('graph-link')
                .selectable(false);

            block.elem.data(Graph.string.ID_LINK, this.props.guid);
            block.addClass('link-' + this.props.type);

            coat = (new Graph.svg.Path())
                .addClass('graph-link-coat')
                .render(block);

            coat.data('text', this.props.label);
            coat.elem.data(Graph.string.ID_LINK, this.props.guid);

            coat.draggable({
                ghost: true,
                manual: true,
                batchSync: false
            });

            coat.editable({
                width: 150,
                height: 80,
                offset: 'pointer'
            });

            coat.on('pointerdown.link', _.bind(this.onCoatClick, this));
            coat.on('select.link', _.bind(this.onCoatSelect, this));
            coat.on('deselect.link', _.bind(this.onCoatDeselect, this));
            coat.on('beforedrag.link', _.bind(this.onCoatBeforeDrag, this));
            coat.on('afterdrag.link', _.bind(this.onCoatAfterDrag, this));
            coat.on('edit.link', _.bind(this.onCoatEdit, this));
            coat.on('beforeedit.link', _.bind(this.onCoatBeforeEdit, this));
            coat.on('afterdestroy.link', _.bind(this.onCoatAfterDestroy, this));

            path = (new Graph.svg.Path())
                .addClass('graph-link-path')
                .selectable(false)
                .clickable(false)
                .attr('marker-end', 'url(#marker-link-end)')
                .attr('stroke', this.props.stroke || '#000000')
                .render(block);

            if (this.props.type == 'message') {
                path.attr('marker-start', 'url(#marker-link-start-circle)');
            }

            path.elem.data(Graph.string.ID_LINK, this.props.guid);

            label = (new Graph.svg.Text(0, 0, ''))
                .addClass('graph-link-label')
                .selectable(false)
                .render(block);

            label.draggable({ghost: true});

            label.on('render.link', _.bind(this.onLabelRender, this));
            label.on('afterdrag.link', _.bind(this.onLabelAfterDrag, this));

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

        initMetadata: function() {
            this.metadata.tools = [
                {
                    name: 'config',
                    icon: Graph.icons.CONFIG,
                    title: Graph._('Click to config link'),
                    enabled: true,
                    handler: _.bind(this.onConfigToolClick, this)
                },
                {
                    name: 'sendtofront',
                    icon: Graph.icons.SEND_TO_FRONT,
                    title: Graph._('Send to front'),
                    enabled: true,
                    handler: _.bind(this.onFrontToolClick, this)
                },
                {
                    name: 'sendtoback',
                    icon: Graph.icons.SEND_TO_BACK,
                    title: Graph._('Send to back'),
                    enabled: true,
                    handler: _.bind(this.onBackToolClick, this)
                },
                {
                    name: 'trash',
                    icon: Graph.icons.TRASH,
                    title: Graph._('Click to remove link'),
                    enabled: true,
                    handler: _.bind(this.onTrashToolClick, this)
                }
            ];
        },

        unbindResource: function(type) {
            var existing = this.props[type],
                handlers = this.handlers[type];

            if (existing) {
                var vector = Graph.registry.vector.get(existing);
                if (vector) {
                    if (handlers) {
                        var name, ns;
                        for (name in handlers) {
                            ns = name + '.link';
                            vector.off(ns, handlers[name]);
                            ns = null;
                        }
                    }
                }
            }

            handlers = null;

            return this;
        },

        bindResource: function(type, resource) {
            var router = this.router,
                handlers = this.handlers[type];

            this.unbindResource(type, resource);

            handlers = {};

            handlers.afterresize = _.bind(getHandler(this, type, 'AfterResize'), this);
            handlers.select = _.bind(getHandler(this, type, 'Select'), this);
            handlers.afterrotate = _.bind(getHandler(this, type, 'AfterRotate'), this);
            handlers.beforedrag = _.bind(getHandler(this, type, 'BeforeDrag'), this, _, resource);
            handlers.drag = _.bind(getHandler(this, type, 'Drag'), this);
            handlers.afterdrag = _.bind(getHandler(this, type, 'AfterDrag'), this);
            handlers.beforedestroy = _.bind(getHandler(this, type, 'BeforeDestroy'), this);
            
            this.handlers[type] = handlers;
            this.props[type] = resource.guid();

            resource.on('afterresize.link', handlers.afterresize);
            resource.on('afterrotate.link', handlers.afterrotate);
            resource.on('beforedestroy.link', handlers.beforedestroy);
            resource.on('select.link', handlers.select);

            // VERY EXPENSIVE!!!
            if (resource.isDraggable()) {
                resource.on('beforedrag.link', handlers.beforedrag);
                if ( ! resource.draggable().ghost()) {
                    resource.on('drag.link', handlers.drag);
                } else {
                    resource.on('afterdrag.link', handlers.afterdrag);
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

        unbindSource: function(source) {
            return this.unbindResource('source');
        },

        unbindTarget: function(target) {
            return this.unbindResource('target');
        },

        component: function(name) {
            if (name === undefined) {
                return Graph.registry.vector.get(this.components.block);
            }
            return Graph.registry.vector.get(this.components[name]);
        },

        invalidate: function(cache) {
            if (cache !== undefined) {
                this.cached[cache] = null;
            } else {
                this.cached.bendpoints = null;
            }
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

        type: function(type) {
            if (type === undefined) {
                return this.props.type;
            }

            this.props.type = type;

            var component = this.component();

            if (type == 'message') {
                this.component('path').attr('marker-start', 'url(#marker-link-start-circle)');
            } else {
                this.component('path').attr('marker-start', '');
            }

            component.removeClass('link-normal link-message');
            component.addClass('link-' + type);
        },

        connect: function(start, end) {
            // already connected ?
            if (this.props.connected) {
                return;
            }

            this.router.route(start, end);
            this.props.connected = true;
        },

        connectByCommand: function(command) {
            if (this.props.connected) {
                return;
            }

            this.router.execute(command);
            this.props.connected = true;
        },

        disconnect: function(reload) {
            // already disconnected ?
            if ( ! this.props.connected) {
                return;
            }

            reload = _.defaultTo(reload, true);

            this.props.connected = false;

            if (reload) {
                this.router.reset();
                this.reload(this.router.command());    
            }
        },

        redraw: function(props) {

        },

        reload: function(command, silent) {
            silent = _.defaultTo(silent, false);

            command = command || '';

            this.component('coat').attr('d', command).dirty(true);
            this.component('path').attr('d', command);
            this.invalidate();

            if ( ! silent) {
                this.refresh();
                this.fire('change');
                Graph.topic.publish('link:change');
            }
        },

        reloadConvex: function(convex) {
            this.cached.convex = convex;
        },

        removeConvex: function() {
            this.cached.convex = null;
        },

        reset: function(silent) {
            var command = this.router.command();
            this.reload(command, silent);
        },

        refresh: function() {

            // TODO: update label position
            if (this.props.label) {
                var label = this.component('label');

                if (label.props.rendered) {
                    var path = this.router.path();

                    if (path.segments.length) {
                        var bound = label.bbox().toJson(),
                            distance = this.props.labelDistance || .5,
                            scale = this.router.layout().scale(),
                            path = this.router.path(),
                            dots = path.pointAt(distance * path.length(), true),
                            align = Graph.util.pointAlign(dots.start, dots.end, 10);

                        if (align == 'h') {
                            dots.x += (bound.width / 2 + (10 / scale.x));
                        } else {
                            dots.y -= (bound.height - (5 / scale.y));
                        }

                        label.attr({
                            x: dots.x,
                            y: dots.y
                        });

                        label.arrange();

                        path = null;
                        dots = null;

                        label.dirty(true);
                    } else {
                        label.hide();
                    }
                }
            }

        },

        label: function(text) {
            var path, distance, point, align;

            if (text === undefined) {
                return this.props.label;
            }

            this.props.label = text;
            
            var componentLabel = this.component('label'),
                componentCoat = this.component('coat');

            componentLabel.write(text);
            componentLabel.arrange();

            componentCoat.data('text', text);
            
            if (componentLabel.props.rendered) {
                this.refresh();
            }

            return this;
        },

        stroke: function(color) {
            color = color || '#000';

            this.props.stroke = color;
            this.component('path').attr('stroke', color);

            return this;
        },

        select: function(single) {
            var paper = this.router.source().paper();
            single = _.defaultTo(single, false);
            if (single && paper) {
                paper.collector().clearCollection();
            }

            this.component('coat').select();
        },

        deselect: function() {
            this.component('coat').deselect();
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

        relocate: function(dx, dy) {
            this.router.relocate(dx, dy);
            this.reload(this.router.command());
        },

        relocateHead: function(dx, dy) {
            var port = this.router.head();
            if (port) {
                port.x += dx;
                port.y += dy;
                this.router.repair(this.router.target(), port);
            }
        },

        relocateTail: function(dx, dy) {
            var port = this.router.tail();
            if (port) {
                port.x += dx;
                port.y += dy;
                this.router.repair(this.router.source(), port);
            }
        },

        remove: function() {
            var me = this;
            var prop;

            if (this.props.removed) {
                return;
            }

            // flag
            this.props.removed = true;

            // disconnect first
            this.disconnect(false);
            
            // unbind resource
            this.unbindSource();
            this.unbindTarget();

            this.fire('beforedestroy', {link: this});

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

            // clear cache
            for (prop in me.cached) {
                me.cached[prop] = null;
            }

            me.router.destroy();
            me.router = null;

            me.fire('afterdestroy');

            // unregister
            Graph.registry.link.unregister(me);

            // publish
            Graph.topic.publish('link:afterdestroy');
        },
        isSelected: function() {
            return this.props.selected;
        },
        isConnected: function() {
            return this.props.connected;
        },

        toString: function() {
            return 'Graph.link.Link';
        },

        toJson: function() {
            var source = this.router.source(),
                target = this.router.target();

            var sourceShape = Graph.registry.shape.get(source),
                targetShape = Graph.registry.shape.get(target);

            var link = {
                metadata: {

                },
                props: {
                    id: this.props.id,
                    name: this.props.name,
                    guid: this.guid(),
                    type: this.toString(),
                    routerType: this.router.type(),
                    command: this.router.command(),
                    label: this.props.label,
                    labelDistance: this.props.labelDistance,
                    source: sourceShape ? sourceShape.guid() : source.guid(),
                    sourceType: sourceShape ? 'shape' : 'vector',
                    target: targetShape ? targetShape.guid() : target.guid(),
                    targetType: targetShape ? 'shape' : 'vector',
                    convex: +this.props.convex ? 1 : 0,
                    smooth: +this.props.smooth ? 1 : 0,
                    smoothness: this.props.smoothness,
                    stroke: this.props.stroke,
                    dataSource: this.props.dataSource
                },

                params: this.params
            };

            return link;
        },

        ///////// OBSERVERS /////////

        onRouterRoute: function(e) {
            var command = e.command;
            this.reload(command);
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

        onLabelAfterDrag: function(e) {
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

            label.arrange();

            // update label distance
            var path = this.router.path(),
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

        onCoatClick: function(e) {
            var paper = this.component('coat').paper();
            if (paper.state() == 'linking') {
                paper.tool().activate('panzoom');
            }
        },

        onCoatSelect: function(e) {
            var coat = this.component('coat'),
                showControl = false;

            if (e.initial) {
                showControl = true;
            }

            this.props.selected = true;
            this.component().addClass('selected');

            if (showControl) {
                this.resumeControl();
                Graph.topic.publish('link:select', {link: this});
            }
        },

        onCoatDeselect: function(e) {
            if (this.props.removed) return;

            this.props.selected = false;
            this.component().removeClass('selected');
            this.suspendControl();

            if (e.initial) {
                Graph.topic.publish('link:deselect', {link: this});    
            }
        },

        onCoatBeforeDrag: function(e) {
            this.suspendControl();
        },

        onCoatAfterDrag: function(e) {
            this.relocate(e.dx, e.dy);
        },

        onCoatAfterDestroy: function(e) {
            this.remove();
        },

        ///////// OBSERVERS /////////

        onSourceAfterRotate: function(e) {
            var matrix = this.router.source().matrix(),
                oport = this.router.tail(),
                nport = {
                    x: matrix.x(oport.x, oport.y),
                    y: matrix.y(oport.x, oport.y)
                },
                dx = nport.x - oport.x,
                dy = nport.y - oport.y;

            this.relocateTail(dx, dy);
        },

        onSourceSelect: function(e) {
            var target = this.router.target();
            if (this.isSelected()) {
                if ( ! target.isSelected()) {
                    this.deselect();
                }
            } else {
                if (target.isSelected()) {
                    this.select();
                }
            }
        },

        onSourceBeforeDrag: function(e, source) {
            var target = this.router.target();
            if ( ! source.isSelected() || ! target.isSelected()) {
                this.deselect();
            }
            this.cached.convex = null;
        },

        onSourceDrag: function(e) {
            console.warn('Not yet implemented');
        },

        onSourceAfterDrag: function(e) {
            var source = this.router.source(),
                target = this.router.target(),
                dx = e.tx,
                dy = e.ty;

            if (source.isSelected()) {
                if ( ! target.isSelected()) {
                    this.relocateTail(dx, dy);
                }
            } else {
                this.relocateTail(dx, dy);
            }
        },

        onSourceAfterResize: function(e) {
            this.relocateTail(e.translate.dx, e.translate.dy);
        },

        onSourceBeforeDestroy: function() {
            if ( ! this.props.removed) {
                this.component('coat').remove();    
            }
        },

        onTargetAfterRotate: function(e) {
            var matrix = this.router.target().matrix(),
                oport = this.router.head(),
                nport = {
                    x: matrix.x(oport.x, oport.y),
                    y: matrix.y(oport.x, oport.y)
                },
                dx = nport.x - oport.x,
                dy = nport.y - oport.y;

            this.relocateHead(dx, dy);
        },

        onTargetSelect: function(e) {
            var source = this.router.source();
            if (this.isSelected()) {
                if ( ! source.isSelected()) {
                    this.deselect();
                }
            } else {
                if (source.isSelected()) {
                    this.select();
                }
            }
        },

        onTargetBeforeDrag: function(e, target) {
            var source = this.router.source();
            if ( ! source.isSelected() || ! target.isSelected()) {
                this.deselect();
            }
            this.cached.convex = null;
        },

        onTargetDrag: function(e) {
            console.warn('Not yet implemented');
        },

        onTargetAfterDrag: function(e) {
            var target = this.router.target(),
                source = this.router.source(),
                dx = e.tx,
                dy = e.ty;

            if (target.isSelected()) {
                if ( ! source.isSelected()) {
                    this.relocateHead(dx, dy);
                }
            } else {
                this.relocateHead(dx, dy);
            }
        },

        onTargetAfterResize: function(e) {
            this.relocateHead(e.translate.dx, e.translate.dy);
        },

        onTargetBeforeDestroy: function() {
            if ( ! this.props.removed) {
                this.component('coat').remove();    
            }
        },  

        onTrashToolClick: function(e) {
            this.component('coat').remove();
        },

        onConfigToolClick: function(e) {

        },

        onFrontToolClick: function(e) {
            this.sendToFront();
        },

        onBackToolClick: function(e) {

        },

        destroy: function() {

        }

    });

    ///////// STATICS /////////

    Link.guid = 0;

    ///////// HELPERS /////////

    function getHandler(scope, resource, handler) {
        var name = 'on' + _.capitalize(resource) + handler,
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
                controls = [],
                controlImage = Graph.config.base + 'img/' + Graph.config.resizer.image,
                controlSize = Graph.config.resizer.size;

            _.forEach(points, function(dot, i){
                
                var control = (new Graph.svg.Image(
                    controlImage,
                    dot.x - controlSize / 2,
                    dot.y - controlSize / 2,
                    controlSize,
                    controlSize
                ));
                
                control.selectable(false);
                control.removeClass(Graph.styles.VECTOR);
                
                if (i === 0) {
                    control.addClass(Graph.styles.LINK_TAIL);
                    control.elem.data('pole', 'tail');
                } else if (i === maxlen) {
                    control.addClass(Graph.styles.LINK_HEAD);
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
                
                control.draggable({ghost: false});
                control.cursor('default');
                
                control.on('beforedrag', _.bind(me.onControlStart, me, _, context, control));
                control.on('drag',  _.bind(me.onControlMove,  me, _, context, control));
                control.on('afterdrag',   _.bind(me.onControlEnd,   me, _, context, control));
                
                control.render(editor);
                controls.push(control.guid());
            });
            
            me.cached.controls = controls;
            controls = null;
        },
        
        onControlStart: function(e, context, control) {
            this.router.initTrans(context);
            
            if (context.trans == 'CONNECT') {
                var paper = this.component().paper();
                if (paper) {
                    paper.addClass('linking');
                }
            }

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
                    me.reload(result.command, true);
                });
            } else {
                me.router.connecting(context, function(result){
                    me.reload(result.command, true);
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

            if (context.trans == 'CONNECT') {
                var paper = this.component().paper();
                if (paper) {
                    paper.removeClass('linking');
                }
            }

            this.reload(this.router.command());
            this.invalidate();
            this.resumeControl();
        }

    });

    ///////// STATICS /////////

}());

(function(){

    Graph.link.Orthogonal = Graph.extend(Graph.link.Link, {

        reload: function(command, silent) {
            var convex, smooth, radius, routes, maxlen, segments;
            
            silent = _.defaultTo(silent, false);
            convex = this.cached.convex;
            smooth = this.props.smooth;

            if (convex) {
                var points = this.router.waypoints();

                if ( ! points) {
                    return;
                }

                routes = points.slice();
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
                radius = this.props.smoothness || 6;
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

            }

            command = command || '';

            this.component('coat').attr('d', command).dirty(true);
            this.component('path').attr('d', command);
            this.invalidate();

            if ( ! silent) {
                this.refresh();
                this.fire('change');
                Graph.topic.publish('link:change');
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
                controls = [],
                controlImage = Graph.config.base + 'img/' + Graph.config.resizer.image,
                controlSize = Graph.config.resizer.size;

            _.forEach(points, function(dot, i){
                var control, cursor, align, axis, drag;

                control = (new Graph.svg.Image(
                    controlImage,
                    dot.x - controlSize / 2,
                    dot.y - controlSize / 2,
                    controlSize,
                    controlSize
                ));

                control.selectable(false);
                control.removeClass(Graph.styles.VECTOR);
                control.elem.group('graph-link');
                control.elem.data(Graph.string.ID_LINK, linkid);

                drag = {ghost: false};
                axis = null;
                cursor = 'default';

                if (i === 0) {
                    control.addClass(Graph.styles.LINK_TAIL);
                    control.elem.data('pole', 'tail');
                } else if (i === maxlen) {
                    control.addClass(Graph.styles.LINK_HEAD);
                    control.elem.data('pole', 'head');
                } else {
                    align  = Graph.util.pointAlign(dot.start, dot.end);
                    axis   = align == 'v' ? 'y' : 'x';
                    cursor = axis  == 'x' ? 'ew-resize' : 'ns-resize';

                    drag = {ghost:false, axis: axis};
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

                control.on('beforedrag', _.bind(me.onControlStart, me, _, context, control));
                control.on('drag',  _.bind(me.onControlMove,  me, _, context));
                control.on('afterdrag',   _.bind(me.onControlEnd,   me, _, context, control));

                control.render(editor);
                controls.push(control.guid());
            });

            me.cached.controls = controls;
            controls = null;
        },

        onControlStart: function(e, context, control) {
            this.component('coat').cursor(context.cursor);
            this.router.initTrans(context);

            if (context.trans == 'CONNECT') {
                var paper = this.component().paper();
                if (paper) {
                    paper.addClass('linking');
                }
            }

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
                    me.reload(result.command, true);
                });
            } else {
                me.router.connecting(context, function(result){
                    me.reload(result.command, true);
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

            if (context.trans == 'CONNECT') {
                var paper = this.component().paper();
                if (paper) {
                    paper.removeClass('linking');
                }
            }

            this.reload(this.router.command());
            this.invalidate();
            this.resumeControl();
        },

        toString: function() {
            return 'Graph.link.Orthogonal';
        }

    });

    ///////// STATICS /////////

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

(function(){

    Graph.plugin.Plugin = Graph.extend({

        props: {
            vector: null,
            activator: 'tool'
        },

        cached: {
            
        },

        /**
         * Get/set options
         */
        options: function(options) {

        },
        
        vector: function() {
            return Graph.registry.vector.get(this.props.vector);
        },

        invalidate: function() {
            
        },

        enable: function(activator) {},

        disable: function() {},

        destroy: function() {}

    });

}());

(function(){

    var Manager = Graph.plugin.Manager = function() {
        this.installed = {};
    };

    Manager.prototype.get = function(plugin) {
        var installed = this.installed[plugin];

        return {

            plugin: function() {
                if (installed) {
                    var target = Graph.registry.vector.get(installed.target);
                    return target[installed.handler]();
                }
                return null;
            },

            component: function() {
                if (installed) {
                    return Graph.registry.vector.get(installed.target);
                }
                return null;
            }
        };
    };

    Manager.prototype.install = function(plugin, target, options) {
        var handler = this.getPluginHandler(plugin);

        if (handler) {
            options = options || {};
            target[handler](options);

            this.installed[plugin] = {
                handler: handler,
                target: target.guid()
            };
        }
    };

    Manager.prototype.uninstall = function(plugin) {
        var installed = this.installed[plugin];
        if (installed) {
            var target = Graph.registry.vector.get(installed.target);
            target[handler]({destroy: true});
            
            delete this.installed[plugin];
        }
    };

    Manager.prototype.getPluginHandler = function(plugin) {
        var maps = {
            'network': 'connectable',
            'resizer': 'resizable',
            'snapper': 'snappable',
            'dragger': 'draggable',
            'editor': 'editable',
            'rotator': 'rotatable'
        };

        return maps[plugin];
    };

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
                this.defineArrowMarker('marker-link-end');
                this.defineCircleMarker('marker-link-start-circle');
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

        defineCircleMarker: function(id) {
            if (this.definitions[id]) {
                return this.definitions[id];
            }

            var marker = Graph.$(_.format(
                '<marker id="{0}" refX="{1}" refY="{2}" viewBox="{3}" markerWidth="{4}" markerHeight="{5}" orient="{6}">' + 
                    '<circle cx="6" cy="6" r="4" fill="none" stroke="#000000" stroke-width="1" />' + 
                '</marker>',
                id, '6', '6', '0 0 20 20', '10', '10', 'auto'
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
    
    // storages
    var vendors = {};

    var Reactor = Graph.plugin.Reactor = function(vector, listeners) {

        var me = this,
            node = vector.node(),
            guid = vector.guid();

        me.props = {
            vector: guid
        };
        
        me.listeners = listeners || {};

        var vendor = vendors[guid] = interact(node);

        vendor.on('down', function reactorDown(e){
            var target = Graph.event.target(e);
            if (target === node) {
                e.originalType = 'pointerdown';
                Graph.topic.publish('vector:pointerdown', {vector: vector});
                vector.fire(e);
            }
        }, true);

        vector.elem.on({
            contextmenu: function(e) {
                var target = Graph.event.target(e);
                if (target === node) {
                    vector.fire(e);
                    // e.preventDefault();
                }
            }
        });

        vendor = null;

    };

    Reactor.prototype.constructor = Reactor;

    Reactor.prototype.fire = function(eventType) {
        var eventObject;

        switch(eventType) {
            case 'down':

                eventObject = {
                    type: 'mousedown'
                };

                break;
        }

        if (eventObject) {
            // this.vendor().fire(eventObject);
        }
    };

    Reactor.prototype.vendor = function() {
        return vendors[this.props.vector];
    };

    Reactor.prototype.draggable = function(options) {
        return this.vendor().draggable(options);
    };

    Reactor.prototype.dropzone = function(options) {
        return this.vendor().dropzone(options);
    };

    Reactor.prototype.gesturable = function(options) {
        return this.vendor().gesturable(options);
    };

    Reactor.prototype.destroy = function() {
        var guid = this.props.vector,
            vendor = vendors[guid];

        if (vendor) {
            vendor.unset();
        }

        delete vendors[guid];
    };

    Reactor.prototype.toString = function() {
        return 'Graph.plugin.Reactor';
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
                        bb = bb || vector.bboxPristine().toJson();
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
                        bb = bb || vector.bboxPristine().toJson();
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
            vector.attr('transform', mat.toValue());


            if (events.translate) {
                events.translate = {
                    dx: mat.e,
                    dy: mat.f
                };
                this.fire('aftertranslate', events.translate);
            }

            if (events.rotate) {
                events.rotate = {
                    deg: deg
                };
                this.fire('afterrotate', events.rotate);
            }

            if (events.scale) {
                events.scale = {
                    sx: sx,
                    sy: sy
                };
                this.fire('afterscale', events.scale);
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

                                    vector.attr('transform', matrix.toValue());


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
                                    vector.attr('transform', matrix.toValue());
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
                                    vector.attr('transform', matrix.toValue());
                                    
                                    matrix = null;
                                    plugin = null;
                                } else {
                                    matrix = to[key].clone();

                                    vector.graph.matrix = matrix;
                                    vector.attr('transform', matrix.toValue());

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
            vector: null,
            enabled: true,
            suspended: true,
            restriction: null,
            handleImage: null,
            handleSize: null,
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

            _.assign(me.props, options);

            vector.addClass('graph-resizable');

            me.props.handleImage = Graph.config.base + 'img/' + Graph.config.resizer.image;
            me.props.handleSize = Graph.config.resizer.size;

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
                ne: {ghost: false, cursor: 'nesw-resize'},
                se: {ghost: false, cursor: 'nwse-resize'},
                sw: {ghost: false, cursor: 'nesw-resize'},
                nw: {ghost: false, cursor: 'nwse-resize'},
                 n: {ghost: false, cursor: 'ns-resize', axis: 'y'},
                 e: {ghost: false, cursor: 'ew-resize', axis: 'x'},
                 s: {ghost: false, cursor: 'ns-resize', axis: 'y'},
                 w: {ghost: false, cursor: 'ew-resize', axis: 'x'}
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
                    
                    h.on('beforedrag', _.bind(me.onHandleBeforeDrag, me));
                    h.on('drag', _.bind(me.onHandleDrag, me));
                    h.on('afterdrag', _.bind(me.onHandleAfterDrag, me));

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

        disable: function() {
            this.props.enabled = false;
        },

        enable: function() {
            this.props.enabled = true;
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
                var path, bbox, rotate;
                var ro, cx, cy, ox, oy, hs, hw, hh;

                path = vector.shape();
                bbox = path.bbox().toJson();
                // rotate = vector.matrixCurrent().rotate();
                rotate = vector.matrix().rotate();

                ro = rotate.deg;
                cx = 0;
                cy = 0;
                ox = bbox.x;
                oy = bbox.y;
                hs = me.props.handleSize / 2;
                
                if (ro) {
                    var rmatrix = Graph.matrix(),
                        path = vector.shapeRelative();

                    cx = bbox.x + bbox.width / 2,
                    cy = bbox.y + bbox.height / 2;

                    rmatrix.rotate(-ro, cx, cy);

                    path = path.transform(rmatrix);
                    bbox = path.bbox().toJson();
                } else {
                    var vmatrix = vector.matrix();
                    path = path.transform(vmatrix);
                    bbox = path.bbox().toJson();
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

        restrict: function(options) {
            _.assign(this.props, {
                restriction: options
            });
        },

        setupRestriction: function(handle) {
            var me = this,
                restriction = this.props.restriction || {},
                vector = me.vector(),
                paper = vector.paper(),
                layout = paper.layout(),
                dir = handle.props.dir,
                width = +restriction.width || 0,
                height = +restriction.height || 0,
                MAX_VALUE = Number.MAX_SAFE_INTEGER;

            var bounds = {
                top: -MAX_VALUE,
                left: -MAX_VALUE,
                right: MAX_VALUE,
                bottom: MAX_VALUE
            };

            var origin;
            
            if (restriction.origin === undefined) {
                var box = vector.bboxView().toJson();
                origin = getRestrictOrigin(handle, box);
            } else {
                origin = _.extend({x: 0, y: 0}, restriction.origin);
            }

            switch(dir) {
                case 'n':
                    bounds.bottom = origin.y - height;
                    break;
                case 'e':
                    bounds.left = origin.x + width;
                    break;
                case 's':
                    bounds.top = origin.y + height;
                    break;
                case 'w':
                    bounds.right = origin.x - width;
                    break;
                case 'ne':
                    bounds.left = origin.x + width;
                    bounds.bottom = origin.y - height;
                    break;
                case 'se':
                    bounds.top = origin.y + height;
                    bounds.left = origin.x + width;
                    break;
                case 'sw':
                    bounds.right = origin.x - width;
                    bounds.top = origin.y + height;
                    break;
                case 'nw':
                    bounds.right = origin.x - width;
                    bounds.bottom = origin.y - height;
                    break;
            }

            handle.draggable().restrict(bounds);

        },
        
        onHolderRender: function(e) {
            
        },

        onHandleBeforeDrag: function(e) {
            var me = this, 
                vector = me.vector(), 
                handle = e.publisher;

            me.fire('beforeresize', {
                resizer: this,
                direction: handle.props.dir
            });

            if (vector.isRotatable()) {
                vector.rotatable().suspend();
            }

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
            
            if (this.props.restriction) {
                this.setupRestriction(handle);    
            }

            handle.show();
            handle.removeClass('dragging');
        },

        onHandleDrag: function(e) {
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

        onHandleAfterDrag: function(e) {
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
            me.fire('afterresize', resize);

            if (vector.isRotatable()) {
                vector.rotatable().resume();
            }
        },

        toString: function() {
            return 'Graph.plugin.Resizer';
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

    ///////// HELPERS /////////
    
    function getRestrictOrigin(handle, box) {
        var origin = {
            x: box.x,
            y: box.y
        };

        switch(handle.props.dir) {
            case 'n':
                origin.x = (box.x + box.x2) / 2;
                origin.y = box.y2;
                break;
            case 'e':
                origin.x = box.x;
                origin.y = (box.y + box.y2) / 2;
                break;
            case 's':
                origin.x = (box.x + box.x2) / 2;
                origin.y = box.y;
                break;
            case 'w':
                origin.x = box.x2;
                origin.y = (box.y + box.y2) / 2;
                break;
            case 'ne':
                origin.x = box.x;
                origin.y = box.y2;
                break;
            case 'se':
                origin.x = box.x;
                origin.y = box.y;
                break;
            case 'sw':
                origin.x = box.x2;
                origin.y = box.y;
                break;
            case 'nw':
                origin.x = box.x2;
                origin.y = box.y2;
                break;
        }

        return origin;
    }

}());

(function(){

    Graph.plugin.Rotator = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null,
            enabled: true,
            suspended: true,
            handleImage: null,
            handleSize: null,
            rendered: false
        },

        components: {
            helper: null,
            handle: null,
            holder: null,
            circle: null,
            radius: null
        },

        constructor: function(vector, options) {
            var guid = vector.guid();

            options = options || {};

            _.assign(this.props, options);

            this.props.vector = guid;
            this.props.handleImage = Graph.config.base + 'img/' + Graph.config.rotator.image;
            this.props.handleSize = Graph.config.rotator.size;

            this.initComponent();
        },

        invalidate: function()  {
            this.superclass.prototype.invalidate.call(this);
        },

        initComponent: function() {
            var holder, helper, handle, circle, radius;

            holder = (new Graph.svg.Group())    
                .removeClass(Graph.styles.VECTOR)
                .addClass('graph-rotator');

            holder.elem.group('graph-rotator');
            holder.on('render.rotator', _.bind(this.setup, this));

            helper = (new Graph.svg.Rect(0, 0, 0, 0, 0))
                .removeClass(Graph.styles.VECTOR)
                .addClass('graph-rotator-helper')
                .selectable(false)
                .clickable(false)
                .render(holder);

            handle = (new Graph.svg.Image(
                this.props.handleImage, 
                0, 
                0, 
                this.props.handleSize - 2, 
                this.props.handleSize
            ))
            .selectable(false)
            .removeClass(Graph.styles.VECTOR)
            .addClass('graph-rotator-handle')
            .render(holder);

            handle.elem.group('graph-rotator');

            radius = (new Graph.svg.Line())
                .selectable(false)
                .clickable(false)
                .removeClass(Graph.styles.VECTOR)
                .render(holder);

            circle = (new Graph.svg.Circle(0, 0, 5))
                .selectable(false)
                .clickable(false)
                .removeClass(Graph.styles.VECTOR)
                .render(holder);

            this.components.helper = helper.guid();
            this.components.handle = handle.guid();
            this.components.holder = holder.guid();
            this.components.circle = circle.guid();
            this.components.radius = radius.guid();
            this.suspendHelper();

            holder = handle = helper = circle = radius = null;
        },

        setup: function() {

            var me = this,
                vector = this.vector(),
                layout = vector.paper().layout(),
                helper = this.helper(),
                handle = this.handle(),
                holder = this.holder(),
                radius = this.radius(),
                handleNode = handle.node();

            var trans = {
                scale: null,
                center: null,
                translate: null,
                move: null,
                rotate: null,
                snaps: null,
                resizing: null
            };

            handle.interactable().draggable({
                manualStart: true,
                onstart: function(e) {

                    var matrix = vector.matrix();
                    var center, radian;

                    trans.scale = layout.scale();
                    trans.origin = handle.bbox().center().toJson();
                    trans.target = {x: trans.origin.x, y: trans.origin.y};
                    trans.move = {x: 0, y: 0};
                    trans.rotate = matrix.rotate().deg;
                    trans.snaps = [0, 45, 90, -135, -180, -225, -90, -45];
                    trans.resizing = vector.isResizable() && vector.resizable().props.suspended === false;
                    
                    center = helper.bbox().center().toJson();
                    trans.center = center;

                    radian = holder.matrixCurrent().rotate().rad;
                    trans.radian = {
                        sin: Math.sin(radian),
                        cos: Math.cos(radian)
                    };

                    if (trans.resizing) {
                        vector.resizable().suspend();
                    }

                    me.resumeHelper();
                },
                onmove: function(e) {
                    var edx = e.dx,
                        edy = e.dy;

                    var transform, rad, deg, dx, dy, tx, ty;

                    trans.matrix = new Graph.lang.Matrix();

                    // scaling
                    edx /= trans.scale.x;
                    edy /= trans.scale.y;

                    // radian
                    dx = edx *  trans.radian.cos + edy * trans.radian.sin;
                    dy = edx * -trans.radian.sin + edy * trans.radian.cos;

                    trans.move.x += dx;
                    trans.move.y += dy;

                    tx = trans.move.x + trans.origin.x;
                    ty = trans.move.y + trans.origin.y;

                    trans.target = {x: tx, y: ty};

                    // rad = Math.atan2((ty - trans.center.y), (tx - trans.center.x));
                    rad = Math.atan2((trans.center.y - ty), (trans.center.x - tx));
                    deg = Math.round(rad * 180 / Math.PI - 90);

                    // snapping
                    deg = Graph.util.snapValue(deg, trans.snaps, 5);
                    
                    trans.matrix.rotate(deg, trans.center.x, trans.center.y);
                    trans.rotate = deg;

                    transform = trans.matrix.toValue();

                    handle.attr('transform', transform);
                    helper.attr('transform', transform);
                    radius.attr('transform', transform);
                },

                onend: function() {
                    var vmatrix = vector.matrix(),
                        vcenter = vector.bboxPristine().center().toJson(),
                        vrotate = vmatrix.rotate().deg,
                        drotate = trans.rotate - vrotate;

                    var cx, cy;

                    cx = vcenter.x;
                    cy = vcenter.y;

                    vmatrix.rotate(drotate, cx, cy);
                    vector.attr('transform', vmatrix.toValue());
                    vector.dirty(true);

                    me.redraw();

                    if (trans.resizing) {
                        vector.resizable().resume();
                    }

                    me.fire('afterrotate', {
                        deg: trans.rotate - 90,
                        cx: cx,
                        cy: cy
                    });

                }
            })
            .on('down', function(e){
                e.preventDefault();
                e.stopPropagation();
            })
            .on('move', function(e){
                if (me.props.enabled) {
                    var i = e.interaction;
                    if (i.pointerIsDown && ! i.interacting()) {
                        var a = {name: 'drag'};
                        i.prepared.name = a.name;
                        i.setEventXY(i.startCoords, i.pointers);

                        if (e.currentTarget === handleNode) {
                            i.start(a, e.interactable, handleNode);    
                        }
                    }    
                }
            });
        },

        holder: function() {
            return Graph.registry.vector.get(this.components.holder);
        },

        helper: function() {
            return Graph.registry.vector.get(this.components.helper);
        },

        circle: function() {
            return Graph.registry.vector.get(this.components.circle);
        },

        radius: function() {
            return Graph.registry.vector.get(this.components.radius);
        },

        handle: function() {
            return Graph.registry.vector.get(this.components.handle);
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

        resumeHelper: function() {
            var vector, key;
            for (key in this.components) {
                if (['holder', 'handle'].indexOf(key) === -1) {
                    vector = this[key]();
                    vector && vector.show();
                }
            }
        },

        suspend: function() {
            this.props.suspended = true;
            this.holder().elem.detach();
        },

        suspendHelper: function() {
            var vector, key;
            for (key in this.components) {
                if (['holder', 'handle'].indexOf(key) === -1) {
                    vector = this[key]();
                    vector && vector.hide();
                }
            }
        },

        render: function() {
            if (this.props.rendered) {
                this.redraw();
                return;
            }

            this.props.rendered = true;
            this.holder().render(this.vector().parent());
            this.redraw();
        },

        redraw: function() {
            
            var vector = this.vector(),
                holder = this.holder(),
                helper = this.helper(),
                handle = this.handle(),
                circle = this.circle(),
                radius = this.radius(),
                rotate = vector.matrix().rotate().deg;

            var bound = vector.bbox().toJson(),
                edge = 30;

            var cx, cy;

            if (rotate) {
                var rmatrix = Graph.matrix(),
                    rpath = vector.shapeRelative();

                cx = bound.x + bound.width / 2,
                cy = bound.y + bound.height / 2;

                rmatrix.rotate(-rotate, cx, cy);

                rpath = rpath.transform(rmatrix);
                bound = rpath.bbox().toJson();

            } else {
                var vmatrix = vector.matrix(),
                    vpath = vector.shape();

                vpath = vpath.transform(vmatrix);
                bound = vpath.bbox().toJson();

                cx = bound.x + bound.width / 2;
                cy = bound.y + bound.height / 2;
            }

            

            // reset first
            helper.reset();
            handle.reset();
            radius.reset();

            helper.attr({
                x: bound.x,
                y: bound.y,
                width: bound.width,
                height: bound.height
            });

            var hw = (this.props.handleSize - 2) / 2,
                hh = (this.props.handleSize) / 2,
                hx = cx - hw,
                hy = bound.y - edge - hh;

            circle.attr({
                cx: cx, 
                cy: cy
            });

            handle.attr({
                x: hx, 
                y: hy
            });

            radius.attr({
                x1: cx,
                y1: cy,
                x2: cx,
                y2:  bound.y - edge + hh
            });

            handle.rotate(rotate, cx, cy).commit();
            helper.rotate(rotate, cx, cy).commit();
            radius.rotate(rotate, cx, cy).commit();

            holder = helper = bound = handle = radius = circle = null;
        },

        destroy: function() {
            var key, cmp;

            for (key in this.components) {
                cmp = this[key]();
                if (cmp) {
                    cmp.remove();
                    this.components[key] = cmp = null;
                }
            }

        }

    });

}());

(function(){

    Graph.plugin.Collector = Graph.extend(Graph.plugin.Plugin, {

        props: {
            enabled: false,
            suspended: true,
            rendered: false,
            activator: 'tool',
            ready: false
        },

        paper: null,

        collection: [],

        components: {
            rubber: null
        },

        collecting: {
            enabled: false
        },

        constructor: function(paper) {
            var me = this;

            if ( ! paper.isPaper()) {
                throw Graph.error('Collector tool only available for paper !');
            }

            me.paper = paper;
            me.components.rubber = Graph.$('<div class="graph-rubberband">');
            me.collection = new Graph.collection.Vector();

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
            var me = this;

            if (me.props.ready) {
                return;
            }

            me.props.ready = true;

            var collecting = me.collecting,
                paper = me.paper,
                layout = paper.layout(),
                position = layout.position(),
                rubber = me.components.rubber,
                vendor = paper.interactable().vendor();

            vendor.styleCursor(false);

            vendor.draggable({

                manualStart: true,

                onstart: function(e) {
                    layout.invalidate();
                    position = layout.position();

                    var offset = {
                        x: e.clientX - position.left,
                        y: e.clientY - position.top
                    };

                    _.assign(collecting, {
                        enabled: true,
                        start: {
                            // x: e.clientX,
                            // y: e.clientY,
                            x: offset.x,
                            y: offset.y
                        },
                        end: {
                            // x: e.clientX,
                            // y: e.clientY,
                            x: offset.x,
                            y: offset.y
                        },
                        bounds: {}
                    });

                    rubber.query.css({
                        width: 0,
                        height: 0,
                        // transform: 'translate(' + (collecting.start.x - position.left) + 'px, ' + (collecting.start.y - position.top) + 'px)'
                        transform: 'translate(' + (collecting.start.x) + 'px, ' + (collecting.start.y) + 'px)'
                    });
                },

                onmove: function(e) {
                    var start = collecting.start,
                        offset = {
                            x: e.clientX - position.left,
                            y: e.clientY - position.top
                        },
                        end = {
                            // x: e.clientX,
                            // y: e.clientY
                            x: offset.x,
                            y: offset.y
                        };

                    var bounds;

                    if ((start.x <= end.x && start.y < end.y) || (start.x < end.x && start.y <= end.y)) {
                        bounds = {
                            x: start.x,
                            y: start.y,
                            width:  end.x - start.x,
                            height: end.y - start.y
                        };
                    } else if ((start.x >= end.x && start.y < end.y) || (start.x > end.x && start.y <= end.y)) {
                        bounds = {
                            x: end.x,
                            y: start.y,
                            width:  start.x - end.x,
                            height: end.y - start.y
                        };
                    } else if ((start.x <= end.x && start.y > end.y) || (start.x < end.x && start.y >= end.y)) {
                        bounds = {
                            x: start.x,
                            y: end.y,
                            width:  end.x - start.x,
                            height: start.y - end.y
                        };
                    } else if ((start.x >= end.x && start.y > end.y) || (start.x > end.x && start.y >= end.y)) {
                        bounds = {
                            x: end.x,
                            y: end.y,
                            width:  start.x - end.x,
                            height: start.y - end.y
                        };
                    } else {
                        bounds = {
                            x: end.x,
                            y: end.y,
                            width:  0,
                            height: 0
                        };
                    }

                    collecting.bounds = bounds;

                    rubber.query.css({
                        width:  bounds.width,
                        height: bounds.height,
                        // transform: 'translate(' + (bounds.x - position.left) + 'px,' + (bounds.y - position.top) + 'px)'
                        transform: 'translate(' + (bounds.x) + 'px,' + (bounds.y) + 'px)'
                    });
                },

                onend: function() {
                    
                    if ( ! collecting.enabled) return;
                    collecting.enabled = false;

                    var context = paper.guid(),
                        vectors = Graph.registry.vector.collect(context),
                        bounds = collecting.bounds;

                    var start = layout.pointerLocation({
                        clientX: bounds.x + position.left,
                        clientY: bounds.y + position.top
                    });

                    var end = layout.pointerLocation({
                        clientX: bounds.x + position.left + bounds.width,
                        clientY: bounds.y + position.top + bounds.height
                    });
                    
                    var bbox = new Graph.lang.BBox({
                        x: start.x,
                        y: start.y,
                        x2: end.x,
                        y2: end.y,
                        width: end.x - start.x,
                        height: end.y - start.y
                    });

                    bbox.transform(paper.viewport().matrix());

                    _.forEach(vectors, function(v){
                        if (v.guid() != context && v.isSelectable() && ! v.isGroup()) {
                            if (bbox.contains(v)) {
                                me.collect(v, true);
                            }
                        }
                    });

                    if (me.props.activator == 'tool') {
                        paper.tool().activate('panzoom');
                    }

                    bbox = null;
                    me.suspend();
                }
            })
            .on('down', function(e){
                var target, single, vector;

                target = Graph.event.target(e);
                single = ! (e.ctrlKey || e.shiftKey);
                vector = Graph.registry.vector.get(target);

                if (vector) {
                    if ( ! vector.isSelectable()) {
                        if ( 
                            ! vector.elem.belong('graph-resizer') && 
                            ! vector.elem.belong('graph-link') && 
                            ! vector.elem.belong('graph-rotator')
                        ) {
                            if (single) {
                                me.clearCollection();
                            }
                        }
                    }
                }
            })
            .on('tap', function(e){
                var target, vector, single;
                
                target = Graph.event.target(e);
                vector = Graph.registry.vector.get(target);
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
                        var action = {name: 'drag'};

                        // -- workaround for a bug in v1.2.6 of interact.js
                        i.prepared.name = action.name;
                        i.setEventXY(i.startCoords, i.pointers);

                        if (e.currentTarget === paper.node()) {
                            if (me.props.suspended) {
                                me.resume();
                            }
                            i.start(action, e.interactable, rubber.node());
                        }
                    }
                }
            });
        },

        render: function() {
            var me = this;

            if (me.props.rendered) {
                return;
            }

            me.paper.container().append(me.components.rubber);
            me.props.rendered = true;
        },

        size: function() {
            return this.collection.size();
        },

        index: function(vector) {
            return this.collection.index(vector);
        },

        add: function(vector) {
            var offset = this.index(vector);
            vector._collector = this;
            if (offset === -1) {
                this.collection.push(vector);
            }
        },

        remove: function(vector) {
            delete vector._collector;
            this.collection.pull(vector);
        },

        collect: function(vector) {
            vector.select();
            Graph.cached.paper = this.paper.guid();
        },

        decollect: function(vector) {
            vector.deselect();
        },

        clearCollection: function() {
            var me = this,
                collection = me.collection.toArray().slice();

            _.forEach(collection, function(vector){
                me.decollect(vector);
            });

            collection = null;
        },

        suspend: function() {
            this.props.suspended = true;
            this.components.rubber.detach();
        },

        resume: function() {
            if (this.props.suspended) {
                this.props.suspended = false;
                if ( ! this.props.rendered) {
                    this.render();
                } else {
                    this.paper.container().append(this.components.rubber);
                }
            }
        },

        syncBeforeDrag: function(master, e) {
            var me = this;

            me.collection.each(function(v){
                if (v.plugins.dragger && v.plugins.dragger.props.enabled && v !== master) {
                    (function(){
                        // var mat = v.graph.matrix.data(),
                        //     sin = mat.sin,
                        //     cos = mat.cos;

                        var rotate = v.matrixCurrent().rotate(),
                            rad = rotate.rad,
                            sin = Math.sin(rad),
                            cos = Math.cos(rad);

                        if (v.plugins.resizer && ! v.plugins.resizer.props.suspended) {
                            v.plugins.resizer.suspend();
                        }

                        if (v.plugins.rotator && ! v.plugins.rotator.props.suspended) {
                            v.plugins.rotator.suspend();
                        }

                        if (v.plugins.dragger.props.ghost) {
                            v.plugins.dragger.resume();
                        }

                        v.syncdrag = {
                            sin: sin,
                            cos: cos,
                            tdx: 0,
                            tdy: 0
                        };

                        v.addClass('dragging');

                        v.fire('beforedrag', {
                            dx: e.dx *  cos + e.dy * sin,
                            dy: e.dx * -sin + e.dy * cos,
                            master: false
                        });

                    }());
                }
            });

            me.fire('beforedrag');
        },

        syncDrag: function(master, e) {
            var me = this;

            me.collection.each(function(v){
                if (v.plugins.dragger && v.plugins.dragger.props.enabled && v !== master) {
                    (function(v, e){
                        var dx = e.tx *  v.syncdrag.cos + e.ty * v.syncdrag.sin,
                            dy = e.tx * -v.syncdrag.sin + e.ty * v.syncdrag.cos;

                        if (v.plugins.dragger.props.ghost) {
                            v.plugins.dragger.helper().translate(dx, dy).commit();
                        } else {
                            v.translate(dx, dy).commit();
                        }

                        v.syncdrag.tdx += dx;
                        v.syncdrag.tdy += dy;

                        v.fire('drag', {
                            dx: dx,
                            dy: dy,
                            master: false
                        });

                    }(v, e));
                }
            });

        },

        syncAfterDrag: function(master, e) {
            var me = this;

            me.collection.each(function(v){
                if (v.plugins.dragger && v.plugins.dragger.props.enabled && v !== master) {
                    (function(v, e){
                        var batchSync = v.plugins.dragger.props.batchSync,
                            ghost = v.plugins.dragger.props.ghost;

                        if (ghost) {
                            if (batchSync) {
                                v.translate(v.syncdrag.tdx, v.syncdrag.tdy).commit();
                            }
                            v.plugins.dragger.suspend();
                        }

                        if ( ! batchSync) {
                            v.dirty(true);
                        }

                        v.fire('afterdrag', {
                            dx: v.syncdrag.tdx,
                            dy: v.syncdrag.tdy,
                            batch: true,
                            master: false
                        });

                        v.removeClass('dragging');

                        delete v.syncdrag;

                    }(v, e));
                }
            });

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
            ready: false,
            manual: false,

            ghost: true,
            vector: null,
            enabled: true,
            rendered: false,
            suspended: true,
            inertia: false,
            bound: false,
            grid: null,
            axis: false,
            cursor: 'move',

            cls: '',

            // batching operation
            batchSync: true,
            restriction: false
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

        dragging: {
            enabled: false,
            vector: null,
            paper: null,
            helper: null,
            dx: 0,
            dy: 0,
            coord: null
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
                    .addClass('graph-dragger-helper' + ((this.props.cls ? ' ' : '') + this.props.cls ))
                    .removeClass('graph-elem graph-elem-rect')
                    .traversable(false)
                    .selectable(false)
                    .clickable(false)
                    .render(holder);

                helper.elem.data(Graph.string.ID_VECTOR, this.vector().guid());

                comp.holder = holder.guid();
                comp.helper = helper.guid();

                holder = null;
                helper = null;
            } else {
                this.props.cls && (this.vector().addClass(this.props.cls));
            }
        },

        setup: function() {
            var me, vector, vendor, paper, options;

            if (this.props.ready) {
                return;
            }

            me = this;
            vector = me.vector();
            paper = vector.paper();
            options = {};

            _.extend(options, {
                manualStart: true,
                onstart: _.bind(me.onDragStart, me),
                onmove: _.bind(me.onDragMove, me),
                onend: _.bind(me.onDragEnd, me)
            });

            vendor = vector.interactable().vendor();
            vendor.draggable(options);
            vendor.styleCursor(false);

            me.cached.origin = vendor.origin();
            me.cached.snapping = [];

            vendor.on('down', _.bind(me.onPointerDown, me));

            if (me.props.grid) {
                me.snap({
                    mode: 'grid',
                    x: me.props.grid[0],
                    y: me.props.grid[1]
                });
            }

            me.props.ready = true;
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
            if (this.props.ghost) {
                if ( ! this.props.rendered) {
                    this.props.rendered = true;
                    this.holder().render(this.vector().parent());
                    this.redraw();
                }
            }
        },

        suspend: function() {
            if (this.props.ghost) {
                this.props.suspended = true;
                this.holder().elem.detach();    
            }
        },

        resume: function() {
            if (this.props.ghost) {
                this.props.suspended = false;
                if ( ! this.props.rendered) {
                    this.render();
                } else {
                    this.vector().parent().elem.append(this.holder().elem);
                    this.redraw();
                }    
            }
        },

        redraw: function() {
            if (this.props.ghost) {
                var vector = this.vector(),
                    helper = this.helper(),
                    matrix = vector.matrix(),
                    rotate = matrix.rotate().deg,
                    bound = vector.bbox().toJson();

                var cx, cy;

                if (rotate) {
                    var rmatrix = Graph.matrix(),
                        rpath = vector.shapeRelative();

                    cx = bound.x + bound.width / 2,
                    cy = bound.y + bound.height /2;

                    rmatrix.rotate(-rotate, cx, cy);

                    rpath = rpath.transform(rmatrix);
                    bound = rpath.bbox().toJson();
                }

                helper.reset();

                helper.attr({
                    x: bound.x,
                    y: bound.y,
                    width: bound.width,
                    height: bound.height
                });

                if (rotate) {
                    helper.rotate(rotate, cx, cy).commit();
                }
            }
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

        restrict: function(options) {
            this.props.restriction = options;
        },

        start: function() {
            var me = this, 
                vector = me.vector(),
                vendor = vector.interactable().vendor();

            if (me.props.manual) {
                return;
            }

            if (me.dragging.enabled) {
                return;
            }

            me.dragging.enabled = true;
            me.dragging.moveHandler = _.bind(me.onPointerMove, me, _, vector);
            
            vendor.on('move', me.dragging.moveHandler);
        },

        onVectorRender: function() {
            this.setup();
        },

        onPointerDown: function draggerDown(e) {
            e.preventDefault();
            this.start();
        },

        onPointerMove: function draggerMove(e, vector) {
            var i = e.interaction;

            if (this.props.enabled) {
                if (i.pointerIsDown && ! i.interacting()) {
                    var paper = vector.paper(),
                        node = vector.node(),
                        action = { name: 'drag' };

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
                layout = paper.layout(),
                helper = this.helper();

            vector.addClass('dragging');

            paper.cursor(this.props.cursor);

            this.dragging.vector = vector;
            this.dragging.paper = paper;
            this.dragging.helper = helper;

            this.dragging.dx = 0;
            this.dragging.dy = 0;
            this.dragging.tx = 0;
            this.dragging.ty = 0;

            var matrix = vector.matrixCurrent(),
                rotate = matrix.rotate(),
                scale  = matrix.scale();

            this.dragging.deg = rotate.deg;
            this.dragging.rad = rotate.rad;
            this.dragging.sin = Math.sin(rotate.rad);
            this.dragging.cos = Math.cos(rotate.rad);
            this.dragging.sx = scale.x;
            this.dragging.sy = scale.y;

            var edata = {
                x: e.clientX,
                y: e.clientY,
                dx: 0,
                dy: 0,
                ghost: this.props.ghost
            };

            this.fire('beforedrag', edata);

            var coord = layout.pointerLocation(e);
            this.dragging.coord = coord;
        },

        onDragMove: function(e) {

            var dragging = this.dragging,
                paper = dragging.paper,
                vector = dragging.vector,
                helper = dragging.helper,
                ghost = this.props.ghost,
                axs = this.props.axis,
                deg = dragging.deg,
                sin = dragging.sin,
                cos = dragging.cos,
                scaleX = dragging.sx,
                scaleY = dragging.sy;

            var tx = _.defaultTo(e.dx, 0),
                ty = _.defaultTo(e.dy, 0);

            var dx, dy, mx, my;

            dx = dy = mx = my = 0;

            tx /= scaleX;
            ty /= scaleY;
            
            if (axs == 'x') {
                dx = tx;
                dy = 0;

                mx = tx *  cos + 0 * sin;
                my = tx * -sin + 0 * cos;
            } else if (axs == 'y') {
                dx = 0;
                dy = ty;

                mx = 0 *  cos + ty * sin;
                my = 0 * -sin + ty * cos;
            } else {
                dx = mx = tx *  cos + ty * sin;
                dy = my = tx * -sin + ty * cos;
            }

            // check restriction
            var restriction = this.props.restriction;

            if (restriction) {
                var coord = this.dragging.coord;

                coord.x += dx;
                coord.y += dy;

                if (coord.x < restriction.left || coord.x > restriction.right) {
                    dx = mx = tx = 0;
                }
                
                if (coord.y < restriction.top || coord.y > restriction.bottom) {
                    dy = my = ty = 0;
                }
            }

            this.dragging.dx += mx;
            this.dragging.dy += my;
            this.dragging.tx += tx;
            this.dragging.ty += ty;

            var pageX = _.defaultTo(e.pageX, e.x0),
                pageX = _.defaultTo(e.pageY, e.y0);

            pageX /= scaleX;
            pageX /= scaleY;

            var event = {
                pageX: pageX,
                pageY: pageX,

                tx: tx,
                ty: ty,

                dx: dx,
                dy: dy,

                ghost: this.props.ghost
            };

            this.fire('drag', event);

            if (ghost) {
                helper.translate(event.dx, event.dy).commit();
            } else {
                vector.translate(event.dx, event.dy).commit();
            }
        },

        onDragEnd: function(e) {
            var dragging = this.dragging,
                paper = dragging.paper,
                vector = dragging.vector,
                helper = dragging.helper,
                ghost = this.props.ghost,
                dx = dragging.dx,
                dy = dragging.dy,
                tx = dragging.tx,
                ty = dragging.ty;

            if (ghost) {
                vector.translate(dx, dy).commit();

                this.redraw();
                this.suspend();
            }

            vector.removeClass('dragging');
            paper.cursor('default');

            var edata = {
                dx: dx,
                dy: dy,
                tx: tx,
                ty: ty,
                ghost: this.props.ghost
            };

            var vendor = vector.interactable().vendor();
            vendor.off('move', this.dragging.moveHandler);
            
            this.dragging.moveHandler = null;
            this.dragging.enabled = false;

            this.fire('afterdrag', edata);

            for (var key in this.dragging) {
                this.dragging[key] = null;
            }

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
        },

        toString: function() {
            return 'Graph.plugin.Dragger';
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

    var CLS_CONNECT_VALID = 'connect-valid',
        CLS_CONNECT_INVALID = 'connect-invalid',
        CLS_CONNECT_RESET = 'connect-valid connect-invalid',
        CLS_CONNECT_CLEAR = 'connect-valid connect-invalid connect-hover',
        CLS_CONNECT_HOVER = 'connect-hover',

        CONNECT_OUTGOING = 'outgoing',
        CONNECT_INCOMING = 'incoming';

    Graph.plugin.Network = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null,
            wiring: 'h:h',
            tuning: true,
            limitIncoming: 0,
            limitOutgoing: 0
        },

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

            _.assign(me.props, options);

            me.props.vector = guid;

            me.cached.cables = {};
            me.cached.pairs = {};

            vector.addClass('graph-connectable');

            // setup link droppable

            var vendor = vector.interactable().vendor();

            vendor.dropzone({
                accept: _.format('.{0}, .{1}', Graph.styles.LINK_HEAD, Graph.styles.LINK_TAIL),
                overlap: .2
            })
            .on('dropdeactivate', function(e){
                var t = Graph.event.target(e);
                var v = Graph.registry.vector.get(t);
                if (v) {
                    v.removeClass(CLS_CONNECT_CLEAR);
                }
                me.invalidateTrans();
            })
            .on('dropactivate', function(e){
                var t = Graph.event.target(e);
                var v = Graph.registry.vector.get(t);

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
                var t = Graph.event.target(e);
                var v = Graph.registry.vector.get(t);
                if (v) {
                    v.removeClass(CLS_CONNECT_RESET);
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
                var link = Graph.registry.link.get(e.relatedTarget);

                if (me.linking.valid) {
                    if (me.linking.pole == 'head') {

                        var oldTarget = me.linking.router.target();
                        
                        if (oldTarget && oldTarget.guid() != vector.guid()) {
                            oldTarget.connectable().removeLink(link);
                        }

                        me.linking.router.updateTrans('CONNECT', {
                            target: vector
                        });

                    } else {

                        var oldSource = me.linking.router.source();

                        if (oldSource && oldSource.guid() != vector.guid()) {
                            oldSource.connectable().removeLink(link);
                        }

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
            if (this.props.tuning) {
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
            } else {
                return this.props.wiring;
            }
        },

        orientation: function(network) {
            var sourceBox = this.vector().bboxOriginal().toJson(),
                targetBox = network.vector().bboxOriginal().toJson(),
                orientation = Graph.util.boxOrientation(sourceBox, targetBox, this.treshold());

            sourceBox = targetBox = null;
            return orientation;
        },

        isSource: function(link) {
            return link.source().guid() == this.vector().guid();
        },

        isTarget: function(link) {
            return link.target().guid() == this.vector().guid();
        },

        connect: function(target, start, end, options) {
            if (this.canConnect(target)) {

                if (start && ! end) {
                    options = start;
                    start = null;
                    end = null;
                } else {
                    if (start instanceof Graph.lang.Point) {
                        start = start.toJson();
                    }

                    if (end instanceof Graph.lang.Point) {
                        end = end.toJson();
                    }    
                }

                options = options || {};

                var source = this,
                    sourceVector = source.vector(),
                    targetVector = target.vector(),
                    paper = sourceVector.paper(),
                    paperLayout = paper.layout(),
                    router = paperLayout.createRouter(sourceVector, targetVector),
                    link = paperLayout.createLink(router, options);

                if (options.command !== undefined) {
                    link.connectByCommand(options.command);
                } else {
                    link.connect(start, end);    
                }

                link.render(paper);

                link.cached.beforeDestroyHandler = _.bind(this.onLinkBeforeDestroy, this);
                link.on('beforedestroy', link.cached.beforeDestroyHandler);

                source.addLink(link, CONNECT_OUTGOING, targetVector);
                target.addLink(link, CONNECT_INCOMING, sourceVector);

                sourceVector.fire('connect', {link: link});

                return link;
            }

            return false;
        },

        connectByLinker: function(target, start, end, options) {
            var routerType = this.vector().paper().layout().routerType();

            if (routerType == 'orthogonal') {
                this.connect(target, null, null, options);
            } else {
                this.connect(target, start, end, options);
            }
        },

        disconnect: function(target, link) {
            var connections = this.connections(target),
                connectionsLength = connections.length,
                disconnected = 0,
                linkIds = [];

            if (link !== undefined) {
                if ( ! _.isArray(link)) {
                    linkIds = link ? [link.guid()] : [];
                } else {
                    linkIds = _.map(link, function(l){ return l && l.guid() });
                }
            }
            
            _.forEach(connections, function(conn){
                if (linkIds.length) {
                    if (_.indexOf(linkIds, conn.guid) > -1) {
                        conn.link.disconnect();
                        disconnected++;
                        connectionsLength--;
                    }
                } else {
                    conn.link.disconnect();
                    connectionsLength--;
                }
            });

            if (linkIds.length) {
                return disconnected === linkIds.length;
            } else {
                return connectionsLength === 0;
            }

        },

        addLink: function(link, type, pair) {
            var guid = link.guid(),
                cables = this.cached.cables,
                pairs = this.cached.pairs;

            pair  = pair.guid();
            pairs = pairs || {};

            pairs[pair] = pairs[pair] || [];

            if (_.indexOf(pairs[pair], guid) === -1) {
                pairs[pair].push(guid);
            }

            cables[guid] = {
                type: type,
                pair: pair
            };
        },

        removeLink: function(link) {
            var guid, pair;

            if (_.isString(link)) {
                guid = link;
            } else {
                guid = link.guid();
            }

            var conn = this.cached.cables[guid];

            if (conn) {
                if (this.cached.pairs[conn.pair]) {
                    var index = _.indexOf(this.cached.pairs[conn.pair], guid);

                    if (index > -1) {
                        this.cached.pairs[conn.pair].splice(index, 1);
                    }

                    if ( ! this.cached.pairs[conn.pair].length) {
                        delete this.cached.pairs[conn.pair];
                    }
                }
            }

            delete this.cached.cables[guid];
            conn = null;
        },

        repairLinks: function() {
            console.log('called');
        },

        hasConnection: function(network) {
            var conn = this.connections(network);
            return conn.length ? conn : false;
        },

        connections: function(network) {
            var me = this,
                registry = Graph.registry.link,
                current = this.props.vector,
                conns = [];

            if (network !== undefined) {

                var pair = network.vector().guid();

                if (this.cached.pairs[pair]) {
                    _.forEach(me.cached.pairs[pair], function(guid){
                        var link = registry.get(guid),
                            opts = me.cached.cables[guid];
                        if (link && opts) {
                            conns.push({
                                guid: guid,
                                link: link,
                                type: opts.type,
                                source: opts.type == 'outgoing' ? current : pair,
                                target: opts.type == 'outgoing' ? pair : current
                            });
                        }
                    });
                }

                return conns;
            }

            var cables = me.cached.cables;

            _.forOwn(cables, function(opts, guid){
                var link = registry.get(guid);
                if (link) {
                    conns.push({
                        guid: guid,
                        link: link,
                        type: opts.type,
                        source: opts.type == 'outgoing' ? current : opts.pair,
                        target: opts.type == 'outgoing' ? opts.pair : current
                    });
                }
            });

            return conns;
        },

        ///////// RULES /////////

        /**
         * Can connect to target
         */
        canConnect: function(target) {
            if (target instanceof Graph.plugin.Network) {
                var sourceVector = this.vector().guid(),
                    targetVector = target.vector().guid();

                var connections, outgoing, incoming;

                // check limit outgoing
                if (this.props.limitOutgoing > 0) {
                    connections = this.connections();
                    outgoing = _.filter(connections, function(conn){
                        return conn.type == 'outgoing';
                    });

                    if (outgoing.length + 1 > this.props.limitOutgoing) {
                        return false;
                    }
                }

                if (target.props.limitIncoming > 0) {
                    connections = target.connections();
                    
                    incoming = _.filter(connections, function(conn){
                        return conn.type == 'incoming';
                    });

                    if (incoming.length + 1 > target.props.limitIncoming) {
                        return false;
                    }
                }

                if (sourceVector != targetVector) {
                    return true;
                }
            }

            return false;
        },

        destroy: function() {
            var me = this;

            // collect garbage
            this.cached.cables = null;
            this.cached.pairs  = null;
        },

        toString: function() {
            return 'Graph.plugin.Network';
        },

        onLinkBeforeDestroy: function(e) {
            var link = e.link;
            var vector, network;

            if ((vector = link.router.source())) {
                vector.connectable().removeLink(link);
            }

            if ((vector = link.router.target())) {
                vector.connectable().removeLink(link);
            }

            link.off('beforedestroy', link.cached.beforeDestroyHandler);
            link.cached.beforeDestroyHandler = null;
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
            range: {min: 0.2, max: 4.0}
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
                        '<a data-tool="zoom-reset" href="javascript:void(0)" title="' + Graph._('Reset zoom') + '">' + Graph.icons.ZOOM_RESET + '</a>'+
                        '<div class="splitter"></div>'+
                        '<a data-tool="zoom-in" href="javascript:void(0)" title="' + Graph._('Zoom in') + '">' + Graph.icons.ZOOM_IN + '</a>'+
                        '<div class="splitter"></div>'+
                        '<a data-tool="zoom-out" href="javascript:void(0)" title="' + Graph._('Zoom out') + '">' + Graph.icons.ZOOM_OUT +  '</a>'+
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
            // matrix.translate(.5, .5);

            viewport.attr('transform', matrix.toValue());
            viewport.graph.matrix = matrix;
        },

        zoomIn: function() {
            var paper = this.vector().paper(),
                viewport = paper.viewport(),
                origin = paper.layout().center(),
                direction = 0.1875;

            this.zoom(paper, viewport, direction, origin);
        },

        zoomOut: function() {
            var paper = this.vector().paper(),
                viewport = paper.viewport(),
                origin = paper.layout().center(),
                direction = -0.1875;

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

            viewport.attr('transform', matrixScale.toValue());
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

            viewport.attr('transform', matrix.toValue());
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

                // console.log(event.deltaY, factor, event.deltaY * factor / (-15));

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

            var target = Graph.$(Graph.event.target(e)),
                vector = Graph.registry.vector.get(target),
                vendor = paper.interactable().vendor(),
                tool   = paper.tool().current();

            var offset;

            if (this.panning.moveHandler) {
                vendor.off('move', this.panning.moveHandler);
                this.panning.moveHandler = null;
            }

            if (this.panning.stopHandler) {
                vendor.off('up', this.panning.stopHandler);
                this.panning.stopHandler = null;
            }

            if (' collector pencil '.indexOf(tool) > -1) {
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

            this.scroll(paper, viewport, dx, dy);

            this.panning.start = {
                x: e.clientX - offset.x,
                y: e.clientY - offset.y
            };

            paper.cursor('move');

            // prevent select
            e.preventDefault();
        },

        onPointerStop: function(e, paper) {
            var me = this, vendor = paper.interactable().vendor();
            var delay;

            // wait interact to fire last posible event...
            delay = _.delay(function(){
                clearTimeout(delay);
                delay = null;

                vendor.off('move', me.panning.moveHandler);
                vendor.off('up', me.panning.stopHandler);

                me.panning.moveHandler = null;
                me.panning.stopHandler = null;
            }, 0);

            paper.cursor('default');
        },

        onBeforeZoom: _.debounce(function(paper){

            Graph.topic.publish('paper:beforezoom', null, paper);

        }, 300, {leading: true, trailing: false}),

        onZoom: _.debounce(function(paper) {
            var state = paper.state();

            if (state == 'panning') {
                paper.cursor('default');
            }

        }, 300),

        onBeforeScroll: _.debounce(function(paper){

            Graph.topic.publish('paper:beforescroll', null, paper);

        }, 300, {leading: true, trailing: false}),

        onScroll: _.debounce(function() {

        }, 300),

        toString: function() {
            return 'Graph.plugin.Panzoom';
        }

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

    function onDestroy(event, paper) {
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

    var CLS_CONNECT_VALID = 'connect-valid',
        CLS_CONNECT_INVALID = 'connect-invalid',
        CLS_CONNECT_RESET = 'connect-valid connect-invalid';

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
            me.initComponent();
        },
        
        initComponent: function() {
            var me = this, 
                comp = me.components;

            var block, pointer, path;

            block = (new Graph.svg.Group())
                .addClass('graph-linker-path')
                .selectable(false);

            pointer = (new Graph.svg.Circle())
                .addClass('graph-linker-pointer')
                .removeClass(Graph.styles.VECTOR)
                .selectable(false)
                .render(block);

            path = (new Graph.svg.Path())
                .addClass('graph-linker-path')
                .removeClass(Graph.styles.VECTOR)
                .selectable(false)
                .render(block)
                .attr('marker-end', 'url(#marker-link-end)');

            comp.block = block.guid();
            comp.pointer = pointer.guid();
            comp.path = path.guid();
        },

        component: function(name) {
            if (name === undefined) {
                return Graph.registry.vector.get(this.components.block);
            }
            return Graph.registry.vector.get(this.components[name]);
        },

        render: function() {
            var paper;

            if (this.props.rendered) {
                return;
            }

            paper = this.vector();
            this.component().render(paper);

            this.props.rendered = true;
        },

        invalidate: function() {
            var vector, vendor;

            if (this.linking.enabled) {
                vector = this.vector();
                vendor = vector.interactable().vendor();
                
                if (this.linking.moveHandler) {
                    vendor.off('move', this.linking.moveHandler);
                    this.linking.moveHandler = null;
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
            var paper = this.vector();
            this.props.enabled = true;

            paper.state('linking');
            paper.addClass('linking');
        },

        disable: function() {
            var paper = this.vector();

            this.props.enabled = false;
            this.invalidate();
            this.suspend();

            paper.removeClass('linking');
        },

        suspend: function() {
            this.props.suspended = true;
            this.component().elem.detach();
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
                this.component().elem.appendTo(paper.viewport().elem);
            }
        },
        
        /**
         *  Start manual linking
         */
        start: function(source, anchor) {
            var paper = this.vector(),
                layout = paper.layout(),
                offset = layout.position();
                
            if (paper.tool().current() != 'linker') {
                return;
            }
            
            if (this.linking.enabled) {
                if (this.linking.source && this.linking.target) {
                    this.build();
                } else {
                    this.invalidate();
                    this.suspend();
                }
                return;
            } else {
                if (source.isPaper()) {
                    this.invalidate();
                    this.suspend();
                    paper.tool().activate('panzoom');
                    return;
                }
            }
            
            this.linking.visits = [];
            
            var vendor, sbox, port;

            if (source.isConnectable()) {

                if (this.props.suspended) {
                    this.resume();    
                }

                var path = this.component('path');

                this.linking.moveHandler = _.bind(this.onPointerMove, this, _, paper, path);    
                
                vendor = paper.interactable().vendor();
                vendor.on('move', this.linking.moveHandler);

                this.linking.visits.push(source);    

                if (source.isConnectable()) {
                    
                    if ( ! this.linking.source) {
                        sbox = source.bboxOriginal();
                        port = sbox.center(true);

                        this.linking.source = source;
                        this.linking.start  = port;
                        
                        if (anchor) {
                            path.moveTo(port.x, port.y).lineTo(anchor.x, anchor.y, false);
                        } else {
                            path.moveTo(port.x, port.y).lineTo(port.x, port.y, false);
                        }   

                        sbox = port = null;
                    }

                }

                this.linking.enabled = true;
            }
        },
        
        cropping: function(start, end) {
            var source = this.linking.source,
                target = this.linking.target,
                cable = new Graph.lang.Path([['M', start.x, start.y], ['L', end.x, end.y]]);

            var spath, scrop, tpath, tcrop;

            if (source) {
                spath = source.shapeView();
                scrop = spath.intersection(cable, true);
            }

            if (target) {
                tpath = target.shapeView();
                tcrop = tpath.intersection(cable, true);
            }

            cable = spath = tpath = null;

            return {
                start: scrop ? scrop[0] : null,
                end:   tcrop ? tcrop[0] : null
            };
        },

        build: function() {
            var path = this.component('path'),
                tail = path.tail(),
                head = path.head();

            if (tail && head) {
                var sourceNetwork = this.linking.source.connectable(),
                    targetNetwork = this.linking.target.connectable();

                sourceNetwork.connectByLinker(targetNetwork, tail, head);
            }

            this.invalidate();
            this.suspend();
        },

        onPointerDown: function(e, paper) {
            var layout = paper.layout(),
                source = layout.grabVector(e);
            
            if (source) {
                this.start(source);
            }
            
            layout = source = null;
        },

        onPointerMove: function(e, paper, path) {
            if (this.linking.enabled) {

                var layout = paper.layout(),
                    target = layout.grabVector(e);

                if ( ! target) {
                    return;
                }

                var source = this.linking.source,
                    valid = false;

                if (source) {

                    // track visit
                    if (this.linking.visits.indexOf(target.guid()) === -1) {
                        this.linking.visits.push(target);
                    }
                    
                    var start = this.linking.start,
                        coord = layout.pointerLocation(e),
                        x = coord.x,
                        y = coord.y,
                        rad = Graph.util.rad(Graph.util.theta(start, {x: x, y: y})),
                        sin = Math.sin(rad),
                        cos = Math.cos(rad),
                        tdx = this.linking.treshold * -cos,
                        tdy = this.linking.treshold *  sin;

                    x += tdx;
                    y += tdy;

                    if (target.isConnectable()) {
                        
                        var crop, tbox, port;

                        if (source.connectable().canConnect(target.connectable())) {
                            valid  = true;

                            target.removeClass(CLS_CONNECT_INVALID);
                            target.addClass(CLS_CONNECT_VALID);
                            
                            tbox = target.bboxOriginal();
                            port = tbox.center(true);

                            this.linking.target = target;
                            this.linking.end    = port;

                            crop = this.cropping(start, port);

                            if (crop.start) {
                                path.moveTo(crop.start.x, crop.start.y);
                            }

                            if (crop.end) {
                                path.lineTo(crop.end.x, crop.end.y, false);
                            } else {
                                path.lineTo(x, y, false);
                            }

                            tbox = port = null;
                        } else {
                            target.removeClass(CLS_CONNECT_VALID);
                            target.addClass(CLS_CONNECT_INVALID);
                        }

                    } else {
                        target.addClass(CLS_CONNECT_INVALID);
                    }

                    if ( ! valid) {

                        if (this.linking.target) {
                            this.linking.target.removeClass(CLS_CONNECT_RESET);
                        }

                        this.linking.target = null;
                        this.linking.end    = null; 

                        crop = this.cropping(start, {x: x, y: y});

                        if (crop.start) {
                            path.moveTo(crop.start.x, crop.start.y);
                        }

                        if (crop.end) {
                            path.lineTo(crop.end.x, crop.end.y, false);
                        } else {
                            path.lineTo(x, y, false);
                        }
                    }

                }
            }

            e.preventDefault();
        },

        toString: function() {
            return 'Graph.plugin.Linker';
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
        },

        toString: function() {
            return 'Graph.plugin.ToolManager';
        }


    });


}());

(function(){

    Graph.plugin.Pencil = Graph.extend(Graph.plugin.Plugin, {

        writing: {
            startHandler: null
        },

        constructor: function(vector) {
            this.props.vector = vector.guid();
        },

        enable: function(activator) {
            this.props.enabled = true;
            this.props.activator = activator;

            var vector = this.vector(),
                vendor = vector.interactable().vendor();

            vector.cursor('text');
            vector.state('writing');

            this.writing.startHandler = _.bind(this.onPointerDown, this);
            vendor.on('down', this.writing.startHandler);

        },

        disable: function() {
            this.props.enabled = false;
            var vendor = this.vector().interactable().vendor();
            vendor.off('down', this.writing.startHandler);
            this.writing.startHandler = null;
        },

        toString: function() {
            return 'Graph.plugin.Pencil';
        },

        onPointerDown: function(e) {
            var vector = this.vector();

            if (vector.isPaper()) {
                var offset, options, result;

                offset = vector.layout().pointerLocation(e);
                options = {
                    left: offset.x,
                    top: offset.y
                };

                if ( ! vector.diagram().current()) {
                    vector.diagram().create();
                }
                
                result = vector.diagram().current().drawShape(
                    'Graph.shape.common.Label', 
                    options
                );

                if (result.shape) {
                    var t = _.delay(function(e){
                        clearTimeout(t);
                        t = null;

                        vector.tool().activate('panzoom');
                        result.shape.editable().plugin().startEdit();

                    }, 10);    
                } else {
                    //vector.tool().activate('panzoom');
                }
                
            }
        }

    });

}());

(function(){

    var MIN_BOX_WIDTH  = 150,
        MIN_BOX_HEIGHT = 50,
        OFFSET_TRESHOLD = 10;

    var Editor = Graph.plugin.Editor = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null,
            rendered: false,
            suspended: true,
            width: 'auto',
            height: 'auto',
            offset: 'auto',
            align: 'center'
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
            comp.editor.css('text-align', this.props.align);
            
            comp.editor.on('keydown', function(e){
                switch(e.keyCode) {
                    case Graph.event.ENTER:
                        me.commit();
                        break;
                    case Graph.event.DELETE:
                    case Graph.event.SHIFT:
                        e.stopPropagation();
                        break;

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
                Graph.topic.unsubscribe('paper:beforezoom', this.editing.commitHandler);
                Graph.topic.unsubscribe('paper:beforescroll', this.editing.commitHandler);
                Graph.topic.unsubscribe('vector:pointerdown', this.editing.commitHandler);

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
                matrix = vector.matrixCurrent(),
                scale  = matrix.scale();

            var vbox = vector.bbox().clone().transform(matrix).toJson();
            var left, top, width, height;
            
            width  = vbox.width;
            height = vbox.height;
            left = vbox.x;
            top  = vbox.y;

            if (this.props.width != 'auto') {
                width = Math.max(this.props.width, MIN_BOX_WIDTH);
                width = Math.max(width * scale.x, width);
                left = vbox.x;
            } else {
                width = width - 8 * scale.x;
                left = left + 4 * scale.x;
            }   

            if (this.props.height != 'auto') {
                height = Math.max(this.props.height, MIN_BOX_HEIGHT);
                height = Math.max(height * scale.y, height);
                top = vbox.y;
            } else {
                height = height - 8 * scale.y;
                top = top + 4 * scale.y;
            }

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

            vector.deselect();

            if (vector.paper()) {
                if (vector.paper().tool().current() == 'linker') {
                    vector.paper().tool().activate('panzoom');
                }        
            }

            me.fire('beforeedit');
            me.resume();

            if (e && this.props.offset == 'pointer') {
                var editor = me.components.editor,
                    paper = vector.paper(),
                    layout = paper.layout(),
                    scale = layout.scale();

                var offset, coords, screen;

                if (paper) {
                    offset = paper.position();
                    coords = layout.pointerLocation(e);
                    
                    if (this.props.align == 'center') {
                        screen = {
                            x: e.clientX - offset.left,
                            y: e.clientY - offset.top
                        };

                        editor.css({
                            left: screen.x - editor.width() / 2,
                            top: screen.y - editor.height() / 2
                        });
                    } else {
                        screen = vector.bboxView().toJson();
                        screen = layout.screenLocation({x: screen.x, y: screen.y});

                        editor.css({
                            left: screen.x - offset.left,
                            top: screen.y - offset.top
                        });
                    }

                    editor.focus(true);

                    me.cached.left = coords.x;
                    me.cached.top  = coords.y;
                }
            }

            if ( ! me.editing.commitHandler) {
                me.editing.commitHandler = function() {
                    me.commit();
                };

                Graph.topic.subscribe('paper:beforezoom', me.editing.commitHandler);
                Graph.topic.subscribe('paper:beforescroll', me.editing.commitHandler);
                Graph.topic.subscribe('vector:pointerdown', me.editing.commitHandler);
            }
        },

        onDoubleTap: function(e) {
            this.startEdit(e);
            e.preventDefault();
        },

        destroy: function() {
            if (this.editing.commitHandler) {
                Graph.topic.unsubscribe('paper:beforezoom', this.editing.commitHandler);
                Graph.topic.unsubscribe('paper:beforescroll', this.editing.commitHandler);
                Graph.topic.unsubscribe('vector:pointerdown', this.editing.commitHandler);

                this.editing.commitHandler = null;
            }

        },

        toString: function() {
            return 'Graph.plugin.Editor';
        }

    });

    ///////// STATICS /////////
    
    

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
            offset: null,
            stubx: null,
            stuby: null
        },

        constructor: function(vector, options) {
            options = options || {};

            if ( ! vector.isPaper()) {
                throw Graph.error("Snapper plugin only available for paper");
            }

            _.assign(this.props, options);

            this.props.vector  = vector.guid();

            this.initComponent(vector);
            this.snapping.coords = {};
        },

        invalidate: function() {
            for (var key in this.snapping) {
                this.snapping[key] = null;
            }

            this.snapping.coords = {};
            this.clients = {};
        },

        initComponent: function(vector) {
            var block, stubx, stuby;

            block = (new Graph.svg.Group())
                .selectable(false)
                .clickable(false)
                .addClass('graph-snapper');

            stubx = (new Graph.svg.Path('M 0 0 L 0 0'))
                .removeClass(Graph.styles.VECTOR)
                .selectable(false)
                .clickable(false)
                .render(block);

            stuby = (new Graph.svg.Path('M 0 0 L 0 0'))
                .removeClass(Graph.styles.VECTOR)
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

        enable: function() {
            this.props.enabled = true;
        },

        disable: function() {
            this.props.enabled = false;
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

        refresh: function(clientId) {
            if (this.props.enabled) {
                var key, client, center, token;

                if (clientId !== undefined) {
                    var options = this.clients[clientId];

                    if (options) {
                        if (this.snapping.coords[options.coords]) {
                            delete this.snapping.coords[options.coords];
                        }
                        client = Graph.registry.vector.get(clientId);    
                        if (client) {
                            center = this.getClientCenter(client);
                            token = center.x + '_' + center.y;
                            this.snapping.coords[token] = center;
                            this.clients[clientId].coords = token;
                        }
                    }
                } else {
                    this.snapping.coords = {};    
                    for (key in this.clients) {
                        client = Graph.registry.vector.get(key);
                        if (client) {
                            center = this.getClientCenter(client);
                            token = center.x + '_' + center.y;
                            this.snapping.coords[token] = center;
                            this.clients[key].coords = token;
                        }
                    }  
                }
            }
        },

        setup: function(client, options) {

            if ( ! this.props.enabled) {
                return;
            }

            var me = this,
                clientId = client.guid();

            var key;

            if (me.clients[clientId]) {
                client.off('beforedrag', me.clients[clientId].beforeDragHandler);
                client.off('afterdrag',  me.clients[clientId].afterDragHandler);
                client.off('afterdestroy',  me.clients[clientId].afterDestroyHandler);

                if (me.clients[clientId].coords) {
                    delete me.snapping.coords[me.clients[clientId].coords];
                }

                delete me.clients[clientId];
            }

            if (options.enabled) {

                var dragger = client.draggable();

                me.clients[clientId] = {
                    coords: null,
                    osnaps: dragger.snap(),
                    beforeDragHandler: _.bind(me.onClientBeforeDrag, me, _, client),
                    afterDragHandler: _.bind(me.onClientAfterDrag, me, _, client),
                    afterDestroyHandler: _.bind(me.onClientAfterDestroy, me, _, client)
                };

                client.on('beforedrag', me.clients[clientId].beforeDragHandler);
                client.on('afterdrag', me.clients[clientId].afterDragHandler);
                client.on('afterdestroy',  me.clients[clientId].afterDestroyHandler);

                var center = me.getClientCenter(client),
                    coords = this.snapping.coords;

                // this.vector().circle(center.x, center.y, 5);

                key = center.x + '_' + center.y;

                if ( ! coords[key]) {
                    coords[key] = center;
                    me.clients[clientId].coords = key;
                }

                key = null;
            }
        },

        repairClient: function(client) {
            console.log(client);
        },

        getClientCenter: function(client) {
            var bbox = client.bboxView(),
                center = bbox.center(true);

            return center;
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

        onClientBeforeDrag: function(e, client) {

            if ( ! this.props.enabled) {
                return;
            }

            var me = this,
                paper = me.vector(),
                viewport = paper.viewport(),
                layout = paper.layout(),
                offset = layout.position(),
                center = me.getClientCenter(client);

            var snapping = this.snapping,
                coords = snapping.coords;

            snapping.stubx = this.component('stubx');
            snapping.stuby = this.component('stuby');

            var left = offset.left,
                top = offset.top,
                ma = viewport.matrix(),
                pt = layout.pointerLocation({clientX: e.x, clientY: e.y}),
                diffx = center.x - pt.x,
                diffy = center.y - pt.y,
                snapx = [],
                snapy = [];

            _.forOwn(coords, function(c){
                var mx, my, vx, vy;

                mx = ma.x(c.x - diffx, c.y - diffy);
                my = ma.y(c.x - diffx, c.y - diffy);

                vx = mx + left;

                if (_.indexOf(snapx, vx) === -1) {
                    snapx.push(vx);
                }

                vy = my + top;

                if (_.indexOf(snapy, vy) === -1) {
                    snapy.push(vy);
                }
            });

            client.draggable().snap([
                function(x, y) {
                    var rx, ry, x1, y1, pt;

                    rx = snapValue(x, snapx);
                    ry = snapValue(y, snapy);

                    x1 = rx.value;
                    y1 = ry.value;

                    pt = layout.pointerLocation({
                        clientX: x1,
                        clientY: y1
                    });

                    if (rx.snapped) {
                        me.showStub('x', pt.x + diffx);
                    } else {
                        me.hideStub('x');
                    }

                    if (ry.snapped) {
                        me.showStub('y', pt.y + diffy);
                    } else {
                        me.hideStub('y');
                    }

                    return {
                        x: x1,
                        y: y1
                    };
                }
            ]);

            me.resume();
        },

        onClientAfterDrag: function(e, client) {

            if ( ! this.props.enabled) {
                return;
            }

            var snapping = this.snapping,
                options = this.clients[client.guid()];

            if (options) {
                var dragger = client.draggable();

                if (options.osnaps) {
                    dragger.snap(options.osnaps);
                }

                var token, center;

                if (options.coords) {
                    delete snapping.coords[options.coords];
                }

                center = this.getClientCenter(client);
                token = center.x + '_' + center.y;

                if ( ! snapping.coords[token]) {
                    snapping.coords[token] = center;
                    options.coords = token;
                }

                token = null;
                center = null;
            }

            this.suspend();

            _.assign(this.snapping, {
                stubx: null,
                stuby: null
            });
        },

        onClientAfterDestroy: function(e, client) {
            var guid = client.guid(),
                options = this.clients[guid],
                snapping = this.snapping;

            if (options) {
                if (options.coords) {
                    if (snapping.coords[options.coords]) {
                        delete snapping.coords[options.coords];
                    }
                }
                delete this.clients[guid];
            }
        },

        toString: function() {
            return 'Graph.plugin.Snapper';
        }

    });

    ///////// HELPERS /////////

    function snapValue(value, snaps, range) {
        range = _.defaultTo(range, 10);

        var i = snaps.length, v;

        while(i--) {
            v = Math.abs(snaps[i] - value);
            if (v <= range) {
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

    Graph.plugin.Toolpad = Graph.extend(Graph.plugin.Plugin, {
        
        props: {
            vector: null,
            rendered: false,
            suspended: true
        },
        
        components: {
            pad: null
        },  
    
        constructor: function(paper) {
            
            this.props.vector = paper.guid();
            this.initComponent(paper);

            this.cached.tools = null;
            this.cached.shape = null;
            this.cached.link  = null;
            
            Graph.topic.subscribe('shape:select', _.bind(this.onShapeSelect, this));
            Graph.topic.subscribe('shape:deselect', _.bind(this.onShapeDeselect, this));
            
            Graph.topic.subscribe('link:select', _.bind(this.onLinkSelect, this));
            Graph.topic.subscribe('link:deselect', _.bind(this.onLinkDeselect, this));
        },
        
        initComponent: function(paper) {
            
            var pad = '<div class="graph-toolpad">' + 
                            // '<div class="pad-header"></div>' + 
                            // '<div class="pad-splitter"></div>' + 
                            '<div class="pad-body"></div>'+
                      '</div>';

            pad = Graph.$(pad);

            pad.on('click', '[data-shape-tool]', _.bind(this.onShapeToolClick, this));
            pad.on('click', '[data-link-tool]', _.bind(this.onLinkToolClick, this));
            
            this.components.pad = pad;
        },
        
        render: function() {
            if (this.props.rendered) {
                return;
            }
            
            this.components.pad.appendTo(this.vector().container());
            this.props.rendered = true;
        },
        
        suspend: function() {
            this.props.suspended = true;
            this.components.pad.detach();
        },
        
        resume: function() {
            if (this.props.suspended) {
                
                this.props.suspended = false;
                
                if ( ! this.props.rendered) {
                    this.render();
                } else {
                    this.components.pad.appendTo(this.vector().container());
                }
            }
        },
        
        onShapeSelect: function(e) {
            var shape = e.shape,
                meta = shape.metadata,
                pad = this.components.pad;

            var body = '';

            // pad.find('.pad-header').html('<a href="javascript:void(0);"><i class="' + meta.icon + '"></i></a>');            
            // pad.find('.pad-header').html('<a href="javascript:void(0);"><i class="ion-navicon-round"></i></a>');            
            
            _.forEach(meta.tools, function(tool, index){
                if (tool.enabled) {
                    if (index > 0) {
                        body += '<div class="splitter"></div>';    
                    }
                    body += '<a data-shape-tool="' + tool.name + '" href="javascript:void(0)" title="' + tool.title + '">' + tool.icon + '</a>';
                }
            });
            
            pad.find('.pad-body').html(body);

            this.cached.tools = meta.tools;
            this.cached.shape = shape;

            this.resume();
        },
        
        onShapeDeselect: function(e) {
            this.suspend();
        },
        

        onLinkSelect: function(e) {
            var link = e.link,
                meta = link.metadata,
                pad = this.components.pad;
            
            // pad.find('.pad-header').html('<a><i class="' + meta.icon + '"></i></a>');
            // pad.find('.pad-header').html('<a><i class="ion-navicon-round"></i></a>');
            
            var body = '';
            
            _.forEach(meta.tools, function(tool, index){
                if (tool.enabled) {
                    if (index > 0) {
                        body += '<div class="splitter"></div>';        
                    }
                    body += '<a data-link-tool="' + tool.name + '" href="#" title="' + tool.title + '">'+ tool.icon +'</a>';                    
                }
            });
            
            pad.find('.pad-body').html(body);
            
            this.cached.tools = meta.tools;
            this.cached.link = link;
            this.resume();
        },

        onLinkDeselect: function(e) {
            this.suspend();
        },
        
        onShapeToolClick: function(e) {
            var target = Graph.$(e.currentTarget),
                name = target.data('shapeTool');

            var tool = _.find(this.cached.tools, function(t){
                return t.name == name;
            });

            if (tool) {
                if (tool.name == 'config') {
                    var paper = this.vector();
                    paper.fire('shapetoolclick', {
                        shape: this.cached.shape
                    });
                } else if (tool.handler) {
                    tool.handler(e);
                }
            }
            
            e.preventDefault();
        },

        onLinkToolClick: function(e) {
            var target = Graph.$(e.currentTarget),
                name = target.data('linkTool');
            
            var tool = _.find(this.cached.tools, function(t){
                return t.name == name;
            });

            if (tool) {
                if (tool.name == 'config') {
                    var paper = this.vector();
                    paper.fire('linktoolclick', {
                        link: this.cached.link
                    });
                } else if (tool.handler) {
                    tool.handler(e);
                }
            }
            
            e.preventDefault();  
        },

        toString: function() {
            return 'Graph.plugin.Toolpad';
        }
        
    });

}());

(function(){

    Graph.plugin.Clipper = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null
        },

        constructor: function(vector) {
            var me = this,
                guid = vector.guid();

            me.props.vector = guid;

            if (vector.isPaper()) {
                vector.on('keycopy', function(e){
                    me.copy();
                });

                vector.on('keypaste', function(e){
                    me.paste();
                });
            }

            me.cached.clips = null;
            me.cached.paste = 1;
        },

        vector: function() {
            return Graph.registry.vector.get(this.props.vector);
        },

        invalidate: function() {
            this.cached.clips = null;
        },

        cut: function() {

        },

        copy: function() {
            var me = this,
                paper = this.vector(),
                selection = paper.collector().collection.toArray().slice();

            me.cached.paste = 1;

            if (selection.length) {
                var clips = [],
                    excludes = { 
                        guid: true,
                        id: true
                    };

                _.forEach(selection, function(vector){
                    var shape = Graph.registry.shape.get(vector);
                    if (shape) {
                        var data = shape.toJson(),
                            clip = {};
                        var key, val;

                        for (key in data.props) {
                            val = data.props[key];
                            if ( ! excludes[key]) {
                                clip[key] = val;
                            }
                        }
                        clips.push(clip);
                    }
                });
                this.cached.clips = clips;
            } else {
                this.cached.clips = null;
            }
        },

        paste: function() {
            var me = this,
                clips = this.cached.clips,
                paper = this.vector(),
                scale = paper.layout().scale(),
                collector = paper.collector();

            if (clips && clips.length) {

                collector.clearCollection();

                _.forEach(clips, function(clip){
                    var prop = _.cloneDeep(clip);  

                    if (prop.left !== undefined) {
                        prop.left += me.cached.paste * 20 / scale.x;
                    }

                    if (prop.top !== undefined) {
                        prop.top += me.cached.paste * 20 / scale.y;
                    }

                    var shape = Graph.factory(Graph.ns(clip.type), [prop]);
                    shape.render(paper);
                    shape.select();
                });

                me.cached.paste++;
            }
        }

    });

}());

(function(){

    var Shape = Graph.shape.Shape = Graph.extend({

        props: {
            id: null,
            guid: null,
            mode: null,
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            rotate: 0,
            label: '',
            alias: '',
            fill: 'rgb(255, 255, 255)',
            stroke: 'rgb(0, 0, 0)',
            strokeWidth: 2,
            dataSource: null
        },

        params: [],

        components: {
            shape: null,
            block: null,
            label: null,
            child: null
        },

        layout: {
            suspended: false
        },

        tree: {
            paper: null,
            parent: null,
            children: null
        },

        metadata: {
            type: null,
            icon: Graph.icons.SHAPE,
            style: 'graph-shape',
            tools: null,
            params: []
        },

        cached: {

        },

        plugins: {
            manager: null
        },

        constructor: function(options) {
            var guid;

            this.data(options || {});

            guid = 'graph-shape-' + (++Shape.guid);

            this.props.guid = guid;
            this.tree.children = new Graph.collection.Shape();
            this.plugins.manager = new Graph.plugin.Manager();

            this.initComponent();
            this.initMetadata();

            if (this.components.shape) {
                var style = Graph.styles.SHAPE,
                    shape = this.component();

                if (this.metadata.style) {
                    style += ' ' + this.metadata.style;
                }

                shape.addClass(style);
                shape.attr('data-shape', guid);
                
                style = null;
            }

            Graph.registry.shape.register(this);

            guid = null;
        },

        data: function(name, value) {
            if (name === undefined && value === undefined) {
                return this.props;
            }

            var excludes = {
                type: true,
                client_id: true,
                client_parent: true,
                client_pool: true,
                diagram_id: true,
                parent_id: true
            };

            var maps = {
                stroke_width: 'strokeWidth',
                data_source: 'dataSource'
            };

            var map, key;

            if (_.isPlainObject(name)) {
                for (key in name) {
                    if ( ! excludes[key]) {
                        map = maps[key] || key;
                        if (key == 'params') {
                            this.params = name[key];
                        } else {
                            this.props[map] = name[key];
                        }
                    }
                }
                return this;
            }

            if (value === undefined) {
                return this.props[name];
            }

            if ( ! excludes[name]) {
                map = maps[name] || name;
                if (name == 'params') {
                    this.params = value;
                } else {
                    this.props[map] = value;        
                }
            }

            return this;
        },

        update: function(data) {
            data = data || {};

            if (data.props) {
                this.data(data.props);
            }
        },

        redraw: function(props) {
            var key;
            
            props = props || {};

            this.suspendLayout();

            for (key in props) {
                if (this[key] !== undefined && _.isFunction(this[key])) {
                    this[key](props[key]);
                }
            }

            this.resumeLayout();
            this.refresh();
        },

        is: function(type) {
            return this.metadata.type == type;
        },

        initMetadata: function() {
            this.metadata.tools = [
                {
                    name: 'config',
                    icon: Graph.icons.CONFIG,
                    title: Graph._('Click to config shape'),
                    enabled: true,
                    handler: _.bind(this.onConfigToolClick, this)
                },
                {
                    name: 'link',
                    icon: Graph.icons.LINK,
                    title: Graph._('Click to start shape linking'),
                    enabled: true,
                    handler: _.bind(this.onLinkToolClick, this)
                },
                {
                    name: 'sendtofront',
                    icon: Graph.icons.SEND_TO_FRONT,
                    title: Graph._('Send to front'),
                    enabled: true,
                    handler: _.bind(this.onFrontToolClick, this)
                },
                {
                    name: 'sendtoback',
                    icon: Graph.icons.SEND_TO_BACK,
                    title: Graph._('Send to back'),
                    enabled: true,
                    handler: _.bind(this.onBackToolClick, this)
                },
                {
                    name: 'trash',
                    icon: Graph.icons.TRASH,
                    title: Graph._('Click to remove shape'),
                    enabled: true,
                    handler: _.bind(this.onTrashToolClick, this)
                }
            ];
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

        invalidate: function() {
            for (var key in this.cached) {
                this.cached[key] = null;
            }
        },

        connectable: function() {
            return this.plugins.manager.get('network');
        },

        resizable: function() {
            return this.plugins.manager.get('resizer');
        },

        draggable: function() {
            return this.plugins.manager.get('dragger');
        },

        snappable: function() {
            return this.plugins.manager.get('snapper');
        },

        editable: function() {
            return this.plugins.manager.get('editor');  
        },

        paper: function() {
            return Graph.registry.vector.get(this.tree.paper);
        },

        parent: function() {
            return Graph.registry.shape.get(this.tree.parent);
        },

        children: function() {
            return this.tree.children;
        },

        hasChild: function(child) {
            return this.children().has(child);
        },

        addChild: function(child, relocate) {
            var children = this.children(),
                placeTarget = this.component('child'),
                guid = this.guid(),
                me = this;

            relocate = _.defaultTo(relocate, true);

            if ( ! _.isArray(child)) {
                child = [child];
            }

            var beforeDestroyHandler = _.bind(this.onChildBeforeDestroy, this);

            _.forEach(child, function(shape){
                var parent = shape.parent();

                if (parent && parent.guid() != guid) {
                    parent.removeChild(shape);
                }

                if ( ! children.has(shape)) {
                    var shapeComponent = shape.component();

                    if (relocate) {
                        shapeComponent.relocate(placeTarget);    
                    } else {
                        placeTarget.append(shapeComponent);
                    }
                    
                    shape.cached.beforeDestroyHandler = _.bind(me.onChildBeforeDestroy, me);
                    shape.cached.afterDragHandler = _.bind(me.onChildAfterDrag, me);
                    shape.cached.connectHandler = _.bind(me.onChildConnect, me);

                    shape.on('beforedestroy', shape.cached.beforeDestroyHandler);
                    shape.on('afterdrag', shape.cached.afterDragHandler);
                    shape.on('connect', shape.cached.connectHandler);

                    children.push(shape);
                    shape.tree.parent = guid;

                    // update shape props
                    var matrix = shapeComponent.matrix();

                    shape.data({
                        left: matrix.props.e,
                        top: matrix.props.f
                    });
                }
            });

            if (relocate) {
                this.autoResize();    
            }
        },

        removeChild: function(child) {
            var children = this.children();

            if (children.has(child)) {
                children.pull(child);
                child.tree.parent = null;
            }
        },

        guid: function() {
            return this.props.guid;
        },

        matrix: function() {
            return this.component().matrix();
        },

        bbox: function() {
            return Graph.bbox({
                 x: this.props.left,
                 y: this.props.top,
                x2: this.props.left + this.props.width,
                y2: this.props.top + this.props.height,
                width: this.props.width,
                height: this.props.height
            });
        },

        render: function(paper) {
            var guid = this.guid(),
                paperGuid = paper.guid();

            var component = this.component();
            component && component.render(paper);
            
            // save
            this.tree.paper = paperGuid;
            Graph.registry.shape.setContext(guid, paperGuid);
        },

        select: function(single) {
            var blockComponent = this.component('block'),
                paper = this.paper();

            single = _.defaultTo(single, false);

            if (single && paper) {
                paper.collector().clearCollection();
            }

            if (blockComponent) {
                blockComponent.select();
            }
        },

        deselect: function() {
            var blockComponent = this.component('block');
            if (blockComponent) {
                blockComponent.deselect();
            }
        },

        remove: function() {
            // just fire block removal
            this.component('block').remove();
        },

        refresh: _.debounce(function() {
            if (this.layout.suspended) {
                return;
            }

            var label = this.component('label'),
                block = this.component('block'),
                bound = block.bbox().toJson();

            label.attr({
                x: bound.x + bound.width  / 2,
                y: bound.x + bound.height / 2
            });

            label.wrap(bound.width - 10);

        }, 1),

        autoResize: function() {

        },

        center: function() {
            var bbox = this.component().bboxView().toJson();
            return {
                x: (bbox.x + bbox.x2) / 2,
                y: (bbox.y + bbox.y2) / 2
            };
        },

        translate: function(dx, dy) {
            var component = this.component();
            component.translate(dx, dy).commit();

            // update props
            var matrix = component.matrix(),
                left = matrix.props.e,
                top = matrix.props.f;

            this.data({
                left: left,
                top: top
            });

            var childComponent = this.component('child');

            if (childComponent) {
                childComponent.dirty(true);
            }

        },

        cascade: function(handler) {
            cascade(this, handler);
        },

        sendToBack: function() {
            var parent = this.parent(),
                container = parent 
                    ? parent.component('child').elem
                    : this.paper().viewport().elem;

            container && container.prepend(this.component().elem);
        },

        sendToFront: function() {
            var parent = this.parent(),
                container = parent 
                    ? parent.component('child').elem
                    : this.paper().viewport().elem;

            container && container.append(this.component().elem);
        },

        suspendLayout: function() {
            this.layout.suspended = true;
        },

        resumeLayout: function() {
            this.layout.suspended = false;
        },

        /**
         *  Use this method only for updating `width`, `height`, `left`, `top`
         *  otherwise use data()
         */
        attr: function(name, value) {
            var me = this;

            if (_.isPlainObject(name)) {
                _.forOwn(name, function(v, k){
                    me.props[k] = v;
                });
                return this;
            }

            if (value === undefined) {
                return this.props[name];
            }

            this.props[name] = value;
            return this;
        },

        height: function(value) {
            if (value === undefined) {
                return this.props.height;
            }

            var block = this.component('block'),
                box = block.bbox().toJson(),
                sx = 1,
                sy = value / this.props.height,
                cx = (box.x + box.x2) / 2,
                cy = box.y,
                dx = 0,
                dy = 0;

            var resize = block.resize(sx, sy, cx, cy, dx, dy);
            block.fire('afterresize', resize);
            
            this.props.height = value;
            return this;
        },

        width: function(value) {
            if (value === undefined) {
                return this.props.width;
            }

            var block = this.component('block'),
                box = block.bbox().toJson(),
                sx = value / this.props.width,
                sy = 1,
                cx = box.x,
                cy = (box.y + box.y2) / 2,
                dx = 0,
                dy = 0;

            var resize = block.resize(sx, sy, cx, cy, dx, dy);
            block.fire('afterresize', resize);

            this.props.width = value;
            return this;
        },

        left: function(value) {
            if (value === undefined) {
                return this.props.left;
            }

            var shape = this.component(),
                matrix = shape.matrix(),
                dx = value - matrix.props.e,
                dy = 0;

            shape.translate(dx, dy).commit();
            this.props.left = value;

            return this;
        },

        top: function(value) {
            if (value === undefined) {
                return this.props.top;
            }

            var shape = this.component(),
                matrix = shape.matrix(),
                dx = 0,
                dy = value - matrix.props.f;

            shape.translate(dx, dy).commit();
            this.props.top = value;

            return this;
        },

        rotate: function(value) {
            var block = this.component('block');
            if (block && block.isRotatable()) {
                var center = block.bbox().toJson();
                block.rotate(value, center.x, center.y).commit();
            }
        },

        label: function(label) {
            if (label === undefined) {
                return this.props.label;
            }

            var blockComponent = this.component('block'),
                labelComponent = this.component('label');

            labelComponent.props.text = label;
            blockComponent.data('text', label);

            this.props.label = label;
            this.refresh();
        },

        fill: function(value) {
            if (value === undefined) {
                return this.props.fill;
            }
            this.props.fill = value;
            this.component('block').elem.css('fill', value);
        },

        stroke: function(value) {
            if (value === undefined) {
                return this.props.stroke;
            }
            
            this.props.stroke = value;
            this.component('block').elem.css('stroke', value);
        },

        strokeWidth: function(value) {
            if (value === undefined) {
                return this.props.strokeWidth;
            }

            this.props.strokeWidth = value;
            this.component('block').elem.css('stroke-width', value);
        },

        connect: function(target, start, end, options){
            var sourceNetwork = this.connectable().plugin(),
                targetNetwork = target.connectable().plugin();

            if (sourceNetwork && targetNetwork) {
                return sourceNetwork.connect(targetNetwork, start, end, options);
            }

            return false;
        },

        disconnect: function(target, link) {
            var sourceNetwork = this.connectable().plugin(),
                targetNetwork = target.connectable().plugin();

            if (sourceNetwork && targetNetwork) {
                return sourceNetwork.disconnect(targetNetwork, link);
            }

            return false;
        },

        toJson: function() {
            var blockComponent = this.component('block'),
                paper = this.paper();

            var shape = {
                metadata: {

                },
                props: {
                    id: this.props.id,
                    type: this.toString(),
                    mode: this.props.mode,
                    guid: this.props.guid,
                    pool: null,
                    parent: this.tree.parent,
                    label: this.props.label,
                    left: this.props.left,
                    top: this.props.top,
                    width: this.props.width,
                    height: this.props.height,
                    rotate: this.props.rotate,
                    fill: this.props.fill,
                    strokeWidth: this.props.strokeWidth,
                    stroke: this.props.stroke,
                    dataSource: this.props.dataSource
                },
                params: this.params,
                links: [
                    
                ]
            };

            var network = this.connectable().plugin();

            if (network) {
                var connections = network.connections();

                _.forEach(connections, function(conn){
                    var linkData = conn.link.toJson();

                    shape.links.push({
                        guid: conn.guid,
                        mode: conn.type,
                        pair: conn.type == 'outgoing' ? linkData.props.target : linkData.props.source
                    });
                });
            }

            return shape;
        },

        ///////// PRIVATE OBSERVERS /////////

        onLabelEdit: function(e) {
            this.label(e.text);
        },

        onBeforeDrag: function(e) {
            this.fire(e);
            this.paper().diagram().capture();
        },

        onAfterDrag: function(e) {
            var blockComponent = this.component('block'),
                shapeComponent = this.component('shape'),
                childComponent = this.component('child'),
                blockMatrix = blockComponent.matrix();

            var shapeMatrix;

            blockComponent.reset();

            shapeComponent.matrix().multiply(blockMatrix);
            shapeComponent.attr('transform', shapeComponent.matrix().toValue());
            shapeComponent.dirty(true);

            if (childComponent) {
                childComponent.dirty(true);
            }

            // update props
            shapeMatrix = shapeComponent.matrix();

            this.data({
                left: shapeMatrix.props.e,
                top: shapeMatrix.props.f
            });

            // forward
            this.fire(e);
        },

        onAfterRotate: function(e) {
            var shapeComponent = this.component('shape'),
                blockComponent = this.component('block'),
                childComponent = this.component('child');

            var shapeMatrix = shapeComponent.matrix();

            shapeMatrix.multiply(blockComponent.matrix());
            shapeComponent.attr('transform', shapeMatrix.toValue());
            shapeComponent.dirty(true);

            if (childComponent) {
                childComponent.dirty(true);
            }

            blockComponent.reset();
            blockComponent.rotatable().redraw();

            if (blockComponent.isResizable() && blockComponent.resizable().props.suspended === false) {
                blockComponent.resizable().redraw();    
            }

            var shapeRotate = shapeMatrix.rotate();
            this.props.rotate = shapeRotate.deg;
        },

        onSelect: function(e) {
            this.component('shape').addClass('shape-selected');
            if (e.initial) {
                Graph.topic.publish('shape:select', {shape: this});    
            }
        },

        onDeselect: function(e) {
            this.component('shape').removeClass('shape-selected');
            if (e.initial) {
                Graph.topic.publish('shape:deselect', {shape: this});
            }
        },

        onConnect: function(e) {
            var link = e.link,
                sourceVector = link.router.source(),
                targetVector = link.router.target();

            if (sourceVector && targetVector) {
                var sourceShape = Graph.registry.shape.get(sourceVector),
                    targetShape = Graph.registry.shape.get(targetVector);

                if (sourceShape && targetShape) {
                    this.fire('connect', {
                        link: link,
                        source: sourceShape,
                        target: targetShape
                    });
                }
            }
        },

        onAfterResize: function() {
            this.refresh();
        },

        onBeforeDestroy: function() {
            this.fire('beforedestroy', {shape: this});
        },

        onAfterDestroy: function() {
            // remove label
            this.component('label').remove();

            // remove shape
            this.component('shape').remove();

            for (var name in this.components) {
                this.components[name] = null;
            }

            this.fire('afterdestroy', {shape: this});
            Graph.registry.shape.unregister(this);
        },

        onChildConnect: function(e) {

        },

        onChildAfterDrag: function(e) {
            var childComponent;

            if (e.batch) {
                if (e.master) {
                    childComponent = this.component('child');
                    if (childComponent) {
                        childComponent.dirty(true);
                    }
                }
            } else {
                childComponent = this.component('child');
                if (childComponent) {
                    childComponent.dirty(true);
                }
            }
        },

        onChildBeforeDestroy: function(e) {
            var shape = e.shape;

            this.children().pull(shape);

            shape.off('beforedestroy', shape.cached.beforeDestroyHandler);
            shape.off('afterdrag', shape.cached.afterDragHandler);
            shape.off('connect', shape.cached.connectHandler);

            shape.cached.beforeDestroyHandler = null;
            shape.cached.afterDragHandler = null;
            shape.cached.connectHandler = null;

            var childComponent = shape.component('child');

            if (childComponent) {
                childComponent.dirty(true);
            }
        },

        onConfigToolClick: function(e) {

        },

        onTrashToolClick: function(e) {
            this.paper().diagram().capture();
            this.remove();
        },

        onLinkToolClick: function(e) {
            var paper = this.paper();

            if (paper) {
                var layout = paper.layout(),
                    linker = paper.plugins.linker,
                    coord  = layout.pointerLocation(e);

                paper.tool().activate('linker');
                linker.start(this.connectable().component(), coord);
            }
        },

        onFrontToolClick: function(e) {
            this.sendToFront();
        },

        onBackToolClick: function(e) {
            this.sendToBack();
        }
    });

    ///////// STATICS /////////

    Shape.guid = 0;

    ///////// EXTENSION /////////

    Graph.isShape = function(obj) {
        return obj instanceof Graph.shape.Shape;
    };

    ///////// HELPERS /////////

    function cascade(shape, handler) {
        var child = shape.children().toArray();
        var result;

        result = handler.call(shape, shape);
        result = _.defaultTo(result, true);

        if (result && child.length) {
            _.forEach(child, function(curr){
                cascade(curr, handler);
            });
        }
    }

}());


(function(){

    Graph.ns('Graph.shape.activity');

    Graph.shape.activity.Start = Graph.extend(Graph.shape.Shape, {

        props: {
            label: 'Start',
            width: 60,
            height: 60,
            left: 0,
            top: 0
        },

        metadata: {
            type: 'activity.start',
            style: 'graph-shape-activity-start'
        },

        initComponent: function() {
            var comp = this.components,
                pmgr = this.plugins.manager;

            var shape, block, label;

            shape = (new Graph.svg.Group(this.props.left, this.props.top))
                .selectable(false);

            var cx = this.props.width / 2,
                cy = this.props.height / 2;

            block = (new Graph.svg.Ellipse(cx, cy, cx, cy))
                .addClass(Graph.styles.SHAPE_BLOCK)
                .style({
                    fill: this.props.fill,
                    stroke: this.props.stroke,
                    strokeWidth: this.props.strokeWidth
                })
                .data('text', this.props.label)
                .render(shape);

            block.elem.data(Graph.string.ID_SHAPE, this.guid());

            pmgr.install('dragger', block, {ghost: true, cls: Graph.styles.SHAPE_DRAG});
            pmgr.install('network', block, {wiring: 'h:v'});
            pmgr.install('resizer', block);
            pmgr.install('editor',  block);
            pmgr.install('snapper', block);

            block.on('edit.shape',      _.bind(this.onLabelEdit, this));
            block.on('beforedrag.shape', _.bind(this.onBeforeDrag, this));
            block.on('afterdrag.shape',   _.bind(this.onAfterDrag, this));
            block.on('afterresize.shape',    _.bind(this.onAfterResize, this));
            block.on('beforedestroy.shape',    _.bind(this.onBeforeDestroy, this));
            block.on('afterdestroy.shape',    _.bind(this.onAfterDestroy, this));
            block.on('select.shape',    _.bind(this.onSelect, this));
            block.on('deselect.shape',  _.bind(this.onDeselect, this));
            block.on('connect.shape', _.bind(this.onConnect, this));

            label = (new Graph.svg.Text(cx, cy, this.props.label))
                .addClass(Graph.styles.SHAPE_LABEL)
                .selectable(false)
                .clickable(false)
                .render(shape);

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();

            shape = block = label = null;
        },

        refresh: function() {
            if (this.layout.suspended) {
                return;
            }
            
            var block = this.component('block'),
                shape = this.component('shape'),
                label = this.component('label');

            var matrix, bound, cx, cy;

            bound  = block.bbox().toJson(),
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toValue());

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

            // update props

            matrix = shape.matrix();

            this.data({
                left: matrix.props.e,
                top: matrix.props.f,
                width: bound.width,
                height: bound.height
            });

            bound  = null;
            matrix = null;
        },

        toString: function() {
            return 'Graph.shape.activity.Start';
        }

    });

    ///////// STATIC /////////

}());


(function(){

    Graph.shape.activity.Final = Graph.extend(Graph.shape.Shape, {

        props: {
            label: 'End',
            width: 60,
            height: 60,
            left: 0,
            top: 0,
            fill: '#FF4081'
        },

        metadata: {
            type: 'activity.final',
            style: 'graph-shape-activity-final'
        },

        initComponent: function() {
            var comp = this.components,
                pmgr = this.plugins.manager;

            var shape, block, inner, label;

            shape = (new Graph.svg.Group(this.props.left, this.props.top))
                .selectable(false);

            var cx = this.props.width / 2,
                cy = this.props.height / 2;

            block = (new Graph.svg.Ellipse(cx, cy, cx, cy))
                .addClass(Graph.styles.SHAPE_BLOCK)
                .style({
                    stroke: this.props.stroke,
                    strokeWidth: this.props.strokeWidth
                })
                .data('text', this.props.label)
                .render(shape);

            block.elem.data(Graph.string.ID_SHAPE, this.guid());

            pmgr.install('dragger', block, {ghost: true, cls: Graph.styles.SHAPE_DRAG});
            pmgr.install('network', block, {wiring: 'h:v'});
            pmgr.install('resizer', block);
            pmgr.install('editor',  block);
            pmgr.install('snapper', block);

            block.on('edit.shape',      _.bind(this.onLabelEdit, this));
            block.on('beforedrag.shape', _.bind(this.onBeforeDrag, this));
            block.on('afterdrag.shape',   _.bind(this.onAfterDrag, this));
            block.on('afterresize.shape',    _.bind(this.onAfterResize, this));
            block.on('beforedestroy.shape',    _.bind(this.onBeforeDestroy, this));
            block.on('afterdestroy.shape',    _.bind(this.onAfterDestroy, this));
            block.on('select.shape',    _.bind(this.onSelect, this));
            block.on('deselect.shape',  _.bind(this.onDeselect, this));
            block.on('connect.shape', _.bind(this.onConnect, this));

            inner = (new Graph.svg.Ellipse(cx, cy, cx - 6, cy - 6))
                .addClass('comp-inner')
                .style({
                    fill: this.props.fill
                })
                .clickable(false)
                .selectable(false)
                .render(shape);

            label = (new Graph.svg.Text(cx, cy, this.props.label))
                .addClass(Graph.styles.SHAPE_LABEL)
                .addClass('comp-label')
                .selectable(false)
                .clickable(false)
                .render(shape);

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();
            comp.inner = inner.guid();

            shape = block = label = inner = null;
        },

        fill: function(value) {
            if (value === undefined) {
                return this.props.value;
            }

            this.component('inner').elem.css('fill', value);
            this.props.fill = value;

            return this;
        },

        refresh: function() {
            if (this.layout.suspended) {
                return;
            }

            var block = this.component('block'),
                shape = this.component('shape'),
                inner = this.component('inner'),
                label = this.component('label');

            var matrix, bound, cx, cy;

            bound  = block.bbox().toJson(),
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toValue());

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

            // update props
            matrix = shape.matrix();

            this.data({
                left: matrix.props.e,
                top: matrix.props.f,
                width: bound.width,
                height: bound.height
            });

            bound  = null;
            matrix = null;
        },

        toString: function() {
            return 'Graph.shape.activity.Final';
        },

        onAfterDestroy: function() {
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
            
            this.fire('afterdestroy');
        }

    });

    ///////// STATIC /////////


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

        metadata: {
            type: 'activity.action',
            icon: Graph.icons.SHAPE_ACTION,
            style: 'graph-shape-activity-action'
        },

        initComponent: function() {
            var comp = this.components,
                pmgr = this.plugins.manager;

            var shape, block, label;

            var cx = this.props.width / 2,
                cy = this.props.height / 2;

            shape = (new Graph.svg.Group(this.props.left, this.props.top))
                .selectable(false);

            block = (new Graph.svg.Rect(0, 0, this.props.width, this.props.height))
                .addClass(Graph.styles.SHAPE_BLOCK)
                .style({
                    fill: this.props.fill,
                    stroke: this.props.stroke,
                    strokeWidth: this.props.strokeWidth
                })
                .data('text', this.props.label)
                .render(shape);

            block.elem.data(Graph.string.ID_SHAPE, this.guid());

            pmgr.install('dragger', block, {ghost: true, cls: Graph.styles.SHAPE_DRAG});
            pmgr.install('resizer', block);
            pmgr.install('editor',  block);
            pmgr.install('network', block, {wiring: 'h:v'});
            pmgr.install('snapper', block);
            pmgr.install('rotator', block);

            block.on('edit.shape', _.bind(this.onLabelEdit, this));
            block.on('beforedrag.shape', _.bind(this.onBeforeDrag, this));
            block.on('afterdrag.shape', _.bind(this.onAfterDrag, this));
            block.on('afterresize.shape', _.bind(this.onAfterResize, this));
            block.on('beforedestroy.shape', _.bind(this.onBeforeDestroy, this));
            block.on('afterdestroy.shape', _.bind(this.onAfterDestroy, this));
            block.on('select.shape', _.bind(this.onSelect, this));
            block.on('deselect.shape', _.bind(this.onDeselect, this));
            block.on('connect.shape', _.bind(this.onConnect, this));
            block.on('afterrotate.shape', _.bind(this.onAfterRotate, this));

            label = (new Graph.svg.Text(cx, cy, this.props.label))
                .addClass(Graph.styles.SHAPE_LABEL)
                .clickable(false)
                .selectable(false)
                .render(shape);

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();

            if (this.props.rotate) {
                this.rotate(this.props.rotate);
            }

            shape = block = label = null;
        },
        
        refresh: function() {
            if (this.layout.suspended) {
                return;
            }
            
            var block = this.component('block'),
                shape = this.component('shape'),
                label = this.component('label');

            var bound, matrix;

            bound = block.bbox().toJson();
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toValue());

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

            // update props


            matrix = shape.matrix();
            
            this.data({
                left: matrix.props.e,
                top: matrix.props.f,

                width: bound.width,
                height: bound.height
            });

            bound  = null;
            matrix = null;
        },

        onAfterResize: function() {
            this.refresh();
        },

        toString: function() {
            return 'Graph.shape.activity.Action';
        }

    });

    ///////// STATIC /////////

}());


(function(){

    Graph.shape.activity.Router = Graph.extend(Graph.shape.Shape, {

        props: {
            label: 'Route',
            mode: 'xor', // none | parallel | or | xor | complex | event
            width: 100,
            height: 100,
            left: 0,
            top: 0
        },

        metadata: {
            type: 'activity.router',
            icon: Graph.icons.ROUTER_NONE,
            style: 'graph-shape-activity-router'
        },

        constructor: function() {
            if (this.props.mode != 'none') {
                this.props.width = this.props.height = 50;
            }
            this.superclass.prototype.constructor.apply(this, arguments);
        },

        initMetadata: function() {
            this.metadata.tools = [
                {
                    name: 'mode-none',
                    icon: Graph.icons.ROUTER_NONE,
                    title: Graph._('Change to default mode'),
                    enabled: true,
                    handler: _.bind(this.onModeClick, this, _, 'none')
                },
                {
                    name: 'mode-or',
                    icon: Graph.icons.ROUTER_OR,
                    title: Graph._('Change to OR mode'),
                    enabled: true,
                    handler: _.bind(this.onModeClick, this, _, 'or')
                },
                {
                    name: 'mode-xor',
                    icon: Graph.icons.ROUTER_XOR,
                    title: Graph._('Change to XOR mode'),
                    enabled: true,
                    handler: _.bind(this.onModeClick, this, _, 'xor')
                },
                {
                    name: 'mode-parallel',
                    icon: Graph.icons.ROUTER_PARALLEL,
                    title: Graph._('Change to parallel mode'),
                    enabled: true,
                    handler: _.bind(this.onModeClick, this, _, 'parallel')
                },
                {
                    name: 'config',
                    icon: Graph.icons.CONFIG,
                    title: Graph._('Click to config shape'),
                    enabled: true
                },
                {
                    name: 'link',
                    icon: Graph.icons.LINK,
                    title: Graph._('Click to start shape linking'),
                    enabled: true,
                    handler: _.bind(this.onLinkToolClick, this)
                },
                {
                    name: 'sendtofront',
                    icon: Graph.icons.SEND_TO_FRONT,
                    title: Graph._('Send to front'),
                    enabled: true,
                    handler: _.bind(this.onFrontToolClick, this)
                },
                {
                    name: 'sendtoback',
                    icon: Graph.icons.SEND_TO_BACK,
                    title: Graph._('Send to back'),
                    enabled: true,
                    handler: _.bind(this.onBackToolClick, this)
                },
                {
                    name: 'trash',
                    icon: Graph.icons.TRASH,
                    title: Graph._('Click to remove shape'),
                    enabled: true,
                    handler: _.bind(this.onTrashToolClick, this)
                }
            ];
        },

        initComponent: function() {
            var comp = this.components,
                pmgr = this.plugins.manager;

            var shape, block, label, mode;

            var points = [
                this.props.width / 2, 0,
                this.props.width, this.props.height / 2,
                this.props.width / 2, this.props.height,
                0, this.props.height / 2
            ];

            var cx = points[0],
                cy = points[3];

            shape = (new Graph.svg.Group(this.props.left, this.props.top))
                .selectable(false);

            block = (new Graph.svg.Polygon(points))
                .addClass(Graph.styles.SHAPE_BLOCK)
                .data('text', this.props.label)
                .render(shape);

            block.elem.data(Graph.string.ID_SHAPE, this.guid());
            
            pmgr.install('dragger', block, {ghost: true, cls: Graph.styles.SHAPE_DRAG});
            pmgr.install('resizer', block);
            pmgr.install('editor',  block);
            pmgr.install('network', block, {wiring: 'v:v'});
            pmgr.install('snapper', block);

            block.on('edit.shape',      _.bind(this.onLabelEdit, this));
            block.on('beforedrag.shape', _.bind(this.onBeforeDrag, this));
            block.on('afterdrag.shape',   _.bind(this.onAfterDrag, this));
            block.on('afterresize.shape',    _.bind(this.onAfterResize, this));
            block.on('beforedestroy.shape',    _.bind(this.onBeforeDestroy, this));
            block.on('afterdestroy.shape',    _.bind(this.onAfterDestroy, this));
            block.on('select.shape',    _.bind(this.onSelect, this));
            block.on('deselect.shape',  _.bind(this.onDeselect, this));
            block.on('connect.shape', _.bind(this.onConnect, this));

            label = (new Graph.svg.Text(cx, cy, this.props.label))
                .addClass(Graph.styles.SHAPE_LABEL)
                .clickable(false)
                .selectable(false)
                .render(shape);

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();

            shape = block = label = null;

            this.mode(this.props.mode);
        },

        mode: function(mode) {
            if (mode === undefined) {
                return this.props.mode;
            }
            
            this.props.mode = mode;

            var inner;

            if (this.props.mode != 'none') {
                
                this.component('label').hide();
                this.component('block').resizable().disable();

                if (this.components.inner) {
                    this.component('inner').remove();
                }

                var shape = this.component();

                switch(mode) {
                    case 'parallel':
                        inner = (new Graph.svg.Path('M 10 25 L 25 25 L 25 40 L 25 25 L 40 25 L 25 25 L 25 10'));
                        break;
                    case 'or':
                        inner = (new Graph.svg.Circle(25, 25, 10));
                        break;
                    case 'xor':
                        inner = (new Graph.svg.Path('M 15 15 L 25 25 L 15 35 L 25 25 L 35 35 L 25 25 L 35 15'));
                        break;
                }

                if (inner) {
                    inner.addClass('comp-inner');
                    inner.selectable(false);
                    inner.clickable(false);
                    inner.render(shape);

                    this.components.inner = inner.guid();
                }
            } else {
                this.component('label').show();
                this.component('block').resizable().enable();

                inner = this.component('inner');

                if (inner) {
                    inner.remove();
                    this.components.inner = null;
                }

            }

            return this;
        },

        width: function(value) {
            if (value === undefined) {
                return this.props.width;
            }

            var box = this.component('block').bbox().toJson(),
                sx = value / this.props.width,
                sy = 1,
                cx = box.x,
                cy = (box.y + box.y2) / 2,
                dx = 0,
                dy = 0;

            this.component('block').resize(sx, sy, cx, cy, dx, dy);
            this.component().dirty(true);

            this.props.width = value;
            return this;
        },

        height: function(value) {
            if (value === undefined) {
                return this.props.height;
            }

            var block = this.component('block'),
                box = block.bbox().toJson(),
                sx = 1,
                sy = value / this.props.height,
                cx = (box.x + box.x2) / 2,
                cy = box.y,
                dx = 0,
                dy = 0;

            var resize = block.resize(sx, sy, cx, cy, dx, dy);
            block.fire('afterresize', resize);

            this.props.height = value;
            return this;
        },

        refresh: function() {
            if (this.layout.suspended) {
                return;
            }

            var block = this.component('block'),
                shape = this.component('shape'),
                label = this.component('label');

            var bound, matrix;

            bound = block.bbox().toJson();
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toValue());

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

            // update props

            matrix = shape.matrix();

            this.data({
                left: matrix.props.e,
                top: matrix.props.f,
                width: bound.width,
                height: bound.height
            });

            matrix = null;
            bound  = null;
        },

        toString: function() {
            return 'Graph.shape.activity.Router';
        },

        onModeClick: function(e, mode) {
            this.mode(mode);
        }

    });

    ///////// STATIC /////////

}());


(function(){

    Graph.shape.activity.Fork = Graph.extend(Graph.shape.Shape, {
        props: {
            width: 300,
            height: 15,
            left: 0,
            top: 0
        },

        metadata: {
            type: 'activity.fork',
            style: 'graph-shape-activity-fork'
        },

        initComponent: function() {
            var comp = this.components,
                pmgr = this.plugins.manager;

            var shape, block, label;

            shape = (new Graph.svg.Group(this.props.left, this.props.top))
                .selectable(false);

            block = (new Graph.svg.Rect(0, 0, this.props.width, this.props.height, 0))
                .addClass(Graph.styles.SHAPE_BLOCK)
                .render(shape);

            block.elem.data(Graph.string.ID_SHAPE, this.guid());

            pmgr.install('dragger', block, {ghost: true, cls: Graph.styles.SHAPE_DRAG});
            pmgr.install('resizer', block);
            pmgr.install('snapper', block);
            pmgr.install('network', block, {
                wiring: 'v:v', 
                tuning: false,
                limitIncoming: 1,
                limitOutgoing: 0
            });

            block.on('beforedrag.shape', _.bind(this.onBeforeDrag, this));
            block.on('afterdrag.shape',   _.bind(this.onAfterDrag, this));
            block.on('afterresize.shape',    _.bind(this.onAfterResize, this));
            block.on('beforedestroy.shape',    _.bind(this.onBeforeDestroy, this));
            block.on('afterdestroy.shape',    _.bind(this.onAfterDestroy, this));
            block.on('select.shape',    _.bind(this.onSelect, this));
            block.on('deselect.shape',  _.bind(this.onDeselect, this));
            block.on('connect.shape', _.bind(this.onConnect, this));
            
            label = (new Graph.svg.Text(0, 0, this.props.label))
                .addClass(Graph.styles.SHAPE_LABEL)
                .clickable(false)
                .selectable(false)
                .render(shape);


            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();
        },

        refresh: function() {
            if (this.layout.suspended) {
                return;
            }
            
            var block = this.component('block'),
                shape = this.component('shape');

            var bound, matrix;

            bound = block.bbox().toJson();
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toValue());

            block.attr({
                x: 0,
                y: 0
            });

            block.dirty(true);
            block.resizable().redraw();

            matrix = shape.matrix();

            this.data({
                left: matrix.props.e,
                top: matrix.props.f,
                width: bound.width,
                height: bound.height
            });

            bound  = null;
            matrix = null;
        },

        toString: function() {
            return 'Graph.shape.activity.Join';
        }
    });

    ///////// STATIC /////////

}());


(function(){

    Graph.shape.activity.Join = Graph.extend(Graph.shape.Shape, {
        props: {
            width: 300,
            height: 15,
            left: 0,
            top: 0
        },

        metadata: {
            type: 'activity.join',
            style: 'graph-shape-activity-join'
        },

        initComponent: function() {
            var comp = this.components,
                pmgr = this.plugins.manager;

            var shape, block, label;

            shape = (new Graph.svg.Group(this.props.left, this.props.top))
                .selectable(false);

            block = (new Graph.svg.Rect(0, 0, this.props.width, this.props.height, 0))
                .addClass(Graph.styles.SHAPE_BLOCK)
                .render(shape);

            block.elem.data(Graph.string.ID_SHAPE, this.guid());

            pmgr.install('dragger', block, {ghost: true, cls: Graph.styles.SHAPE_DRAG});
            pmgr.install('resizer', block);
            pmgr.install('snapper', block);
            pmgr.install('network', block, {
                wiring: 'v:v', 
                tuning: false,
                limitIncoming: 0,
                limitOutgoing: 1
            });

            block.on('beforedrag.shape', _.bind(this.onBeforeDrag, this));
            block.on('afterdrag.shape',   _.bind(this.onAfterDrag, this));
            block.on('afterresize.shape',    _.bind(this.onAfterResize, this));
            block.on('beforedestroy.shape',    _.bind(this.onBeforeDestroy, this));
            block.on('afterdestroy.shape',    _.bind(this.onAfterDestroy, this));
            block.on('select.shape',    _.bind(this.onSelect, this));
            block.on('deselect.shape',  _.bind(this.onDeselect, this));
            block.on('connect.shape', _.bind(this.onConnect, this));
            
            label = (new Graph.svg.Text(0, 0, this.props.label))
                .addClass(Graph.styles.SHAPE_LABEL)
                .clickable(false)
                .selectable(false)
                .render(shape);

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.label = label.guid();
        },

        refresh: function() {
            if (this.layout.suspended) {
                return;
            }
            
            var block = this.component('block'),
                shape = this.component('shape');

            var bound, matrix;

            bound = block.bbox().toJson();
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toValue());

            block.attr({
                x: 0,
                y: 0
            });

            block.dirty(true);
            block.resizable().redraw();

            matrix = shape.matrix();

            this.data({
                left: matrix.props.e,
                top: matrix.props.f,
                width: bound.width,
                height: bound.height
            });

            bound  = null;
            matrix = null;
        },

        toString: function() {
            return 'Graph.shape.activity.Join';
        }
    });

    ///////// STATIC /////////

}());


(function(){

    var TRANSFER_RECEIVE = 'receive',
        TRANSFER_DISPOSE = 'dispose';

    Graph.shape.activity.Lane = Graph.extend(Graph.shape.Shape, {

        props: {
            label: 'Participant Role',
            width: 1000,
            height: 200,
            left: 0,
            top: 0
        },

        components: {
            header: null
        },

        tree: {
            pool: null
        },

        transfer: null,

        resizing: null,

        metadata: {
            type: 'activity.lane',
            icon: Graph.icons.SHAPE_LANE,
            style: 'graph-shape-activity-lane'
        },

        constructor: function(options) {
            this.superclass.prototype.constructor.call(this, options);
        },

        initMetadata: function() {
            this.metadata.tools = [
                {
                    name: 'config',
                    icon: Graph.icons.CONFIG,
                    title: Graph._('Click to config shape'),
                    enabled: true
                },
                {
                    name: 'above',
                    icon: Graph.icons.LANE_ABOVE,
                    title: Graph._('Add shape above'),
                    enabled: true,
                    handler: _.bind(this.onAboveToolClick, this)
                },
                {
                    name: 'below',
                    icon: Graph.icons.LANE_BELOW,
                    title: Graph._('Add shape below'),
                    enabled: true,
                    handler: _.bind(this.onBelowToolClick, this)
                },
                {
                    name: 'moveup',
                    icon: Graph.icons.MOVE_UP,
                    title: Graph._('Move up'),
                    enabled: true,
                    handler: _.bind(this.onUpToolClick, this)
                },
                {
                    name: 'movedown',
                    icon: Graph.icons.MOVE_DOWN,
                    title: Graph._('Move down'),
                    enabled: true,
                    handler: _.bind(this.onDownToolClick, this)
                },
                {
                    name: 'sendtofront',
                    icon: Graph.icons.SEND_TO_FRONT,
                    title: Graph._('Send to front'),
                    enabled: true,
                    handler: _.bind(this.onFrontToolClick, this)
                },
                {
                    name: 'sendtoback',
                    icon: Graph.icons.SEND_TO_BACK,
                    title: Graph._('Send to back'),
                    enabled: true,
                    handler: _.bind(this.onBackToolClick, this)
                },
                {
                    name: 'trash',
                    icon: Graph.icons.TRASH,
                    title: Graph._('Click to remove shape'),
                    enabled: true,
                    handler: _.bind(this.onTrashToolClick, this)
                }
            ];
        },

        initComponent: function() {
            var comp = this.components,
                pmgr = this.plugins.manager;

            var shape, block, header, label, child;

            shape = (new Graph.svg.Group(this.props.left, this.props.top))
                .selectable(false);

            block = (new Graph.svg.Rect(0, 0, this.props.width, this.props.height, 0))
                .addClass(Graph.styles.SHAPE_BLOCK)
                .render(shape);

            block.elem.data(Graph.string.ID_SHAPE, this.guid());

            pmgr.install('resizer', block, {restriction: { width: 200, height: 100 }});
            pmgr.install('dragger', block, {ghost: true, batchSync: false, cls: Graph.styles.SHAPE_DRAG});

            block.on('beforedrag.shape', _.bind(this.onBeforeDrag, this));
            block.on('afterdrag.shape',   _.bind(this.onAfterDrag, this));
            block.on('beforeresize.shape', _.bind(this.onBeforeResize, this));
            block.on('afterresize.shape',    _.bind(this.onAfterResize, this));
            block.on('beforedestroy.shape',    _.bind(this.onBeforeDestroy, this));
            block.on('afterdestroy.shape',    _.bind(this.onAfterDestroy, this));
            block.on('select.shape',    _.bind(this.onSelect, this));
            block.on('deselect.shape',  _.bind(this.onDeselect, this));

            header = (new Graph.svg.Rect(0, 0, 30, this.props.height, 0))
                .addClass(Graph.styles.SHAPE_HEADER)
                .selectable(false)
                .render(shape);

            header.data('text', this.props.label);

            pmgr.install('editor', header, {
                width: 200, 
                height: 100,
                offset: 'pointer'
            });

            header.on('edit.shape', _.bind(this.onLabelEdit, this));

            var tx = 15,
                ty = this.props.height / 2;

            label = (new Graph.svg.Text(tx, ty, this.props.label))
                .addClass(Graph.styles.SHAPE_LABEL)
                .selectable(false)
                .clickable(false)
                .render(shape);

            label.rotate(270, tx, ty).commit();

            child = (new Graph.svg.Group())
                .addClass(Graph.styles.SHAPE_CHILD)
                .selectable(false)
                .render(shape);

            child.translate(50, 0).commit();

            comp.shape = shape.guid();
            comp.block = block.guid();
            comp.header = header.guid();
            comp.label = label.guid();
            comp.child = child.guid();

            // set virtual pool
            this.tree.pool = new Graph.shape.activity.Pool();
            this.tree.pool.insert(this);

            shape = block = header = label = null;
        },

        initDropzone: function() {
            var me = this,
                comp = me.component(),
                block = me.component('block'),
                children = me.children();

            block.interactable().dropzone({
                accept: '.shape-draggable',
                overlap: .2
            })
            .on('dragenter', function laneDragEnter(e){
                var poolGuid = me.pool().guid,
                    laneGuid = me.guid();

                var vector, shape, batch;

                if ( ! me.transfer) {
                    vector = Graph.registry.vector.get(e.relatedTarget);

                    if (vector) {

                        shape = Graph.registry.shape.get(vector);

                        if (shape) {

                            if (
                                (shape.guid() == laneGuid) || 
                                (shape.is('activity.lane') && shape.pool().guid == poolGuid)
                            ) {
                                return;
                            }

                            me.transfer = {
                                shape: shape,
                                batch: []
                            };

                            me.transfer.shape.on('afterdrag', onTransferEnd);
                            me.transfer.batch = [shape];

                            var collector = vector.collector();

                            if (collector) {
                                batch = collector.collection.toArray().slice();
                                
                                _.forEach(batch, function(v){
                                    var s = Graph.registry.shape.get(v);
                                    if (s && s.guid() != shape.guid()) {
                                        me.transfer.batch.push(s);
                                    }
                                });

                                batch = null;
                            }
                        }
                    }
                }

                if (me.transfer) {
                    comp.addClass('receiving');
                }
            })
            .on('dragleave', function laneDragLeave(e){
                comp.removeClass('receiving');
            })
            .on('drop', function laneDrop(e){
                if (me.transfer) {
                    var delay;

                    delay = _.delay(function(){
                        clearTimeout(delay);
                        delay = null;

                        // takeout lane from batch
                        var appended = [],
                            lanes = [],
                            poolGuid = me.pool().guid,
                            laneGuid = me.guid();

                        _.forEach(me.transfer.batch, function(shape){
                            if (shape.is('activity.lane')) {
                                if (shape.guid() != laneGuid && shape.pool().guid != poolGuid) {
                                    lanes.push(shape);
                                }
                            } else {
                                appended.push(shape);
                            }
                        });

                        if (appended.length) {
                            me.addChild(appended);
                        }

                        if (lanes.length) {
                            me.addSiblingBellow(lanes);
                        }

                    }, 0);

                }

                comp.removeClass('receiving');
            });

            block = null;

            /////////

            function onTransferEnd() {
                var delay;

                delay = _.delay(function(){

                    clearTimeout(delay);
                    delay = null;

                    me.transfer.shape.off('afterdrag', onTransferEnd);
                    me.transfer = null;

                }, 0);
            }
        },

        pool: function() {
            return this.tree.pool;
        },

        // @Override
        render: function(paper, method, sibling) {
            var component = this.component();

            method = _.defaultTo(method, 'prepend');

            component.render(paper, method, sibling);

            // save
            this.tree.paper = paper.guid();
            Graph.registry.shape.setContext(this.guid(), paper.guid());

            this.initDropzone();
        },

        sendToBack: function() {
            var paper = this.paper();
        },

        sendToFront: function() {
            this.pool().bringToFront(this);
        },

        refresh: function() {
            if (this.layout.suspended) {
                return;
            }

            var block = this.component('block'),
                shape = this.component('shape'),
                child = this.component('child'),
                header = this.component('header'),
                label = this.component('label');

            var matrix, bound;

            bound  = block.bbox().toJson();
            matrix = Graph.matrix().translate(bound.x, bound.y);

            shape.matrix().multiply(matrix);
            shape.attr('transform', shape.matrix().toValue());
            shape.dirty(true);
            child.dirty(true);

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

            // update props

            matrix = shape.matrix();

            this.data({
                left: matrix.props.e,
                top: matrix.props.f,
                width: bound.width,
                height: bound.height
            });

            bound  = null;
            matrix = null;
        },

        attr: function(name, value) {
            var result = this.superclass.prototype.attr.call(this, name, value),
                maps = {
                    width: 'width',
                    height: 'height',
                    left: 'x',
                    top: 'y'
                };

            var block, key, val;

            if (_.isPlainObject(name)) {

                block = this.component('block');

                for (key in name) {
                    if (maps[key]) {
                        val = name[key];
                        block.attr(maps[key], val);
                    }
                }

                this.refresh();

            } else if (value !== undefined) {
                block = this.component('block');

                if (maps[name]) {
                    block.attr(maps[name], value);
                }

                this.refresh();
            }

            return result;
        },

        height: function(value) {
            if (value !== undefined) {
                var childBox = this.component('child').bbox().toJson();
                value = Math.max(value, (childBox.y + childBox.height + 20));    
            }

            return this.superclass.prototype.height.call(this, value);
        },

        width: function(value) {
            if (value !== undefined) {
                var childBox = this.component('child').bbox().toJson();
                value = Math.max(value, (childBox.x + childBox.width + 20));
            }

            return this.superclass.prototype.width.call(this, value);
        },

        stroke: function(value) {
            var result = this.superclass.prototype.stroke.call(this, value);
            if (value !== undefined) {
                this.component('header').elem.css('stroke', this.props.stroke);
            }
            return result;
        },

        addChild: function(child, redraw) {
            this.superclass.prototype.addChild.call(this, child, redraw);
            this.pool().invalidate();
        },

        removeChild: function(child) {
            this.superclass.prototype.removeChild.call(this, child);
            this.pool().invalidate();
        },

        addSiblingBellow: function(lanes) {
            if ( ! _.isArray(lanes)) {
                lanes = [lanes];
            }

            var pool = this.pool(),
                height = _.reduce(
                    _.map(lanes, function(lane){
                        return lane.height();
                    }),
                    function(result, curr) {
                        return result + curr;
                    },
                    0
                ),
                offsetWidth = this.width(),
                offsetLeft = this.left(),
                offsetTop = (this.top() + this.height());

            pool.createSpaceBellow(this, height);

            _.forEach(lanes, function(lane){

                var boxBefore = lane.component().bboxView().clone().toJson();
                var boxAfter, dx, dy;

                lane.component().reset();

                lane.attr({
                    width: offsetWidth,
                    left: offsetLeft,
                    top: offsetTop
                });

                height = lane.height();
                offsetTop += height;
                
                lane.tree.pool = pool;
                pool.insert(lane);

                lane.children().each(function(c){
                    var netcom = c.connectable().component();
                    netcom && (netcom.dirty(true));
                });

                boxAfter = lane.component().bboxView().toJson();

                dx = boxAfter.x - boxBefore.x;
                dy = boxAfter.y - boxBefore.y;

                pool.relocateLinks(dx, dy, lane);
                
            });

            pool.invalidate();
            this.refreshSnapper();
            
        },

        createSiblingAbove: function(options) {
            var sibling = new Graph.shape.activity.Lane(options),
                paper = this.paper(),
                pool = this.pool();

            // create space above
            pool.createSpaceAbove(this, sibling.height());

            // sync position 'above'
            var top = (this.top() - sibling.height());

            sibling.attr({
                width: this.props.width,
                left: this.props.left,
                top: top
            });

            // sync pool
            sibling.tree.pool = pool;

            var result = pool.insert(sibling);

            if (result !== undefined) {
                sibling.render(paper, 'before', this.component());
                pool.invalidate();
                this.refreshSnapper();
            }

            return sibling;
        },

        createSiblingBellow: function(options) {
            var sibling = new Graph.shape.activity.Lane(options),
                paper = this.paper(),
                pool = this.pool();

            // create space
            pool.createSpaceBellow(this, sibling.height());

            // sync position 'bellow'
            var bottom = (this.top() + this.height());

            sibling.attr({
                width: this.props.width,
                left: this.props.left,
                top: bottom
            });

            // sync pool
            sibling.tree.pool = pool;

            var result = pool.insert(sibling);

            if (result !== undefined) {
                sibling.render(paper, 'after', this.component());
                pool.invalidate();
                this.refreshSnapper();
            }

            return sibling;
        },

        refreshSnapper: function() {
            this.paper().snapper().refresh();
        },

        autoResize: function() {

            var shapeComponent = this.component(),
                blockComponent = this.component('block');

            if (blockComponent.isSelected()) {
                blockComponent.deselect();
            }

            var bbox = this.bbox().toJson(),
                actualBBox = shapeComponent.bbox().toJson(),
                blockComponent = this.component('block'),
                padding = {
                    top: 20,
                    bottom: 20,
                    left: 40,
                    right: 20
                };

            var bounds = _.extend({}, bbox);
            
            if (actualBBox.y + padding.top - bbox.y < padding.top) {
                bounds.y = actualBBox.y - padding.top;
            }

            if (actualBBox.x + padding.left - bbox.x < padding.left) {
                bounds.x = actualBBox.x - padding.left;
            }

            if (bbox.x2 - actualBBox.x2 + padding.right < padding.right) {
                bounds.x2 = actualBBox.x2 + padding.right;
            }

            if (bbox.y2 - actualBBox.y2 + padding.bottom < padding.bottom) {
                bounds.y2 = actualBBox.y2 + padding.bottom;
            }

            var dx = bounds.x - bbox.x,
                dy = bounds.y - bbox.y;

            var width = bounds.x2 - bounds.x,
                height = bounds.y2 - bounds.y;

            var pool = this.pool(),
                curr = this.guid(),
                lanes = pool.populateChildren(),
                childOffsets = {};

            lanes.each(function(lane){
                var childBox = lane.component('child').bboxView().toJson();
                childOffsets[lane.guid()] = {
                    x: childBox.x,
                    y: childBox.y
                };
            });

            this.translate(dx, dy);

            this.attr({
                width: width,
                height: height
            });

            pool.resizeBy(this);

            lanes.each(function(lane){
                var child = lane.component('child'),
                    childBox = child.bboxView().toJson(),
                    offset = childOffsets[lane.guid()]

                if (offset) {
                    var dx = offset.x - childBox.x,
                        dy = offset.y - childBox.y;

                    child.translate(dx, dy).commit();
                }

            });

        },

        toString: function() {
            return 'Graph.shape.activity.Lane';
        },

        toJson: function() {
            var result = this.superclass.prototype.toJson.call(this);
            result.props.pool = this.pool().guid;
            return result;
        },

        onAfterDestroy: function() {
            var me = this, guid = this.guid();

            me.cascade(function(shape){
                if (shape.guid() != guid) {
                    shape.remove();
                }
            });

            this.pool().remove(this);

            // remove child
            this.component('child').remove();

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
            this.fire('afterdestroy');
        },

        onChildConnect: function(e) {
            var sourceParent = e.source.parent(),
                targetParent = e.target.parent();

            if (sourceParent && targetParent) {
                var sourcePool = sourceParent.pool(),
                    targetPool = targetParent.pool();

                if (sourcePool.guid != targetPool.guid) {
                    e.link.type('message');
                }
            }
        },

        onChildBeforeDestroy: function(e) {
            this.superclass.prototype.onChildBeforeDestroy.call(this, e);
            this.pool().invalidate();
        },

        onSelect: function(e) {
            var me = this, guid = me.guid();

            var delay = _.delay(function(){

                clearTimeout(delay);
                delay = null;

                me.cascade(function(curr){
                    if (curr.guid() != guid) {
                        var vector, network;

                        // deselect shape
                        vector = curr.draggable().component();

                        if (vector) {
                            vector.deselect();
                        }

                        // deselect links
                        network = curr.connectable().plugin();

                        if (network) {
                            var connections = network.connections();
                            _.forEach(connections, function(conn){
                                conn.link.deselect();
                            });
                        }
                        
                    }
                });

                me.component('shape').addClass('shape-selected');
                Graph.topic.publish('shape:select', {shape: me});

            }, 0);
        },

        onBeforeDrag: function(e) {
            if (e.master) {

                this.fire(e);
                this.paper().diagram().capture();

                var links = this.pool().populateLinks();
                var link, key;

                for (key in links.isolated) {
                    link = links.isolated[key].link;
                    link.deselect();
                }

                for (key in links.separated) {
                    link = links.separated[key].link;
                    link.deselect();
                }

            }
        },

        onAfterDrag: function(e) {
            if (e.master) {
                var blockComponent = this.component('block'),
                    shapeComponent = this.component('shape'),
                    childComponent = this.component('child'),
                    blockMatrix = blockComponent.matrix(),
                    pool = this.pool();

                var shapeMatrix;

                blockComponent.reset();

                shapeComponent.matrix().multiply(blockMatrix);
                shapeComponent.attr('transform', shapeComponent.matrix().toValue());
                shapeComponent.dirty(true);
                childComponent.dirty(true);

                // update props
                shapeMatrix = shapeComponent.matrix();

                this.data({
                    left: shapeMatrix.props.e,
                    top: shapeMatrix.props.f
                });

                // forward
                this.fire(e);

                // sync other
                pool.relocateSiblings(this, e.dx, e.dy);
                pool.refreshContents();

                // sync links
                pool.relocateLinks(e.dx, e.dy);
                pool.refreshChildren();

                this.refreshSnapper();
            }

        },

        onBeforeResize: function(e){
            this.resizing = {
                childOffsets: {}
            };

            // set resize restriction
            // calculate max children bound for all lanes
            var bounds = this.component('child').bboxView().toJson(),
                lanes = this.pool().populateChildren(),
                resizing = this.resizing;

            lanes.each(function(lane){
                var laneChildComponent = lane.component('child'),
                    laneChildBox = laneChildComponent.bboxView().toJson();

                resizing.childOffsets[lane.guid()] = {
                    x: laneChildBox.x,
                    y: laneChildBox.y
                };

                if (laneChildBox.x < bounds.x) {
                    bounds.x = laneChildBox.x;
                }

                if (bounds.x2 < laneChildBox.x2) {
                    bounds.x2 = laneChildBox.x2;
                }

            });

            var resizer = e.resizer,
                direction = e.direction,
                origin = {
                    x: bounds.x, 
                    y: bounds.y
                },
                padding = {
                    top: 10,
                    left: 40,
                    right: 10,
                    bottom: 10
                };

            switch(direction) {
                case 'n':
                    origin.x = (bounds.x + bounds.x2) / 2;
                    origin.y = bounds.y2 - padding.bottom;
                    break;
                case 'e':
                    origin.x = bounds.x + padding.right;
                    origin.y = (bounds.y + bounds.y2) / 2;
                    break;
                case 's':
                    origin.x = (bounds.x + bounds.x2) / 2;
                    origin.y = bounds.y + padding.top;
                    break;
                case 'w':
                    origin.x = bounds.x2 - padding.left;
                    origin.y = (bounds.y + bounds.y2) / 2;
                    break;
                case 'ne':
                    origin.x = bounds.x + padding.right;
                    origin.y = bounds.y2 - padding.bottom;
                    break;
                case 'se':
                    origin.x = bounds.x + padding.right;
                    origin.y = bounds.y + padding.top;
                    break;
                case 'sw':
                    origin.x = bounds.x2 - padding.left;
                    origin.y = bounds.y + padding.top;
                    break;
                case 'nw':
                    origin.x = bounds.x2 - padding.left;
                    origin.y = bounds.y2 - padding.bottom;
                    break;
            }

            var width = bounds.x2 - bounds.x,
                height = bounds.y2 - bounds.y;

            if (width <= 0) {
                width = 200;
            }

            if (height <= 0) {
                height = 100;
            }

            resizer.restrict({
                width: width,
                height: height,
                origin: origin
            });

        },

        onAfterResize: function(e) {
            this.superclass.prototype.onAfterResize.call(this, e);

            var pool = this.pool();
            pool.resizeBy(this);

            if (this.resizing) {
                var lanes = pool.populateChildren(),
                    resizing = this.resizing;

                lanes.each(function(lane){
                    var child = lane.component('child'),
                        childBox = child.bboxView().toJson(),
                        offset = resizing.childOffsets[lane.guid()];

                    if (offset) {
                        var dx = offset.x - childBox.x,
                            dy = offset.y - childBox.y;

                        child.translate(dx, dy).commit();
                    }

                });

                this.resizing = resizing = null;
            }

        },

        onAboveToolClick: function(e) {
            this.createSiblingAbove();
        },

        onBelowToolClick: function(e) {
            this.createSiblingBellow();
        },

        onUpToolClick: function(e) {
            this.pool().moveUp(this);
            this.refreshSnapper();
        },

        onDownToolClick: function(e) {
            this.pool().moveDown(this);
            this.refreshSnapper();
        }

    });

    ///////// STATIC /////////

}());


(function(){

    /**
     * Virtual pool for lanes
     */

    var Pool = Graph.shape.activity.Pool = function() {
        this.guid = 'pool-' + (++Pool.guid);

        // tree nodes
        this.lanes = (new Graph.collection.Tree([]))
            .keygen(function(lane){
                return lane.bbox.y;
                // return (lane.bbox.y + (1e-9 * lane.bbox.x));
            });

        this.cached = {
            nodes: {},
            contents: null
        };
    };

    Pool.prototype.invalidate = function() {
        this.cached.contents = null;
    };

    Pool.prototype.populateChildren = function() {
        var children = [];

        _.forEach(this.lanes.toArray(), function(node){
            var lane = Graph.registry.shape.get(node.lane);
            children.push(lane);
        });

        return new Graph.collection.Shape(children);
    };

    Pool.prototype.bbox = function() {
        var nodes = this.lanes.toArray(),
             x = [],
             y = [],
            x2 = [],
            y2 = [];

        var bbox;

        for (var i = nodes.length - 1; i >= 0; i--) {
            bbox = nodes[i].bbox;

            x.push(bbox.x);
            y.push(bbox.y);

            x2.push(bbox.x + bbox.width);
            y2.push(bbox.y + bbox.height);
        }

         x = _.min(x);
         y = _.min(y);
        x2 = _.max(x2);
        y2 = _.max(y2);

        nodes = null;

        return Graph.bbox({
            x: x,
            y: y,
            x2: x2,
            y2: y2,
            width: x2 - x,
            height: y2 - y
        });
    };

    Pool.prototype.get = function(index) {
        var data = this.lanes.get(index);
        if (data) {
            return Graph.registry.shape.get(data.lane);
        }
        return null;
    };

    Pool.prototype.prev = function(lane) {
        var index = this.index(lane),
            prev = this.lanes.get(index - 1);

        if (prev) {
            return Graph.registry.shape.get(prev.lane);
        }

        return null;
    };

    Pool.prototype.last = function() {
        var index = this.size() - 1,
            last = this.lanes.get(index);

        if (last) {
            return Graph.registry.shape.get(last.lane);
        }

        return null;
    };

    /**
     * Create new space
     */
    Pool.prototype.createSpaceAbove = function(lane, height) {
        var laneIndex = this.index(lane),
            prev = this.lanes.get(laneIndex - 1),
            me = this;

        if (prev) {
            this.lanes.bubble(prev, function(curr){
                var shape = Graph.registry.shape.get(curr.lane);
                if (shape) {
                    shape.translate(0, -height);
                    curr.bbox = shape.bbox().toJson();

                    shape.children().each(function(c){
                        var comnet = c.connectable().component();
                        comnet && (comnet.dirty(true));
                    });

                    me.relocateLinks(0, -height, shape);
                }
            });
            this.lanes.order();
        }
    };

    Pool.prototype.createSpaceBellow = function(lane, height) {
        var laneIndex = this.index(lane),
            next = this.lanes.get(laneIndex + 1),
            me = this;

        if (next) {
            this.lanes.cascade(next, function(curr){
                var shape = Graph.registry.shape.get(curr.lane);
                if (shape) {
                    shape.translate(0, height);
                    curr.bbox = shape.bbox().toJson();

                    shape.children().each(function(c){
                        var comnet = c.connectable().component();
                        comnet && (comnet.dirty(true));
                    });

                    me.relocateLinks(0, height, shape);
                }
            });
            this.lanes.order();
        }
    };

    Pool.prototype.relocateSiblings = function(lane, dx, dy) {
        var root = this.lanes.root(),
            guid = lane.guid();

        if (root) {
            this.lanes.cascade(root, function(curr){
                if (curr.lane == guid) {
                    curr.bbox = lane.bbox().toJson();
                } else {
                    var shape = Graph.registry.shape.get(curr.lane);
                    if (shape) {
                        shape.translate(dx, dy);
                        curr.bbox = shape.bbox().toJson();
                    }
                }
            });
        }
    };

    Pool.prototype.resizeBy = function(lane) {
        var guid = lane.guid(),
            bbox = lane.bbox().toJson(),
            root = this.lanes.root(),
            index = this.index(lane);

        if (root) {

            // sample
            var prev, next, dx1, dx2, dy1, dy2;

            prev = this.lanes.get(index - 1);
            next = this.lanes.get(index + 1);

            dx1 = 0;
            dy1 = 0;

            dx2 = 0
            dy2 = 0;

            if (prev) {
                dx1 = bbox.x - prev.bbox.x;
                dy1 = bbox.y - (prev.bbox.y + prev.bbox.height);
            }

            if (next) {
                dx2 = bbox.x - next.bbox.x;
                dy2 = (bbox.y + bbox.height) - next.bbox.y;
            }

            this.lanes.cascade(root, function(curr, i){
                if (curr.lane == guid) {
                    curr.bbox = bbox;
                } else {
                    var shape = Graph.registry.shape.get(curr.lane);
                    if (shape) {

                        var group = shape.component(),
                            block = shape.component('block');

                        // up
                        if (index > i) {
                            shape.translate(dx1, dy1);
                        }
                        // down
                        else if (index < i) {
                            shape.translate(dx2, dy2);
                        }

                        block.attr({
                            width: bbox.width
                        });

                        block.dirty(true);
                        shape.refresh();

                        curr.bbox = shape.bbox().toJson();
                    }
                }
            });
        }

        bbox = null;
    };

    Pool.prototype.bringToFront = function(lane) {
        var sets = Graph.$('[data-pool="' + this.guid + '"]'),
            last = sets.last();

        if (last.length()) {
            if (last.node() != lane.component().node()) {
                last.after(lane.component().elem);
            }
        }
    };

    Pool.prototype.moveUp = function(lane) {
        var index = this.index(lane),
            prev  = this.get(index - 1),
            laneNode = this.lanes.get(index),
            prevNode = this.lanes.get(index - 1);

        if (prev) {
            var laneBox = lane.bbox().toJson(),
                prevBox = prev.bbox().toJson();

            var dx1 = 0,
                dy1 = prevBox.y - laneBox.y,
                dx2 = 0,
                dy2 = laneBox.height;

            laneNode.bbox.y  += dy1;
            laneNode.bbox.y2 += dy1;

            prevNode.bbox.y  += dy2;
            prevNode.bbox.y2 += dy2;

            lane.translate(dx1, dy1);
            prev.translate(dx2, dy2);

            this.lanes.order();

            lane.children().each(function(c){
                var comnet = c.connectable().component();
                comnet && (comnet.dirty(true));
            });

            prev.children().each(function(c){
                var comnet = c.connectable().component();
                comnet && (comnet.dirty(true));
            });

            this.relocateLinks(dx1, dy1, lane);
            this.relocateLinks(dx2, dy2, prev);
        }
    };

    Pool.prototype.moveDown = function(lane) {
        var index = this.index(lane),
            next  = this.get(index + 1),
            laneNode = this.lanes.get(index),
            nextNode = this.lanes.get(index + 1);

        if (next) {
            var laneBox = lane.bbox().toJson(),
                nextBox = next.bbox().toJson();

            var dx1 = 0,
                dy1 = nextBox.height,
                dx2 = 0,
                dy2 = laneBox.y - nextBox.y;

            laneNode.bbox.y  += dy1;
            laneNode.bbox.y2 += dy1;

            nextNode.bbox.y  += dy2;
            nextNode.bbox.y2 += dy2;

            lane.translate(dx1, dy1);
            next.translate(dx2, dy2);

            this.lanes.order();

            lane.children().each(function(c){
                var comnet = c.connectable().component();
                comnet && (comnet.dirty(true));
            });

            next.children().each(function(c){
                var comnet = c.connectable().component();
                comnet && (comnet.dirty(true));
            });

            this.relocateLinks(dx1, dy1, lane);
            this.relocateLinks(dx2, dy2, next);
        }
    };

    Pool.prototype.refreshChildren = function() {
        var children = this.populateChildren();

        children.each(function(lane){
            lane.component('child').dirty(true);
        });
    };

    /**
     * Populate lanes children
     */
    Pool.prototype.populateContents = function(lane) {
        var contents;
        if (lane !== undefined) {
            contents = new Graph.collection.Shape(lane.children().toArray());
        } else {
            contents = this.cached.contents;
            if ( ! contents) {
                contents = [];
                _.forEach(this.lanes.toArray(), function(node){
                    var lane = Graph.registry.shape.get(node.lane);
                    if (lane) {
                        contents = _.concat(contents, lane.children().toArray());
                    }
                });

                contents = new Graph.collection.Shape(contents);
                this.cached.contents = contents;
            }    
        }

        return contents;
    };

    Pool.prototype.refreshContents = function() {
        var contents = this.populateContents();

        contents.each(function(shape){
            var connectableBlock = shape.connectable().component();
            if (connectableBlock) {
                connectableBlock.dirty(true);
            }
        });
    };

    Pool.prototype.populateLinks = function(lane) {
        var me = this, 
            contents = me.populateContents(lane),
            contentKeys = contents.keys(),
            result = {
                isolated: {},
                separated: {}
            };

        contents.each(function(shape){
            var network = shape.connectable().plugin(),
                connections = (network && network.connections()) || [];

            var pairVector, pairShape;

            _.forEach(connections, function(conn){
                pairVector = Graph.registry.vector.get((conn.type == 'incoming' ? conn.source : conn.target));
                if (pairVector) {
                    pairShape = Graph.registry.shape.get(pairVector);
                    if (pairShape) {
                        if (_.indexOf(contentKeys, pairShape.guid()) > -1) {
                            if ( ! result.isolated[conn.guid]) {
                                result.isolated[conn.guid] = conn;
                            }
                        } else {
                            if ( ! result.separated[conn.guid]) {
                                result.separated[conn.guid] = conn;
                            }
                        }
                    }
                }
            });
        });

        return result;
    };

    Pool.prototype.relocateLinks = function(dx, dy, lane) {
        var links = this.populateLinks(lane);
        var key, conn, router;
        
        for (key in links.isolated) {
            conn = links.isolated[key];
            conn.link.invalidate('convex');
            conn.link.relocate(dx, dy);
        }
        
        for (key in links.separated) {
            conn = links.separated[key];
            conn.link.invalidate('convex');
            
            if (conn.type == 'incoming') {
                conn.link.relocateHead(dx, dy);
            } else {
                conn.link.invalidate('convex');
                conn.link.relocateTail(dx, dy);
            }
        }
        
        links = null;
    };


    Pool.prototype.size = function() {
        return this.lanes.size();
    };

    Pool.prototype.insert = function(lane) {
        var guid = lane.guid();
        var node, index;

        node = {
            lane: guid,
            bbox: lane.bbox().toJson()
        };

        index = this.lanes.insert(node);

        if (index !== undefined) {
            this.cached.nodes[guid] = node;
            lane.component().elem.attr('data-pool', this.guid);
        }

        node = null;
        return index;
    };

    Pool.prototype.remove = function(lane) {
        var guid = lane.guid(),
            node = this.cached.nodes[guid];

        var index = this.lanes.remove(node);
        
        if (index !== undefined) {
            // shrink pool (direction: up)
            var prev = this.lanes.get(index - 1),
                next = this.lanes.get(index),
                me = this;
            
            if (next) {
                var dx = 0,
                    dy = -node.bbox.height;

                this.lanes.cascade(next, function(node){
                    var lane = Graph.registry.shape.get(node.lane);
                    if (lane) {
                        lane.translate(dx, dy);
                        node.bbox = lane.bbox().toJson();

                        lane.children().each(function(c){
                            var comnet = c.connectable().component();
                            comnet && (comnet.dirty(true));
                        });

                        me.relocateLinks(dx, dy, lane);
                    }
                });

                this.lanes.order();
            }

            delete this.cached.nodes[guid];
        }

        node = null;

        return index;
    };

    Pool.prototype.index = function(lane) {
        var guid = lane.guid(),
            node = this.cached.nodes[guid];

        var index = this.lanes.index(node);

        node = null;

        return index;
    };

    ///////// STATIC /////////

    Pool.guid = 0;

}());


(function(){

    Graph.shape.common.Label = Graph.extend(Graph.shape.Shape, {
        props: {
            label: 'untitled',
            align: 'left',
            fontSize: 16,
            lineHeight: 1.1
        },
        metadata: {
            type: 'common.label',
            icon: 'ion-android-create'
        },
        initComponent: function() {
            var pmgr = this.plugins.manager;
            var shape, block, label;

            shape = (new Graph.svg.Group(this.props.left, this.props.top))
                .selectable(false);

            block = (new Graph.svg.Rect(0, 0, 0, 0, 0))
                .data('text', this.props.label)
                .render(shape);

            block.style({
                fill: 'rgba(255,255,255,0)',
                'stroke-width': 0
            });

            block.elem.data(Graph.string.ID_SHAPE, this.guid());

            pmgr.install('dragger', block, {cls: Graph.styles.SHAPE_DRAG});
            pmgr.install('editor',  block, {width: 300, height: 75, align: 'left', offset: 'pointer'});

            block.on('edit.shape', _.bind(this.onLabelEdit, this));
            block.on('afterdrag.shape', _.bind(this.onAfterDrag, this));
            block.on('select.shape', _.bind(this.onSelect, this));
            block.on('deselect.shape', _.bind(this.onDeselect, this));
            block.on('beforedestroy.shape',    _.bind(this.onBeforeDestroy, this));
            block.on('afterdestroy.shape',    _.bind(this.onAfterDestroy, this));

            label = (new Graph.svg.Text(0, (this.props.lineHeight * this.props.fontSize) , this.props.label))
                .attr('font-size', this.props.fontSize)
                .attr('text-anchor', this.props.align)
                .clickable(false)
                .selectable(false)
                .render(shape);

            label.on('render.shape', _.bind(this.onLabelRender, this));

            _.assign(this.components, {
                shape: shape.guid(),
                block: block.guid(),
                label: label.guid()
            });
        },

        initMetadata: function() {
            this.metadata.tools = [
                {
                    name: 'sendtofront',
                    icon: Graph.icons.SEND_TO_FRONT,
                    title: Graph._('Send to front'),
                    enabled: true,
                    handler: _.bind(this.onFrontToolClick, this)
                },
                {
                    name: 'sendtoback',
                    icon: Graph.icons.SEND_TO_BACK,
                    title: Graph._('Send to back'),
                    enabled: true,
                    handler: _.bind(this.onBackToolClick, this)
                },
                {
                    name: 'trash',
                    icon: Graph.icons.TRASH,
                    title: Graph._('Click to remove shape'),
                    enabled: true,
                    handler: _.bind(this.onTrashToolClick, this)
                }
            ];
        },

        refresh: _.debounce(function() {
            if (this.layout.suspended) {
                return;
            }

            var label = this.component('label'),
                block = this.component('block');

            label.write(this.props.label);
            label.dirty(true);
            
            var labelBox = label.bbox().toJson();

            block.attr({
                width: labelBox.width
            });

            block.dirty(true);
            
        }, 1),

        toString: function() {
            return 'Graph.shape.common.Label';
        },

        onLabelRender: function() {

            var label = this.component('label'),
                block = this.component('block'),
                labelBox = label.bbox().toJson();

            block.attr({
                width: labelBox.width,
                height: labelBox.height
            });
        },

        onLabelEdit: function(e) {
            var text = e.text;

            if (text) {
                this.component('label').props.text = text;
                this.props.label = text;
                this.refresh();    
            } else {
                this.remove();
            }
        },

        onAfterDrag: function(e) {
            var blockComponent = this.component('block'),
                shapeComponent = this.component('shape'),
                blockMatrix = blockComponent.matrix();

            var shapeMatrix;

            blockComponent.reset();

            shapeComponent.matrix().multiply(blockMatrix);
            shapeComponent.attr('transform', shapeComponent.matrix().toValue());
            shapeComponent.dirty(true);

            shapeMatrix = shapeComponent.matrix();

            this.data({
                left: shapeMatrix.props.e,
                top: shapeMatrix.props.f
            });

            this.fire(e);
        },

        onSelect: function(e) {
            this.component().addClass('label-selected');
            if (e.initial) {
                Graph.topic.publish('shape:select', {shape: this});
            }
        },

        onDeselect: function(e) {
            this.component().removeClass('label-selected');
            if (e.initial) {
                Graph.topic.publish('shape:deselect', {shape: this});
            }
        }
    });

}());

(function(){
    
    var XMLDOC = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [<!ENTITY nbsp "&#160;">]>';
    
    var Exporter = Graph.data.Exporter = function(vector, options){
        
        this.options = _.extend({}, Exporter.defaults, options || {});
        this.element = vector.node();
        
        var bounds, width, height, scale;
        
        if (vector.isPaper()) {
            bounds = vector.viewport().bbox().toJson();
            height = Math.max((bounds.y + bounds.height + 100), vector.elem.height());
            width  = Math.max((bounds.x + bounds.width), vector.elem.width());
            scale  = vector.layout().scale();
        } else {
            bounds = vector.bbox().toJson();
            width  = bounds.width;
            height = bounds.height;
            scale  = vector.matrixCurrent().scale();
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
    
    Exporter.prototype.exportSVG = function(filename, compression) {
        var options = _.extend({}, this.options);
        
        options.encoder = 'application/svg+xml';
        options.compression = 1;
        options.background = '#ffffff';

        var uri = createDataURI(this.element, options);
        var link = document.createElement('a');
        var click;

        link.setAttribute('download', filename);
        link.setAttribute('href', uri);

        if (document.createEvent) {
            click = document.createEvent('MouseEvents');
            click.initEvent('click', true, false);
            link.dispatchEvent(click);
        } else if (document.createEventObject) {
            link.fireEvent('onclick');
        }

        link = click = null;
    };

    Exporter.prototype.exportJPEG = function(filename, compression) {
        var options = _.extend({}, this.options);
        
        options.encoder = 'image/jpeg';
        options.compression = compression || 1;
        options.background = '#ffffff';
        
        filename = _.defaultTo(filename, 'download.jpg');
        
        exportImage(this.element, options, function(result){
            if (result) {
                download(filename, result);
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

    Exporter.prototype.exportFile = function(callback) {
        var options = _.extend({}, this.options);
        
        options.encoder = 'image/jpeg';
        options.compression = 1;
        options.background = '#ffffff';

        exportImage(this.element, options, function(result){
            if (result) {
                var blob = createBlob(result);
                callback && callback(blob);
            } else {
                callback && callback(false);
            }
        });
    };

    Exporter.prototype.exportBlob = function(callback) {
        var options = _.extend({}, this.options);
        
        options.encoder = 'image/jpeg';
        options.compression = 1;
        options.background = '#ffffff';

        exportImage(this.element, options, function(result){
            if (result) {
                var blob = createBlob(result);
                callback && callback(blob);
            } else {
                callback && callback(false);
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

            if (options.background) {
                context.fillStyle = options.background;
                context.fillRect(0, 0, canvas.width, canvas.height);
            }

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

    function createData(element, options) {
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
        holder = cloned = null;
        return xml;
    }
    
    function createDataURI(element, options) {
        var xml = createData(element, options),
            uri = 'data:image/svg+xml;base64,' + window.btoa(repair(xml));

        return uri;
    }
    
    function getElementStyles(element) {
        var styles = document.styleSheets,
            result = '';
            
        var rules, rule, found;

        if (Graph.config.dom == 'shadow') {
            var parent = element.parentNode,
                counter = 0;
            
            while(parent) {
                if (parent == element.ownerDocument) {
                    break;
                }
                if (parent.styleSheets !== undefined) {
                    styles = parent.styleSheets;
                    break;
                }
                parent = parent.parentNode;
            }    
        }

        for (var i = 0, ii = styles.length; i < ii; i++) {
            rules = styles[i].cssRules;
            
            if (rules != null) {
                
                for (var j = 0, jj = rules.length; j < jj; j++, found = null) {
                    
                    rule = rules[j];
                    
                    if (rule.style !== undefined) {
                        if (rule.selectorText) {

                            // BUG: https://github.com/exupero/saveSvgAsPng/issues/11
                            
                            try {
                                found = element.querySelector(rule.selectorText);

                                if (found) {
                                    result += rule.selectorText + " { " + rule.style.cssText + " }\n";
                                } else if(rule.cssText.match(/^@font-face/)) {
                                    result += rule.cssText + '\n';
                                }
                            } catch(e) {
                                
                                continue;
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

    var Manager = Graph.diagram.Manager = Graph.extend({

        props: {
            paper: null,
            defaultType: 'activity'
        },

        pallets: [],
        diagram: null,
        snapshoot: [],

        constructor: function(paper) {
            this.props.paper = paper.guid();
            paper.on('keynavdown', _.bind(this.onKeynavDown, this));
        },

        paper: function() {
            return Graph.registry.vector.get(this.props.paper);
        },

        deselectAll: function() {
            this.paper().collector().clearCollection();
        },

        removeSelection: function() {
            var selection = this.paper().collector().collection.toArray().slice();
                  
            this.capture();

            _.forEach(selection, function(vector){
                vector.remove();
            });
        },

        capture: function() {
            // capture to snapshoot
            if (this.diagram) {
                // var data = this.diagram.toJson();
                // this.snapshoot = [data];
            }
        },

        undo: function() {
            if (this.snapshoot.length) {
                this.diagram.render(this.snapshoot[0]);
            }
        },

        redo: function() {

        },

        addPallet: function(pallet) {
            var me = this,
                paper = me.paper(),
                layout = paper.layout(),
                scale = layout.scale(),
                drawing = null;

            me.pallets.push(pallet);

            pallet.on({
                pick: function(e) {

                    paper.tool().activate('panzoom');

                    if ( ! me.diagram) {
                        me.create(me.props.defaultType);
                    }

                    var origin = layout.pointerLocation({
                        clientX: e.origin.x,
                        clientY: e.origin.y
                    });

                    var options = {
                        left: origin.x,
                        top: origin.y
                    };

                    var result = me.diagram.drawShape(e.shape, options);
                    
                    if (result.movable) {
                        drawing = result.shape;
                        scale = paper.layout().scale();
                        drawing.component('block').dirty(true);
                        drawing.component().dirty(true);
                    } else {
                        drawing = null;
                        pallet.stopPicking();
                    }

                },
                drag: function(e) {
                    if (drawing) {
                        var dx = e.dx,
                            dy = e.dy;

                        dx /= scale.x;
                        dy /= scale.y;

                        if (scale.x < 1) {
                            dx += scale.x;
                        }

                        drawing.translate(dx, dy);
                    }
                },
                drop: function(e) {
                    if (drawing) {
                        drawing = null;
                    }
                }
            });

        },

        current: function() {
            return this.diagram;
        },

        remove: function() {
            if (this.diagram) {
                this.diagram.remove();
                this.diagram = null;

                this.paper().fire('diagram.destroy');
            }
        },

        create: function(type, options, silent) {
            type = _.defaultTo(this.props.defaultType);

            var clazz = Graph.diagram.type[_.capitalize(type)],
                paper = this.paper();

            this.diagram = Graph.factory(clazz, [paper, options]);
            silent = _.defaultTo(silent, false);

            if ( ! silent) {
                paper.fire('diagram.create', {
                    diagram: this.diagram
                });
            }

            return this.diagram;
        },

        saveAsImage: function(type, filename) {
            var exporter = new Graph.data.Exporter(this.paper());
              
            switch(type) {
                case 'svg':
                    exporter.exportSVG(filename);
                    break;
                case 'png':
                    exporter.exportPNG(filename);
                    break;
                case 'jpg':
                case 'jpeg':
                    exporter.exportJPEG(filename);
                    break;
            }

            exporter = null;
        },

        saveAsFile: function(callback) {
            var exporter = new Graph.data.Exporter(this.paper());
            exporter.exportFile(callback);
            exporter = null;
        },

        saveAsBlob: function(callback) {
            var exporter = new Graph.data.Exporter(this.paper());
            return exporter.exportBlob(callback);
        },

        onKeynavDown: function(e) {
            switch (e.keyCode) {
                case Graph.event.DELETE:
                    this.removeSelection();
                    e.preventDefault();
                    break;
            }
        }

    });

}());

(function(){
    var Parser = Graph.diagram.Parser = function(data) {
        data = data || {};

        this._props  = data.props || {};
        this._shapes = data.shapes || [];
        this._links  = data.links || [];
        this._tree   = {};

        this.parse();
    };

    Parser.prototype.constructor = Parser;

    Parser.prototype.parse = function() {
        var shapes = this._shapes,
            tree = {},
            nodes = {},
            total = shapes.length;

        _.forEach(shapes, function(shape, idx){
            nodes[shape.props.id] = {
                id: shape.props.id,
                parent_id: shape.props.parent_id,
                index: idx,
                total: total
            };
        });

        var key, node;

        for (key in nodes) {
            node = nodes[key];
            if ( ! node.parent_id) {
                tree[key] = node;
            } else {
                if (nodes[node.parent_id].children === undefined) {
                    nodes[node.parent_id].children = {};
                }
                nodes[node.parent_id].children[node.id] = node;
            }
        }

        this._tree = tree;
    };

    Parser.prototype.shapes = function() {
        var shapes = this._shapes,
            tree = this._tree;

        return {
            total: shapes.length,
            each: function(callback) {
                traverse(tree, shapes, callback);
            }
        };
    };

    Parser.prototype.links = function() {
        var links = this._links;
        return {
            total: links.length,
            each: function(callback) {
                _.forEach(links, callback);
            }
        }
    };

    Parser.prototype.props = function() {
        var props = this._props;
        return {
            each: function(callback) {
                _.forOwn(props, callback);
            }
        }
    };

    Parser.prototype.destroy = function() {
        this._shapes = null;
        this._links = null;
        this._tree = null;
        this._props = null;
    };

    function traverse(nodes, shapes, callback) {
        var key, node;
        for (key in nodes) {
            node = nodes[key];
            callback(shapes[node.index], node.index, node.total);
            if (node.children !== undefined) {
                traverse(node.children, shapes, callback);
            }
        }
    }

}());


(function(){

    var Pallet = Graph.diagram.pallet.Activity = Graph.extend({
        
        props: {
            guid: null,
            rendered: false,
            template: null
        },
        
        components: {
            pallet: null
        },
        
        cached: {
            
        },

        picking: {
            enabled: false,
            target: null,
            matrix: null,
            shape: null,
            begin: false,
            start: null
        },
        
        constructor: function(options) {
            _.assign(this.props, options || {});
            this.props.guid = 'pallet-' + (++Pallet);
            this.initComponent();

            Graph.registry.pallet.register(this);
        },

        guid: function() {
            return this.props.guid;
        },

        initComponent: function() {
            var template, contents, pallet;

            contents = this.props.template;

            if ( ! contents) {
                contents = '' + 
                    '<defs>' + 
                        '<marker id="marker-arrow-pallet" refX="11" refY="10" viewBox="0 0 20 20" markerWidth="10" markerHeight="10" orient="auto">' + 
                            '<path d="M 1 5 L 11 10 L 1 15 Z" fill="#30D0C6" stroke-linecap="round" stroke-dasharray="10000, 1"/>' + 
                        '</marker>' + 
                    '</defs>' + 
                    '<g class="graph-pallet-item" data-shape="Graph.shape.activity.Start" transform="matrix(1,0,0,1,40,0)">' + 
                        '<circle cx="32" cy="32" r="30"/>' +
                        '<text x="32" y="36">Start</text>' + 
                    '</g>' + 
                    '<g class="graph-pallet-item" data-shape="Graph.shape.activity.Final" transform="matrix(1,0,0,1,40,80)">' + 
                        '<circle cx="32" cy="32" r="30"/>' + 
                        '<circle cx="32" cy="32" r="24" class="full"/>' + 
                        '<text x="32" y="36">End</text>' + 
                    '</g>' + 
                    '<g class="graph-pallet-item" data-shape="Graph.shape.activity.Action" transform="matrix(1,0,0,1,40,160)">' + 
                        '<rect x="2" y="2" width="60" height="60" rx="7" ry="7"/>' + 
                        '<text x="32" y="34">Action</text>' + 
                    '</g>' + 
                    '<g class="graph-pallet-item" data-shape="Graph.shape.activity.Router" transform="matrix(1,0,0,1,40,250)">' + 
                        '<rect x="4" y="4" width="54" height="54" transform="rotate(45,32,32)"/>' + 
                        '<text x="30" y="34">Route</text>' + 
                    '</g>' + 
                    '<g class="graph-pallet-item" data-shape="Graph.shape.activity.Join" transform="matrix(1,0,0,1,40,340)">' + 
                        '<rect x="2" width="60" height="58" rx="0" ry="0" style="fill: rgba(255,255,255,0); stroke-width: 0" />' + 
                        '<rect x="2" y="28" width="60" height="6" rx="0" ry="0" pointer-events="none" class="full"/>' + 
                        '<path d="M 10  0 L 10 28" pointer-events="none" ></path>' + 
                        '<path d="M 54  0 L 54 28" pointer-events="none" ></path>' + 
                        '<path d="M 32 34 L 32 60" marker-end="url(#marker-arrow-pallet)" pointer-events="none" ></path>' + 
                        '<text x="32" y="20">Join</text>' + 
                    '</g>' + 
                    '<g class="graph-pallet-item" data-shape="Graph.shape.activity.Fork" transform="matrix(1,0,0,1,40,420)">' + 
                        '<rect x="2" width="60" height="58" rx="0" ry="0" pointer-events="none" style="fill: rgba(255,255,255,0); stroke-width: 0" />' + 
                        '<rect x="2" y="28" width="60" height="6" rx="0" ry="0" class="full"/>' + 
                        '<path d="M 10 34 L 10 60" marker-end="url(#marker-arrow-pallet)" pointer-events="none" ></path>' + 
                        '<path d="M 54 34 L 54 60" marker-end="url(#marker-arrow-pallet)" pointer-events="none" ></path>' + 
                        '<path d="M 32  0 L 32 28" pointer-events="none" ></path>' + 
                        '<text x="32" y="50">Fork</text>' + 
                    '</g>' + 
                    '<g class="graph-pallet-item" data-shape="Graph.shape.activity.Lane" transform="matrix(1,0,0,1,40,510)">' + 
                        '<rect x="2" y="2" width="60" height="60" rx="0" ry="0"/>' + 
                        '<rect x="2" y="2" width="10" height="60" rx="0" ry="0"/>' + 
                        '<text x="32" y="34">Role</text>' + 
                    '</g>';
            }

            template = _.format(
                '<svg class="graph-pallet" xmlns="{0}" xmlns:xlink="{1}" version="{2}" style="width: 100%; height: 100%">' + 
                    contents + 
                '</svg>',
                Graph.config.xmlns.svg,
                Graph.config.xmlns.xlink,
                Graph.config.svg.version
            );

            pallet = Graph.$(template);
            this.components.pallet = pallet;
        },

        stopPicking: function() {
            if (this.picking.enabled) {
                this.picking.target.remove();
                _.assign(this.picking, {
                    target: null,
                    matrix: null,
                    offset: null,
                    enabled: false,
                    shape: null,
                    start: false
                });
            }
        },

        render: function(container) {
            if (this.props.rendered) {
                return;
            }

            var me = this, 
                pallet = this.components.pallet;

            this.props.rendered = true;

            container = Graph.$(container);
            container.prepend(pallet);
            container = null;

            interact('.graph-pallet-item')
                .on('down', function(e){
                    dragStart(e);
                })
                .on('move', function(e){
                    dragMove(e);
                })
                .on('up', function(e){
                    dragStop(e);
                });

            /////////
            
            pallet.on('mouseleave', function(e){
                dragStop(e);
            });

            function dragStart(e) {
                var target = Graph.$(e.currentTarget);

                if (me.picking.enabled) {
                    dragStop(e);
                }

                if (target.data('shape') !== undefined) {
                    var transform = Graph.util.transform2segments(target.attr('transform'));
                    transform = transform[0].slice(1);

                    me.picking.enabled = true;
                    me.picking.matrix = Graph.factory(Graph.lang.Matrix, transform);
                    me.picking.target = Graph.$(e.currentTarget.cloneNode(true));
                    me.picking.target.addClass('grabbing');
                    me.picking.shape = target.data('shape');

                    pallet.append(me.picking.target);

                    me.fire('pick', {
                        shape: me.picking.shape,
                        origin: {
                            x: e.clientX,
                            y: e.clientY
                        }
                    });

                    transform = null;

                }
            }

            function dragMove(e) {
                var i = e.interaction;

                if (i.pointerIsDown && me.picking.target) {
                    e.preventDefault();
                    
                    var current = {
                        x: e.clientX,
                        y: e.clientY
                    };

                    if ( ! me.picking.offset) {
                        me.picking.offset = current;
                    }

                    var dx = current.x - me.picking.offset.x,
                        dy = current.y - me.picking.offset.y;

                    me.picking.matrix.translate(dx, dy);
                    me.picking.target.attr('transform', me.picking.matrix.toValue());

                    me.fire('drag', {
                        dx: dx,
                        dy: dy
                    }); 

                    me.picking.offset = current;
                }
            }

            function dragStop(e) {
                if (me.picking.enabled) {
                    me.fire('drop', {
                        clientX: e.clientX,
                        clientY: e.clientY
                    });
                }
                me.stopPicking();
            }

            return this;
        },
        
        toString: function() {
            return 'Graph.diagram.pallet.Activity';
        }

    });

    Pallet.guid = 0;

}());

(function(){

    Graph.diagram.type.Diagram = Graph.extend({
        props: {
            id: null,
            paper: null,
            dirty: false
        },

        drawing: {
            enabled: false
        },

        metadata: {
            type: 'diagram.diagram'
        },

        constructor: function(paper, options) {
            options = options || {};
            _.assign(this.props, options);

            this.props.paper = paper.guid();
            this.empty();
        },

        /**
         * update properties
         */
        update: function(data) {

            var me = this,
                parser = new Graph.diagram.Parser(data),
                paper = me.paper();
            
            parser.props().each(function(v, k){
                if (k != 'type') {
                    me.props[k] = v;    
                }
            });

            parser.shapes().each(function(item){
                var shape;

                if (item.props.id) {
                    shape = me.getShapeBy(function(s){ 
                        return s.props.id == item.props.id; 
                    });
                }

                // stil not found?
                shape = me.getShapeBy(function(s){
                    return s.props.guid == item.props.client_id;
                });

                // if (item.props.id) {
                //     shape = me.getShapeBy(function(s){ 
                //         return s.props.id == item.props.id; 
                //     });
                // } else {
                //     shape = me.getShapeBy(function(s){
                //         return s.props.guid == item.props.client_id;
                //     });
                // }

                if (shape) {
                    shape.update(item);
                }
            });

            parser.links().each(function(item){
                var link;

                if (item.props.id) {
                    link = me.getLinkBy(function(link){
                        return link.props.id == item.props.id;
                    });
                }

                // still not found ?
                link = me.getLinkBy(function(link){
                    return link.props.guid == item.props.client_id;
                });

                // if (item.props.id) {
                //     link = me.getLinkBy(function(link){
                //         return link.props.id == item.props.id;
                //     });
                // } else {
                //     link = me.getLinkBy(function(link){
                //         return link.props.guid == item.props.client_id;
                //     });
                // }

                if (link) {
                    link.data(item.props);
                }
            });

            parser.destroy();
            parser = null;
        },

        commit: function() {
            this.props.dirty = false;
            return this;
        },

        /**
         * Render data and update properties
         */
        render: function(data) {

        },

        paper: function() {
            return Graph.registry.vector.get(this.props.paper);
        },

        empty: function() {
            var shapes = this.getShapes();
            
            this.paper().snapper().invalidate();

            shapes.each(function(shape){
                if ( ! shape.tree.parent) {
                    shape.remove();
                }
            });

            shapes = null;
            return this;
        },

        getShapes: function() {
            var context = this.paper().guid(),
                shapes = Graph.registry.shape.collect(context);
            
            return new Graph.collection.Shape(shapes);
        },

        getLinks: function() {
            var shapes = this.getShapes().toArray(),  
                indexes = {},
                links = [];

            var network, connections, i, ii, j, jj;

            for(i = 0, ii = shapes.length; i < ii; i++) {
                network = shapes[i].connectable().plugin();
                if (network) {
                    connections = network.connections();
                    for (j = 0, jj = connections.length; j < jj; j++) {
                        if (indexes[connections[j].guid] === undefined) {
                            links.push(connections[j].link);
                            indexes[connections[j].guid] = true;
                        }
                    }
                }
            }

            indexes = null;
            return new Graph.collection.Link(links);
        },
        
        drawShape: function(namespace, options) {

        },

        findShapeBy: function(identity) {
            var shapes = this.getShapes().toArray();
            return _.filter(shapes, identity);
        },

        getShapeBy: function(identity) {
            var shapes = this.getShapes().toArray();
            return _.find(shapes, identity);
        },

        getLinkBy: function(identity) {
            var links = this.getLinks().toArray();
            return _.find(links, identity);
        },

        remove: function() {
            this.empty();
            this.fire('afterdestroy');
        },

        toJson: function() {
            var json = {};
            return json;
        }

    });

}());
(function(){

    var Diagram = Graph.diagram.type.Activity = Graph.extend(Graph.diagram.type.Diagram, {

        props: {
            name: 'Activity Diagram',
            description: 'No diagram description',
            cover: null
        },

        rendering: {
            active: false
        },

        metadata: {
            type: 'diagram.activity'
        },

        drawShape: function(namespace, options) {
            var paper = this.paper();

            // already drawing
            if (this.drawing.dragging) {
                this.drawing.dragging = false;

                this.drawing.shape.off('beforedrag', this.drawing.beforeDrag);
                this.drawing.shape.off('aferdrag', this.drawing.afterDrag);

                this.drawing.beforeDrag = null;
                this.drawing.afterDrag = null;

                // mark as invalid
                this.drawing.shape.remove();
                this.drawing.shape = null;
            }

            var clazz, shape, movable;

            options = options || {};
            movable = true;

            if (namespace == 'Graph.shape.activity.Lane') {
                var shapes = this.getShapes();
                if (shapes.size() && ! this.hasLane()) {
                    var bbox = shapes.bbox().toJson();
                    
                    options.left = bbox.x - 40;
                    options.top = bbox.y - 20;

                    movable = false;
                    bbox = null;
                }
                shapes = null;
            } else if (namespace == 'Graph.shape.common.Label') {
                movable = false;
            }

            clazz = Graph.ns(namespace);
            shape = Graph.factory(clazz, [options]);

            // check again...
            if (movable) {
                movable = !!shape.draggable().plugin();
            }

            var me = this;

            this.drawing.beforeDrag = function(e) {
                shape.component().addClass('picking');
            };

            this.drawing.afterDrag = function() {
                var timer;

                timer = _.delay(function(shape){
                    var valid = false;

                    clearTimeout(timer);
                    timer = null;

                    if (shape.is('activity.lane')) {
                        valid = true;
                    } else {
                        if (me.hasLane()) {
                            var parent = shape.parent();
                            valid = parent && parent.is('activity.lane');
                        } else {
                            valid = true;
                        }
                    }

                    if ( ! valid) {
                        Graph.message("Can't drop shape outside lane or pool", 'warning');
                        shape.remove();
                        shape = null;
                    }
                }, 0, me.drawing.shape);

                shape.component().removeClass('picking');

                me.drawing.beforeDrag = null;
                me.drawing.afterDrag = null;
                me.drawing.dragging = false;
                me.drawing.shape = null;

            };

            if (movable) {
                this.drawing.dragging = true;
                this.drawing.shape = shape;

                shape.render(paper);

                var draggable = shape.draggable().plugin(),
                    snappcomp = shape.snappable().component();

                draggable.start();

                if (options.left !== undefined && options.top !== undefined) {
                    var center = shape.center(),
                        dx = options.left - center.x,
                        dy = options.top - center.y;
                    shape.translate(dx, dy);    

                    if (snappcomp) {
                        snappcomp.dirty(true);
                    }
                }

                shape.one('beforedrag', this.drawing.beforeDrag);
                shape.one('afterdrag', this.drawing.afterDrag);

            } else {

                me.drawing.dragging = false;
                me.drawing.shape = null;
                me.drawing.beforeDrag = null;
                me.drawing.afterDrag = null;
                
                if (shape.is('activity.lane')) {
                    var children = me.getShapes().toArray();

                    shape.render(paper);
                    shape.addChild(children);
                    children = null;

                } else if (shape.is('common.label')) {

                    var lanes = me.findShapeBy(function(shape){ return shape.is('activity.lane'); }),
                        coord = {x: shape.props.left, y: shape.props.top},
                        found = false;

                    shape.render(paper);

                    /*if (lanes.length) {
                        var box, i, j;

                        for (i = 0, j = lanes.length; i < j; i++) {
                            box = lanes[i].bbox().toJson();
                            
                            if (Graph.util.isBoxContainsPoint(box, coord)) {
                                found = lanes[i];
                                break;
                            }
                        }

                        if (found) {
                            found.addChild(shape);
                        } else {
                            Graph.message("Can't drop shape outside lane or pool", 'warning');
                            shape.remove();
                            shape = null;
                        }

                    }*/
                }
            }

            return {
                movable: movable,
                shape: shape
            };
        },

        hasLane: function() {
            return this.findShapeBy(function(shape){ return shape.is('activity.lane'); }).length !== 0;
        },

        render: function(data) {
            var me = this,
                paper = this.paper(),
                parser = new Graph.diagram.Parser(data);

            if (this.rendering.active) {
                return;
            }

            this.rendering.active = true;
            this.empty();

            parser.props().each(function(v, k){
                me.props[k] = v;
            });

            render(parser).then(function(rendered){
                parser.links().each(function(item){
                    var props = item.props,
                        params = JSON.parse(item.params),
                        sourceShape = rendered[props.source_id],
                        targetShape = rendered[props.target_id];

                    if (sourceShape && targetShape) {
                        var sourceNetwork = sourceShape.connectable().plugin(),
                            targetNetwork = targetShape.connectable().plugin();

                        if (sourceNetwork && targetNetwork) {
                            var link = sourceNetwork.connect(targetNetwork, null, null, item.props);
                            link.params = params;
                        }
                    }
                })
                
                me.rendering.active = false;

                parser.destroy();
                parser = null;

                me.paper().snapper().refresh();
            }); 

            ///////// RENDERER /////////
            
            function render(parser) {
                var def = Graph.defer(),
                    rendered = {},
                    pools = {},
                    count = 0,
                    tick = 0;

                parser.shapes().each(function(item, index, total){
                    var props = item.props,
                        params = JSON.parse(item.params),
                        clazz = Graph.ns(props.type);

                    var shape, delay;

                    delay = _.delay(function(clazz, props, params){
                        clearTimeout(delay);
                        delay = null;

                        shape = Graph.factory(clazz, [props]);
                        shape.params = params;
                        shape.render(paper);

                        if (props.client_pool) {
                            if (pools[props.client_pool] === undefined) {
                                pools[props.client_pool] = [];
                            }
                            pools[props.client_pool].push(shape);
                        }

                        if (rendered[props.parent_id] !== undefined) {
                            rendered[props.parent_id].addChild(shape, false);
                            
                            var netcom = shape.connectable().component();

                            if (netcom) {
                                netcom.dirty(true);
                            }
                        }

                        rendered[props.id] = shape;
                        count++;
                        
                        if (count === total) {
                            
                            var lanes, key, pool;

                            for (key in pools) {
                                lanes = pools[key];
                                pool  = null;

                                if (lanes.length > 1) {
                                    _.forEach(lanes, function(lane, idx){
                                        if ( ! pool) {
                                            pool = lane.pool();
                                        } else {
                                            lane.tree.pool = pool;
                                            pool.insert(lane);
                                        }
                                    });
                                }

                                if (pool) {
                                    pool.invalidate();
                                }
                            }

                            def.resolve(rendered);
                        }

                    }, (tick * 100), clazz, props, params);

                    tick++;
                });

                return def.promise();
            };  
        },  

        toString: function() {
            return 'Graph.diagram.type.Activity';
        },

        toJson: function() {
            var diagram = {
                props: {
                    id: this.props.id,
                    name: this.props.name,
                    type: this.toString(),
                    description: this.props.description,
                    cover: this.props.cover
                },
                shapes: [],
                links: []
            };

            var shapes = this.getShapes(),
                links = this.getLinks();

            shapes.each(function(shape){
                var data = shape.toJson();
                diagram.shapes.push({
                    props: data.props,
                    params: data.params
                });
            });

            links.each(function(link){
                var data = link.toJson();
                diagram.links.push({
                    props: data.props,
                    params: data.params
                });
            });

            shapes = links = null;
            return diagram;
        }
    });
    
}());



(function(){

    Graph.popup.Dialog = Graph.extend({

        props: {
            opened: false
        },

        components: {
            element: null,
            backdrop: null
        },

        handlers: {
            backdrop_click: null
        },

        constructor: function(element, options) {
            var me = this, 
                comp = me.components,
                handlers = me.handlers;

            comp.element = Graph.$(element);

            if (options.buttons) {
                _.forEach(options.buttons, function(button, index){
                    var element = Graph.$(button.element, comp.element);
                    if (element.length()) {
                        var name = 'button' + index,
                            func = name + '_click';

                        comp[name] = element;

                        if (_.isFunction(button.onclick)) {
                            handlers[func] = _.bind(function(e){
                                button.onclick.call(me, e);
                            }, me);
                            element.on('click', handlers[func]);
                        }
                        name = func = null;
                    }
                    element = null;
                });
            }
        },

        element: function() {
            return this.components.element;
        },

        open: function() {
            if (this.props.opened) {
                return;
            }

            this.element().addClass('open');
            this.props.opened = true;

            this.center();
            this.backdrop();
        },

        close: function() {
            var me = this,
                comp = this.components,
                handlers = this.handlers,
                backdrop = comp.backdrop;

            this.element().removeClass('open');
            this.props.opened = false;

            if (handlers.backdrop_click) {
                backdrop.off('click', handlers.backdrop_click);
                handlers.backdrop_click = null;

                var backdropUser = +backdrop.data('user');

                backdropUser--;

                if (backdropUser <= 0) {
                    backdropUser = 0;
                    backdrop.detach();
                }

                backdrop.data('user', backdropUser);
            }

            _.forOwn(handlers, function(handler, name){
                var tmp = _.split(name, '_'),
                    key = tmp[0],
                    evt = tmp[1];

                if (handler && comp[key] && evt) {
                    comp[key].off(evt, handler);
                    handlers[name] = null;
                }
                
                tmp = key = evt = null;
            });

            this.fire('close');
        },

        center: _.debounce(function() {
            var element = this.element(),
                width = element.width(),
                height = element.height();

            element.css({
                'top': '50%',
                'left': '50%',
                'margin-top': -height / 2,
                'margin-left': -width / 2
            });
        }, 0),

        backdrop: function() {
            var me = this,
                backdrop = Graph.$('.graph-dialog-backdrop');

            if ( ! backdrop.length()) {
                backdrop = Graph.$('<div class="graph-dialog-backdrop"/>');
                backdrop.data('user', 0);
                backdrop.on('click', function(e){
                    e.stopPropagation();
                });
            }

            me.handlers.backdrop_click = function() {
                me.close();
            };

            backdrop.on('click', me.handlers.backdrop_click);

            var backdropUser = +backdrop.data('user');

            backdropUser++;
            backdrop.data('user', backdropUser);

            me.components.element.before(backdrop);
            me.components.backdrop = backdrop;
        },

        toString: function() {
            return 'Graph.popup.Dialog';
        },

        destroy: function() {
            this.components.element = null;
        }

    });

    ///////// STATICS /////////

    ///////// SHORTCUT /////////
    
    Graph.dialog = function(element, options){
        return new Graph.popup.Dialog(element, options);
    };

}());
(function(){
    var DOCUMENT  = document;

    ///////////////////////// HOOK DOCUMENT CLICK /////////////////////////
    
    Graph(function(){
        var doc = DOCUMENT,
            on = function(target, type, handler) {
                if (target.addEventListener) {
                    target.addEventListener(type, handler, false);
                } else {
                    target.attachEvent('on' + type, handler);
                }
            };

        on(doc, 'mousedown', function(e){
            var target, vector, paper;

            target = Graph.$(Graph.event.target(e));
            vector = target.data(Graph.string.ID_VECTOR);

            if (vector) {
                vector = Graph.registry.vector.get(vector);
                paper = vector.paper();
                Graph.cached.paper = paper ? paper.guid() : null;
            }

            vector = paper = null;
        });

        on(doc, 'keydown', function(e){
            var paper;

            if (Graph.event.isNavigation(e)) {
                paper = Graph.cached.paper;
                
                if (paper) {
                    paper = Graph.registry.vector.get(paper);
                    e.originalType = 'keynavdown';
                    paper.fire(e);
                }
            } else if (e.ctrlKey || e.cmdKey) {
                paper = Graph.cached.paper;
                
                if (paper) {
                    paper = Graph.registry.vector.get(paper);
                    if (e.keyCode === Graph.event.C) {
                        e.originalType = 'keycopy';
                        paper.fire(e);
                    } else if (e.keyCode === Graph.event.V) {
                        e.originalType = 'keypaste';
                        paper.fire(e);
                    }
                }   
            }
        });

        on(doc, 'keyup', function(e){
            if (Graph.event.isNavigation(e)) {
                var paper = Graph.cached.paper;
                if (paper) {
                    paper = Graph.registry.vector.get(paper);
                    e.originalType = 'keynavup';
                    paper.fire(e);
                }
            }
        });
    });

    ///////////////////////// LISTEN DOCUMENT READY ////////////////////////
    
    (function(doc){
        var timer;

        var execute = function() {
            _.forEach(Graph.BOOTSTRAPS, function(f){
                f();
            });
        };

        var ready = function() {
            doc.removeEventListener('DOMContentLoaded', ready, false);
            doc.readyState = 'complete';
        };

        var inspect = function() {
            if (doc.readyState != 'complete') {
                timer = _.delay(function(){
                    clearTimeout(timer);
                    timer = null;
                    inspect();
                }, 10);
            } else {
                execute();
            }
        };

        if (doc.readyState == null && doc.addEventListener) {
            doc.addEventListener('DOMContentLoaded', ready, false);
            doc.readyState = 'loading';
        }

        inspect();
        
    }(DOCUMENT));

    ///////////////////////////////////////////////////////////////////////

}());