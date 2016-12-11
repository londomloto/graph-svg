
(function(){

    var BBox = Graph.lang.BBox = function(bounds) {
        this.props = _.extend({
            x: 0,
            y: 0,
            x2: 0,
            y2: 0,
            width: 0,
            height: 0
        }, bounds || {});
    };

    BBox.options = {
        props: {
            x: 0,
            y: 0,
            x2: 0,
            y2: 0,
            width: 0,
            height: 0
        }
    };

    BBox.extend = Graph.lang.Class.extend;

    BBox.prototype = Object.create(Graph.lang.Class.prototype);
    BBox.prototype.constructor = BBox;
    BBox.prototype.superclass = Graph.lang.Class;

    BBox.prototype.shape = function() {
        var prop = this.props;

        return new Graph.lang.Path([
            ['M', prop.x, prop.y],
            ['l', prop.width, 0],
            ['l', 0, prop.height],
            ['l', -prop.width, 0],
            ['z']
        ]);
    };

    BBox.prototype.origin = function(simple) {
        simple = _.defaultTo(simple, false);

        var x = this.props.x,
            y = this.props.y;

        return simple ? {x: x, y: y} : Graph.point(x, y);
    };

    BBox.prototype.center = function(simple) {
        simple = _.defaultTo(simple, false);

        var x = this.props.x + this.props.width  / 2,
            y = this.props.y + this.props.height / 2;

        return simple ? {x: x, y: y} : Graph.point(x, y);
    };

    BBox.prototype.corner = function(simple) {
        simple = _.defaultTo(simple, false);

        var x = this.props.x + this.props.width,
            y = this.props.y + this.props.height;

        return simple ? {x: x, y: y} : Graph.point(x, y);
    };

    BBox.prototype.width = function() {
        return this.props.width;
    };

    BBox.prototype.height = function() {
        return this.props.height;
    };

    BBox.prototype.clone = function() {
        var props = _.extend({}, this.props);
        return new BBox(props);
    };

    BBox.prototype.contains = function(obj) {
        var contain = true,
            bbox = this.props,
            dots = [];

        var vbox, papa, mat, dot;

        if (Graph.isPoint(obj)) {
            dots = [
                [obj.props.x, obj.props.y]
            ];
        } else if (Graph.isVector(obj)) {
            dots = obj.vertices(true);
        } else if (Graph.isBBox(obj)) {
            dots = [
                [obj.props.x, obj.props.y],
                [obj.props.x2, obj.props.y2]
            ];
        } else {
            var args = _.toArray(arguments);
            if (args.length === 2) {
                dots = [args];
            }
        }

        if (dots.length) {
            var l = dots.length;
            while(l--) {
                dot = dots[l];
                contain = dot[0] >= bbox.x  &&
                          dot[0] <= bbox.x2 &&
                          dot[1] >= bbox.y  &&
                          dot[1] <= bbox.y2;
                if ( ! contain) {
                    break;
                }
            }
        }

        return contain;
    };

    BBox.prototype.expand = function(dx, dy, dw, dh) {
        var ax, ay;
        if (_.isUndefined(dy)) {
            ax = Math.abs(dx);

            dx = -ax;
            dy = -ax;
            dw = 2 * ax;
            dh = 2 * ax;
        } else {
            ax = Math.abs(dx);
            ay = Math.abs(dy);

            dx = -ax;
            dy = -ay;
            dw = 2 * ax;
            dh = 2 * ay;
        }

        this.props.x += dx;
        this.props.y += dy;
        this.props.width  += dw;
        this.props.height += dh;

        return this;
    };

    BBox.prototype.translate = function(dx, dy) {
        this.props.x  += dx;
        this.props.y  += dy;
        this.props.x2 += dx;
        this.props.y2 += dy;

        return this;
    };

    BBox.prototype.transform = function(matrix) {
        var x = this.props.x,
            y = this.props.y;

        this.props.x = matrix.x(x, y);
        this.props.y = matrix.y(x, y);

        x = this.props.x2;
        y = this.props.y2;

        this.props.x2 = matrix.x(x, y);
        this.props.y2 = matrix.y(x, y);

        this.props.width  = this.props.x2 - this.props.x;
        this.props.height = this.props.y2 - this.props.y;

        return this;
    };

    BBox.prototype.intersect = function(tbox) {
        var me = this,
            bdat = me.props,
            tdat = tbox.toJson();

        return tbox.contains(bdat.x, bdat.y)
            || tbox.contains(bdat.x2, bdat.y)
            || tbox.contains(bdat.x, bdat.y2)
            || tbox.contains(bdat.x2, bdat.y2)
            || me.contains(tdat.x, tdat.y)
            || me.contains(tdat.x2, tdat.y)
            || me.contains(tdat.x, tdat.y2)
            || me.contains(tdat.x2, tdat.y2)
            || (bdat.x < tdat.x2 && bdat.x > tdat.x || tdat.x < bdat.x2 && tdat.x > bdat.x)
            && (bdat.y < tdat.y2 && bdat.y > tdat.y || tdat.y < bdat.y2 && tdat.y > bdat.y);
    };

    BBox.prototype.sideNearestPoint = function(point) {
        var px = point.props.x,
            py = point.props.y,
            tx = this.props.x,
            ty = this.props.y,
            tw = this.props.width,
            th = this.props.height;

        var distToLeft = px - tx;
        var distToRight = (tx + tw) - px;
        var distToTop = py - ty;
        var distToBottom = (ty + th) - py;
        var closest = distToLeft;
        var side = 'left';

        if (distToRight < closest) {
            closest = distToRight;
            side = 'right';
        }

        if (distToTop < closest) {
            closest = distToTop;
            side = 'top';
        }
        if (distToBottom < closest) {
            closest = distToBottom;
            side = 'bottom';
        }

        return side;
    };

    BBox.prototype.pointNearestPoint = function(point) {
        if (this.contains(point)) {
            var side = this.sideNearestPoint(point);
            switch (side){
                case 'right': return Graph.point(this.props.x + this.props.width, point.props.y);
                case 'left': return Graph.point(this.props.x, point.props.y);
                case 'bottom': return Graph.point(point.props.x, this.props.y + this.props.height);
                case 'top': return Graph.point(point.props.x, this.props.y);
            }
        }
        return point.clone().adhereToBox(this);
    };

    BBox.prototype.toJson = function() {
        return _.clone(this.props);
    };

    BBox.prototype.toString = function() {
        return 'Graph.lang.BBox';
    };

    BBox.prototype.toValue = function() {
        var p = this.props;
        return _.format(
            '{0},{1} {2},{3} {4},{5} {6},{7}',
            p.x, p.y,
            p.x + p.width, p.y,
            p.x + p.width, p.y + p.height,
            p.x, p.y + p.height
        );
    };

    ///////// EXTENSION /////////

    Graph.isBBox = function(obj) {
        return obj instanceof Graph.lang.BBox;
    };

    Graph.bbox = function(bounds) {
        return new Graph.lang.BBox(bounds);
    };

}());
