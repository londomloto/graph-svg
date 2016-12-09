
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