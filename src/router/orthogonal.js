
(function(){

    var Router = Graph.router.Router;

    Graph.router.Orthogonal = Graph.extend(Router, {

        bendpoints: function() {
            var points = this.cached.bendpoints;

            if ( ! points) {
                var segments = this.path().curve().segments,
                    maxlen = segments.length - 1;

                var segment, curve, length, point, x, y;

                points = [];

                for (var i = 0, ii = segments.length; i < ii; i++) {
                    segment = segments[i];

                    if (i === 0) {

                        x = segment[1];
                        y = segment[2];

                        curve = Graph.curve([['M', x, y], ['C', x, y, x, y, x, y]]);
                        point = curve.pointAt(curve.t(0), true);

                        point.index = i;
                        point.range = [i, i + 1];
                        point.space = 0;

                        points.push(point);
                    } else {

                        curve = Graph.curve([['M', x, y], segment]);

                        x = segment[5];
                        y = segment[6];

                        length = curve.length();

                        point = curve.pointAt(curve.t(length / 2), true);
                        point.index = i;
                        point.range = [i - 1, i];
                        point.space = 0;

                        points.push(point);
                        
                        if (i === maxlen) {
                            point = curve.pointAt(curve.t(length), true);
                            point.index = i;
                            point.range = [i - 1, i];
                            point.space = 0;

                            points.push(point);
                        }
                    }
                }

                this.cached.bendpoints = points;
            }

            return points;
        },

        route: function(start, end) {
            
            var source = this.source(),
                target = this.target(),
                sourceNetwork = source.connectable(),
                targetNetwork = target.connectable(),
                sourceBBox = source.bboxOriginal(),
                sourceBox = sourceBBox.toJson(),
                targetBBox = target.bboxOriginal(),
                targetBox = targetBBox.toJson(),
                orient = sourceNetwork.orientation(targetNetwork),
                direct = sourceNetwork.direction(targetNetwork),
                croping  = false;

            if ( ! start) {
                start = sourceBBox.center(true);
            }

            if ( ! end) {
                end = targetBBox.center(true);
            }

            // record initial values
            if ( ! this.values.start && ! this.values.end) {
                this.values.start = start;
                this.values.end = end;    
            }
            
            var sdot, edot;

            if (direct) {
                if (direct == 'h:h') {
                    switch (orient) {
                        case 'top-right':
                        case 'right':
                        case 'bottom-right':
                            sdot = {
                                x: sourceBox.x + 1,
                                y: start.y
                            };

                            edot = {
                                x: targetBox.x + targetBox.width - 1,
                                y: end.y
                            };
                            croping = true;
                            break;
                        case 'top-left':
                        case 'left':
                        case 'bottom-left':
                            sdot = {
                                x: sourceBox.x + sourceBox.width - 1,
                                y: start.y
                            };

                            edot = {
                                x: targetBox.x + 1,
                                y: end.y
                            };
                            croping = true;
                            break;
                    }
                }

                if (direct == 'v:v') {
                    
                    switch (orient) {
                        case 'top-left':
                        case 'top':
                        case 'top-right':
                            sdot = {
                                x: start.x,
                                y: sourceBox.y + sourceBox.height - 1
                            };

                            edot = {
                                x: end.x,
                                y: targetBox.y + 1
                            };

                            croping = true;

                            break;
                        case 'bottom-left':
                        case 'bottom':
                        case 'bottom-right':
                            sdot = {
                                x: start.x,
                                y: sourceBox.y + 1
                            };

                            edot = {
                                x: end.x,
                                y: targetBox.y + targetBox.height - 1
                            };

                            croping = true;
                            break;
                        case 'left':
                        case 'right':
                            sdot = {
                                x: start.x,
                                y: sourceBox.y + 1
                            };

                            edot = {
                                x: end.x,
                                y: targetBox.y + 1
                            };
                            break;
                        case 'right':

                            break;
                    }
                }
            }

            var groupBox, routes, bends, shape, cable, inter;

            if (croping) {

                shape = source.shapeView();
                cable = Graph.path(Graph.util.points2path([sdot, edot]));
                inter = shape.intersection(cable, true);

                if (inter.length) {
                    inter = inter[0];
                    if ( ! Graph.util.isPointEquals(inter, sdot)) {
                        sdot = inter;
                    }
                }

                shape = target.shapeView();
                inter = shape.intersection(cable, true);

                if (inter.length) {
                    inter = inter[inter.length - 1];
                    if ( ! Graph.util.isPointEquals(inter, edot)) {
                        edot = inter;
                    }
                }

                bends  = Graph.util.lineBendpoints(sdot, edot, direct);
                routes = [sdot].concat(bends).concat([edot]);

                this.values.waypoints = Router.tidyRoutes(routes);
            } else if (sdot && edot) {
                switch(orient) {
                    case 'left':
                    case 'right':
                        groupBox = Graph.util.expandBox(Graph.util.groupBox([sourceBox, targetBox]), 0, 20);

                        bends = [
                            {x: sdot.x, y: groupBox.y},
                            {x: edot.x, y: groupBox.y}
                        ];

                        break;
                }

                cable = Graph.path(Graph.util.points2path([sdot].concat(bends).concat([edot])));
                routes = [sdot].concat(bends).concat([edot]);

                this.values.waypoints = Router.tidyRoutes(routes);
            } else {

                sdot = start;
                edot = end;

                // get bending point from center
                bends = Graph.util.lineBendpoints(sdot, edot, direct);
                cable = Graph.path(Graph.util.points2path([sdot].concat(bends).concat([edot])));
                shape = source.shapeView();

                // get source inter
                inter = shape.intersection(cable, true);

                if (inter.length) {
                    sdot = inter[0];
                }

                shape = target.shapeView();
                inter = shape.intersection(cable, true);

                if (inter.length) {
                    edot = inter[inter.length - 1];
                }

                routes = [sdot].concat(bends).concat([edot]);
                this.values.waypoints = Router.tidyRoutes(routes);
            }

            this.commit();

            this.fire('route', { command: this.command() });

            return this;
        },

        repair: function(component, port) {
            var routes = this.values.waypoints.slice();

            // TEST: force
            if ( ! Router.isRepairable(routes)) {
                return this.route();
            }

            var target = this.target(),
                targetBBox = target.bboxOriginal(),
                source = this.source(),
                sourceBBox = source.bboxOriginal();

            var bound1, bound2, center, points, axis, repaired;

            if (component === source) {
                bound1 = sourceBBox.toJson();
                bound2 = targetBBox.toJson();
                center = sourceBBox.center(true);
                points = routes;
            } else {
                bound1 = targetBBox.toJson();
                bound2 = sourceBBox.toJson();
                center = targetBBox.center(true);
                points = routes.slice();
                points.reverse();
            }

            axis = Graph.util.pointAlign(points[0], points[1]) == 'h' ? 'x' : 'y';
            Router.portCentering(port, center, axis);

            repaired = Router.repairRoutes(
                bound1,
                bound2,
                port,
                points
            );

            var cropped, closest, rangeStart, rangeEnd;

            if (repaired) {

                if (component === target) {
                    repaired.reverse();
                }

                cropped = repaired.slice();
                closest = Router.getClosestIntersect(repaired, source.shapeView(), targetBBox.center(true));

                if (closest) {
                    rangeStart = Router.getSegmentIndex(repaired, closest);
                    cropped = cropped.slice(rangeStart + 1);
                    cropped.unshift(closest);
                }

                closest = Router.getClosestIntersect(cropped, target.shapeView(), sourceBBox.center(true));

                if (closest) {
                    rangeEnd = Router.getSegmentIndex(cropped, closest);
                    cropped = cropped.slice(0, rangeEnd + 1);
                    cropped.push(closest);

                    if (cropped.length === 2) {
                        var align = Graph.util.pointAlign(cropped[0], cropped[1]);
                        if (align == 'h') {
                            cropped[1].x = cropped[0].x;
                        } else if (align == 'v') {
                            cropped[1].y = cropped[0].y;
                        }
                    }
                }

                this.values.waypoints = cropped;
                this.commit();
                this.fire('route', {command: this.command()});

                return this;
            } else {
                return this.route();
            }
        },

        initTrans: function(context) {
            var waypoints = this.waypoints(),
                source = this.source(),
                target = this.target(),
                rangeStart = context.ranges.start,
                rangeEnd = context.ranges.end,
                sourceBBox = source.bboxView(),
                targetBBox = target.bboxView(),
                segmentStart = waypoints[rangeStart],
                segmentEnd = waypoints[rangeEnd];

            var snaps = [];

            if (context.trans == 'BENDING') {
                // force start & end to center
                if (rangeStart === 0) {
                    Router.portCentering(segmentStart, sourceBBox.center(true), context.axis);
                }

                if (rangeEnd === waypoints.length - 1) {
                    Router.portCentering(segmentEnd, targetBBox.center(true), context.axis);
                }

                snaps = [
                    waypoints[rangeStart - 1],
                    segmentStart,
                    segmentEnd,
                    waypoints[rangeEnd + 1]
                ];

                if (rangeStart < 2) {
                    snaps.unshift(sourceBBox.center(true));
                }

                if (rangeEnd > waypoints.length - 3) {
                    snaps.unshift(targetBBox.center(true));
                }
            }

            var offset = this.layout().position(),
                snapH = [],
                snapV = [];

            context.snap.hor = [];
            context.snap.ver = [];

            _.forEach(snaps, function(p){
                if (p) {

                    if (context.axis == 'y') {
                        snapH.push(p.y);
                        context.snap.hor.push(p.y + offset.top);
                    }

                    if (context.axis == 'x') {
                        snapV.push(p.x);
                        context.snap.ver.push(p.x + offset.left);
                    }
                }
            });

            this.cached.connect = null;
            this.cached.bending = null;

            if (context.trans == 'BENDING') {
                this.cached.bending = {
                    source: source,
                    target: target,
                    original: waypoints,
                    rangeStart: rangeStart,
                    rangeEnd: rangeEnd,
                    segmentStart: segmentStart,
                    segmentEnd: segmentEnd,
                    sourceBound: sourceBBox.toJson(),
                    targetBound: targetBBox.toJson(),
                    sourcePath: source.shapeView(),
                    targetPath: target.shapeView(),
                    snapH: snapH,
                    snapV: snapV
                };
            } else {
                var original = waypoints.slice(),
                    segmentAlign = Graph.util.pointAlign(segmentStart, segmentEnd, 10);

                if (original.length === 2) {
                    var q1, q2;

                    q1 = {
                        x: (segmentStart.x + segmentEnd.x) / 2,
                        y: (segmentStart.y + segmentEnd.y) / 2
                    };

                    q2 = {
                        x: q1.x,
                        y: q1.y
                    };

                    original.splice(1, 0, q1, q2);

                    if (context.index !== 0) {
                        rangeStart += 2;
                        rangeEnd   += 2;

                        segmentStart = original[rangeStart];
                        segmentEnd   = original[rangeEnd];

                        context.index += 2;

                        context.point = _.extend({}, segmentEnd);
                        context.event = _.extend({}, segmentEnd);
                    } else {
                        segmentEnd = original[rangeEnd];
                    }
                }

                this.cached.connect = {
                    valid: false,
                    source: null,
                    target: null,
                    sourcePath: null,
                    targetPath: null,
                    rangeStart: rangeStart,
                    rangeEnd: rangeEnd,
                    segmentStart: segmentStart,
                    segmentEnd: segmentEnd,
                    segmentAlign: segmentAlign,
                    original: original
                };
            }
        },

        updateTrans: function(trans, data) {
            if (trans == 'CONNECT') {
                var connect = this.cached.connect,
                    oldSource = connect.source,
                    oldTarget = connect.target;

                _.assign(connect, data);

                if (oldSource && connect.source) {
                    if (oldSource.guid() != connect.source.guid()) {
                        connect.sourcePath = connect.source.shapeView();
                    }
                } else if ( ! oldSource && connect.source) {
                    connect.sourcePath = connect.source.shapeView();
                }

                if (oldTarget && connect.target) {
                    if (oldTarget.guid() != connect.target.guid()) {
                        connect.targetPath = connect.target.shapeView();
                    }
                } else if ( ! oldTarget && connect.target) {
                    connect.targetPath = connect.target.shapeView();
                }

            }
        },

        /**
         * Segment bending
         */
        bending: function(trans, callback) {

            var bending = this.cached.bending,
                routes = bending.original.slice(),
                segmentStart = bending.segmentStart,
                segmentEnd = bending.segmentEnd,
                rangeStart = bending.rangeStart,
                rangeEnd = bending.rangeEnd;

            var newStart, newEnd;

            newStart = {
                x: segmentStart.x + trans.delta.x,
                y: segmentStart.y + trans.delta.y
            };

            newEnd = {
                x: segmentEnd.x + trans.delta.x,
                y: segmentEnd.y + trans.delta.y
            };

            // snapping //

            if (trans.axis == 'x') {
                trans.event.x = (newStart.x + newEnd.x) / 2;
            }

            if (trans.axis == 'y') {
                trans.event.y = (newStart.y + newEnd.y) / 2;
            }

            var sx = Graph.util.snapValue(trans.event.x, bending.snapV),
                sy = Graph.util.snapValue(trans.event.y, bending.snapH);

            trans.event.x = sx;
            trans.event.y = sy;

            if (trans.axis == 'x') {
                newStart.x = sx;
                newEnd.x = sx;
            }

            if (trans.axis == 'y') {
                newStart.y = sy;
                newEnd.y = sy;
            }

            routes[rangeStart] = newStart;
            routes[rangeEnd]   = newEnd;

            var dotlen = routes.length,
                offset = 0;

            var sourceOrient, targetOrient;

            if (rangeStart < 2) {
                sourceOrient = Graph.util.boxOrientation(
                    bending.sourceBound,
                    Graph.util.pointbox(newStart)
                );

                if (rangeStart === 1) {
                    if (sourceOrient == 'intersect') {
                        routes.shift();
                        routes[0] = newStart;
                        offset--;
                    }
                } else {
                    if (sourceOrient != 'intersect') {
                        routes.unshift(segmentStart);
                        offset++;
                    }
                }
            }

            if (rangeEnd > dotlen - 3) {

                targetOrient = Graph.util.boxOrientation(
                    bending.targetBound,
                    Graph.util.pointbox(newEnd)
                );

                if (rangeEnd === dotlen - 2) {
                    if (targetOrient == 'intersect') {
                        routes.pop();
                        routes[routes.length - 1] = newEnd;
                    }
                } else {
                    if (targetOrient != 'intersect') {
                        routes.push(segmentEnd);
                    }
                }
            }


            bending.routes = routes;
            bending.newRangeStart = rangeStart + offset;

            this.cropBending(callback);
        },

        cropBending: _.debounce(function(callback) {

            var bending = this.cached.bending,
                routes  = bending.routes,
                srcport = Router.porting(routes, bending.sourcePath, true),
                tarport = Router.porting(routes, bending.targetPath),
                cropped = routes.slice(srcport.index + 1, tarport.index);

            var command;

            cropped.unshift(srcport.port);
            cropped.push(tarport.port);

            bending.waypoints = cropped;

            if (callback) {
                command = Graph.util.points2path(cropped);
                callback({
                    command: command
                });
            }
        }, 0),

        connecting: function(context, callback) {
            var connect = this.cached.connect,
                routes = connect.original.slice(),
                segmentAlign = connect.segmentAlign,
                segmentStart = connect.segmentStart,
                segmentEnd = connect.segmentEnd,
                rangeStart = connect.rangeStart,
                rangeEnd = connect.rangeEnd;

            var point, command;

            point = {
                x: context.point.x + context.delta.x,
                y: context.point.y + context.delta.y
            };

            var newStart, newEnd;

            if (context.index === 0) {
                newStart = {
                    x: context.point.x + context.delta.x,
                    y: context.point.y + context.delta.y
                };

                if (segmentAlign == 'v') {
                    newEnd = {
                        x: segmentEnd.x,
                        y: newStart.y
                    };
                } else {
                    newEnd = {
                        x: newStart.x,
                        y: segmentEnd.y
                    };
                }
            } else {
                newEnd = {
                    x: context.point.x + context.delta.x,
                    y: context.point.y + context.delta.y
                };

                if (segmentAlign == 'h') {
                    newStart = {
                        x: newEnd.x,
                        y: segmentStart.y
                    };
                } else {
                    newStart = {
                        x: segmentStart.x,
                        y: newEnd.y
                    };
                }
            }

            routes[rangeStart] = newStart;
            routes[rangeEnd]   = newEnd;

            context.event.x = point.x;
            context.event.y = point.y;

            connect.routes  = routes;

            this.cropConnect(context, callback);
        },

        cropConnect: _.debounce(function(context, callback) {
            var connect = this.cached.connect,
                routes = connect.routes;

            if (connect.valid) {
                var command, shape, cable, inter, align;

                if (context.index === 0) {
                    if (connect.source) {
                        shape = connect.sourcePath;
                    }
                } else {
                    if (connect.target) {
                        shape = connect.targetPath;
                    }
                }

                if (shape) {
                    cable = Graph.path(Graph.util.points2path(routes));
                    inter = shape.intersection(cable, true);

                    if (inter.length) {
                        routes[context.index] = inter[0];
                    }
                }
            }

            connect.waypoints = routes;

            if (callback) {
                command = Graph.util.points2path(routes);
                callback({command: command});
            }
        }, 0),

        stopTrans: function (context) {
            var connect, bending, points, changed, concised;

            if (context.trans == 'CONNECT') {
                connect = this.cached.connect;
                points = connect.waypoints;

                if (this.cached.connect.valid) {
                    changed = true;

                    this.source(connect.source);
                    this.target(connect.target);

                    this.fire('reroute', {
                        source: connect.source,
                        target: connect.target
                    });
                } else {
                    points = connect.original.slice();
                    changed = false;
                }
            } else if (context.trans == 'BENDING') {
                bending = this.cached.bending;
                points = bending.waypoints;
                changed = true;
            }

            if (changed) {
                this.values.waypoints = Router.tidyRoutes(points);
            } else {
                this.values.waypoints = points;
            }

            this.commit();
        },

        toString: function() {
            return 'Graph.router.Orthogonal';
        }

    });

    ///////// STATICS /////////

}());
