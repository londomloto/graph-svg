
(function(){

    var CLS_CONNECT_VALID = 'connect-valid',
        CLS_CONNECT_INVALID = 'connect-invalid',
        CLS_CONNECT_RESET = 'connect-valid connect-invalid';

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
            me.initComponent();
        },
        
        initComponent: function() {
            var me = this, 
                comp = me.components;

            var block, pointer, path;

            block = (new Graph.svg.Group())
                .addClass('graph-linker-path')
                .selectable(false);

            pointer = (new Graph.svg.Circle())
                .addClass('graph-linker-pointer')
                .removeClass(Graph.styles.VECTOR)
                .selectable(false)
                .render(block);

            path = (new Graph.svg.Path())
                .addClass('graph-linker-path')
                .removeClass(Graph.styles.VECTOR)
                .selectable(false)
                .render(block)
                .attr('marker-end', 'url(#marker-link-end)');

            comp.block = block.guid();
            comp.pointer = pointer.guid();
            comp.path = path.guid();
        },

        component: function(name) {
            if (name === undefined) {
                return Graph.registry.vector.get(this.components.block);
            }
            return Graph.registry.vector.get(this.components[name]);
        },

        render: function() {
            var paper;

            if (this.props.rendered) {
                return;
            }

            paper = this.vector();
            this.component().render(paper);

            this.props.rendered = true;
        },

        invalidate: function() {
            var vector, vendor;

            if (this.linking.enabled) {
                vector = this.vector();
                vendor = vector.interactable().vendor();
                
                if (this.linking.moveHandler) {
                    vendor.off('move', this.linking.moveHandler);
                    this.linking.moveHandler = null;
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
            var paper = this.vector();
            this.props.enabled = true;

            paper.state('linking');
            paper.addClass('linking');
        },

        disable: function() {
            var paper = this.vector();

            this.props.enabled = false;
            this.invalidate();
            this.suspend();

            paper.removeClass('linking');
        },

        suspend: function() {
            this.props.suspended = true;
            this.component().elem.detach();
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
                this.component().elem.appendTo(paper.viewport().elem);
            }
        },
        
        /**
         *  Start manual linking
         */
        start: function(source, anchor) {
            var paper = this.vector(),
                layout = paper.layout(),
                offset = layout.position();
                
            if (paper.tool().current() != 'linker') {
                return;
            }
            
            if (this.linking.enabled) {
                if (this.linking.source && this.linking.target) {
                    this.build();
                } else {
                    this.invalidate();
                    this.suspend();
                }
                return;
            } else {
                if (source.isPaper()) {
                    this.invalidate();
                    this.suspend();
                    paper.tool().activate('panzoom');
                    return;
                }
            }
            
            this.linking.visits = [];
            
            var vendor, sbox, port;

            if (source.isConnectable()) {

                if (this.props.suspended) {
                    this.resume();    
                }

                var path = this.component('path');

                this.linking.moveHandler = _.bind(this.onPointerMove, this, _, paper, path);    
                
                vendor = paper.interactable().vendor();
                vendor.on('move', this.linking.moveHandler);

                this.linking.visits.push(source);    

                if (source.isConnectable()) {
                    
                    if ( ! this.linking.source) {
                        sbox = source.bboxOriginal();
                        port = sbox.center(true);

                        this.linking.source = source;
                        this.linking.start  = port;
                        
                        if (anchor) {
                            path.moveTo(port.x, port.y).lineTo(anchor.x, anchor.y, false);
                        } else {
                            path.moveTo(port.x, port.y).lineTo(port.x, port.y, false);
                        }   

                        sbox = port = null;
                    }

                }

                this.linking.enabled = true;
            }
        },
        
        cropping: function(start, end) {
            var source = this.linking.source,
                target = this.linking.target,
                cable = new Graph.lang.Path([['M', start.x, start.y], ['L', end.x, end.y]]);

            var spath, scrop, tpath, tcrop;

            if (source) {
                spath = source.shapeView();
                scrop = spath.intersection(cable, true);
            }

            if (target) {
                tpath = target.shapeView();
                tcrop = tpath.intersection(cable, true);
            }

            cable = spath = tpath = null;

            return {
                start: scrop ? scrop[0] : null,
                end:   tcrop ? tcrop[0] : null
            };
        },

        build: function() {
            var path = this.component('path'),
                tail = path.tail(),
                head = path.head();

            if (tail && head) {
                var sourceNetwork = this.linking.source.connectable(),
                    targetNetwork = this.linking.target.connectable();

                sourceNetwork.connectByLinker(targetNetwork, tail, head);
            }

            this.invalidate();
            this.suspend();
        },

        onPointerDown: function(e, paper) {
            var layout = paper.layout(),
                source = layout.grabVector(e);
            
            if (source) {
                this.start(source);
            }
            
            layout = source = null;
        },

        onPointerMove: function(e, paper, path) {
            if (this.linking.enabled) {

                var layout = paper.layout(),
                    target = layout.grabVector(e);

                if ( ! target) {
                    return;
                }

                var source = this.linking.source,
                    valid = false;

                if (source) {

                    // track visit
                    if (this.linking.visits.indexOf(target.guid()) === -1) {
                        this.linking.visits.push(target);
                    }
                    
                    var start = this.linking.start,
                        coord = layout.pointerLocation(e),
                        x = coord.x,
                        y = coord.y,
                        rad = Graph.util.rad(Graph.util.theta(start, {x: x, y: y})),
                        sin = Math.sin(rad),
                        cos = Math.cos(rad),
                        tdx = this.linking.treshold * -cos,
                        tdy = this.linking.treshold *  sin;

                    x += tdx;
                    y += tdy;

                    if (target.isConnectable()) {
                        
                        var crop, tbox, port;

                        if (source.connectable().canConnect(target.connectable())) {
                            valid  = true;

                            target.removeClass(CLS_CONNECT_INVALID);
                            target.addClass(CLS_CONNECT_VALID);
                            
                            tbox = target.bboxOriginal();
                            port = tbox.center(true);

                            this.linking.target = target;
                            this.linking.end    = port;

                            crop = this.cropping(start, port);

                            if (crop.start) {
                                path.moveTo(crop.start.x, crop.start.y);
                            }

                            if (crop.end) {
                                path.lineTo(crop.end.x, crop.end.y, false);
                            } else {
                                path.lineTo(x, y, false);
                            }

                            tbox = port = null;
                        } else {
                            target.removeClass(CLS_CONNECT_VALID);
                            target.addClass(CLS_CONNECT_INVALID);
                        }

                    } else {
                        target.addClass(CLS_CONNECT_INVALID);
                    }

                    if ( ! valid) {

                        if (this.linking.target) {
                            this.linking.target.removeClass(CLS_CONNECT_RESET);
                        }

                        this.linking.target = null;
                        this.linking.end    = null; 

                        crop = this.cropping(start, {x: x, y: y});

                        if (crop.start) {
                            path.moveTo(crop.start.x, crop.start.y);
                        }

                        if (crop.end) {
                            path.lineTo(crop.end.x, crop.end.y, false);
                        } else {
                            path.lineTo(x, y, false);
                        }
                    }

                }
            }

            e.preventDefault();
        },

        toString: function() {
            return 'Graph.plugin.Linker';
        }

    });

    ///////// HELPER /////////
    


}());