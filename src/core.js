
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