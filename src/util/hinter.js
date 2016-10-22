    
(function(){

    Graph.util.Hinter = Graph.extend({

        components: {
            G: null,
            V: null,
            H: null
        },

        collection: {},

        sources: {
            M: [],
            C: []
        },

        targets: {
            M: [],
            C: []
        },

        paper: null,
        rendered: false,

        constructor: function(paper) {
            this.paper = paper;
            this.initComponent();
        },

        initComponent: function() {
            var me = this, 
                comp = me.components;

            comp.G = (new Graph.svg.Group())
                .addClass('graph-util-hinter')
                .removeClass('graph-elem graph-elem-group')
                .traversable(false)
                .selectable(false);

            comp.H = (new Graph.svg.Line(0, 0, 0, 0))
                .removeClass('graph-elem graph-elem-line')
                .render(comp.G);

            comp.V = (new Graph.svg.Line(0, 0, 0, 0))
                .removeClass('graph-elem graph-elem-line')
                .render(comp.G);
        },

        render: function() {
            if ( ! this.rendered) {
                this.rendered = true;
                this.components.G.render(this.paper);
            }
        },

        suspend: function(bearing) {
            this.components[bearing].removeClass('visible');
        },

        resume: function(bearing) {
            this.components[bearing].addClass('visible');
        },

        register: function(vector) {
            var me = this,
                id = vector.id(),
                box = vector.bbox().toJson();

            me.collection[id] = {
                vector: vector,
                dirty: false,
                vertices: {
                    M: [
                        Math.round(box.x, 2),
                        Math.round(box.y + box.height / 2, 2),
                        box.width, 
                        box.height
                    ],
                    C: [
                        Math.round(box.x + box.width / 2, 2),
                        Math.round(box.y, 2),
                        box.width, 
                        box.height
                    ]
                }
            };

            vector.on({
                dragend: function() {
                    me.collection[id].dirty = true;
                },
                resize: function() {
                    me.collection[id].dirty = true;
                }
            });
        },

        activate: function(vector) {
            var me = this,
                id = vector.id();

            if ( ! this.rendered) {
                this.render();
            } else {
                this.paper.elem.append(this.components.G.elem);
            }

            // bring to front;
            // me.paper.elem.append(me.components.G.elem);
            
            if (me.collection[id].dirty) {
                var box = vector.bbox().toJson();
                me.collection[id].vertices = {
                    M: [
                        Math.round(box.x, 2),
                        Math.round(box.y + box.height / 2, 2),
                        box.width, 
                        box.height
                    ],
                    C: [
                        Math.round(box.x + box.width / 2, 2),
                        Math.round(box.y, 2),
                        box.width, 
                        box.height
                    ]
                }
                me.collection[id].dirty = false;
            }

            me.sources.M = me.collection[id].vertices.M;
            me.sources.C = me.collection[id].vertices.C;

            me.targets.M = [];
            me.targets.C = [];

            _.forEach(me.collection, function(col, id){
                if (col.vector !== vector) {
                    if (col.dirty) {
                        var box = col.vector.bbox().toJson();
                        col.vertices = {
                            M: [
                                Math.round(box.x, 2),
                                Math.round(box.y + box.height / 2, 2),
                                box.width, 
                                box.height
                            ],
                            C: [
                                Math.round(box.x + box.width / 2, 2),
                                Math.round(box.y, 2),
                                box.width, 
                                box.height
                            ]
                        }
                        col.dirty = false;
                    }
                    me.targets.M.push(col.vertices.M);
                    me.targets.C.push(col.vertices.C);
                }
            });
        },

        watch: function(dx, dy) {
            var me = this;

            // update source
            _.forEach(me.sources, function(s){
                s[0] += dx;
                s[1] += dy;
            });

            var x1, y1, x2, y2;

            // find `M`
            var fm = _.find(me.targets.M, function(t){
                return t[1] === me.sources.M[1];
            });

            if (fm) {
                me.resume('H');

                if (me.sources.M[0] < fm[0]) {
                    x1 = me.sources.M[0];
                    x2 = fm[0] + fm[2];
                } else {
                    x1 = me.sources.M[0] + me.sources.M[2];
                    x2 = fm[0];
                }

                me.components.H.attr({
                    x1: x1,
                    y1: me.sources.M[1],
                    x2: x2,
                    y2: fm[1]
                });
            } else {
                me.suspend('H');
            }

            // find `C`
            var fc = _.find(me.targets.C, function(t){
                return t[0] === me.sources.C[0];
            });

            if (fc) {
                me.resume('V');

                if (me.sources.C[1] < fc[1]) {
                    y1 = me.sources.C[1];
                    y2 = fc[1] + fc[3];
                } else {
                    y1 = me.sources.C[1] + me.sources.C[3];
                    y2 = fc[1];
                }

                me.components.V.attr({
                    x1: me.sources.C[0],
                    y1: y1, //me.sources.C[1],
                    x2: fc[0],
                    y2: y2
                    // x1: me.sources.C[0],
                    // y1: y1,
                    // x2: fc[0],
                    // y2: y2
                });
            } else {
                me.suspend('V');
            }

        },

        deactivate: function() {
            this.suspend('H');
            this.suspend('V');
            this.components.G.elem.detach();

            this.components.H.attr({
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0
            });

            this.components.V.attr({
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0
            });

            this.sources.M = [];
            this.sources.C = [];

            this.targets.M = [];
            this.targets.C = [];
            
        }
    });

}());