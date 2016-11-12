
(function(){    

    var Heap = Graph.collection.Heap = function(comparison) {
        this.comparison = _.defaultTo(comparison, defcmp);
        this.nodes = [];
    };  

    Heap.prototype.constructor = Heap;

    Heap.prototype.push = function(val) {
        return heappush(this.nodes, val, this.comparison);
    };

    Heap.prototype.pop = function() {
        return heappop(this.nodes, this.comparison);
    };

    Heap.prototype.peek = function() {
        return this.nodes[0];
    };

    Heap.prototype.contains = function(val) {
        return this.nodes.indexOf(val) !== -1;
    };

    Heap.prototype.largest = function(n) {
        n = _.defaultTo(n, 1);
        return largest(this.nodes, n, this.comparison);
    };

    Heap.prototype.smallest = function(n) {
        n = _.defaultTo(n, 1);
        return smallest(this.nodes, n, this.comparison);
    };

    Heap.prototype.replace = function(val) {
        return heapreplace(this.nodes, val, this.comparison);
    };

    Heap.prototype.pushpop = function(val) {
        return heappushpop(this.nodes, val, this.comparison);
    };

    Heap.prototype.heapify = function() {
        return heapify(this.nodes, this.comparison);
    };

    Heap.prototype.update = function(val) {
        return heapupdate(this.nodes, val, this.comparison);
    };

    Heap.prototype.clear = function() {
        this.nodes = [];
    };

    Heap.prototype.isEmpty = function() {
        return this.nodes.length === 0;
    };

    Heap.prototype.size = function() {
        return this.nodes.length;
    };

    Heap.prototype.clone = function() {
        var heap;
        
        heap = new Heap();
        heap.nodes = _.cloneDeep(this.nodes);

        return heap;
    };

    Heap.prototype.toArray = function() {
        return _.cloneDeep(this.nodes);
    };

    ///////// HELPERS /////////

    function defcmp(a, b) {
        return a === b ? 0 : (a < b ? -1 : 1);
    }

    function insort(a, x, lo, hi, cmp) {
        var mid;
        
        lo = _.defaultTo(lo, 0);
        cmp = _.defaultTo(cmp, defcmp);

        if (lo < 0) {
            throw new Error('lo must be non-negative');
        }

        hi = _.defaultTo(hi, a.length);

        while (lo < hi) {
            mid = Math.floor((lo + hi) / 2);
            if (cmp(x, a[mid]) < 0) {
                hi = mid;
            } else {
                lo = mid + 1;
            }
        }

        return ([].splice.apply(a, [lo, lo - lo].concat(x)), x);
    }

    function heappush(array, item, cmp) {
        cmp = _.defaultTo(cmp, defcmp);
        array.push(item);
        return shiftdown(array, 0, array.length - 1, cmp);
    }

    function heappop(array, cmp) {
        var lastelt, returnitem;
        
        cmp = _.defaultTo(cmp, defcmp);
        lastelt = array.pop();
        
        if (array.length) {
            returnitem = array[0];
            array[0] = lastelt;
            shiftup(array, 0, cmp);
        } else {
            returnitem = lastelt;
        }

        return returnitem;
    }

    function heappushpop(array, item, cmp) {
        var _ref;
        
        cmp = _.defaultTo(cmp, defcmp);
        
        if (array.length && cmp(array[0], item) < 0) {
            _ref = [array[0], item], item = _ref[0], array[0] = _ref[1];
            shiftup(array, 0, cmp);
        }

        return item;
    }

    function heapreplace(array, item, cmp) {
        var returnitem;
        
        cmp = _.defaultTo(cmp, defcmp);
        returnitem = array[0];
        array[0] = item;
        shiftup(array, 0, cmp);
        
        return returnitem;
    }

    function heapify(array, cmp) {
        var i, _i, _j, _len, _ref, _ref1, _results, _results1;
        
        cmp = _.defaultTo(cmp, defcmp);

        _ref1 = (function() {
            _results1 = [];
            for (var _j = 0, _ref = Math.floor(array.length / 2); 0 <= _ref ? _j < _ref : _j > _ref; 0 <= _ref ? _j++ : _j--){ 
                _results1.push(_j); 
            }
            return _results1;
        }).apply(this).reverse();

        _results = [];

        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            i = _ref1[_i];
            _results.push(shiftup(array, i, cmp));
        }

        return _results;
    }

    function heapupdate(array, item, cmp) {
        var pos;
        
        cmp = _.defaultTo(cmp, defcmp);
        pos = array.indexOf(item);

        if (pos === -1) {
            return;
        }

        shiftdown(array, 0, pos, cmp);
        return shiftup(array, pos, cmp);
    }

    function largest(array, n, cmp) {
        var elem, result, _i, _len, _ref;

        cmp = _.defaultTo(cmp, defcmp);
        result = array.slice(0, n);
        
        if ( ! result.length) {
            return result;
        }

        heapify(result, cmp);
        
        _ref = array.slice(n);
        
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            elem = _ref[_i];
            heappushpop(result, elem, cmp);
        }

        return result.sort(cmp).reverse();
    }

    function smallest(array, n, cmp) {
        var elem, i, los, result, _i, _j, _len, _ref, _ref1, _results;
        
        cmp = _.defaultTo(cmp, defcmp);

        if (n * 10 <= array.length) {
            result = array.slice(0, n).sort(cmp);

            if ( ! result.length) {
                return result;
            }
        
            los = result[result.length - 1];
            _ref = array.slice(n);
        
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                elem = _ref[_i];
                if (cmp(elem, los) < 0) {
                    insort(result, elem, 0, null, cmp);
                    result.pop();
                    los = result[result.length - 1];
                }
            }

            return result;
        }

        heapify(array, cmp);

        _results = [];

        for (i = _j = 0, _ref1 = Math.min(n, array.length); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
            _results.push(heappop(array, cmp));
        }

        return _results;
    }

    function shiftdown(array, startpos, pos, cmp) {
        var newitem, parent, parentpos;

        cmp = _.defaultTo(cmp, defcmp);
        newitem = array[pos];

        while (pos > startpos) {
            parentpos = (pos - 1) >> 1;
            parent = array[parentpos];
            if (cmp(newitem, parent) < 0) {
                array[pos] = parent;
                pos = parentpos;
                continue;
            }
            break;
        }

        return array[pos] = newitem;
    }

    function shiftup(array, pos, cmp) {
        var childpos, endpos, newitem, rightpos, startpos;

        cmp = _.defaultTo(cmp, defcmp);

        endpos = array.length;
        startpos = pos;
        newitem = array[pos];
        childpos = 2 * pos + 1;
        
        while (childpos < endpos) {
            rightpos = childpos + 1;
            if (rightpos < endpos && ! (cmp(array[childpos], array[rightpos]) < 0)) {
                childpos = rightpos;
            }
            array[pos] = array[childpos];
            pos = childpos;
            childpos = 2 * pos + 1;
        }

        array[pos] = newitem;

        return shiftdown(array, startpos, pos, cmp);
    }

}());