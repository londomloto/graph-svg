
(function(){
    
    var Link = Graph.link.Link;
    
    Graph.link.Directed = Graph.extend(Link, {
        
        renderControl: function() {
            var me = this, editor = me.component('editor');

            if (me.cached.controls) {
                _.forEach(me.cached.controls, function(c){
                    c = Graph.registry.vector.get(c);
                    c.remove();
                });
                me.cached.controls = null;
            }

            var points = this.cached.bendpoints,
                maxlen = points.length - 1,
                linkid = me.guid(),
                controls = [],
                controlImage = Graph.config.base + 'img/' + Graph.config.resizer.image,
                controlSize = Graph.config.resizer.size;

            _.forEach(points, function(dot, i){
                
                var control = (new Graph.svg.Image(
                    controlImage,
                    dot.x - controlSize / 2,
                    dot.y - controlSize / 2,
                    controlSize,
                    controlSize
                ));
                
                control.selectable(false);
                control.removeClass(Graph.styles.VECTOR);
                
                if (i === 0) {
                    control.addClass(Graph.styles.LINK_TAIL);
                    control.elem.data('pole', 'tail');
                } else if (i === maxlen) {
                    control.addClass(Graph.styles.LINK_HEAD);
                    control.elem.data('pole', 'head');
                }
                
                control.elem.group('graph-link');
                control.elem.data(Graph.string.ID_LINK, linkid);
                
                var context = {
                    trans: (i === 0 || i === maxlen) ? 'CONNECT' : 'BENDING',
                    index: dot.index,
                    space: dot.space,
                    point: {
                        x: dot.x,
                        y: dot.y
                    },
                    event: {
                        x: dot.x,
                        y: dot.y
                    },
                    range: {
                        start: dot.range[0],
                        end:   dot.range[1]
                    },
                    delta: {
                        x: 0,
                        y: 0
                    },
                    snap: {
                        hor: [],
                        ver: []
                    }
                };
                
                control.draggable({ghost: false});
                control.cursor('default');
                
                control.on('beforedrag', _.bind(me.onControlStart, me, _, context, control));
                control.on('drag',  _.bind(me.onControlMove,  me, _, context, control));
                control.on('afterdrag',   _.bind(me.onControlEnd,   me, _, context, control));
                
                control.render(editor);
                controls.push(control.guid());
            });
            
            me.cached.controls = controls;
            controls = null;
        },
        
        onControlStart: function(e, context, control) {
            this.router.initTrans(context);
            
            if (context.trans == 'CONNECT') {
                var paper = this.component().paper();
                if (paper) {
                    paper.addClass('linking');
                }
            }

            var snaphor = context.snap.hor,
                snapver = context.snap.ver;
            
            control.draggable().snap([
                function(x, y){
                    var sx = Graph.util.snapValue(x, snapver),
                        sy = Graph.util.snapValue(y, snaphor);
                    
                    return {
                        x: sx,
                        y: sy,
                        range: 10
                    };
                }
            ]);
            
            _.forEach(this.cached.controls, function(id){
                var c = Graph.registry.vector.get(id);
                if (c && c !== control) {
                    c.hide();
                }
            });
            
            control.show();
        },
        
        onControlMove: function(e, context, control) {
            var me = this;
            
            context.delta.x += e.dx;
            context.delta.y += e.dy;
            
            var x1, y1, x2, y2;
            
            x1 = context.event.x,
            y1 = context.event.y;
            
            if (context.trans == 'BENDING') {
                me.router.bending(context, function(result){
                    me.reload(result.command, true);
                });
            } else {
                me.router.connecting(context, function(result){
                    me.reload(result.command, true);
                });
            }
            
            x2 = context.event.x,
            y2 = context.event.y;
            
            // update dragger
            e.originalData.dx = (x2 - x1);
            e.originalData.dy = (y2 - y1);
        },
        
        onControlEnd: function(e, context, control) {
            this.router.stopTrans(context);

            if (context.trans == 'CONNECT') {
                var paper = this.component().paper();
                if (paper) {
                    paper.removeClass('linking');
                }
            }

            this.reload(this.router.command());
            this.invalidate();
            this.resumeControl();
        }

    });

    ///////// STATICS /////////

}());