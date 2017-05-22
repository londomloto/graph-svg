
(function(){

    Graph.layout.Layout = Graph.extend({
        
        props: {
            // view config
            fit: true,
            view: null,
            width: 0,
            height: 0,

            // router config
            router: {
                type: 'orthogonal'
            },

            link: {
                smooth: false,
                smoothness: 6
            }
        },
        
        view: null,

        cached: {
            offset: null,
            position: null
        },

        constructor: function(view, options) {
            _.assign(this.props, options || {});
            this.props.view = view.guid();
        },

        view: function() {
            return Graph.registry.vector.get(this.props.view);
        },

        paper: function() {
            return this.view().paper();
        },

        offset: function() {
            // TODO: please fix...
            return this.position();
        },

        position: function() {
            var position = this.cached.position;
            var view, node;

            if ( ! position) {
                view = this.view();
                node = view.isViewport() ? view.parent().node() : view.node();

                position = node.getBoundingClientRect();
                this.cached.position = position;
            }

            return position;
        },

        center: function() {
            var center = this.cached.center;

            if ( ! center) {
                var position = this.position();

                center = {
                    x: position.width / 2,
                    y: position.height / 2
                };

                this.cached.center = _.extend({}, center);
            }
            
            return center;
        },

        scale: function() {
            return this.view().matrix().scale();
        },

        width: function() {
            var view, bbox, width;

            view = this.view();

            if (view.isViewport()) {
                width = this.paper().width();
            } else {
                bbox  = view.bbox();
                width = bbox.width();
            }

            view = bbox = null;
            return width;
        },

        height: function() {
            var view, bbox, height;

            view = this.view();

            if (view.isViewport()) {
                height = this.paper().height();
            } else {
                bbox   = view.bbox();
                height = bbox.height();
            }

            view = bbox = null;
            return height;
        },
        
        invalidate: function() {
            this.cached.offset = null;
            this.cached.center = null;
            this.cached.position = null;
        },

        grabVector: function(event) {
            var target = Graph.event.target(event);
            return Graph.registry.vector.get(target);
        },

        grabLink: function(event) {
            var target = Graph.event.target(event);
            return Graph.registry.link.get(target);
        },

        pointerLocation: function(pointer) {
            var x = pointer.clientX,
                y = pointer.clientY,
                position = this.position(),
                matrix = this.view().matrix(),
                invert = matrix.clone().invert(),
                scale  = matrix.scale(),
                location = {
                    x: invert.x(x, y),
                    y: invert.y(x, y)
                };

            
            location.x -= position.left / scale.x;
            location.y -= position.top / scale.y;    
            
            matrix = invert = null;

            return location;
        },

        screenLocation: function(coord) {
            var screen = this.view().node().getScreenCTM();
                matrix = Graph.matrix(
                    screen.a,
                    screen.b,
                    screen.c,
                    screen.d,
                    screen.e,
                    screen.f
                );

            var x = matrix.x(coord.x, coord.y),
                y = matrix.y(coord.x, coord.y);

            coord.x = x;
            coord.y = y;
            
            return coord;
        },

        dragSnapping: function() {
            return {
                mode: 'anchor',
                x: 1,
                y: 1
            };
        },

        routerType: function() {
            return this.props.router.type;
        },
        
        createRouter: function(source, target, options) {
            var clazz, router;

            clazz   = Graph.router[_.capitalize(this.props.router.type)];
            options = _.extend({}, this.props.router, options || {});
            router  = Graph.factory(clazz, [this.view(), source, target, options]);

            return router;
        },
        
        createLink: function(router, options) {
            var clazz, link;

            clazz   = Graph.link[_.capitalize(this.props.router.type)];
            options = _.extend({}, this.props.link, options || {});
            link    = Graph.factory(clazz, [router, options]);

            return link;
        },

        refresh: function(vector) {
            this.fire('refresh');
        },

        arrangeLinks: function() {
            var scope = this.view().paper().guid(),
                links = Graph.registry.link.collect(scope);
            
            if (links.length) {
                
                var inspect = [];
                
                _.forEach(links, function(link){
                    if (link.cached.convex) {
                        inspect.push(link.guid());
                    }
                });
                
                // TODO: research for sweepline algorithm
                
                var sweeper = new Graph.util.Sweeplink(links),
                    convex = sweeper.findConvex();
                
                var key, link, idx;
                
                for (key in convex) {
                    link = Graph.registry.link.get(key);
                    
                    link.reloadConvex(convex[key]);
                    link.reset(true);
                    
                    idx = _.indexOf(inspect, key);
                    
                    if (idx > -1) {
                        inspect.splice(idx, 1);
                    }
                }
                
                if (inspect.length) {
                    _.forEach(inspect, function(key){
                        var link = Graph.registry.link.get(key);
                        
                        link.removeConvex();
                        link.reset(true);
                    });
                }
                
                sweeper.destroy();
                sweeper = null;
            }
        },

        arrangeShapes: function() {
            
        },

        toString: function() {
            return 'Graph.layout.Layout';
        }
        
    });

}());