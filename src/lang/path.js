(function(){

    var Path = Graph.lang.Path = function(command) {
        var segments = [];

        if (Graph.isPath(command)) {
            segments = _.cloneDeep(command.segments);
        } else if (_.isArray(command)) {
            segments = _.cloneDeep(command);
        } else {
            segments = _.cloneDeep(Graph.util.path2segments(command));
        }

        this.segments = segments;
    };

    Path.options = {
        segments: []
    };

    Path.extend = Graph.lang.Class.extend;

    Path.prototype.constructor = Path;

    Path.prototype.command = function() {
        return Graph.util.segments2path(this.segments);
    };

    Path.prototype.absolute = function() {
        if ( ! this.segments.length) {
            return new Path([['M', 0, 0]]);
        }

        var cached = Graph.lookup(this.toString(), 'absolute', this.toValue()),
            segments = this.segments;

        if (cached.absolute) {
            return cached.absolute;
        }

        var result = [],
            x = 0,
            y = 0,
            mx = 0,
            my = 0,
            start = 0;

        if (segments[0][0] == 'M') {
            x = +segments[0][1];
            y = +segments[0][2];
            mx = x;
            my = y;
            start++;
            result[0] = ['M', x, y];
        }

        var z = segments.length == 3 &&
                segments[0][0] == 'M' &&
                segments[1][0].toUpperCase() == 'R' &&
                segments[2][0].toUpperCase() == 'Z';

        for (var dots, seg, itm, i = start, ii = segments.length; i < ii; i++) {
            result.push(seg = []);
            itm = segments[i];

            if (itm[0] != _.toUpper(itm[0])) {
                seg[0] = _.toUpper(itm[0]);

                switch(seg[0]) {
                    case 'A':
                        seg[1] = itm[1];
                        seg[2] = itm[2];
                        seg[3] = itm[3];
                        seg[4] = itm[4];
                        seg[5] = itm[5];
                        seg[6] = +(itm[6] + x);
                        seg[7] = +(itm[7] + y);
                        break;
                    case 'V':
                        seg[1] = +itm[1] + y;
                        break;
                    case 'H':
                        seg[1] = +itm[1] + x;
                        break;
                    case 'R':
                        dots = _.concat([x, y], itm.slice(1));
                        for (var j = 2, jj = dots.length; j < jj; j++) {
                            dots[j] = +dots[j] + x;
                            dots[++j] = +dots[j] + y;
                        }
                        result.pop();
                        result = _.concat(result, [['C'].concat(cat2bezier(dots, z))])
                        break;
                    case 'M':
                        mx = +itm[1] + x;
                        my = +itm[2] + y;
                    default:
                        for (var k = 1, kk = itm.length; k < kk; k++) {
                            seg[k] = +itm[k] + ((k % 2) ? x : y);
                        }
                }

            } else if (itm[0] == 'R') {
                dots = _.concat([x, y], itm.slice(1));
                result.pop();
                result = _.concat(result, [['C'].concat(cat2bezier(dots, z))]);
                seg = _.concat(['R'], itm.slice(-2));
            } else {
                for (var l = 0, ll = itm.length; l < ll; l++) {
                    seg[l] = itm[l];
                }
            }

            switch (seg[0]) {
                case 'Z':
                    x = mx;
                    y = my;
                    break;
                case 'H':
                    x = seg[1];
                    break;
                case 'V':
                    y = seg[1];
                    break;
                case 'M':
                    mx = seg[seg.length - 2];
                    my = seg[seg.length - 1];
                default:
                    x = seg[seg.length - 2];
                    y = seg[seg.length - 1];
            }
        }

        cached.absolute = result = new Path(result);
        return result;
    };

    Path.prototype.start = function() {
        return this.pointAt(0);
    };

    Path.prototype.end = function() {
        return this.pointAt(this.length());
    };

    Path.prototype.head = function() {

    };

    Path.prototype.tail = function() {

    };

    Path.prototype.relative = function() {
        var cached = Graph.lookup(this.toString(), 'relative', this.toValue()),
            segments = this.segments;

        if (cached.relative) {
            return cached.relative;
        }

        var result = [],
            x = 0,
            y = 0,
            mx = 0,
            my = 0,
            start = 0;

        if (segments[0][0] == 'M') {
            x = segments[0][1];
            y = segments[0][2];
            mx = x;
            my = y;
            start++;
            result.push(['M', x, y]);
        }

        for (var i = start, ii = segments.length; i < ii; i++) {
            var seg = result[i] = [], itm = segments[i];

            if (itm[0] != _.toLower(itm[0])) {
                seg[0] = _.toLower(itm[0]);

                switch (seg[0]) {
                    case 'a':
                        seg[1] = itm[1];
                        seg[2] = itm[2];
                        seg[3] = itm[3];
                        seg[4] = itm[4];
                        seg[5] = itm[5];
                        seg[6] = +(itm[6] - x).toFixed(3);
                        seg[7] = +(itm[7] - y).toFixed(3);
                        break;
                    case 'v':
                        seg[1] = +(itm[1] - y).toFixed(3);
                        break;
                    case 'm':
                        mx = itm[1];
                        my = itm[2];
                    default:
                        for (var j = 1, jj = itm.length; j < jj; j++) {
                            seg[j] = +(itm[j] - ((j % 2) ? x : y)).toFixed(3);
                        }
                }
            } else {
                seg = res[i] = [];
                if (itm[0] == 'm') {
                    mx = itm[1] + x;
                    my = itm[2] + y;
                }
                for (var k = 0, kk = itm.length; k < kk; k++) {
                    res[i][k] = itm[k];
                }
            }

            var len = result[i].length;

            switch (result[i][0]) {
                case 'z':
                    x = mx;
                    y = my;
                    break;
                case 'h':
                    x += +result[i][len - 1];
                    break;
                case 'v':
                    y += +result[i][len - 1];
                    break;
                default:
                    x += +result[i][len - 2];
                    y += +result[i][len - 1];
            }
        }

        cached.relative = result = new Path(result);
        return result;
    };

    Path.prototype.curve = function() {
        var cached = Graph.lookup(this.toString(), 'curve', this.toValue());

        if (cached.curve) {
            return cached.curve;
        }

        var p = _.cloneDeep(this.absolute().segments),
            a = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
            com = [],
            init = '',
            prev = '';

        var fix;

        for (var i = 0, ii = p.length; i < ii; i++) {
            p[i] && (init = p[i][0]);

            if (init != 'C') {
                com[i] = init;
                i && (prev = com[i - 1]);
            }

            p[i] = fixsegment(p[i], a, prev);

            if (com[i] != 'A' && init == 'C') com[i] = 'C';

            fixarc(p, i);

            var s = p[i], l = s.length;

            a.x = s[l - 2];
            a.y = s[l - 1];
            a.bx = _.float(s[l - 4]) || a.x;
            a.by = _.float(s[l - 3]) || a.y;
        }

        cached.curve = new Path(p);
        return cached.curve;

        ///////// HELPER /////////

        function fixarc(segments, i) {
            if (segments[i].length > 7) {
                segments[i].shift();

                var pi = segments[i];

                while (pi.length) {
                    com[i] = 'A';
                    segments.splice(i++, 0, ['C'].concat(pi.splice(0, 6)));
                }

                segments.splice(i, 1);
                ii = p.length;
            }
        }
    };

    Path.prototype.curve2curve = function(to){
        var p1 = _.cloneDeep(this.absolute().segments),
            p2 = _.cloneDeep((new Path(to)).absolute().segments) ,
            a1 = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
            a2 = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
            com1 = [],
            com2 = [],
            init = '',
            prev = '';

        for (var i = 0, ii = _.max([p1.length, p2.length]); i < ii; i++) {
            // fix p1
            p1[i] && (init = p1[i][0]);

            if (init != 'C') {
                com1[i] = init;
                i && (prev = com1[i - 1]);
            }

            p1[i] = fixsegment(p1[i], a1, prev);

            if (com1[i] != 'A' && init == 'C') com1[i] = 'C';

            fixarc2(p1, i);

            // fix p2
            p2[i] && (init = p2[i][0]);

            if (init != 'C') {
                com2[i] = init;
                i && (prev = com2[i - 1]);
            }

            p2[i] = fixsegment(p2[i], attrs2, pcom);

            if (com2[i] != 'A' && init == 'C') com2[i] = 'C';

            // fix p1 & p2
            fixArc2(p2, i);

            fixmove2(p1, p2, a1, a2, i);
            fixmove2(p2, p1, a2, a1, i);

            var s1 = p1[i],
                s2 = p2[i],
                l1 = s1.length,
                l2 = s2.length;

            a1.x = s1[l1 - 2];
            a1.y = s1[l1 - 1];
            a1.bx = _.float(s1[l1 - 4]) || a1.x;
            a1.by = _.float(s1[l1 - 3]) || a1.y;

            a2.bx = _.float(s2[l2 - 4]) || a2.x;
            a2.by = _.float(s2[l2 - 3]) || a2.y;
            a2.x = s2[l2 - 2];
            a2.y = s2[l2 - 1];

        }

        return [new Path(p1), new Path(p2)];

        ///////// HELPER /////////

        function fixarc2(segments, i) {
            if (segments[i].length > 7) {
                segments[i].shift();
                var pi = segments[i];

                while (pi.length) {
                    com1[i] = 'A';
                    com2[i] = 'A';
                    segments.splice(i++, 0, ['C'].concat(pi.splice(0, 6)));
                }

                segments.splice(i, 1);
                ii = _.max([p1.length, p2.length]);
            }
        }

        function fixmove2(segments1, segments2, a1, a2, i) {
            if (segments1 && segments2 && segments1[i][0] == 'M' && segments2[i][0] != 'M') {
                segments2.splice(i, 0, ['M', a2.x, a2.y]);
                a1.bx = 0;
                a1.by = 0;
                a1.x = segments1[i][1];
                a1.y = segments1[i][2];
                ii = _.max([p1.length, p2 && p2.length || 0]);
            }
        }

    };

    Path.prototype.bbox = function(){
        if ( ! this.segments.length) {
            return Graph.bbox({x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0});
        }

        var cached = Graph.lookup(this.toString(), 'bbox', this.toValue());

        if (cached.bbox) {
            return cached.bbox;
        }

        var segments = this.curve().segments,
            x = 0,
            y = 0,
            X = [],
            Y = [],
            p;

        for (var i = 0, ii = segments.length; i < ii; i++) {
            p = segments[i];
            if (p[0] == 'M') {
                x = p[1];
                y = p[2];
                X.push(x);
                Y.push(y);
            } else {
                var box = Graph.util.curvebox(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                X = X.concat(box.min.x, box.max.x);
                Y = Y.concat(box.min.y, box.max.y);
                x = p[5];
                y = p[6];
            }
        }

        var xmin = _.min(X),
            ymin = _.min(Y),
            xmax = _.max(X),
            ymax = _.max(Y),
            width = xmax - xmin,
            height = ymax - ymin,
            bounds = {
                x: xmin,
                y: ymin,
                x2: xmax,
                y2: ymax,
                width: width,
                height: height,
                cx: xmin + width / 2,
                cy: ymin + height / 2
            };

        cached.bbox = Graph.bbox(bounds);
        return cached.bbox;
    };

    Path.prototype.transform = function(matrix) {
        if ( ! matrix) {
            return;
        }

        var cached = Graph.lookup(this.toString(), 'transform', this.toValue(), matrix.toValue());

        if (cached.transform) {
            return cached.transform;
        }

        var segments = _.cloneDeep(this.curve().segments);
        var x, y, i, ii, j, jj, seg;

        for (i = 0, ii = segments.length; i < ii; i++) {
            seg = segments[i];
            for (j = 1, jj = seg.length; j < jj; j += 2) {
                x = matrix.x(seg[j], seg[j + 1]);
                y = matrix.y(seg[j], seg[j + 1]);
                seg[j] = x;
                seg[j + 1] = y;
            }
        }

        cached.transform = new Path(segments);
        return cached.transform;
    };

    Path.prototype.lengthAt = function(point) {

    };

    Path.prototype.pointAt = function(length, dots) {
        var ps = this.curve().segments;
        var point, s, x, y, l, c, d;

        dots = _.defaultTo(dots, false);

        l = 0;

        for (var i = 0, ii = ps.length; i < ii; i++) {
            s = ps[i];
            if (s[0] == 'M') {
                x = s[1];
                y = s[2];
            } else {
                c = Graph.curve([['M', x, y], s]);
                d = c.length();
                if (l + d > length) {
                    point = c.pointAt(c.t(length - l), dots);
                    c = null;
                    return point;
                }

                l += d;
                x = s[5];
                y = s[6];

                c = null;
            }
        }

        c = Graph.curve([['M', x, y], s]);
        point = c.pointAt(1, dots);

        c = null;
        return point;
    };

    Path.prototype.segmentAt = function(length) {
        var segments = this.curve().segments,
            index = -1,
            total = 0;

        var x, y, l, c;

        _.forEach(segments, function(s, i){
            if (s[0] == 'M') {
                x = s[1];
                y = s[2];
            } else {
                c = Graph.curve([['M', x, y], s]);
                x = c.x();
                y = c.y();
                l = c.length();

                if (l + total > length) {
                    index = i;
                    return false;
                }

                total += l;
                c = null;
            }
        });

        return index;
    };

    Path.prototype.length = function() {
        var ps = this.curve().segments;
        var point, s, x, y, l, c;

        l = 0;

        for (var i = 0, ii = ps.length; i < ii; i++) {
            s = ps[i];
            if (s[0] == 'M') {
                x = s[1];
                y = s[2];
            } else {
                c = Graph.curve([['M', x, y], s]);
                l = l + c.length();
                x = s[5];
                y = s[6];
                c = null;
            }
        }
        return l;
    };

    Path.prototype.slice = function(from, to) {
        var ps = this.curve().segments;
        var sub = {};
        var point, sp, s, x, y, l, c, d;

        l = 0;
        sp = '';

        for (var i = 0, ii = ps.length; i < ii; i++) {
            s = ps[i];
            if (s[0] == 'M') {
                x = s[1];
                y = s[2];
            } else {
                c = Graph.curve([['M', x, y], s]);
                d = c.length();

                if (l + d > length) {
                    point = c.pointAt(c.t(length - l));
                    sp += ['C' + point.start.x, point.start.y, point.m.x, point.m.y, point.props.x, point.props.y];
                    sub.start = Graph.path(sp);
                    sp = ['M' + point.props.x, point.props.y + 'C' + point.n.x, point.n.y, point.end.x, point.end.y, s[5], s[6]].join();
                }

                l += d;
                x = s[5];
                y = s[6];

                c = null;
            }
            sp += s.shift() + s;
        }

        sub.end = Graph.path(sp);
        return sub;
    };

    Path.prototype.vertices = function() {
        var cached = Graph.lookup(this.toString(), 'vertices', this.toValue());

        if (cached.vertices) {
            return cached.vertices;
        }

        var ps = this.segments,
            vs = [];

        _.forEach(ps, function(s){
            var l = s.length, x, y;
            if (s[0] != 'Z') {
                if (s[0] == 'M') {
                    x = s[1];
                    y = s[2];
                } else {
                    x = s[l - 2];
                    y = s[l - 1];
                }
                vs.push(Graph.point(x, y));
            }
        });

        cached.vertices = vs;
        return cached.vertices;
    };

    Path.prototype.addVertext = function(vertext) {
        var simple = this.isSimple(),
            segments = simple ? _.cloneDeep(this.segments) : this.curve().segments,
            index = -1,
            vx = vertext.props.x,
            vy = vertext.props.y,
            l1 = 0,
            l2 = 0;

        var x, y, c1, c2;

        _.forEach(segments, function(s, i){
            if (s[0] != 'Z') {
                if (s[0] == 'M') {
                    x = s[1];
                    y = s[2];
                } else {
                    if (s[0] == 'L') {
                        c1 = Graph.curve([['M', x, y], ['C', x, y, x, y, s[1], s[2]]]);
                        x = s[1];
                        y = s[2];
                    } else {
                        c1 = Graph.curve([['M', x, y], s]);
                        x = c1.x();
                        y = c1.y();
                    }

                    c2 = c1.clone();
                    c2.segments[1][5] = vx;
                    c2.segments[1][6] = vy;

                    l1 += c1.length();
                    l2 += c2.length();

                    if (l2 <= l1) {
                        index = i;
                        return false;
                    }
                }
            }
        });

        if (index > -1) {
            if (simple) {
                segments.splice(index, 0, ['L', vx, vy]);
            } else {
                segments.splice(index, 0, ['C', vx, vy, vx, vy, vx, vy]);
            }
            this.segments = segments;
        }

        return this;
    };

    Path.prototype.intersect = function(path) {
        return intersection(this, path, true) > 0;
    };

    Path.prototype.intersection = function(path, json) {
        var result = intersection(this, path);

        return json ? result : _.map(result, function(d){
            var p = Graph.point(d.x, d.y);

            p.segment1 = d.segment1;
            p.segment2 = d.segment2;
            p.bezier1  = d.bezier1;
            p.bezier2  = d.bezier2;

            return p;
        });
    };

    Path.prototype.intersectnum = function(path) {
        return intersection(this, path, true);
    };

    Path.prototype.alpha = function(point) {

    };

    Path.prototype.contains = function(point) {
        var b, p, d, x, y;

        x = point.props.x;
        y = point.props.y;
        b = this.bbox();
        d = b.toJson();

        p = new Path([['M', x, y], ['H', d.x2 + 10]]);

        return b.contains(point) && this.intersectnum(p) % 2 == 1;
    };

    /**
     * Get point on path that closest to target point
     */
    Path.prototype.nearest = function(point) {
        var length  = this.length(),
            tolerance = 20,
            bestdist = Infinity,
            taxicab = Graph.util.taxicab;

        var best, bestlen, currpoint, currdist, i;

        if (Graph.isPoint(point)) {
            point = point.toJson();
        }

        for (i = 0; i < length; i += tolerance) {
            currpoint = this.pointAt(i, true);
            currdist  = taxicab(currpoint, point);

            if (currdist < bestdist) {
                bestdist = currdist;
                best = currpoint;
                bestlen = i;
            }
        }

        tolerance /= 2;

        var prev, next, prevlen, nextlen, prevdist, nextdist;

        while(tolerance > .5) {
            if ((prevlen = bestlen - tolerance) >= 0 && (prevdist = taxicab((prev = this.pointAt(prevlen, true)), point)) < bestdist) {
                best = prev;
                bestlen = prevlen;
                bestdist = prevdist;
            } else if ((nextlen = bestlen + tolerance) <= length && (nextdist = taxicab((next = this.pointAt(nextlen, true)), point)) < bestdist) {
                best = next;
                bestlen = nextlen;
                bestdist = nextdist;
            } else {
                tolerance /= 2;
            }
        }

        best.distance = bestlen;
        return best;
    };

    Path.prototype.isSimple = function() {
        var simple = true;

        _.forEach(this.segments, function(s){
            if ( ! /[MLZ]/i.test(s[0])) {
                simple = false;
                return false;
            }
        });

        return simple;
    };

    Path.prototype.moveTo = function(x, y) {
        var segments = this.segments;

        if (segments.length) {
            segments[0][0] = 'M';
            segments[0][1] = x;
            segments[0][2] = y;
        } else {
            segments = [['M', x, y]];
        }

        return this;
    };

    Path.prototype.lineTo = function(x, y, append) {
        var segments = this.segments;

        append = _.defaultTo(append, true);

        if (segments) {
            var maxs = segments.length - 1;

            if (segments[maxs][0] == 'M' || append) {
                segments.push(['L', x, y]);
            } else {
                segments[maxs][1] = x;
                segments[maxs][2] = y;
            }
        }

        return this;
    };

    Path.prototype.toString = function() {
        return 'Graph.lang.Path';
    };

    Path.prototype.toValue = function() {
        return Graph.util.segments2path(this.segments);
    };

    Path.prototype.toArray = function() {
        return this.segments;
    };

    Path.prototype.clone = function() {
        var segments = [];

        _.forEach(this.segments, function(seg){
            segments.push(seg.slice());
        });

        return new Path(segments);
    };

    ///////// EXTENSION /////////

    Graph.isPath = function(obj) {
        return obj instanceof Graph.lang.Path;
    };

    Graph.path = function(command) {
        return new Graph.lang.Path(command);
    };

    ///////// HELPERS /////////

    function fixsegment(segment, attr, prev) {
        var nx, ny, tq = {T:1, Q:1};

        if ( ! segment) {
            return ['C', attr.x, attr.y, attr.x, attr.y, attr.x, attr.y];
        }

        ! ( segment[0] in tq) && (attr.qx = attr.qy = null);

        switch (segment[0]) {
            case 'M':
                attr.X = segment[1];
                attr.Y = segment[2];
                break;
            case 'A':
                segment = ['C'].concat(arc2curve.apply(0, [attr.x, attr.y].concat(segment.slice(1))));
                break;
            case 'S':
                if (prev == 'C' || prev == 'S') {
                    nx = attr.x * 2 - attr.bx;
                    ny = attr.y * 2 - attr.by;
                } else {
                    nx = attr.x;
                    ny = attr.y;
                }
                segment = ['C', nx, ny].concat(segment.slice(1));
                break;
            case 'T':
                if (prev == 'Q' || prev == 'T') {
                    attr.qx = attr.x * 2 - attr.qx;
                    attr.qy = attr.y * 2 - attr.qy;
                } else {
                    attr.qx = attr.x;
                    attr.qy = attr.y;
                }
                segment = ['C'].concat(quad2curve(attr.x, attr.y, attr.qx, attr.qy, segment[1], segment[2]));
                break;
            case 'Q':
                attr.qx = segment[1];
                attr.qy = segment[2];
                segment = ['C'].concat(quad2curve(attr.x, attr.y, segment[1], segment[2], segment[3], segment[4]));
                break;
            case 'L':
                segment = ['C'].concat(line2curve(attr.x, attr.y, segment[1], segment[2]));
                break;
            case 'H':
                segment = ['C'].concat(line2curve(attr.x, attr.y, segment[1], attr.y));
                break;
            case 'V':
                segment = ['C'].concat(line2curve(attr.x, attr.y, attr.x, segment[1]));
                break;
            case 'Z':
                segment = ['C'].concat(line2curve(attr.x, attr.y, attr.X, attr.Y));
                break;
        }
        return segment;
    }

    /**
     * Convert catmull-rom to bezier segment
     * https://advancedweb.hu/2014/10/28/plotting_charts_with_svg/
     */
    function cat2bezier(dots, z) {
        var segments = [],
            def = _.defaultTo;

        for (var i = 0, ii = dots.length; ii - 2 * !z > i; i += 2) {
            var p = [
                {x: def(dots[i - 2], 0), y: def(dots[i - 1], 0)},
                {x: def(dots[i], 0),     y: def(dots[i + 1], 0)},
                {x: def(dots[i + 2], 0), y: def(dots[i + 3], 0)},
                {x: def(dots[i + 4], 0), y: def(dots[i + 5], 0)}
            ];

            if (z) {
                if (!i) {
                    p[0] = {x: def(dots[ii - 2], 0), y: def(dots[ii - 1], 0)};
                } else if (ii - 4 == i) {
                    p[3] = {x: def(dots[0], 0), y: def(dots[1], 0)};
                } else if (ii - 2 == i) {
                    p[2] = {x: def(dots[0], 0), y: def(dots[1], 0)};
                    p[3] = {x: def(dots[2], 0), y: def(dots[3], 0)};
                }
            } else {
                if (ii - 4 == i) {
                    p[3] = p[2];
                } else if (!i) {
                    p[0] = {x: def(dots[i], 0), y: def(dots[i + 1], 0)};
                }
            }

            segments = [
                (-p[0].x + 6 * p[1].x + p[2].x) / 6,
                (-p[0].y + 6 * p[1].y + p[2].y) / 6,
                ( p[1].x + 6 * p[2].x - p[3].x) / 6,
                ( p[1].y + 6 * p[2].y - p[3].y) / 6,
                p[2].x,
                p[2].y
            ];
        }

        return segments;
    }

    function line2curve(x1, y1, x2, y2) {
        return [x1, y1, x2, y2, x2, y2];
    }

    function quad2curve (x1, y1, ax, ay, x2, y2) {
        var _13 = 1 / 3,
            _23 = 2 / 3;

        return [
            _13 * x1 + _23 * ax,
            _13 * y1 + _23 * ay,
            _13 * x2 + _23 * ax,
            _13 * y2 + _23 * ay,
            x2,
            y2
        ];
    }

    function arc2curve (x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
        var
            _120 = Math.PI * 120 / 180,
            rad = Math.PI / 180 * (+angle || 0),
            res = [],
            xy,
            rotate = Graph.memoize(function (x, y, rad) {
                var X = x * Math.cos(rad) - y * Math.sin(rad),
                    Y = x * Math.sin(rad) + y * Math.cos(rad);
                return {x: X, y: Y};
            });

        if ( ! recursive) {
            xy = rotate(x1, y1, -rad);
            x1 = xy.x;
            y1 = xy.y;
            xy = rotate(x2, y2, -rad);
            x2 = xy.x;
            y2 = xy.y;
            var cos = Math.cos(Math.PI / 180 * angle),
                sin = Math.sin(Math.PI / 180 * angle),
                x = (x1 - x2) / 2,
                y = (y1 - y2) / 2;
            var h = (x * x) / (rx * rx) + (y * y) / (ry * ry);
            if (h > 1) {
                h = Math.sqrt(h);
                rx = h * rx;
                ry = h * ry;
            }
            var rx2 = rx * rx,
                ry2 = ry * ry,
                k = (large_arc_flag == sweep_flag ? -1 : 1) *
                    Math.sqrt(Math.abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x))),
                cx = k * rx * y / ry + (x1 + x2) / 2,
                cy = k * -ry * x / rx + (y1 + y2) / 2,
                f1 = Math.asin(((y1 - cy) / ry).toFixed(9)),
                f2 = Math.asin(((y2 - cy) / ry).toFixed(9));

            f1 = x1 < cx ? Math.PI - f1 : f1;
            f2 = x2 < cx ? Math.PI - f2 : f2;
            f1 < 0 && (f1 = Math.PI * 2 + f1);
            f2 < 0 && (f2 = Math.PI * 2 + f2);
            if (sweep_flag && f1 > f2) {
                f1 = f1 - Math.PI * 2;
            }
            if (!sweep_flag && f2 > f1) {
                f2 = f2 - Math.PI * 2;
            }
        } else {
            f1 = recursive[0];
            f2 = recursive[1];
            cx = recursive[2];
            cy = recursive[3];
        }
        var df = f2 - f1;
        if (Math.abs(df) > _120) {
            var f2old = f2,
                x2old = x2,
                y2old = y2;
            f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
            x2 = cx + rx * Math.cos(f2);
            y2 = cy + ry * Math.sin(f2);
            res = arc2curve(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy]);
        }
        df = f2 - f1;
        var c1 = Math.cos(f1),
            s1 = Math.sin(f1),
            c2 = Math.cos(f2),
            s2 = Math.sin(f2),
            t =  Math.tan(df / 4),
            hx = 4 / 3 * rx * t,
            hy = 4 / 3 * ry * t,
            m1 = [x1, y1],
            m2 = [x1 + hx * s1, y1 - hy * c1],
            m3 = [x2 + hx * s2, y2 - hy * c2],
            m4 = [x2, y2];

        m2[0] = 2 * m1[0] - m2[0];
        m2[1] = 2 * m1[1] - m2[1];

        if (recursive) {
            return [m2, m3, m4].concat(res);
        } else {
            res = [m2, m3, m4].concat(res).join().split(",");
            var result = [];
            for (var i = 0, ii = res.length; i < ii; i++) {
                result[i] = i % 2 ? rotate(res[i - 1], res[i], rad).y : rotate(res[i], res[i + 1], rad).x;
            }
            return result;
        }
    }

    function intersection(path1, path2, count) {
        var ss1 = path1.curve().segments,
            ln1 = ss1.length,
            ss2 = path2.curve().segments,
            ln2 = ss2.length,
            res = count ? 0 : [];

        var x1, y1, x2, y2, x1m, y1m, x2m, y2m, bz1, bz2, cv1, cv2;
        var si, sj, i, j;
        var inter;

        for (i = 0; i < ln1; i++) {
            si = ss1[i];
            if (si[0] == 'M') {
                x1 = x1m = si[1];
                y1 = y1m = si[2];
            } else {
                if (si[0] == 'C') {
                    bz1 = [['M', x1, y1], si];
                    cv1 = [x1, y1].concat(si.slice(1));
                    x1 = si[5];
                    y1 = si[6];
                } else {
                    bz1 = [['M', x1, y1], ['C', x1, y1, x1m, y1m, x1m, x1m]];
                    cv1 = [x1, y1, x1, y1, x1m, y1m, x1m, y1m];
                    x1 = x1m;
                    y1 = y1m;
                }

                for (j = 0; j < ln2; j++) {
                    sj = ss2[j];
                    if (sj[0] == 'M') {
                        x2 = x2m = sj[1];
                        y2 = y2m = sj[2];
                    } else {
                        if (sj[0] == 'C') {
                            bz2 = [['M', x2, y2], sj];
                            cv2 = [x2, y2].concat(sj.slice(1));
                            x2 = sj[5];
                            y2 = sj[6];
                        } else {
                            bz2 = [['M', x2, y2],['C', x2, y2, x2m, y2m, x2m, y2m]];
                            cv2 = [x2, y2, x2, y2, x2m, y2m, x2m, y2m];
                            x2 = x2m;
                            y2 = y2m;
                        }

                        if (count) {
                            res += Graph.util.curveIntersection(cv1, cv2, true);
                        } else {
                            inter = Graph.util.curveIntersection(cv1, cv2);

                            for (var k = 0, kk = inter.length; k < kk; k++) {
                                inter[k].segment1 = i;
                                inter[k].segment2 = j;
                                inter[k].bezier1 = bz1;
                                inter[k].bezier2 = bz2;
                            }

                            res = res.concat(inter);
                        }
                    }
                }
            }
        }

        return res;
    }

}());
