
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