(function(){
    var DOCUMENT  = document;

    ///////////////////////// HOOK DOCUMENT CLICK /////////////////////////
    
    Graph(function(){
        var doc = DOCUMENT,
            on = function(target, type, handler) {
                if (target.addEventListener) {
                    target.addEventListener(type, handler, false);
                } else {
                    target.attachEvent('on' + type, handler);
                }
            };

        on(doc, 'mousedown', function(e){
            var target, vector, paper;

            target = Graph.$(Graph.event.target(e));
            vector = target.data(Graph.string.ID_VECTOR);

            if (vector) {
                vector = Graph.registry.vector.get(vector);
                paper = vector.paper();
                Graph.cached.paper = paper ? paper.guid() : null;
            }

            vector = paper = null;
        });

        on(doc, 'keydown', function(e){
            var paper;

            if (Graph.event.isNavigation(e)) {
                paper = Graph.cached.paper;
                
                if (paper) {
                    paper = Graph.registry.vector.get(paper);
                    e.originalType = 'keynavdown';
                    paper.fire(e);
                }
            } else if (e.ctrlKey || e.cmdKey) {
                paper = Graph.cached.paper;
                
                if (paper) {
                    paper = Graph.registry.vector.get(paper);
                    if (e.keyCode === Graph.event.C) {
                        e.originalType = 'keycopy';
                        paper.fire(e);
                    } else if (e.keyCode === Graph.event.V) {
                        e.originalType = 'keypaste';
                        paper.fire(e);
                    }
                }   
            }
        });

        on(doc, 'keyup', function(e){
            if (Graph.event.isNavigation(e)) {
                var paper = Graph.cached.paper;
                if (paper) {
                    paper = Graph.registry.vector.get(paper);
                    e.originalType = 'keynavup';
                    paper.fire(e);
                }
            }
        });
    });

    ///////////////////////// LISTEN DOCUMENT READY ////////////////////////
    
    (function(doc){
        var timer;

        var execute = function() {
            _.forEach(Graph.BOOTSTRAPS, function(f){
                f();
            });
        };

        var ready = function() {
            doc.removeEventListener('DOMContentLoaded', ready, false);
            doc.readyState = 'complete';
        };

        var inspect = function() {
            if (doc.readyState != 'complete') {
                timer = _.delay(function(){
                    clearTimeout(timer);
                    timer = null;
                    inspect();
                }, 10);
            } else {
                execute();
            }
        };

        if (doc.readyState == null && doc.addEventListener) {
            doc.addEventListener('DOMContentLoaded', ready, false);
            doc.readyState = 'loading';
        }

        inspect();
        
    }(DOCUMENT));

    ///////////////////////////////////////////////////////////////////////

}());