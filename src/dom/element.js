
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