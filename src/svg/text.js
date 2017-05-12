
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