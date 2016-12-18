
(function(){

    Graph.plugin.Snapper = Graph.extend(Graph.plugin.Plugin, {

        props: {
            enabled: true,
            suspended: true,
            rendered: false,
            vector: null
        },

        clients: {

        },

        components: {
            block: null,
            stubx: null,
            stuby: null
        },

        // trans
        snapping: {
            coords: null,
            vector: null,
            offset: null,
            stubx: null,
            stuby: null
        },

        constructor: function(vector, options) {
            options = options || {};

            if ( ! vector.isPaper()) {
                throw Graph.error("Snapper plugin only available for paper");
            }

            _.assign(this.props, options);

            this.props.vector  = vector.guid();

            this.initComponent(vector);
            this.snapping.coords = {};
        },

        invalidate: function() {
            for (var key in this.snapping) {
                this.snapping[key] = null;
            }

            this.snapping.coords = {};
            this.clients = {};
        },

        initComponent: function(vector) {
            var block, stubx, stuby;

            block = (new Graph.svg.Group())
                .selectable(false)
                .clickable(false)
                .addClass('graph-snapper');

            stubx = (new Graph.svg.Path('M 0 0 L 0 0'))
                .removeClass(Graph.styles.VECTOR)
                .selectable(false)
                .clickable(false)
                .render(block);

            stuby = (new Graph.svg.Path('M 0 0 L 0 0'))
                .removeClass(Graph.styles.VECTOR)
                .clickable(false)
                .selectable(false)
                .render(block);

            this.components.block = block.guid();
            this.components.stuby = stuby.guid();
            this.components.stubx = stubx.guid();

        },

        component: function(name) {
            if (name === undefined) {
                return Graph.registry.vector.get(this.components.block);
            }
            return Graph.registry.vector.get(this.components[name]);
        },

        render: function() {
            if (this.props.rendered) {
                return;
            }
            this.component().render(this.vector());
            this.props.rendered = true;
        },

        enable: function() {
            this.props.enabled = true;
        },

        disable: function() {
            this.props.enabled = false;
        },

        suspend: function() {
            this.props.suspended = true;
            this.component().elem.detach();
        },

        resume: function() {
            if (this.props.suspended) {
                this.props.suspended = false;
                if ( ! this.props.rendered) {
                    this.render();
                } else {
                    var block = this.component(),
                        viewport = this.vector().viewport();
                    block.elem.appendTo(viewport.elem);
                }
            }
        },

        refresh: function(clientId) {
            if (this.props.enabled) {
                var key, client, center, token;

                if (clientId !== undefined) {
                    var options = this.clients[clientId];

                    if (options) {
                        if (this.snapping.coords[options.coords]) {
                            delete this.snapping.coords[options.coords];
                        }
                        client = Graph.registry.vector.get(clientId);    
                        if (client) {
                            center = this.getClientCenter(client);
                            token = center.x + '_' + center.y;
                            this.snapping.coords[token] = center;
                            this.clients[clientId].coords = token;
                        }
                    }
                } else {
                    this.snapping.coords = {};    
                    for (key in this.clients) {
                        client = Graph.registry.vector.get(key);
                        if (client) {
                            center = this.getClientCenter(client);
                            token = center.x + '_' + center.y;
                            this.snapping.coords[token] = center;
                            this.clients[key].coords = token;
                        }
                    }  
                }
            }
        },

        setup: function(client, options) {

            if ( ! this.props.enabled) {
                return;
            }

            var me = this,
                clientId = client.guid();

            var key;

            if (me.clients[clientId]) {
                client.off('beforedrag', me.clients[clientId].beforeDragHandler);
                client.off('afterdrag',  me.clients[clientId].afterDragHandler);
                client.off('afterdestroy',  me.clients[clientId].afterDestroyHandler);

                if (me.clients[clientId].coords) {
                    delete me.snapping.coords[me.clients[clientId].coords];
                }

                delete me.clients[clientId];
            }

            if (options.enabled) {

                var dragger = client.draggable();

                me.clients[clientId] = {
                    coords: null,
                    osnaps: dragger.snap(),
                    beforeDragHandler: _.bind(me.onClientBeforeDrag, me, _, client),
                    afterDragHandler: _.bind(me.onClientAfterDrag, me, _, client),
                    afterDestroyHandler: _.bind(me.onClientAfterDestroy, me, _, client)
                };

                client.on('beforedrag', me.clients[clientId].beforeDragHandler);
                client.on('afterdrag', me.clients[clientId].afterDragHandler);
                client.on('afterdestroy',  me.clients[clientId].afterDestroyHandler);

                var center = me.getClientCenter(client),
                    coords = this.snapping.coords;

                // this.vector().circle(center.x, center.y, 5);

                key = center.x + '_' + center.y;

                if ( ! coords[key]) {
                    coords[key] = center;
                    me.clients[clientId].coords = key;
                }

                key = null;
            }
        },

        repairClient: function(client) {
            console.log(client);
        },

        getClientCenter: function(client) {
            var bbox = client.bboxView(),
                center = bbox.center(true);

            return center;
        },

        showStub: function(axis, value) {
            var snapping = this.snapping;
            var command;

            if (axis == 'x') {
                command = 'M ' + value + ' -100000 L ' + value + ' 100000';

                snapping.stubx.attr('d', command);
                snapping.stubx.addClass('visible');
            }

            if (axis == 'y') {
                command = 'M -100000 ' + value + ' L 100000 ' + value;

                snapping.stuby.attr('d', command);
                snapping.stuby.addClass('visible');
            }

            command = null;
        },

        hideStub: function(axis) {
            var stub = axis == 'x' ? 'stubx' : 'stuby';
            this.snapping[stub].removeClass('visible');
        },

        onClientBeforeDrag: function(e, client) {

            if ( ! this.props.enabled) {
                return;
            }

            var me = this,
                paper = me.vector(),
                viewport = paper.viewport(),
                layout = paper.layout(),
                offset = layout.position(),
                center = me.getClientCenter(client);

            var snapping = this.snapping,
                coords = snapping.coords;

            snapping.stubx = this.component('stubx');
            snapping.stuby = this.component('stuby');

            var left = offset.left,
                top = offset.top,
                ma = viewport.matrix(),
                pt = layout.pointerLocation({clientX: e.x, clientY: e.y}),
                diffx = center.x - pt.x,
                diffy = center.y - pt.y,
                snapx = [],
                snapy = [];

            _.forOwn(coords, function(c){
                var mx, my, vx, vy;

                mx = ma.x(c.x - diffx, c.y - diffy);
                my = ma.y(c.x - diffx, c.y - diffy);

                vx = mx + left;

                if (_.indexOf(snapx, vx) === -1) {
                    snapx.push(vx);
                }

                vy = my + top;

                if (_.indexOf(snapy, vy) === -1) {
                    snapy.push(vy);
                }
            });

            client.draggable().snap([
                function(x, y) {
                    var rx, ry, x1, y1, pt;

                    rx = snapValue(x, snapx);
                    ry = snapValue(y, snapy);

                    x1 = rx.value;
                    y1 = ry.value;

                    pt = layout.pointerLocation({
                        clientX: x1,
                        clientY: y1
                    });

                    if (rx.snapped) {
                        me.showStub('x', pt.x + diffx);
                    } else {
                        me.hideStub('x');
                    }

                    if (ry.snapped) {
                        me.showStub('y', pt.y + diffy);
                    } else {
                        me.hideStub('y');
                    }

                    return {
                        x: x1,
                        y: y1
                    };
                }
            ]);

            me.resume();
        },

        onClientAfterDrag: function(e, client) {

            if ( ! this.props.enabled) {
                return;
            }

            var snapping = this.snapping,
                options = this.clients[client.guid()];

            if (options) {
                var dragger = client.draggable();

                if (options.osnaps) {
                    dragger.snap(options.osnaps);
                }

                var token, center;

                if (options.coords) {
                    delete snapping.coords[options.coords];
                }

                center = this.getClientCenter(client);
                token = center.x + '_' + center.y;

                if ( ! snapping.coords[token]) {
                    snapping.coords[token] = center;
                    options.coords = token;
                }

                token = null;
                center = null;
            }

            this.suspend();

            _.assign(this.snapping, {
                stubx: null,
                stuby: null
            });
        },

        onClientAfterDestroy: function(e, client) {
            var guid = client.guid(),
                options = this.clients[guid],
                snapping = this.snapping;

            if (options) {
                if (options.coords) {
                    if (snapping.coords[options.coords]) {
                        delete snapping.coords[options.coords];
                    }
                }
                delete this.clients[guid];
            }
        },

        toString: function() {
            return 'Graph.plugin.Snapper';
        }

    });

    ///////// HELPERS /////////

    function snapValue(value, snaps, range) {
        range = _.defaultTo(range, 10);

        var i = snaps.length, v;

        while(i--) {
            v = Math.abs(snaps[i] - value);
            if (v <= range) {
                return {
                    snapped: true,
                    value: snaps[i]
                };
            }
        }

        return {
            snapped: false,
            value: value
        };
    }

}());
