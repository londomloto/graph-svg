
(function(){
    var global = this;

    var Animator = Graph.plugin.Animator = Graph.extend(Graph.plugin.Plugin, {

        props: {
            vector: null,

            // default duration
            duration: 1000,

            // default easing
            easing: 'linier'
        },

        stacks: [],

        constructor: function(vector) {
            this.props.vector = vector.guid();
        },
        
        create: function(keyframes, duration, easing, callback) {
            return new Animation(keyframes, duration, easing, callback);
        },

        animate: function(params, duration, easing, callback) {
            var vector = this.vector(),
                reset = _.extend({}, vector.attrs);

            var scenes, animation;

            if (params instanceof Animation ) {
                animation = params;
            } else {
                duration = _.defaultTo(duration, this.props.duration);

                if (_.isFunction(easing)) {
                    callback = easing;
                    easing = this.props.easing;
                }

                if ( ! easing) {
                    easing = this.props.easing;
                }

                scenes = {
                    100: params
                };

                animation = new Animation(scenes, duration, easing, callback);
            }

            if ( ! animation.count()) {
                animation = null;
                return;
            }

            reset.transform = vector.attrs.transform;
            reset.matrix = vector.matrix().clone();

            this.start(
                animation, 
                animation.frame(0), 
                reset, 
                null
            );

            animation = null;

            return this;
        },

        resume: function() {

        },

        pause: function() {

        },

        stop: function() {

        },

        start: function(animation, frame, reset, status) {
            var asize = animation.count();

            if ( ! asize) {
                animation = null;
                return;
            }

            var vector = this.vector(),
                ssize = this.stacks.length,
                origin = {},
                delta = {},
                from = {},
                to = {};

            var scene, queue, last, time, playing, applied, p, i;

            if (status) {
                for (i = 0; i < ssize; i++) {
                    p = this.stacks[i];
                    if (p.animation == animation) {
                        if (p.frame != frame) {
                            this.stacks.splice(i, 1);
                            applied = 1;
                        } else {
                            playing = p;
                        }
                        vector.attr(p.reset);
                        break;
                    }
                }
            } else {
                status = +to;
            }

            queue = {
                animation: animation,
                vector: vector
            };

            time = animation.duration();
            last = animation.at(asize - 1).frame;

            for (i = 0; i < asize; i++) {
                scene = animation.at(i);
                if (scene.frame == frame || scene.frame > status * last) {

                    queue.prev = animation.at(i - 1);
                    queue.prev = queue.prev ? queue.prev.frame : 0;

                    queue.frame = scene.frame;
                    queue.duration = time / last * (queue.frame - queue.prev);

                    queue.next = animation.at(i + 1);
                    queue.next = queue.next ? queue.next.frame : undefined;

                    queue.last = last;
                    break;
                } else if (status) {
                    vector.attr(scene.params);
                }
            }

            if ( ! playing) {

                time = queue.duration;

                _.forOwn(scene.params, function(v, k){
                    
                    var able = Animation.animable[k];
                    var plugin, matrix, inverse, segments;
                    var i, j, ii, jj;

                    if (able) {
                        from[k] = vector.attrs[k];
                        from[k] = _.defaultTo(from[k], able.defaults);
                        to[k]   = v;

                        switch(able.type) {
                            case 'number':
                                delta[k] = (to[k] - from[k]) / time;
                                break;

                            case 'transform':
                                var eq = equalizeTransform(vector.attrs[k], v);

                                if (eq.equal) {
                                    from[k]  = eq.from;
                                    to[k]    = eq.to;
                                    delta[k] = [];
                                    delta[k].semantic = true;
                                    for (i = 0, ii = from[k].length; i < ii; i++) {
                                        delta[k][i] = [from[k][i][0]];
                                        for (j = 1, jj = from[k][i].length; j < jj; j++) {
                                            delta[k][i][j] = (to[k][i][j] - from[k][i][j]) / time;
                                        }
                                    }
                                } else {
                                    plugin = vector.plugins.transformer;
                                    segments = Graph.util.transform2segments(to[k]);

                                    matrix = vector.matrix();

                                    from[k] = matrix.clone();
                                    inverse = matrix.invert(true);

                                    vector.graph.matrix = matrix.multiply(inverse);

                                    _.forEach(segments, function(s){
                                        var cmd = s[0], args = s.slice(1);
                                        plugin[cmd].apply(plugin, args);
                                    });

                                    matrix = plugin.commit(false, true);
                                    to[k] = matrix.clone();

                                    delta[k] = {
                                        a: (to[k].props.a - from[k].props.a) / time,
                                        b: (to[k].props.b - from[k].props.b) / time,
                                        c: (to[k].props.c - from[k].props.c) / time,
                                        d: (to[k].props.d - from[k].props.d) / time,
                                        e: (to[k].props.e - from[k].props.e) / time,
                                        f: (to[k].props.f - from[k].props.f) / time
                                    };

                                    segments = null;
                                    plugin = null;
                                    matrix = null;
                                }

                                break;
                        }
                    }

                });

                var timestamp = +new Date;

                _.extend(queue, {
                    scene: scene,
                    timestamp: timestamp,
                    start: timestamp + animation.delay(),

                    reset: reset,
                    from: from,
                    to: to,
                    delta: delta,

                    status: 0,
                    initstatus: status || 0,

                    stop: false
                });

                this.stacks.push(queue);

                if (status && ! playing && ! applied) {
                    queue.stop = true;
                    queue.start = new Date - scene.duration * status;
                    if (this.stacks.length === 1) {
                        return this.player();
                    }
                }

                if (applied) {
                    queue.start = new Date - scene.duration * status;
                }

                if (this.stacks.length === 1) {
                    Animator.play(_.bind(this.player, this));
                }
            } else {
                playing.initstatus = status;
                playing.start = new Date - playing.duration * status;
            }

            this.fire('animstart');

        },

        player: function() {
            var timestamp = +new Date, tick = 0;
            var vector, curr, from, prog, anim, time, able, value, key, type, scene, matrix;
            var plugin, matrix, method, args;
            var key, to, ii, jj, i, j;

            for (; tick < this.stacks.length; tick++) {
                curr = this.stacks[tick];

                if (curr.paused) {
                    continue;
                }
                
                prog   = timestamp - curr.start;

                time   = curr.duration;
                vector = curr.vector;
                scene  = curr.scene;
                from   = curr.from;
                to     = curr.to;
                delta  = curr.delta;
                anim   = curr.animation;

                if (curr.initstatus) {
                    prog = (curr.initstatus * curr.last - curr.prev) / (curr.frame - curr.prev) * time;
                    curr.status = curr.initstatus;
                    delete curr.initstatus;
                    curr.stop && this.stacks.splice(tick--, 1);
                } else {
                    curr.status = (curr.prev + (curr.frame - curr.prev) * (prog / time)) / curr.last;
                }

                if (prog < 0) {
                    continue;
                }

                if (prog < time) {

                    ease = scene.easing(prog / time);

                    for (key in from) {
                        
                        able = Animation.animable[key];

                        switch(able.type) {
                            case 'number':

                                value = +from[key] + ease * time * delta[key];
                                vector.attr(name, value);

                                break;
                            case 'transform':

                                // semantic `rotate,scale,translate`
                                if (delta[key].semantic) {
                                    plugin = vector.plugins.transformer;

                                    for (i = 0, ii = from[key].length; i < ii; i++) {
                                        method = from[key][i][0];
                                        args = [];

                                        for (j = 1, jj = from[key][i].length; j < jj; j++) {
                                            args.push(from[key][i][j] + ease * time * delta[key][i][j]);
                                        }

                                        plugin[method].apply(plugin, args);
                                    }

                                    matrix = plugin.commit(false, true);

                                    vector.attr('transform', matrix.toValue());


                                    matrix = null;
                                    plugin = null;

                                } else {
                                    matrix = Graph.matrix(
                                        from[key].props.a + ease * time * delta[key].a,
                                        from[key].props.b + ease * time * delta[key].b,
                                        from[key].props.c + ease * time * delta[key].c,
                                        from[key].props.d + ease * time * delta[key].d,
                                        from[key].props.e + ease * time * delta[key].e,
                                        from[key].props.f + ease * time * delta[key].f
                                    );
                                    vector.attr('transform', matrix.toValue());
                                    matrix = null;
                                }

                                break;
                        }
                    }

                } else {

                    for (key in to) {
                        
                        able = Animation.animable[key];

                        switch(able.type) {

                            case 'transform':

                                if (delta[key].semantic) {
                                    plugin = vector.plugins.transformer;

                                    _.forEach(to[key], function(v){
                                        var cmd = v[0], args = v.slice(1);
                                        plugin[cmd].apply(plugin, args);
                                    });

                                    matrix = plugin.commit(false, true);

                                    vector.graph.matrix = matrix;
                                    vector.attr('transform', matrix.toValue());
                                    
                                    matrix = null;
                                    plugin = null;
                                } else {
                                    matrix = to[key].clone();

                                    vector.graph.matrix = matrix;
                                    vector.attr('transform', matrix.toValue());

                                    matrix = null;
                                }
                                break;
                            
                            default:
                                vector.attr(key, to[key]);
                                break;
                        }
                    }
                    
                    scene.played++;

                    this.stacks.splice(tick--, 1);

                    var repeat = anim.repeat(), 
                        played = scene.played;

                    if ((repeat > 1 && played < repeat) && ! curr.next ) {
                        _.forOwn(anim.scenes, function(s, k){
                            for (var key in s.params) {
                                if (key == 'transform') {
                                    vector.graph.matrix = curr.reset.matrix;
                                    vector.attr('transform', curr.reset.transform);
                                } else {
                                    vector.attr(k, curr.reset[k]);    
                                }
                            }
                        });

                        this.start(
                            anim,
                            anim.frame(0),
                            curr.reset,
                            null
                        );
                    }

                    if (curr.next && ! curr.stop) {
                        this.start(
                            anim,
                            curr.next,
                            curr.reset,
                            null
                        );
                    }

                    if (played >= repeat) {
                        // ___DONE___?
                        curr = null;
                    }
                }
            }

            if (this.stacks.length) {
                Animator.play(_.bind(this.player, this));
            } else {
                // ___DONE___
            }
        },

        toString: function() {
            return 'Graph.plugin.Animator';
        }

    });

    ///////// STATICS /////////

    Animator.play = (function(g){
        var func = g.requestAnimationFrame || 
                   g.webkitRequestAnimationFrame || 
                   g.mozRequestAnimationFrame || 
                   g.oRequestAnimationFrame || 
                   g.msRequestAnimationFrame || 
                   function (callback) { 
                        setTimeout(callback, 16); 
                   };

        return _.bind(func, g);
    }(global));

    ///////// INTERNAL ANIMATION /////////
    
    var Animation = Graph.extend({

        props: {
            easing: 'linier',
            duration: 1000,
            repeat: 1,
            delay: 0
        },
        
        scenes: {},
        frames: [],

        constructor: function(keyframes, duration, easing, callback) {
            this.props.guid = 'graph-anim-' + (++Animation.guid);
            this.props.duration = duration = _.defaultTo(duration, 1000);

            if (_.isFunction(easing)) {
                if (callback) {
                    this.props.easing = 'function';
                } else {
                    callback = easing;
                    easing = this.props.easing;
                }
            }

            if ( ! easing) {
                easing = this.props.easing;
            }

            if (keyframes) {
                var easing = _.isString(easing) ? Animation.easing[easing] : easing,
                    repeat = this.props.repeat,
                    scenes = this.scenes,
                    frames = this.frames;

                _.forOwn(keyframes, function(f, key){
                    var params = {}, frame, scene;

                    frame = _.toNumber(key);

                    params = _.pickBy(f, function(v, k){
                        return !!Animation.animable[k];
                    });

                    scene = {
                        frame: frame,
                        params: params,
                        easing: easing,
                        callback: callback,
                        played: 0
                    };

                    frames.push(frame);
                    scenes[frame] = scene;
                });

                frames.sort(function(a, b){ return a - b });
            }
        },

        guid: function() {
            return this.props.guid;
        },

        duration: function() {
            return this.props.duration;
        },

        easing: function() {
            return this.props.easing;
        },

        delay: function(delay) {

            if (delay === undefined) {
                return this.props.delay;
            }

            var anim = new Animation();

            anim.frames = this.frames;
            anim.scenes = _.cloneDeep(this.scenes);
            anim.props  = _.cloneDeep(this.props);
            anim.props.delay = delay || 0;
            
            return anim;
        },

        repeat: function(times) {

            if (times === undefined) {
                return this.props.repeat;
            }

            var anim = new Animation();

            anim.frames = this.frames.slice();
            anim.scenes = _.cloneDeep(this.scenes);
            anim.props  = _.cloneDeep(this.props);
            anim.props.repeat = Math.floor(Math.max(times, 0)) || 1;

            // reset to scenes
            _.forOwn(anim.scenes, function(s, f){
                s.played = 0;
            });

            return anim;
        },

        count: function() {
            return this.frames.length;
        },

        at: function(index) {
            var frame = this.frame(index);
            return this.scene(frame);
        },

        frame: function(index) {
            return this.frames[index];
        },

        scene: function(frame) {
            return this.scenes[frame];
        },

        destroy: function() {
            this.scenes = null;
            this.frames = null;
        }

    });

    ///////// STATICS /////////

    _.extend(Animation, {
        guid: 0,

        animable: {
             x: { type: 'number', defaults: 0 },
             y: { type: 'number', defaults: 0 },
            cx: { type: 'number', defaults: 0 },
            cy: { type: 'number', defaults: 0 },
            transform: { type: 'transform', defaults: '' }
        },

        easing: {
            linier: function(n) {
                return n;
            },

            easeIn: function(n) {
                return Math.pow(n, 1.7);
            },

            easeOut: function(n) {
                return Math.pow(n, .48);
            },

            easeInOut: function(n) {
                var q = .48 - n / 1.04,
                    Q = Math.sqrt(.1734 + q * q),
                    x = Q - q,
                    X = Math.pow(Math.abs(x), 1 / 3) * (x < 0 ? -1 : 1),
                    y = -Q - q,
                    Y = Math.pow(Math.abs(y), 1 / 3) * (y < 0 ? -1 : 1),
                    t = X + Y + .5;
                return (1 - t) * 3 * t * t + t * t * t;
            },

            backIn: function(n) {
                var s = 1.70158;
                return n * n * ((s + 1) * n - s);
            },

            backOut: function (n) {
                n = n - 1;
                var s = 1.70158;
                return n * n * ((s + 1) * n + s) + 1;
            },

            elastic: function (n) {
                if (n == !!n) {
                    return n;
                }
                return pow(2, -10 * n) * math.sin((n - .075) * (2 * PI) / .3) + 1;
            },

            bounce: function (n) {
                var s = 7.5625,
                    p = 2.75,
                    l;
                if (n < (1 / p)) {
                    l = s * n * n;
                } else {
                    if (n < (2 / p)) {
                        n -= (1.5 / p);
                        l = s * n * n + .75;
                    } else {
                        if (n < (2.5 / p)) {
                            n -= (2.25 / p);
                            l = s * n * n + .9375;
                        } else {
                            n -= (2.625 / p);
                            l = s * n * n + .984375;
                        }
                    }
                }
                return l;
            }
        }
    });

    ///////// HELPERS /////////
    
    function equalizeTransform (t1, t2) {
        t2 = _.toString(t2).replace(/\.{3}|\u2026/g, t1);
        t1 = Graph.util.transform2segments(t1) || [];
        t2 = Graph.util.transform2segments(t2) || [];
        
        var maxlength = Math.max(t1.length, t2.length),
            from = [],
            to = [],
            i = 0, j, jj,
            tt1, tt2;

        for (; i < maxlength; i++) {
            tt1 = t1[i] || emptyTransform(t2[i]);
            tt2 = t2[i] || emptyTransform(tt1);

            if ((tt1[0] != tt2[0]) ||
                (tt1[0].toLowerCase() == "rotate" && (tt1[2] != tt2[2] || tt1[3] != tt2[3])) ||
                (tt1[0].toLowerCase() == "scale" && (tt1[3] != tt2[3] || tt1[4] != tt2[4]))) {
                return {
                    equal: false,
                    from: tt1,
                    to: tt2
                }
            }
            from[i] = [];
            to[i] = [];
            for (j = 0, jj = Math.max(tt1.length, tt2.length); j < jj; j++) {
                j in tt1 && (from[i][j] = tt1[j]);
                j in tt2 && (to[i][j] = tt2[j]);
            }
        }
        return {
            equal: true,
            from: from,
            to: to
        };
    }

    function emptyTransform(item) {
        var l = item[0];
        switch (l.toLowerCase()) {
            case "translate": return [l, 0, 0];
            case "matrix": return [l, 1, 0, 0, 1, 0, 0];
            case "rotate": if (item.length == 4) {
                return [l, 0, item[2], item[3]];
            } else {
                return [l, 0];
            }
            case "scale": if (item.length == 5) {
                return [l, 1, 1, item[3], item[4]];
            } else if (item.length == 3) {
                return [l, 1, 1];
            } else {
                return [l, 1];
            }
        }
    }

}());