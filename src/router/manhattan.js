
(function(){
    
    var R = Graph.router.Router;
    
    

    Graph.router.Manhattan = Graph.extend(R, {

        props: {
            type: 'manhattan',
            
            step: 10,
            grid: 100,       

            maxLoops: 1000,
            maxAngle: 270,

            angle: 0,

            command: 'M 0 0 L 0 0',
            segments: [['M', 0, 0], ['L', 0, 0]]
        },

        directions: [],

        constructor: function(paper, source, target, options) {
            var me = this, step;

            // me.$super(paper, source, target, options);
            me.superclass.prototype.constructor.call(me, paper, source, target, options);

            step = me.props.step;

            me.directions = [
                {dx:  step, dy:  0   , cost: step, angle: null, name: 'E'},
                {dx:  0   , dy:  step, cost: step, angle: null, name: 'S'},
                {dx: -step, dy:  0   , cost: step, angle: null, name: 'W'},
                {dx:  0   , dy: -step, cost: step, angle: null, name: 'N'}
            ];

            _.forEach(me.directions, function(dir){
                dir.angle = Graph.util.theta({x: 0, y: 0}, {x: dir.dx, y: -dir.dy});
            });
        },
        
        penalties: function() {
            var step = this.props.step,
                pens = {
                      0: 0,
                     90: step / 2,
                    180: 0,
                    270: step / 2
                };

            return pens;
        },

        backtrace: function(parents, point, from, to, patch) {
            var me = this,
                step = me.props.step,
                ways = me.directions.length,
                routes = [],
                prevdiff = Graph.point(0, 0),
                current = point,
                parent;

            while ((parent = parents[current])) {   
                var currdiff = parent.difference(current);
                
                if ( ! currdiff.equals(prevdiff)) {
                    routes.unshift(current);
                    prevdiff = currdiff;
                }

                current = parent;
            }

            routes.unshift(current);

            routes.unshift(from.clone().snap(step));
            routes.push(to.clone().snap(step));

            me.normalize(routes, from, to, patch);

            return me;    
        },

        normalize: function(routes, from, to, patch) {
            var me = this,
                ways = me.directions.length,
                size = routes.length,
                maxs = size - 1;

            var first, last, orient;

            // if (size >= 2) {

            //     first = routes[0];

            //     if ( ! from.equals(first)) {
            //         routes[0].props.x = from.props.x;
            //         routes[0].props.y = from.props.y;
                    
            //         orient = R.dirorient(routes[0], routes[1], ways);
                    
            //         if (orient == 'H') {
            //             routes[1].props.y = routes[0].props.y;
            //         } else if (orient == 'V') {
            //             routes[1].props.x = routes[0].props.x;
            //         }
            //     }

            //     last = routes[maxs];
                
            //     if ( ! to.equals(last)) {
            //         if (size === 2) {
            //             orient = R.dirorient(routes[maxs - 1], routes[maxs], ways);
            //             if (orient == 'H') {
            //                 routes[maxs].props.x = to.props.x;
            //             } else {
            //                 routes[maxs].props.y = to.props.y;
            //             }
            //             routes.push(to.clone());
            //         } else {
            //             routes[maxs].props.x = to.props.x;
            //             routes[maxs].props.y = to.props.y;
                        
            //             orient = R.dirorient(routes[maxs - 1], routes[maxs], ways);

            //             if (orient == 'H') {
            //                 routes[maxs - 1].props.y = routes[maxs].props.y;
            //             } else {
            //                 routes[maxs - 1].props.x = routes[maxs].props.x;
            //             }
            //         }
            //     }
            // }

            var segments = [];

            if (patch) {
                segments = me.props.segments;

                if (patch == 'start') { 
                    segments[0][0] = 'L';
                    
                    segments = _.map(routes, function(r){
                        return ['L', r.props.x, r.props.y];
                    }).concat(segments);

                    segments[0][0] = 'M';
                } else {
                    segments = segments.concat(_.map(routes, function(r){
                        return ['L', r.props.x, r.props.y];
                    }));
                }

                me.props.segments = segments;
                me.commit();
                me.tidify();

            } else {
                segments = _.map(routes, function(p){
                    return ['L', p.props.x, p.props.y];
                });

                segments[0][0] = 'M';
                
                me.props.segments = segments;
                me.commit();
            }

            return me;
        },

        fallback: function(from, to, patch) {
            var router = new Graph.router.Orthogonal(
                this.paper,
                this.ports.source,
                this.ports.target
            );

            router.supply(this.props.command);
            router.route();

            this.props.segments = router.props.segments;

            this.commit();
            this.tidify();

            router = null;
        },

        tuning: function(from, to, obstacle) {
            var me = this, 
                step = me.props.step,
                dirs = me.directions.slice(),
                size = dirs.length,
                heap = [],
                dot = {};

            var closest, source, target, point, dir, i;

            source = from.clone().snap(step);
            target = to.clone().snap(step);

            var i, j;

            for (i = 1; i <= 3; i++) {
                for (j = dirs.length - 1; j >= 0; j--) {
                    dir = dirs[j];
                    point = source.clone().expand(dir.dx * i, dir.dy * i);
                    // me.paper.circle(dot.props.x, dot.props.y, 3).traversable(false).render(); 
                    if (obstacle.permit(point)) {
                        heap.push({
                            point: point,
                            angle: dir.angle,
                            radius: i,
                            distance: point.manhattan(target)
                        });
                        /*if ( ! heap[dir.name]) {
                            heap[dir.name] = {count: 0};
                        }
                        heap[dir.name].count++;*/

                        // heap[dir.name] = heap[dir.name] || {count: 0};
                        // heap[dir.name].count++;
                        // heap[dir.name].dir = dir;
                        // heap[dir.name].point = point;
                        // heap[dir.name].distance = point.manhattan(target);

                        
                        // me.paper.circle(point.props.x, point.props.y, 3).traversable(false).render();     
                    } else {
                        dirs.splice(j, 1);
                    }

                }
            }

            if (heap.length) {
                heap.sort(function(a, b){
                    if (a.radius === b.radius) {
                        return a.distance === b.distance ? 0 : (a.distance < b.distance ? -1 : 1);
                    }
                    return a.radius < b.radius ? 1 : -1;
                });    

                return heap.shift();
            }

            return {
                point: source,
                angle: null
            };
        },

        route: function(from, to, patch) {
            var me = this,
                step = me.props.step,
                ways = me.directions.length,
                pens = me.penalties(),
                loop = me.props.maxLoops;

            var obstacle, heap, fpoint, tpoint;

            obstacle = new Obstacle(me.paper, me.ports.source, me.ports.target);
            obstacle.props.grid = me.props.grid;
            obstacle.props.step = me.props.step;
            obstacle.build();

            heap = new R.util.Heap();

            patch = _.defaultTo(patch, false);

            if ( ! from) {
                from = me.ports.source.location();
            }

            if ( ! to) {
                to = me.ports.target.location();
            }

            // fpoint = from.clone().snap(step);
            // tpoint = to.clone().snap(step);

            var fnear = me.tuning(from, to, obstacle);
            var tnear = me.tuning(to, from, obstacle);

            me.props.angle = fnear.angle;

            fpoint = fnear.point;
            tpoint = tnear.point;

            // fpoint = me.tuning(from, to, obstacle);
            // me.paper.circle(fpoint.props.x, fpoint.props.y, 3).traversable(false).render(); 

            // tpoint = me.tuning(to, from, obstacle);
            // me.paper.circle(tpoint.props.x, tpoint.props.y, 3).traversable(false).render(); 

            if (obstacle.permit(fpoint) && obstacle.permit(tpoint)) {
                var parents = {},
                    distances = {},
                    srckey = fpoint.toValue(),
                    tarkey = tpoint.toValue();

                var prevangle, currkey, currpoint, currdist, currangle,
                    nextkey, nextpoint, deltadir, dist, dir, i;

                heap.add(srckey, fpoint.manhattan(tpoint));
                distances[srckey] = 0;

                while( ! heap.isEmpty() && loop > 0) {
                    
                    currkey   = heap.pop();
                    currpoint = Graph.point(currkey);
                    currdist  = distances[currkey];
                    prevangle = currangle;

                    currangle = parents[currkey]
                        ? R.dirangle(parents[currkey], currpoint, ways)
                        : (me.props.angle !== null ? me.props.angle : R.dirangle(fpoint, currpoint, ways));

                    if (tarkey == currkey) {
                        me.props.angle = currangle;
                        return me.backtrace(parents, currpoint, from, to, patch);

                        // deltadir = dirchange(currangle, dirangle(currpoint, target, ways));
                        
                        // if (currpoint.equals(target) || deltadir < 180) {
                        //     me.props.angle = currangle;
                        //     console.log(n);
                        //     return backtrace(parents, currpoint);
                        // }
                    }

                    for (i = 0; i < ways; i++) {
                        dir = me.directions[i];

                        deltadir = R.dirchange(currangle, dir.angle);

                        if(loop === 1000) {
                            console.log(dir.name, dir.dx, dir.dy);
                            console.log(currangle, dir.angle, deltadir);
                        }
                        
                        if (deltadir > me.props.maxAngle) {
                            continue;
                        }

                        nextpoint = currpoint.clone().expand(dir.dx, dir.dy);
                        nextkey   = nextpoint.toValue();

                        if (heap.isClose(nextkey) || ! obstacle.permit(nextpoint)) {
                            continue;
                        }

                        if (tarkey == nextkey) {
                            parents[nextkey] = currpoint;
                            me.props.angle = R.dirangle(currpoint, nextpoint, ways);
                            return me.backtrace(parents, nextpoint, from, to, patch);
                        }

                        dist = currdist + dir.cost + pens[deltadir];

                        if ( ! heap.isOpen(nextkey) || dist < distances[nextkey]) {
                            parents[nextkey] = currpoint;
                            distances[nextkey] = dist;
                            heap.add(nextkey, dist + nextpoint.manhattan(tpoint));
                        }
                    }
                    loop--;
                }

            }

            obstacle = null;
            heap = null;
            parents = null;
            distances = null;

            console.log('TIDAK');

            me.fallback(from, to, patch);
            return me;
        },

        patch: function() {
            var me = this,
                ways = me.directions.length,
                step = me.props.step,
                from = me.ports.source.location(),
                to = me.ports.target.location();

            var segments = me.props.segments,
                path = Graph.path(me.props.command),
                maxs = segments.length - 1,
                start = Graph.point(segments[0][1], segments[0][2]),
                end = null;

            var angle, orient, length, index;

            if ( ! start.equals(from)) {
                length = path.length();

                if (length) {
                    start = path.pointAt(length / 2);
                    index = path.segmentAt(length / 2);
                    segments.splice(0, index, ['M', start.props.x, start.props.y]);
                }

                me.props.angle = null;
                me.route(from, start, 'start');
            }

            segments = me.props.segments;
            path = Graph.path(me.props.command);
            maxs = segments.length - 1;
            end = Graph.point(segments[maxs][1], segments[maxs][2]);

            if ( ! end.equals(to)) {
                length = path.length();

                if (length) {
                    end = path.pointAt(length / 2);
                    index = path.segmentAt(length / 2);

                    segments.splice(index);
                    segments.push(['L', end.props.x, end.props.y]);
                }

                me.props.angle = null;
                me.route(end, to, 'end');
            }
        },

        modify: function(index, x, y) {
            this.props.segments[index][1] = x;
            this.props.segments[index][2] = y;
            return this;
        },

        insert: function(index, x, y) {
            this.props.segments.splice(index, 0, ['L', x, y]);
            return this;
        },

        tidify: function() {
            var me = this,
                ss = this.props.segments, 
                ws = this.directions.length,
                rs = [];

            var size, last, prev, curr, cdir, pdir,
                prnd, crnd, x, y;

            _.forEach(ss, function(s, i){
                
                if ( ! rs.length) {
                    rs.push(s);
                    x = s[1];
                    y = s[2];
                } else {
                    last = rs.length - 1;
                    rs.push(s);

                    prev = Graph.point(x, y);
                    curr = Graph.point(s[1], s[2]);

                    prnd = prev.clone().round();
                    crnd = curr.clone().round();

                    cdir = R.dirangle(prnd, crnd, ws);
                    cdir = [0, 180, 360].indexOf(cdir) !== -1 ? 'H' : 'V';

                    if (prnd.equals(crnd)) {
                        if (rs[last][0] != 'M') {
                            rs.splice(last, 1);
                        } else {
                            rs.pop();
                        }
                        cdir = pdir;
                    } else {
                        if (cdir == pdir) {
                            if (rs[last][0] != 'M') {
                                rs.splice(last, 1);
                            } else {
                                rs.pop();
                            }
                            cdir = pdir;
                        }
                    }
                    
                    pdir = cdir;

                    x = s[1];
                    y = s[2];
                }
            });

            this.props.segments = rs;
            this.commit();

            return this;
        },

        toString: function() {
            return 'Graph.router.Manhattan';
        }

    });
    
    ///////// INTERNAL OBSTACLE /////////

    var Obstacle = Graph.extend({

        props: {
            step: 10,
            grid: 100
        },

        hash: {},

        source: null,
        target: null,
        paper: null,

        sourceDot: null,
        targetDot: null,

        sourceBox: null,
        targetBox: null,

        constructor: function(paper, source, target, options) {
            _.extend(this.props, options || {});
            
            this.paper = paper;
            this.source = source;
            this.target = target;
        },

        build: function() {
            var me = this,
                step = me.props.step,
                grid = me.props.grid,
                paper = me.paper;

            me.hash = {};

            var svector = me.source ? me.source.vector() : null,
                tvector = me.target ? me.target.vector() : null;

            if (svector) {
                me.sourceBox = svector.bbox().clone();
                me.sourceDot = me.source.location().clone().snap(step, step);
            }

            if (tvector) {
                me.targetBox = tvector.bbox().clone();
                me.targetDot = me.target.location().clone().snap(step, step);
            }

            _.chain(paper.children().toArray())
                // .difference(excludes)
                .filter(function(c){
                    var included = c.props.traversable === true;
                    
                    if (me.sourceBox && c === svector) {
                        included = false;
                    }

                    if (me.targetBox && c === tvector) {
                        included = false;
                    }

                    return included;
                })
                .map(function(c){
                    var box = c.bbox().clone().expand(step);
                    // var dat = box.toJson();
                    // me.paper.rect(dat.x, dat.y, dat.width, dat.height).traversable(false).render().style('fill', 'none');
                    return box;
                })
                .reduce(function(hash, box){
                    var origin, corner, x, y, k;

                    origin = box.origin().snap(grid, grid),
                    corner = box.corner().snap(grid, grid);

                    for (x = origin.props.x; x <= corner.props.x; x += grid) {
                        for (y = origin.props.y; y <= corner.props.y; y += grid) {
                            k = x + ',' + y;
                            hash[k] = hash[k] || [];
                            hash[k].push(box);
                        }
                    }
                    
                    return hash;

                }, me.hash).value();
        },

        clear: function() {
            this.hash = {};
        },

        permit: function(point) {
            var me = this,
                grid = me.props.grid,
                step = me.props.step,
                key = point.clone().snap(grid, grid).toValue();

            if (me.sourceDot && me.sourceBox) {
                if (me.sourceBox.contains(point) && ! me.sourceDot.equals(point)) {
                    return false;
                }
            }

            if (me.targetDot && me.targetBox) {
                if (me.targetBox.contains(point) && ! me.targetDot.equals(point)) {
                    return false;
                }
            }   

            var permit = _.every(me.hash[key], function(box) {
                return ! box.contains(point);
            });

            return permit;
        }
    });

}());