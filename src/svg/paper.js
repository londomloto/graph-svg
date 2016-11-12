
(function(){

    /**
     * Paper - root viewport
     */

    var Paper = Graph.svg.Paper = Graph.extend(Graph.svg.Vector, {
        
        attrs: {
            'class': Graph.styles.PAPER
        },

        props: {
            id: null,
            guid: null,
            type: 'paper',
            text: null,
            rotate: 0,

            traversable: false,
            selectable: false,
            selected: false,
            focusable: false,

            rendered: false,
            showOrigin: true,
            zoomable: true
        },

        components: {
            viewport: null
        },

        constructor: function(width, height, options) {
            var me = this;

            me.superclass.prototype.constructor.call(me, 'svg', {
                'xmlns': Graph.config.xmlns.svg,
                'xmlns:link': Graph.config.xmlns.xlink,
                'version': Graph.config.svg.version
                // 'width': _.defaultTo(width, 200),
                // 'height': _.defaultTo(height, 200)
            });

            _.assign(me.props, options || {});

            me.style({
                overflow: 'hidden',
                position: 'relative'
            });

            me.interactable();
            me.initLayout();

            me.plugins.collector = new Graph.plugin.Collector(me);
            me.plugins.toolmgr.register('collector', 'plugin');

            me.plugins.linker = new Graph.plugin.Linker(me);
            me.plugins.toolmgr.register('linker', 'plugin');
            
            me.plugins.pencil = new Graph.plugin.Pencil(me);
            me.plugins.definer = new Graph.plugin.Definer(me);
            
            me.plugins.snapper = new Graph.plugin.Snapper(me);
            me.plugins.toolpad = new Graph.plugin.Toolpad(me);

            me.on('pointerdown', _.bind(me.onPointerDown, me));
            me.on('keynavdown', _.bind(me.onKeynavDown, me));
            me.on('keynavup', _.bind(me.onKeynavUp, me));
            
            // subscribe topics
            Graph.topic.subscribe('link/update', _.bind(me.listenLinkUpdate, me));
            Graph.topic.subscribe('link/remove', _.bind(me.listenLinkRemove, me));
            Graph.topic.subscribe('shape/draw',  _.bind(me.listenShapeDraw, me));
        },

        initLayout: function() {
            // create viewport
            var viewport = (new Graph.svg.Group())
                .addClass(Graph.styles.VIEWPORT)
                .selectable(false);

            viewport.props.viewport = true;
            
            this.components.viewport = viewport.guid();

            if (this.props.showOrigin) {
                var origin = Graph.$(
                    '<g class="graph-origin">' + 
                        '<rect class="x" rx="1" ry="1" x="-16" y="-1" height="1" width="30"></rect>' + 
                        '<rect class="y" rx="1" ry="1" x="-1" y="-16" height="30" width="1"></rect>' + 
                        '<text class="t" x="-40" y="-10">(0, 0)</text>' + 
                    '</g>'
                );
                
                origin.appendTo(viewport.elem);
                origin = null;
            }

            // render viewport
            viewport.tree.paper = viewport.tree.parent = this.guid();
            viewport.translate(0.5, 0.5).commit();

            this.elem.append(viewport.elem);
            this.children().push(viewport);

            viewport.on('render', function(){
                viewport.cascade(function(c){
                    if (c !== viewport && ! c.props.rendered) {
                        c.props.rendered = true;
                        c.tree.paper = viewport.tree.paper;
                        c.fire('render');
                    }
                });
            });

            this.layout('default');
        },

        layout: function(options) {
            var viewport = this.viewport();

            if (options === undefined) {
                return viewport.graph.layout;
            }
            
            viewport.layout(options);
            return this;
        },

        shape: function(names, options) {
            var shape = Graph.shape(names, options);
            shape.render(this);
            
            return shape;
        },

        render: function(container) {
            var me = this, 
                vp = me.viewport(),
                id = me.guid();

            if (me.props.rendered) {
                return;
            }

            container = Graph.$(container);
            container.append(me.elem);

            me.tree.container = container;
            
            me.elem.css({
                width: '100%',
                height: '100%'
            });
            
            me.props.rendered = true;
            me.fire('render');

            vp.props.rendered = true;
            vp.fire('render');

            if (me.props.zoomable) {
                me.zoomable();
                
                var debounce = _.debounce(function(){
                    debounce.flush();
                    debounce = null;
                    
                    me.tool().activate('panzoom');
                }, 1000);
                
                debounce();
            }

            return me;
        },

        container: function() {
            return this.tree.container;
        },

        selections: function() {
            return this.plugins.collector.selections;
        },

        removeSelection: function() {
            var selections = this.plugins.collector.collection;
            
            for (var v, i = selections.length - 1; i >= 0; i--) {
                v = selections[i];
                selections.splice(i, 1);
                v.remove();
            }
        },

        viewport: function() {
            return Graph.registry.vector.get(this.components.viewport);
        },

        // @Override
        scale: function(sx, sy, cx, cy) {
            if (sx === undefined) {
                return this.viewport().matrix().scale();
            }
            return this.plugins.transformer.scale(sx, sy, cx, cy);
        },

        width: function() {
            return this.elem.width();
        },

        height: function() {
            return this.elem.height();
        },

        connect: function(source, target, start, end, options) {
            var layout, router, link;

            if (start) {
                if ( ! Graph.isPoint(start)) {
                    options = start;
                    start = null;
                    end = null;    
                }
            }

            source = Graph.isShape(source) ? source.provider('network') : source;
            target = Graph.isShape(target) ? target.provider('network') : target;
            layout = this.layout();
            router = layout.createRouter(source, target, options);
            
            link = layout.createLink(router);
            
            link.connect(start, end);
            link.render(this);

            return link;
        },
        
        addPallet: function(pallet) {
            pallet.bindPaper(this);
        },
        
        removePallet: function(pallet) {
            pallet.unbindPaper(this);
        },

        parse: function(json) {
            var paper  = this;
            var shapes = {};

            _.forEach(json.shapes, function(o){
                (function(o){
                    var s = Graph.shape(o.type, o.data);
                    s.render(paper);
                    shapes[o.data.id] = s;    
                }(o));
            });

            _.forEach(json.links, function(o){
                (function(o){
                    paper.connect(shapes[o.source], shapes[o.target]);
                }(o))
            });

        },

        save: function() {
            alert('save');
        },

        toString: function() {
            return 'Graph.svg.Paper';
        },

        ///////// OBSERVERS /////////
        
        onPointerDown: function(e) {

        },

        onKeynavDown: function(e) {
            var me = this, key = e.keyCode;

            switch(key) {
                case Graph.event.DELETE:
                    me.removeSelection();
                    e.preventDefault();
                    break;

                case Graph.event.SHIFT:
                    
                    break;

                case Graph.event.ESC:

                    break;
            }   

        },

        onKeynavUp: function(e) {
            var me = this, key = e.keyCode;

            switch(key) {
                case Graph.event.SHIFT:

                    break;
            }
        },

        saveAsImage: function(filename) {
            var exporter = new Graph.data.Exporter(this);
            exporter.exportPNG(filename);
            exporter = null;
        },

        /**
         * save workspace
         */
        save: function() {

        },

        ///////// TOPIC LISTENERS /////////
        
        listenLinkUpdate: _.debounce(function() {
            this.layout().arrangeLinks();
        }, 300),
        
        listenLinkRemove: _.debounce(function(){
            this.layout().arrangeLinks();
        }, 10),

        listenShapeDraw: _.debounce(function() {
            this.layout().arrangeShapes();
        }, 1)

    });

    ///////// STATICS /////////
    
    Paper.toString = function() {
        return 'function( width, height )';
    };

    ///////// EXTENSIONS /////////

    var vectors = {
        ellipse: 'Ellipse',
        circle: 'Circle',
        rect: 'Rect',
        path: 'Path',
        polyline: 'Polyline',
        polygon: 'Polygon',
        group: 'Group',
        text: 'Text',
        image: 'Image',
        line: 'Line'
    };

    _.forOwn(vectors, function(name, method){
        (function(name, method){
            Paper.prototype[method] = function() {
                var arg = [name].concat(_.toArray(arguments)),
                    svg = Graph.svg.apply(null, arg);

                svg.tree.paper = this.guid();
                svg.render(this);

                arg = null;
                return svg;
            };
        }(name, method));
    });


}());