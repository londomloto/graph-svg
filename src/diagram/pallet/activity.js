
(function(){

    var Pallet = Graph.diagram.pallet.Activity = Graph.extend({
        
        props: {
            guid: null,
            rendered: false,
            template: null
        },
        
        components: {
            pallet: null
        },
        
        cached: {
            
        },

        picking: {
            enabled: false,
            target: null,
            matrix: null,
            shape: null,
            begin: false,
            start: null
        },
        
        constructor: function(options) {
            _.assign(this.props, options || {});
            this.props.guid = 'pallet-' + (++Pallet);
            this.initComponent();

            Graph.registry.pallet.register(this);
        },

        guid: function() {
            return this.props.guid;
        },

        initComponent: function() {
            var template, contents, pallet;

            contents = this.props.template;

            if ( ! contents) {
                contents = '' + 
                    '<defs>' + 
                        '<marker id="marker-arrow-pallet" refX="11" refY="10" viewBox="0 0 20 20" markerWidth="10" markerHeight="10" orient="auto">' + 
                            '<path d="M 1 5 L 11 10 L 1 15 Z" fill="#30D0C6" stroke-linecap="round" stroke-dasharray="10000, 1"/>' + 
                        '</marker>' + 
                    '</defs>' + 
                    '<g class="graph-pallet-item" data-shape="Graph.shape.activity.Start" transform="matrix(1,0,0,1,40,0)">' + 
                        '<circle cx="32" cy="32" r="30"/>' +
                        '<text x="32" y="36">Start</text>' + 
                    '</g>' + 
                    '<g class="graph-pallet-item" data-shape="Graph.shape.activity.Final" transform="matrix(1,0,0,1,40,80)">' + 
                        '<circle cx="32" cy="32" r="30"/>' + 
                        '<circle cx="32" cy="32" r="24" class="full"/>' + 
                        '<text x="32" y="36">End</text>' + 
                    '</g>' + 
                    '<g class="graph-pallet-item" data-shape="Graph.shape.activity.Action" transform="matrix(1,0,0,1,40,160)">' + 
                        '<rect x="2" y="2" width="60" height="60" rx="7" ry="7"/>' + 
                        '<text x="32" y="34">Action</text>' + 
                    '</g>' + 
                    '<g class="graph-pallet-item" data-shape="Graph.shape.activity.Router" transform="matrix(1,0,0,1,40,250)">' + 
                        '<rect x="4" y="4" width="54" height="54" transform="rotate(45,32,32)"/>' + 
                        '<text x="30" y="34">Route</text>' + 
                    '</g>' + 
                    '<g class="graph-pallet-item" data-shape="Graph.shape.activity.Join" transform="matrix(1,0,0,1,40,340)">' + 
                        '<rect x="2" width="60" height="58" rx="0" ry="0" style="fill: rgba(255,255,255,0); stroke-width: 0" />' + 
                        '<rect x="2" y="28" width="60" height="6" rx="0" ry="0" pointer-events="none" class="full"/>' + 
                        '<path d="M 10  0 L 10 28" pointer-events="none" ></path>' + 
                        '<path d="M 54  0 L 54 28" pointer-events="none" ></path>' + 
                        '<path d="M 32 34 L 32 60" marker-end="url(#marker-arrow-pallet)" pointer-events="none" ></path>' + 
                        '<text x="32" y="20">Join</text>' + 
                    '</g>' + 
                    '<g class="graph-pallet-item" data-shape="Graph.shape.activity.Fork" transform="matrix(1,0,0,1,40,420)">' + 
                        '<rect x="2" width="60" height="58" rx="0" ry="0" pointer-events="none" style="fill: rgba(255,255,255,0); stroke-width: 0" />' + 
                        '<rect x="2" y="28" width="60" height="6" rx="0" ry="0" class="full"/>' + 
                        '<path d="M 10 34 L 10 60" marker-end="url(#marker-arrow-pallet)" pointer-events="none" ></path>' + 
                        '<path d="M 54 34 L 54 60" marker-end="url(#marker-arrow-pallet)" pointer-events="none" ></path>' + 
                        '<path d="M 32  0 L 32 28" pointer-events="none" ></path>' + 
                        '<text x="32" y="50">Fork</text>' + 
                    '</g>' + 
                    '<g class="graph-pallet-item" data-shape="Graph.shape.activity.Lane" transform="matrix(1,0,0,1,40,510)">' + 
                        '<rect x="2" y="2" width="60" height="60" rx="0" ry="0"/>' + 
                        '<rect x="2" y="2" width="10" height="60" rx="0" ry="0"/>' + 
                        '<text x="32" y="34">Role</text>' + 
                    '</g>';
            }

            template = _.format(
                '<svg class="graph-pallet" xmlns="{0}" xmlns:xlink="{1}" version="{2}" style="width: 100%; height: 100%">' + 
                    contents + 
                '</svg>',
                Graph.config.xmlns.svg,
                Graph.config.xmlns.xlink,
                Graph.config.svg.version
            );

            pallet = Graph.$(template);
            this.components.pallet = pallet;
        },

        stopPicking: function() {
            if (this.picking.enabled) {
                this.picking.target.remove();
                _.assign(this.picking, {
                    target: null,
                    matrix: null,
                    offset: null,
                    enabled: false,
                    shape: null,
                    start: false
                });
            }
        },

        render: function(container) {
            if (this.props.rendered) {
                return;
            }

            var me = this, 
                pallet = this.components.pallet;

            this.props.rendered = true;

            container = Graph.$(container);
            container.prepend(pallet);
            container = null;

            interact('.graph-pallet-item')
                .on('down', function(e){
                    dragStart(e);
                })
                .on('move', function(e){
                    dragMove(e);
                })
                .on('up', function(e){
                    dragStop(e);
                });

            /////////
            
            pallet.on('mouseleave', function(e){
                dragStop(e);
            });

            function dragStart(e) {
                var target = Graph.$(e.currentTarget);

                if (me.picking.enabled) {
                    dragStop(e);
                }

                if (target.data('shape') !== undefined) {
                    var transform = Graph.util.transform2segments(target.attr('transform'));
                    transform = transform[0].slice(1);

                    me.picking.enabled = true;
                    me.picking.matrix = Graph.factory(Graph.lang.Matrix, transform);
                    me.picking.target = Graph.$(e.currentTarget.cloneNode(true));
                    me.picking.target.addClass('grabbing');
                    me.picking.shape = target.data('shape');

                    pallet.append(me.picking.target);

                    me.fire('pick', {
                        shape: me.picking.shape,
                        origin: {
                            x: e.clientX,
                            y: e.clientY
                        }
                    });

                    transform = null;

                }
            }

            function dragMove(e) {
                var i = e.interaction;

                if (i.pointerIsDown && me.picking.target) {
                    e.preventDefault();
                    
                    var current = {
                        x: e.clientX,
                        y: e.clientY
                    };

                    if ( ! me.picking.offset) {
                        me.picking.offset = current;
                    }

                    var dx = current.x - me.picking.offset.x,
                        dy = current.y - me.picking.offset.y;

                    me.picking.matrix.translate(dx, dy);
                    me.picking.target.attr('transform', me.picking.matrix.toValue());

                    me.fire('drag', {
                        dx: dx,
                        dy: dy
                    }); 

                    me.picking.offset = current;
                }
            }

            function dragStop(e) {
                if (me.picking.enabled) {
                    me.fire('drop', {
                        clientX: e.clientX,
                        clientY: e.clientY
                    });
                }
                me.stopPicking();
            }

            return this;
        },
        
        toString: function() {
            return 'Graph.diagram.pallet.Activity';
        }

    });

    Pallet.guid = 0;

}());