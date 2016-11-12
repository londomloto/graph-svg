
(function(){
    
    var initializing = false;
    // var inherit = /xyz/.test(function(){ xyz; }) ? /\$super/ : /.*/;
    var Class = Graph.lang.Class = function() {};

    Class.prototype.constructor = Class;
    Class.prototype.toString = function() {
        return 'Graph.lang.Class';
    };

    Class.defaults = {};

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
        
        // `$super()` non-strict-mode
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
                near = bubbling(fcal, ctor);
                    
                if (near) {
                    var pro = near.proto, 
                        key = near.key;

                    fsup = pro.superclass.prototype[key];
                    fcal.$super = fsup;
                }
            }

            return fsup ? fsup.apply(this, arguments) : undefined;
        };

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
            lsnr = (this.listeners[fire] || []).slice();

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

            rgex = lsnr = null;
            return event;
        };

        return clazz;
    };

    ///////// HELPER /////////
    
    function bubbling(method, clazz) {
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
            return bubbling(method, proto.superclass);
        } else {
            return null;
        }
    }
    

}());