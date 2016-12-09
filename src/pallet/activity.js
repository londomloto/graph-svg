
(function(){

    Graph.pallet.Activity = Graph.extend({
        
        props: {
            guid: null
        },
        
        components: {
            pallet: null
        },
        
        cached: {
            
        },
        
        constructor: function(options) {
            _.assign(this.props, options || {});
            this.props.guid = 'pallet-' + (++Graph.pallet.Activity.guid);
            this.initComponent();

            Graph.registry.pallet.register(this);
        },

        guid: function() {
            return this.props.guid;
        },

        initComponent: function() {
            var template, pallet;
            
            template = _.format(
                '<svg class="graph-pallet" xmlns="{0}" xmlns:xlink="{1}" version="{2}" style="width: 100%; height: 100%">' + 
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
                        '<text x="32" y="36">Stop</text>' + 
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
                        '<rect x="2" y="28" width="60" height="6" rx="0" ry="0" class="full"/>' + 
                        '<path d="M 10  0 L 10 28"></path>' + 
                        '<path d="M 54  0 L 54 28"></path>' + 
                        '<path d="M 32 34 L 32 60" marker-end="url(#marker-arrow-pallet)"></path>' + 
                        '<text x="32" y="20">Join</text>' + 
                    '</g>' + 
                    '<g class="graph-pallet-item" data-shape="Graph.shape.activity.Fork" transform="matrix(1,0,0,1,40,420)">' + 
                        '<rect x="2" y="28" width="60" height="6" rx="0" ry="0" class="full"/>' + 
                        '<path d="M 10 34 L 10 60" marker-end="url(#marker-arrow-pallet)"></path>' + 
                        '<path d="M 54 34 L 54 60" marker-end="url(#marker-arrow-pallet)"></path>' + 
                        '<path d="M 32  0 L 32 28"></path>' + 
                        '<text x="32" y="50">Fork</text>' + 
                    '</g>' + 
                    '<g class="graph-pallet-item" data-shape="Graph.shape.activity.Lane" transform="matrix(1,0,0,1,40,500)">' + 
                        '<rect x="2" y="2" width="60" height="60" rx="0" ry="0"/>' + 
                        '<rect x="2" y="2" width="10" height="60" rx="0" ry="0"/>' + 
                        '<text x="32" y="34">Role</text>' + 
                    '</g>' + 
                '</svg>',
                Graph.config.xmlns.svg,
                Graph.config.xmlns.xlink,
                Graph.config.svg.version
            );
            
            pallet = Graph.$(template);
            
            var me = this;

            // setup draggable
            var draggable = interact('.graph-pallet-item', pallet.node()).draggable({
                manualStart: true,
                onstart: function(e) {
                    var target = Graph.$(e.target),
                        transform = Graph.util.transform2segments(target.attr('transform')),
                        shape = target.data('shape');

                    transform = transform[0].slice(1);
                    me.cached.matrix = Graph.factory(Graph.lang.Matrix, transform);

                    target.addClass('grabbing');
                    
                    me.fire('drawstart', {shape: shape});
                    transform = target = null;
                },
                onmove: function(e) {
                    me.cached.matrix.translate(e.dx, e.dy);
                    e.target.setAttribute('transform', me.cached.matrix.toValue());
                },
                onend: function(e) {
                    var target = Graph.$(e.target);
                    
                    target.removeClass('grabbing');
                    pallet.node().removeChild(me.cached.clone);

                    me.cached.matrix = null;
                    target = null;

                    me.fire('drawend');
                }
            })
            .on('move', function(e){
                var i = e.interaction;
                if (i.pointerIsDown && ! i.interacting()) {
                    var action = {name: 'drag'};

                    // -- workaround for a bug in v1.2.6 of interact.js
                    i.prepared.name = action.name;
                    i.setEventXY(i.startCoords, i.pointers);

                    me.cached.clone = e.currentTarget.cloneNode(true);
                    pallet.node().appendChild(me.cached.clone);
                    i.start(action, e.interactable, me.cached.clone);
                }
            });
            
            draggable.styleCursor(false);
            this.components.pallet = pallet;
        },

        render: function(container) {
            container = Graph.$(container);
            container.prepend(this.components.pallet);
            container = null;
        },
        
        toString: function() {
            return 'Graph.pallet.Activity';
        }

    });

    Graph.pallet.Activity.guid = 0;

}());