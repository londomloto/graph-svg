
(function(){

    var Router = Graph.router.Router = Graph.extend({

        props: {
            type: 'directed',
            domain: null,
            source: null,
            target: null
        },

        values: {
            start: null,
            end: null,
            waypoints: null
        },

        cached: {
            path: null,
            command: null,
            segments: null,
            bendpoints: null,
            bending: null,
            connect: null
        },

        constructor: function(domain, source, target, options) {
            _.assign(this.props, options || {});

            this.props.domain = domain.guid();
            this.props.source = source.guid();
            this.props.target = target.guid();

            this.values.waypoints = [];
        },

        type: function() {
            return this.props.type;
        },

        invalidate: function() {
            this.cached.path = null;
            this.cached.command = null;
            this.cached.segments = null;
            this.cached.bendpoints = null;
        },

        domain: function() {
            return Graph.registry.vector.get(this.props.domain);
        },

        source: function(source) {
            if (source === undefined) {
                return Graph.registry.vector.get(this.props.source);
            }
            this.props.source = source.guid();
            return this;
        },

        target: function(target) {
            if (target === undefined) {
                return Graph.registry.vector.get(this.props.target);
            }
            this.props.target = target.guid();
            return this;
        },

        layout: function() {
            return this.domain().layout();
        },

        tail: function() {
            var tail = _.first(this.values.waypoints);
            return tail ? _.extend({}, tail) : null;
        },

        head: function() {
            var head = _.last(this.values.waypoints);
            return head ? _.extend({}, head) : null;
        },

        center: function() {
            var path = this.path(),
                center = path.pointAt(path.length() / 2, true);
            path = null;
            return center;
        },

        execute: function(command) {
            this.command(command);
            this.fire('route', { command: this.command() });
        },

        /**
         * Get compiled waypoints, or
         * set waypoint with extracted command strings
         */
        command: function(command) {
            var segments, points;

            if (command === undefined) {
                command = this.cached.command;
                if ( ! command) {
                    segments = this.segments();
                    command  = Graph.util.segments2path(segments);
                    this.cached.command = command;
                }
                return command;
            }

            segments = Graph.util.path2segments(command);

            points = _.map(segments, function(s){
                return {
                    x: s[1],
                    y: s[2]
                };
            });

            this.values.waypoints = points;
            this.invalidate();

            segments = points = null;
            return this;
        },

        segments: function() {
            var segments = this.cached.segments;
            if ( ! segments) {
                segments = [];

                _.forEach(this.values.waypoints, function(p, i){
                    var cmd = i === 0 ? 'M' : 'L';
                    segments.push([cmd, p.x, p.y]);
                });

                this.cached.segments = segments;
            }
            return segments;
        },
        
        waypoints: function() {
            return this.values.waypoints;
        },

        bendpoints: function() {
            var points = this.cached.bendpoints;

            if ( ! points) {
                points = (this.values.waypoints || []).slice();
                this.cached.bendpoints = points;
            }

            return points;
        },

        path: function() {
            var path = this.cached.path;
            if ( ! path) {
                path = Graph.path(this.command());
                this.cached.path = path;
            }
            return path;
        },

        modify: function(index, x, y) {
            this.values.waypoints[index].x = x;
            this.values.waypoints[index].y = y;
            return this;
        },

        commit: function() {
            // reset cache;
            this.invalidate();

            return this;
        },

        route: function() {
            return this;
        },

        repair: function(component, port) {

        },

        reset: function() {
            this.invalidate();
            this.values.waypoints = null;
        },

        relocate: function(dx, dy) {
            _.forEach(this.values.waypoints, function(p){
                p.x += dx;
                p.y += dy;
            });

            this.commit();
            return this;
        },



        ///////// ROUTER TRANS /////////

        initTrans: function(context) {

        },

        updateTrans: function(trans) {

        },

        bending: function() {

        },

        connecting: function() {

        },

        stopTrans: function(context) {

        },

        destroy: function() {
            this.reset();
        }

    });

    ///////// STATICS /////////

    Router.portCentering = function(port, center, axis) {
        if (axis == 'x') {
            port.y = center.y;
        }

        if (axis == 'y') {
            port.x = center.x;
        }

        return port;
    }

    Router.porting = function(routes, shape, source) {
        var index = source ? 0 : routes.length - 1,
            cable = Graph.path(Graph.util.points2path(routes)),
            inter = shape.intersection(cable, true);

        var point, port;

        point = routes[index];

        if (inter.length) {
            inter = Router.sortIntersection(inter);
            port  = source ? inter[0] : inter[inter.length - 1];
        }

        return {
            index: index,
            point: point,
            port:  port || point
        };
    };

    Router.isRepairable = function(routes) {
        var count = routes.length;

        if (count < 3) {
            return false;
        }

        if (count > 4) {
            return true;
        }

        return !_.find(routes, function(p, i){
            var q = routes[i - 1];
            return q && Graph.util.pointDistance(p, q) <= 5;
        });
    };

    Router.getSegmentIndex = function(routes, vertext) {
        var segment = 0;

        _.forEach(routes, function(p, i){
            if (Graph.util.isPointOnLine(p, routes[i + 1], vertext)) {
                segment = i;
                return false;
            }
        });

        return segment;
    };

    Router.sortIntersection = function(intersection) {
        return _.sortBy(intersection, function(p){
            var d = Math.floor(p.t2 * 100) || 1;
            d = 100 - d;
            d = (d < 10 ? '0' : '') + d;
            return p.segment2 + '#' + d;
        });
    };

    Router.getClosestIntersect = function(routes, shape, offset) {
        var cable = Graph.path(Graph.util.points2path(routes)),
            inter = shape.intersection(cable, true),
            distance = Infinity;

        var closest;

        if (inter.length) {
            inter = Router.sortIntersection(inter);
            _.forEach(inter, function(p){
                var t = Graph.util.taxicab(p, offset);
                if (t <= distance) {
                    distance = t;
                    closest = p;
                }
            });
        }

        return closest;
    };

    Router.repairBendpoint = function(bend, oldport, newport) {
        var align = Graph.util.pointAlign(oldport, bend);

        switch(align) {
            case 'v':
                return {
                    x: bend.x,
                    y: newport.y
                };
            case 'h':
                return {
                    x: newport.x,
                    y: bend.y
                };
        }

        return {
            x: bend.x,
            y: bend.y
        };
    };

    Router.repairRoutes = function(bound1, bound2, newport, routes) {
        var oldport = routes[0],
            clonedRoutes = routes.slice();

        var slicedRoutes;

        clonedRoutes[0] = newport;
        clonedRoutes[1] = Router.repairBendpoint(clonedRoutes[1], oldport, newport);

        return clonedRoutes;
    };

    Router.tidyRoutes = function(routes) {
        return _.filter(routes, function(p, i){
            if (Graph.util.isPointOnLine(routes[i - 1], routes[i + 1], p)) {
                return false;
            }
            return true;
        });
    };

}());
