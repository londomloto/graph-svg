
(function(){

    var Matrix = Graph.lang.Matrix = function(a, b, c, d, e, f) {
        this.props = {};

        this.props.a = _.defaultTo(a, 1);
        this.props.b = _.defaultTo(b, 0);
        this.props.c = _.defaultTo(c, 0);
        this.props.d = _.defaultTo(d, 1);
        this.props.e = _.defaultTo(e, 0);
        this.props.f = _.defaultTo(f, 0);
    };

    Matrix.options = {
        props: {
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: 0,
            f: 0
        }
    };

    Matrix.extend = Graph.lang.Class.extend;

    Matrix.prototype.constructor = Matrix;

    Matrix.prototype.x = function(x, y) {
        return x * this.props.a + y * this.props.c + this.props.e;
    };

    Matrix.prototype.y = function(x, y) {
        return x * this.props.b + y * this.props.d + this.props.f;
    };

    Matrix.prototype.get = function(chr) {
        return +this.props[chr].toFixed(4);
    };

    Matrix.prototype.multiply = function(a, b, c, d, e, f) {
        var
            result = [[], [], []],
            source = [
                [this.props.a, this.props.c, this.props.e],
                [this.props.b, this.props.d, this.props.f],
                [0, 0, 1]
            ],
            matrix = [
                [a, c, e],
                [b, d, f],
                [0, 0, 1]
            ];

        var x, y, z, tmp;
        
        if (Graph.isMatrix(a)) {
            matrix = [
                [a.props.a, a.props.c, a.props.e],
                [a.props.b, a.props.d, a.props.f],
                [0, 0, 1]
            ];
        }

        for (x = 0; x < 3; x++) {
            for (y = 0; y < 3; y++) {
                tmp = 0;
                for (z = 0; z < 3; z++) {
                    tmp += source[x][z] * matrix[z][y];
                }
                result[x][y] = tmp;
            }
        }

        this.props.a = result[0][0];
        this.props.b = result[1][0];
        this.props.c = result[0][1];
        this.props.d = result[1][1];
        this.props.e = result[0][2];
        this.props.f = result[1][2];

        return this;
    };

    Matrix.prototype.invert = function(clone) {
        var x = this.props.a * this.props.d - this.props.b * this.props.c;
        var a, b, c, d, e, f;

        clone = _.defaultTo(clone, false);

        a =  this.props.d / x;
        b = -this.props.b / x;
        c = -this.props.c / x;
        d =  this.props.a / x;
        e = (this.props.c * this.props.f - this.props.d * this.props.e) / x;
        f = (this.props.b * this.props.e - this.props.a * this.props.f) / x;

        if (clone) {
            return new Graph.matrix(a, b, c, d, e, f);
        } else {
            this.props.a = a;
            this.props.b = b;
            this.props.c = c;
            this.props.d = d;
            this.props.e = e;
            this.props.f = f;

            return this;
        }
    };

    Matrix.prototype.translate = function(x, y) {
        x = _.defaultTo(x, 0);
        y = _.defaultTo(y, 0);
        this.multiply(1, 0, 0, 1, x, y);

        return this;
    };

    // http://stackoverflow.com/questions/16359246/how-to-extract-position-rotation-and-scale-from-matrix-svg
    Matrix.prototype.rotate = function(angle, cx, cy) {
        var args = arguments;
        if ( ! args.length) {
            var px = this.delta(0, 1),
                py = this.delta(1, 0);

            var deg, rad;

            deg = 180 / Math.PI * Math.atan2(px.y, px.x) - 90;
            rad = Graph.util.rad(deg);

            return {
                deg: deg,
                rad: rad,
                sin: Math.sin(rad),
                cos: Math.cos(rad)
            };
        }

        var radian;

        radian = Graph.util.rad(angle);

        cx = _.defaultTo(cx, 0);
        cy = _.defaultTo(cy, 0);
        
        var cos = +Math.cos(radian).toFixed(9),
            sin = +Math.sin(radian).toFixed(9);
            
        this.multiply(cos, sin, -sin, cos, cx, cy);
        this.multiply(1, 0, 0, 1, -cx, -cy);
        
        return this;
    };

    Matrix.prototype.scale = function(sx, sy, cx, cy) {
        if (sx === undefined) {
            var prop = this.props,
                sx = Graph.util.hypo(prop.a, prop.b),
                sy = Graph.util.hypo(prop.c, prop.d);

            if (this.determinant() < 0) {
                sx = -sx;
            }

            return {
                x: sx,
                y: sy
            };
        }

        sy = _.defaultTo(sy, sx);

        if (cx || cy) {
            cx = _.defaultTo(cx, 0);
            cy = _.defaultTo(cy, 0);
        }

        (cx || cy) && this.multiply(1, 0, 0, 1, cx, cy);
        this.multiply(sx, 0, 0, sy, 0, 0);
        (cx || cy) && this.multiply(1, 0, 0, 1, -cx, -cy);

        return this;
    };

    Matrix.prototype.determinant = function() {
        return this.props.a * this.props.d - this.props.b * this.props.c;
    };

    Matrix.prototype.delta = function(x, y) {
        return {
            x: x * this.props.a + y * this.props.c + 0,
            y: x * this.props.b + y * this.props.d + 0
        };
    };

    Matrix.prototype.data = function() {
        var px = this.delta(0, 1),
            py = this.delta(1, 0),
            skewX = 180 / Math.PI * Math.atan2(px.y, px.x) - 90,
            radSkewX = Graph.util.rad(skewX),
            cosSkewX = Math.cos(radSkewX),
            sinSkewX = Math.sin(radSkewX),
            scaleX = Graph.util.hypo(this.props.a, this.props.b),
            scaleY = Graph.util.hypo(this.props.c, this.props.d),
            radian = Graph.util.rad(skewX);

        if (this.determinant() < 0) {
            scaleX = -scaleX;
        }

        return {
            x: this.props.e,
            y: this.props.f,
            dx: (this.props.e * cosSkewX + this.props.f *  sinSkewX) / scaleX,
            dy: (this.props.f * cosSkewX + this.props.e * -sinSkewX) / scaleY,
            skewX: -skewX,
            skewY: 180 / Math.PI * Math.atan2(py.y, py.x),
            scaleX: scaleX,
            scaleY: scaleY,
            // rotate: skewX,
            rotate: this.rotate().deg,
            rad: radian,
            sin: Math.sin(radian),
            cos: Math.cos(radian),
            a: this.props.a,
            b: this.props.b,
            c: this.props.c,
            d: this.props.d,
            e: this.props.e,
            f: this.props.f
        };
    };

    Matrix.prototype.toFilter = function() {
        return "progid:DXImageTransform.Microsoft.Matrix(" +
           "M11=" + this.get('a') + ", " +
           "M12=" + this.get('c') + ", " +
           "M21=" + this.get('b') + ", " +
           "M22=" + this.get('d') + ", " +
           "Dx="  + this.get('e') + ", " +
           "Dy="  + this.get('f') + ", " +
           "sizingmethod='auto expand'"  +
        ")";
    };

    Matrix.prototype.toArray = function() {
        return [
            [this.get('a'), this.get('c'), this.get('e')],
            [this.get('b'), this.get('d'), this.get('f')],
            [0, 0, 1]
        ];
    };

    Matrix.prototype.toValue = function() {
        return _.format(
            'matrix({0},{1},{2},{3},{4},{5})',
            this.get('a'),
            this.get('b'),
            this.get('c'),
            this.get('d'),
            this.get('e'),
            this.get('f')
        );
    };

    Matrix.prototype.toString = function() {
        return 'Graph.lang.Matrix';
    };

    Matrix.prototype.clone = function() {
        return new Matrix(
            this.props.a,
            this.props.b,
            this.props.c,
            this.props.d,
            this.props.e,
            this.props.f
        );
    };

    ///////// EXTENSION /////////

    Graph.isMatrix = function(obj) {
        return obj instanceof Graph.lang.Matrix;
    };

    Graph.matrix = function(a, b, c, d, e, f) {
        return new Graph.lang.Matrix(a, b, c, d, e, f);
    };

}());
