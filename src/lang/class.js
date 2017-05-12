
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
