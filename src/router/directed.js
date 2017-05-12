
(function(){
    
    var Router = Graph.router.Router;
    
    Graph.router.Directed = Graph.extend(Router, {
        
        bendpoints: function() {
            var points = this.cached.bendpoints;

            if ( ! points) {
                var segments = this.path().curve().segments;
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
                        point.range = [0, 0];
                        point.space = 0;
                        
                        points.push(point);
                    } else {
                        
                        curve = Graph.curve([['M', x, y], segment]);
                        
                        x = segment[5];
                        y = segment[6];
                        
                        length = curve.length();
                        
                        // half
                        point = curve.pointAt(curve.t(length / 2), true);
                        point.index = i;
                        point.range = [i - 1, i];
                        point.space = 0;
                        
                        points.push(point);
                            
                        // full
                        point = curve.pointAt(curve.t(length), true);
                        point.index = i;
                        point.range = [i - 1, i + 1];
                        point.space = 1;
                        
                        points.push(point);
                    }
                }

                this.cached.bendpoints = points;
            }

            return points;
        },
        
        route: function(start, end) {
            var source = this.source(),
                sourceNetwork = source.connectable(),
                sourceBBox = source.bboxOriginal(),
                sourceBox = sourceBBox.toJson(),
                target = this.target(),
                targetNetwork = target.connectable(),
                targetBBox = target.bboxOriginal(),
                targetBox = targetBBox.toJson(),
                orient = sourceNetwork.orientation(targetNetwork),
                direct = sourceNetwork.direction(targetNetwork),
                tuneup = false,
                routes = [];
            
            if ( ! start) {
                start = sourceBBox.center(true);
            }
            
            if ( ! end) {
                end = targetBBox.center(true);
            }

            var sdot, edot;
            
            if (direct) {
                if (direct == 'h:h') {
                    switch (orient) {
                        case 'top-right':
                        case 'right':
                        case 'bottom-right':
                            sdot = { 
                                x: sourceBox.x, 
                                y: start.y 
                            };
                            
                            edot = { 
                                x: targetBox.x + targetBox.width, 
                                y: end.y 
                            };

                            break;
                        case 'top-left':
                        case 'left':
                        case 'bottom-left':
                            sdot = { 
                                x: sourceBox.x + sourceBox.width, 
                                y: start.y 
                            };

                            edot = { 
                                x: targetBox.x, 
                                y: end.y 
                            };

                            break;
                    }
                    tuneup = true;
                }
                
                if (direct == 'v:v') {
                    switch(orient) {
                        case 'top-left':
                        case 'top':
                        case 'top-right':
                            sdot = {
                                x: start.x, 
                                y: sourceBox.y + sourceBox.height
                            };

                            edot = { 
                                x: end.x, 
                                y: targetBox.y
                            };
                            break;
                        case 'bottom-left':
                        case 'bottom':
                        case 'bottom-right':
                            sdot = { 
                                x: start.x, 
                                y: sourceBox.y
                            };

                            edot = { 
                                x: end.x, 
                                y: targetBox.y + targetBox.height
                            };
                            break;
                    }
                    tuneup = true;
                }
            }

            if (tuneup) {
                routes = [sdot, edot];
            } else {
                routes = [start, end];
            }

            var cable = Graph.path(Graph.util.points2path(routes));
            var inter;
            
            inter = source.shapeView().intersection(cable, true);
            
            if (inter.length) {
                routes[0] = inter[0];
            }

            inter = target.shapeView().intersection(cable, true);
            
            if (inter.length) {
                routes[1] = inter[inter.length - 1];
            }
            
            this.values.waypoints = routes;
            this.commit();
             
            this.fire('route', {
                command: this.command()
            });
            
            return this;
        },
        
        repair: function(component, port) {
            var source = this.source(),
                sourceBBox = source.bboxOriginal(),
                target = this.target(),
                targetBBox = target.bboxOriginal(),
                routes = this.values.waypoints,
                maxlen = routes.length - 1;
            
            if (component === source) {
                routes[0] = port;
            } else if (component === target) {
                routes[maxlen] = port;
            }

            var closest;

            closest = Router.getClosestIntersect(routes, source.shapeView(), targetBBox.center(true));

            if (closest) {
                routes[0] = closest;
            }
            
            closest = Router.getClosestIntersect(routes, target.shapeView(), sourceBBox.center(true));
            
            if (closest) {
                routes[maxlen] = closest;
            }
            
            this.commit();
            this.fire('route', {command: this.command()});
        },
        
        initTrans: function(context) {
            var source = this.source(),
                target = this.target(),
                sourcePath = source.shapeView(),
                targetPath = target.shapeView(),
                waypoints = this.waypoints(),
                rangeStart = context.range.start,
                rangeEnd = context.range.end,
                segmentStart = waypoints[rangeStart],
                segmentEnd = waypoints[rangeEnd];
            
            var snaps = [];

            if (context.trans == 'BENDING') {
                snaps = [
                    waypoints[rangeStart],
                    waypoints[rangeEnd]
                ];
            }

            var offset  = this.layout().position();
            
            context.snap.hor = [];
            context.snap.ver = [];
            
            _.forEach(snaps, function(p){
                if (p) {
                    context.snap.hor.push(p.y + offset.top);
                    context.snap.ver.push(p.x + offset.left);
                }
            });
            
            if (context.trans == 'BENDING') {
                this.cached.bending = {
                    source: source,
                    target: target,
                    rangeStart: rangeStart,
                    rangeEnd: rangeStart,
                    segmentStart: segmentStart,
                    segmentEnd: segmentEnd,
                    original: waypoints.slice(),
                    sourcePath: sourcePath,
                    targetPath: targetPath
                };
            } else {
                this.cached.connect = {
                    valid: false,
                    source: null,
                    target: null,
                    sourcePath: null,
                    targetPath: null,
                    original: waypoints.slice()
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
        
        bending: function(context, callback) {
            var bending = this.cached.bending,
                routes = bending.original.slice(),
                rangeStart = bending.rangeStart,
                rangeEnd = bending.rangeEnd,
                segmentStart = bending.segmentStart,
                segmentEnd = bending.segmentEnd;
            
            var segment = {
                x: context.point.x + context.delta.x,
                y: context.point.y + context.delta.y
            };
            
            var align1 = Graph.util.pointAlign(segmentStart, segment, 10),
                align2 = Graph.util.pointAlign(segmentEnd, segment, 10);
                
            if (align1 == 'h' && align2 == 'v') {
                segment.x = segmentStart.x;
                segment.y = segmentEnd.y;
            } else if (align1 == 'v' && align2 == 'h') {
                segment.y = segmentStart.y;
                segment.x = segmentEnd.x;
            } else if (align1 == 'h') {
                segment.x = segmentStart.x;
            } else if (align1 == 'v') {
                segment.y = segmentStart.y;
            } else if (align2 == 'h') {
                segment.x = segmentEnd.x;
            } else if (align2 == 'v') {
                segment.y = segmentEnd.y;
            }
            
            context.event.x = segment.x;
            context.event.y = segment.y;
            
            routes.splice(rangeStart + 1, context.space, segment);
            bending.routes = routes;
            
            this.cropBinding(context, callback);
        },
        
        cropBinding: _.debounce(function(context, callback){
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
                callback({command: command});
            }
            
        }, 0),
        
        connecting: function(context, callback) {
            var connect = this.cached.connect,
                routes = connect.original.slice();
                
            var segment, command;
            
            segment = {
                x: context.point.x + context.delta.x,
                y: context.point.y + context.delta.y
            };
            
            routes[context.index] = segment;
            
            context.event.x = segment.x;
            context.event.y = segment.y;
            
            connect.routes = routes;
            
            this.cropConnect(context, callback);
        },

        cropConnect: _.debounce(function(context, callback) {
            var connect = this.cached.connect,
                routes = connect.routes;

            var command, shape, cable, inter;
            
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
            
            connect.waypoints = routes;

            if (callback) {
                command = Graph.util.points2path(routes);
                callback({command: command});
            }
        }, 0),
        
        stopTrans: function(context) {
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
                this.values.waypoints = Router.tidyRoutes(points);;
            } else {
                this.values.waypoints = points;
            }
            
            this.commit();
            
            this.cached.connect = null;
            this.cached.bending = null;
        },
        
        toString: function() {
            return 'Graph.router.Directed';
        }
        
    });

    ///////// STATICS /////////

}());