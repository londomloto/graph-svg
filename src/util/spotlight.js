
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