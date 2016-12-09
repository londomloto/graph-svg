
(function(){

    Graph.plugin.Snapper = Graph.extend(Graph.plugin.Plugin, {

        props: {
            enabled: false,
            suspended: true,
            rendered: false,
            vector: null,
            context: null
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
            this.props.context = vector.viewport().guid();

            this.initComponent(vector);
            this.snapping.coords = {};
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

        setup: function(client, options) {

            if ( ! this.props.enabled) {
                return;
            }

            var me = this,
                contextId = this.props.context,
                clientId = client.guid();

            var key;

            if (me.clients[clientId]) {
                client.off('dragstart', me.clients[clientId].dragStartHandler);
                client.off('dragend',  me.clients[clientId].dragEndHandler);
                client.off('remove',  me.clients[clientId].removeHandler);

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
                    dragStartHandler: _.bind(me.onClientDragStart, me, _, client),
                    dragEndHandler: _.bind(me.onClientDragEnd, me, _, client),
                    removeHandler: _.bind(me.onClientRemove, me, _, client)
                };

                client.on('dragstart', me.clients[clientId].dragStartHandler);
                client.on('dragend', me.clients[clientId].dragEndHandler);
                client.on('remove',  me.clients[clientId].removeHandler);

                var center = me.getClientCenter(client),
                    coords = this.snapping.coords;

                key = center.x + '_' + center.y;

                if ( ! coords[key]) {
                    coords[key] = center;
                    me.clients[clientId].coords = key;
                }

                key = null;
            }
        },

        refresh: function(client) {

        },

        getClientCenter: function(client) {
            var clientId = client.guid(),
                contextId = this.props.context,
                matrix = Graph.matrix(),
                path = client.pathinfo();

            var center, bbox;

            client.bubble(function(curr){
                if (curr.guid() == contextId) {
                    return false;
                }
                matrix.multiply(curr.matrix());
            });

            path = path.transform(matrix);
            bbox = path.bbox();

            center = bbox.center().toJson();

            matrix = path = bbox = null;

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

        onClientDragStart: function(e, client) {
            var me = this,
                paper = me.vector(),
                layout = paper.layout(),
                offset = layout.offset(),
                center = me.getClientCenter(client);

            var snapping = this.snapping,
                coords = snapping.coords;

            snapping.stubx = this.component('stubx');
            snapping.stuby = this.component('stuby');

            var left = offset.left,
                top = offset.top,
                ma = this.context().matrix(),
                dx = ma.props.e,
                dy = ma.props.f,
                point = layout.grabLocation({clientX: e.x, clientY: e.y}),
                diffx = center.x - point.x,
                diffy = center.y - point.y,
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

                    pt = layout.grabLocation({
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

        onClientDragEnd: function(e, client) {
            var snapping = this.snapping,
                options = this.clients[client.guid()];

            if (options) {
                var dragger = client.draggable();
                
                if (options.osnaps) {
                    dragger.snap(options.osnaps);
                }

                var key, center;

                if (options.coords) {
                    delete snapping.coords[options.coords];
                }

                center = this.getClientCenter(client);
                key = center.x + '_' + center.y;

                if ( ! snapping.coords[key]) {
                    snapping.coords[key] = center;
                    options.coords = key;
                }
                
                key = null;
                center = null;
            }
            
            this.suspend();

            _.assign(this.snapping, {
                stubx: null,
                stuby: null
            });
        },

        onClientRemove: function(e, client) {
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

    function bboxCenter(client, context) {
        if (client.guid() == context.guid()) {
            return client.bbox().center(true);
        }

        var matrix = Graph.matrix();
        var path, bbox, center;

        client.bubble(function(curr){
            matrix.multiply(curr.matrix());
            if (curr === context) {
                return false;
            }
        });

        path = client.pathinfo().transform(matrix);
        bbox = path.bbox();

        center = bbox.center(true);
        path = bbox = null;

        return center;
    }

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