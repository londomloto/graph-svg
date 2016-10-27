
(function(){

    Graph.plugin.Linker = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null,
            enabled: false,
            suspended: true,
            rendered: false
        },

        components: {
            block: null,
            pointer: null,
            path: null
        },

        linking: {
            treshold: 10,
            enabled: false,
            moveHandler: null,
            stopHandler: null,
            source: null,
            start: null,
            target: null,
            end: null,
            visits: []
        },

        constructor: function(vector) {
            var me = this, vendor;

            if ( ! vector.isPaper()) {
                throw Graph.error('Linker plugin is only available for paper !');
            }

            vendor = vector.interactable().vendor();
            vendor.on('down', _.bind(me.onPointerDown, me, _, vector));

            vector.on('keynavdown', function(e){
                if (e.keyCode === Graph.event.ESC) {
                    me.invalidate();
                    vector.tool().activate('panzoom');
                }
            });

            me.props.vector = vector.guid();
            me.initComponent(vector);
        },
        
        initComponent: function(paper) {
            var me = this, comp = me.components;

            comp.block = (new Graph.svg.Group())
                .addClass('graph-linker-path')
                .selectable(false);

            comp.pointer = (new Graph.svg.Circle())
                .addClass('graph-linker-pointer')
                .removeClass(Graph.string.CLS_VECTOR_CIRCLE)
                .selectable(false)
                .render(comp.block);

            comp.path = (new Graph.svg.Path())
                .addClass('graph-linker-path')
                .removeClass(Graph.string.CLS_VECTOR_PATH)
                .selectable(false)
                .render(comp.block)
                .attr('marker-end', 'url(#marker-arrow)');
        },

        render: function() {
            var paper;

            if (this.props.rendered) {
                return;
            }

            paper = this.vector();
            this.components.block.render(paper);
            this.props.rendered = true;
        },

        invalidate: function() {
            var vector, vendor;

            if (this.linking.enabled) {
                vector = this.vector();
                vendor = vector.interactable().vendor();

                vector.removeClass('linking');

                if (this.linking.moveHandler) {
                    vendor.off('move', this.linking.moveHandler);
                }

                if (this.linking.stopHandler) {
                    vendor.off('up', this.linking.stopHandler);   
                }

                if (this.linking.source) {
                    this.linking.source.removeClass('disallowed');
                }

                if (this.linking.target) {
                    this.linking.target.removeClass('allowed');
                }

                _.assign(this.linking, {
                    enabled: false,
                    moveHandler: null,
                    stopHandler: null,
                    source: null,
                    start: null,
                    target: null,
                    end: null
                });
                
                if (this.linking.visits) {
                    _.forEach(this.linking.visits, function(v){
                        v.removeClass('connect-valid connect-invalid');
                    });
                }
                
                this.linking.visits = null;
            }
        },

        enable: function() {
            this.props.enabled = true;
            this.vector().state('linking');
        },

        disable: function() {
            this.props.enabled = false;
            this.invalidate();
            this.suspend();
        },

        suspend: function() {
            this.props.suspended = true;
            this.components.block.elem.detach();
        },

        resume: function() {
            var paper;

            if ( ! this.props.suspended) {
                return;
            }

            paper = this.vector();
            this.props.suspended = false;
            
            if ( ! this.props.rendered) {
                this.render();
            } else {
                paper.viewport().elem.append(this.components.block.elem);
            }
        },

        cropping: function(start, end) {
            var source = this.linking.source,
                target = this.linking.target,
                cable = new Graph.lang.Path([['M', start.x, start.y], ['L', end.x, end.y]]);

            var spath, scrop, tpath, tcrop;

            if (source) {
                spath = source.connectable().pathinfo();
                scrop = spath.intersection(cable, true);
            }

            if (target) {
                tpath = target.connectable().pathinfo();
                tcrop = tpath.intersection(cable, true);
            }

            cable = spath = tpath = null;

            return {
                start: scrop ? scrop[0] : null,
                end:   tcrop ? tcrop[0] : null
            };
        },

        build: function() {
            var tail = this.components.path.tail(),
                head = this.components.path.head();

            if (tail && head) {
                var paper = this.vector();
                paper.connect(
                    this.linking.source, 
                    this.linking.target,
                    tail,
                    head
                );
            }

            this.invalidate();
            this.suspend();
        },

        onPointerDown: function(e, paper) {
            var layout = paper.layout(),
                offset = layout.offset(),
                vector = layout.grabVector(e), 
                vendor = paper.interactable().vendor(),
                tool = paper.tool().current();

            if (tool != 'linker') {
                return;
            }

            if (this.linking.enabled) {
                if (this.linking.target) {
                    this.build();
                }
            } else {
                
                this.linking.visits = [];

                if (vector.isConnectable()) {
                    var sbox, port;

                    // track visit
                    this.linking.visits.push(vector);

                    if ( ! this.linking.source) {
                        
                        sbox = vector.connectable().bbox();
                        port = sbox.center(true);

                        this.linking.source = vector;
                        this.linking.start = port;

                        this.components.path
                            .moveTo(port.x, port.y)
                            .lineTo(port.x, port.y, false);

                        sbox = port = null;
                    }

                    if (this.props.suspended) {
                        this.resume();    
                    }

                    this.linking.enabled = true;
                    this.linking.moveHandler = _.bind(this.onPointerMove, this, _, paper);

                    paper.addClass('linking');

                    vendor = paper.interactable().vendor();
                    vendor.on('move', this.linking.moveHandler);
                }
            }
        },

        onPointerMove: function(e, paper) {
            var layout = paper.layout(),
                start = this.linking.start,
                coord = layout.grabLocation(e);

            var x = coord.x,
                y = coord.y;

            // add threshold
            var rad = Graph.util.rad(Graph.util.theta( start, {x: x, y: y} )),
                sin = Math.sin(rad),
                cos = Math.cos(rad),
                tdx = this.linking.treshold * -cos,
                tdy = this.linking.treshold *  sin;

            x += tdx;
            y += tdy;

            var current = layout.grabVector(e),
                valid = false;

            var target, crop, tbox, port;

            if (current && current.isConnectable()) {
                
                if (this.linking.visits.indexOf(current.guid()) === -1) {
                    this.linking.visits.push(current);
                }

                if (this.linking.source.connectable().canConnect(current.connectable())) {
                    valid = true;
                    target = current;

                    target.removeClass('connect-invalid');
                    target.addClass('connect-valid');
                    
                    tbox = current.connectable().bbox();
                    port = tbox.center(true);
                    
                    this.linking.target = target;
                    this.linking.end    = port;

                    crop = this.cropping(start, port);

                    if (crop.start) {
                        this.components.path.moveTo(crop.start.x, crop.start.y);
                    }

                    if (crop.end) {
                        this.components.path.lineTo(crop.end.x, crop.end.y, false);
                    } else {
                        this.components.path.lineTo(x, y, false);
                    }

                    tbox = port = null;

                } else {
                    current.removeClass('connect-valid');
                    current.addClass('connect-invalid');
                }
            }

            if ( ! valid) {

                if (this.linking.target) {
                    this.linking.target.removeClass('connect-valid connect-invalid');
                }

                this.linking.target = null;
                this.linking.end    = null;

                crop = this.cropping(start, {x: x, y: y});

                if (crop.start) {
                    this.components.path.moveTo(crop.start.x, crop.start.y);
                }

                if (crop.end) {
                    this.components.path.lineTo(crop.end.x, crop.end.y, false);
                } else {
                    this.components.path.lineTo(x, y, false);
                }
            }

        }

    });

    ///////// HELPER /////////
    


}());