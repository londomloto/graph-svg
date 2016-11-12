
(function(){

    Graph.plugin.Sorter = Graph.extend(Graph.plugin.Plugin, {

        props: {
            height: 0,
            width: 0,
            suspended: true,
            enabled: true,
            offsetTop: 0,
            offsetLeft: 0
        },

        sortables: [],
        origins: [],
        guests: [],
        batch: [],
        
        trans: {
            sorting: false,
            valid: false,
            drag: null,
            drop: null
        },

        components: {
            helper: null
        },

        constructor: function(vector) {
            var me = this;

            me.vector = vector;
            me.vector.addClass('graph-sorter');

            me.components.helper = new Graph.svg.Rect(0, 0, 0, 0);
            me.components.helper.addClass('graph-sorter-helper');
            me.components.helper.removeClass('graph-elem graph-elem-rect');
            me.components.helper.props.selectable = false;
            me.components.helper.render(me.vector);
            me.components.helper.$sorter = me;
            
            me.sortables.push(me.components.helper);

            me.vector.on({
                render: _.bind(me.onVectorRender, me),
                appendchild: _.bind(me.onItemAdded, me),
                prependchild: _.bind(me.onItemAdded, me)
            });

            if (me.vector.props.rendered) {
                me.setup();
            }
        },

        // setup plugin
        setup: function() {
            var me = this,
                vector = me.vector,
                paper = vector.paper(),
                context = vector.node();

            if (me.plugin) {
                return;
            }
            
            me.plugin = interact('.graph-sortable', {context: context}).dropzone({
                accept: '.graph-sortable',
                // overlap: 'center',
                overlap: .1,
                // checker: _.bind(me.snapping, me),
                ondropactivate: _.bind(me.onSortActivate, me),
                ondropdeactivate: _.bind(me.onSortDeactivate, me),
                ondragenter: _.bind(me.onSortEnter, me),
                ondragleave: _.bind(me.onSortLeave, me),
                ondrop: _.bind(me.onSort, me)
            });

            me.plugin.styleCursor(false);

            if (paper.plugins.collector) {
                paper.plugins.collector.on({
                    afterdrag: function(e) {
                        var origin = e.origin;
                        if (_.indexOf(me.sortables, origin) > -1) {
                           me.props.offsetTop += e.dy;
                        }
                    }
                });
            }
        },

        snapping: function(drage, pointe, dropped, dropzone, dropel, draggable, dragel) {
            return dropped;
        },

        suspend: function() {
            this.props.suspended = true;

            if (this.components.helper) {
                this.components.helper.focus(false);
                this.components.helper.removeClass('visible');
            }
        },

        resume: function() {
            var me = this;

            me.props.suspended = false;

            if (me.components.helper) {
                me.components.helper.addClass('visible');
            }
        },

        redraw: function() {
            var me = this;

            if (me.trans.valid) {

                if (me.props.suspended) {
                    me.resume();    
                }

                me.swap(me.components.helper, me.trans.drop);
                me.components.helper.focus();
            }
        },

        commit: function() {
            var me = this;

            _.forEach(me.guests, function(g){
                me.vector.elem.append(g.node());
            });

            _.forEach(me.sortables, function(s){
                s.$master  = false;
                s.$sorter  = null;
                s.$sorting = false;
            });

            me.components.helper.attr('height', 0);
            
            if (me.batch.length) {
                me.permute();
            } else {
                me.swap(me.trans.drag, me.components.helper);
            }

            _.forEach(me.origins, function(o){
                o.components.helper.attr('height', 0);
                o.reset();
                o.arrange();
                o.suspend();
            });

            me.reset();
            me.suspend();
            me.resumeBatch(me.batch);
        },

        revert: function() {
            var me = this;
            
            _.forEach(me.guests, function(g){
                me.vector.elem.append(g.node());
            });

            _.forEach(me.sortables, function(s){
                s.$sorting = false;
                s.$sorter  = null;
                s.$master  = false;
            });

            _.forEach(me.origins, function(o){
                o.components.helper.attr('height', 0);
                o.reset();
                o.arrange();
                o.suspend();
            });

            me.components.helper.attr('height', 0);
            me.reset();
            me.arrange();
            me.suspend();
            me.resumeBatch(me.batch);
        },  

        permute: function() {
            var me = this,
                target = _.indexOf(me.sortables, me.components.helper),
                stacks = _.map(me.sortables, function(s, i){ return i; });

            me.batch.sort(function(a, b){
                var ta = a.offset().top,
                    tb = b.offset().top;
                return ta === tb ? 0 : (ta < tb ? -1 : 1);
            });

            orders = _.map(me.batch, function(b){
                return _.indexOf(me.sortables, b);
            });

            var swaps  = _.difference(stacks, orders),
                repos = _.indexOf(swaps, target);

            _.insert(swaps, repos, orders);

            me.sortables = _.permute(me.sortables, swaps);
            me.arrange();
        },

        swap: function(source, target) {
            var me = this,
                from = _.indexOf(me.sortables, source),
                to = _.indexOf(me.sortables, target);

            _.move(me.sortables, from, to);
            me.arrange();
        },

        arrange: function() {
            var me = this;

            me.props.height = 0;
            me.props.width  = 0;

            _.forEach(me.sortables, function(s){
                if ( ! s.$sorting) {
                    var sbox = s.bbox().toJson(),
                        dy = me.props.height- sbox.y + me.props.offsetTop;

                    s.translate(0, dy).commit();
                    me.props.height += sbox.height;

                    if (sbox.width > me.props.width) {
                        me.props.width = sbox.width;
                    }
                }
            });
        },

        suspendBatch: function(batch, predicate) {
            _.forEach(batch, function(b){
                b.cascade(function(c){
                    if (c.props.selected && c.resizer) {
                        c.resizer.suspend();
                    }
                });

                if (predicate) {
                    predicate.call(b, b);
                }
            });
        },

        resumeBatch: function(batch) {
            var me = this, timer;
            timer = _.delay(function(){
                clearTimeout(timer);
                _.forEach(batch, function(b){
                    b.cascade(function(c){
                        if (c.props.selected && c.resizer) {
                            c.resizer.resume();
                        }
                    });
                })
            }, 0);
        },

        reset: function() {
            this.guests = [];
            this.origins = [];
            this.trans.drag = null;
            this.trans.sorting = false;
            this.trans.valid = false;
            this.trans.drop = null;
        },

        enroll: function(item) {
            var me = this, sorter;

            if (_.indexOf(me.sortables, item) === -1)  {
                sorter = item.$sorter;
                sorter.release(item);

                if (_.indexOf(me.origins, sorter) === -1) {
                    me.origins.push(sorter);
                }

                item.$sorter  = me;

                if (item.$master) {
                    me.trans.drag = item;
                }
                
                item.off('.sorter');
                item.tree.parent = me.vector;
                me.vector.children().push(item);
                me.guests.push(item);    
            }
            
        },

        release: function(item) {
            var me = this, 
                sorter = item.$sorter || me;

            var offset;

            item.off('.sorter');
            item.$sorter = null;
            item.tree.parent = null;

            if (item.$master) {
                sorter.trans.drag = null;
            }

            sorter.vector.children().pull(item);
            
            if ((offset = _.indexOf(sorter.sortables, item)) > -1) {
                sorter.sortables.splice(offset, 1);
            }

            if ((offset = _.indexOf(sorter.batch, item)) > -1) {
                sorter.batch.splice(offset, 1);
            }

            if ((offset = _.indexOf(sorter.guests, item)) > -1) {
                sorter.guests.splice(offset, 1);
            }
        },

        onVectorRender: function() {
            this.setup();
        },

        onItemAdded: function(item) {
            var me = this, delay;

            if (_.indexOf(me.sortables, item) > -1) {
                return;
            }

            if (item.hasClass('graph-sorter-helper')) {
                return;
            }

            item.$sorter = this;
            item.addClass('graph-sortable');
            
            item.off('.sorter');

            item.on('render.sorter',    _.bind(me.onItemRender, me));
            item.on('resize.sorter',    _.bind(me.onItemResize, me));
            item.on('dragstart.sorter', _.bind(me.onItemDragStart, me));
            item.on('dragend.sorter',   _.bind(me.onItemDragEnd, me));
            item.on('collect.sorter',   _.bind(me.onItemCollect, me));
            item.on('decollect.sorter', _.bind(me.onItemDecollect, me));

            me.sortables.push(item);

            if (item.props.rendered && ! item.$sorting) {
                delay = _.delay(function(){
                    clearTimeout(delay);
                    me.arrange();
                }, 0);
            }
        },

        onItemRender: function(e) {
            var me = this, delay;
            delay = _.delay(function(){
                clearTimeout(delay);
                me.arrange();
            }, 0);
        },

        onItemResize: function(e) {
            var item = e.publisher,
                sorter = item.$sorter || this, defer;

            suppress(item, true);

            _.forEach(sorter.sortables, function(s){
                if (s !== item) {
                    e.type = 'resize.sortable';
                    s.fire(e);
                }
            });

            defer = _.defer(function(item){
                clearTimeout(defer);
                sorter.arrange();
                suppress(item, false);
            }, item);

            /////////
            
            function suppress(item, state) {
                item.cascade(function(c){
                    if (c.props.selected && c.resizer) {
                        var method = state ? 'suspend' : 'resume';
                        c.resizer[method].call(c.resizer);
                    }
                });
            }
        },

        onItemDragStart: function(e) {
            var me = this, 
                item = e.publisher,
                bsize = me.batch.length;

            var bbox;
            
            me.props.enabled = bsize && (bsize + 1) === me.sortables.length ? false : true;

            if ( ! me.props.enabled) {
                return;
            }

            item.$sorter = me;
            item.$master = true;
            item.$sorting = true;

            me.trans.drag = item;
            me.trans.sorting = true;

            bbox = item.bbox().toJson();  
            width = me.props.width;
            height = bbox.height;

            if (bsize) {
                if ( ! item.lasso) {
                    me.batch.pop().lasso.clearCollection();
                    me.batch = [];
                } else {
                    height = 0;
                    me.suspendBatch(me.batch, function(b){
                        var box = b.bbox().toJson();
                        height += box.height;

                        b.$sorter = me;
                        b.$sorting = true;
                    });
                }
            }

            me.components.helper.attr({
                width: width,
                height: height
            });   
        },

        onItemDragEnd: function(e) {
            var me = this;

            if ( ! me.props.enabled) {
                return;
            }

            if (me.trans.sorting) {
                if ( ! me.trans.valid) {
                    me.revert();
                }
            } else {
                me.revert();
            }
        },

        onItemCollect: function(e) {
            var item = e.publisher,
                sorter = item.$sorter || this;

            sorter.batch.push(item);
        },

        onItemDecollect: function(e, item) {
            var item = e.publisher,
                sorter = item.$sorter || this, offset;

            offset = _.indexOf(sorter.batch, item);
            
            if (offset > -1) {
                sorter.batch.splice(offset, 1);
            }
        },

        onSortActivate: function() {},

        onSortDeactivate: function() {},

        onSortEnter: function(e) {
            var me = this;
            var drag, drop, bbox, width, height;
            
            if ( ! me.props.enabled) {
                return;
            }

            drag = Graph.registry.vector.get(e.relatedTarget);
            drop = Graph.registry.vector.get(e.target);

            if (drag.lasso) {
                
                height = 0;
                width  = me.props.width;

                _.forEach(drag.lasso.collection, function(v){
                    var box;

                    if (v.$sorter) {

                        if (v.$sorter !== me) {
                            me.enroll(v);
                            me.batch.push(v);
                        }
                        
                        box = v.bbox().toJson();
                        height += box.height;

                        if (box.width > width) {
                            width = box.width;
                        }
                    }
                });

                me.components.helper.attr({
                    width: width,
                    height: height
                });
            } else {
                if (drag.$sorter) {
                    if (drag.$sorter !== me) {
                        if (me.batch.length) {
                            me.suspendBatch(me.batch);
                        }

                        me.enroll(drag);

                        bbox = drag.bbox().toJson();
                        height = bbox.height;
                        width = me.props.width;

                        me.components.helper.attr({
                            width: width,
                            height: height    
                        });
                    }
                }
            }

            me.trans.drop  = drop;
            me.trans.valid = true;

            me.redraw();
        },

        onSortLeave: function() {
            var me = this;

            if ( ! me.props.enabled) {
                return;
            }

            me.trans.drop = null;
            me.trans.valid = false;
            me.suspend();
        },

        onSort: function() {
            var me = this;

            if ( ! me.props.enabled) {
                return;
            }

            me.commit();
        }
    });

}());