
(function(){

    var Line = Graph.lang.Line = function(start, end) {
        var args = _.toArray(arguments);

        this.props = {
            start: {
                x: 0,
                y: 0
            },
            end: {
                x: 0,
                y: 0
            }
        };

        if (args.length === 4) {
            _.assign(this.props.start, {
                x: args[0],
                y: args[1]
            })

            _.assign(this.props.end, {
                x: args[2],
                y: args[3]
            });
        } else {
            this.props.start = args[0].toJson();
            this.props.end = args[1].toJson();
        }
    };

    Line.options = {
        props: {
            start: {
                x: 0,
                y: 0
            },
            end: {
                x: 0,
                y: 0
            }
        }
    };

    Line.extend = Graph.lang.Class.extend;

    Line.prototype.constructor = Line;

    Line.prototype.start = function() {
        return Graph.point(this.props.start.x, this.props.start.y);
    };

    Line.prototype.end = function() {
        return Graph.point(this.props.end.x, this.props.end.y);
    };

    Line.prototype.bearing = function() {
        var data = ['NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];

        var x1 = this.props.start.x,
            y1 = this.props.start.y,
            x2 = this.props.end.x,
            y2 = this.props.end.y,
            lat1 = Graph.util.rad(y1),
            lat2 = Graph.util.rad(y2),
            lon1 = x1,
            lon2 = x2,
            deltaLon = Graph.util.rad(lon2 - lon1),
            dy = Math.sin(deltaLon) * Math.cos(lat2),
            dx = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
            index = Graph.util.deg(Math.atan2(dy, dx)) - 22.5;

        if (index < 0) {
            index += 360;
        }

        index = parseInt(index / 45);
        return data[index];
    };

    Line.prototype.intersect = function(line) {
        return this.intersection(line) !== null;
    };

    Line.prototype.intersection = function(line, dots) {
        var x1 = this.props.start.x,
            y1 = this.props.start.y,
            x2 = this.props.end.x,
            y2 = this.props.end.y,
            x3 = line.props.start.x,
            y3 = line.props.start.y,
            x4 = line.props.end.x,
            y4 = line.props.end.y;

        var result = Graph.util.lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4);

        if (result) {
            return dots ? result : Graph.point(result.x, result.y);
        }

        return result;
    };

    Line.prototype.toString = function() {
        return 'Graph.lang.Line';
    };

    ///////// SHORTCUT /////////

    Graph.line = function(command) {
        var args = _.toArray(arguments);
        return Graph.factory(Graph.lang.Line, args);
    };

    Graph.isLine = function(obj) {
        return obj instanceof Graph.lang.Line;
    };

}());
