
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

    var DOCUMENT  = document;
    var LOCATION  = location;
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
        base: '../',
        locale: 'id',
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
        }
    };

    Graph.setup = function(name, value) {
        if (_.isPlainObject(name)) {
            _.extend(Graph.config, name);
        } else {
            Graph.config[name] = value;
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
        ZOOM_IN: 'ion-android-add',
        ZOOM_OUT: 'ion-android-remove',
        ZOOM_RESET: 'ion-pinpoint',

        SHAPE: 'bpmn-icon-start-event-none',
        SHAPE_LANE: 'bpmn-icon-participant',
        SHAPE_LINK: 'ion-ios-shuffle-strong',
        SHAPE_ACTION: 'bpmn-icon-task',
        SHAPE_ROUTER: 'bpmn-icon-gateway-none',

        LANE_ABOVE: 'bpmn-icon-lane-insert-above',
        LANE_BELOW: 'bpmn-icon-lane-insert-below',

        CONFIG: 'bpmn-icon-screw-wrench',
        LINK: 'bpmn-icon-connection-multi',
        TRASH: 'bpmn-icon-trash',

        SEND_TO_BACK: 'font-icon-send-back',
        SEND_TO_FRONT: 'font-icon-bring-front',

        MOVE_UP: 'ion-android-arrow-up',
        MOVE_DOWN: 'ion-android-arrow-down'
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

    ///////////////////////// HOOK DOCUMENT CLICK /////////////////////////
    
    Graph(function(){
        var doc = $(DOCUMENT);

        doc.on('mousedown', function(e){
            var target = $(e.target),
                vector = target.data(Graph.string.ID_VECTOR);

            var paper;

            if (vector) {
                vector = Graph.registry.vector.get(vector);
                paper = vector.paper();
                Graph.cached.paper = paper ? paper.guid() : null;
            } else {
                Graph.cached.paper = null;
            }

            vector = paper = null;
        });

        doc = null;
    });

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
        
    }(DOCUMENT, 'DOMContentLoaded'));

    ///////////////////////////////////////////////////////////////////////
    
}());