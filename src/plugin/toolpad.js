
(function(){

    Graph.plugin.Toolpad = Graph.extend(Graph.plugin.Plugin, {
        
        props: {
            vector: null,
            rendered: false,
            suspended: true
        },
        
        components: {
            pad: null
        },  
    
        constructor: function(paper) {
            
            this.props.vector = paper.guid();
            this.initComponent(paper);

            this.cached.tools = null;
            this.cached.shape = null;
            this.cached.link  = null;
            
            Graph.topic.subscribe('shape:select', _.bind(this.onShapeSelect, this));
            Graph.topic.subscribe('shape:deselect', _.bind(this.onShapeDeselect, this));
            
            Graph.topic.subscribe('link:select', _.bind(this.onLinkSelect, this));
            Graph.topic.subscribe('link:deselect', _.bind(this.onLinkDeselect, this));
        },
        
        initComponent: function(paper) {
            
            var pad = '<div class="graph-toolpad">' + 
                            // '<div class="pad-header"></div>' + 
                            // '<div class="pad-splitter"></div>' + 
                            '<div class="pad-body"></div>'+
                      '</div>';

            pad = Graph.$(pad);

            pad.on('click', '[data-shape-tool]', _.bind(this.onShapeToolClick, this));
            pad.on('click', '[data-link-tool]', _.bind(this.onLinkToolClick, this));
            
            this.components.pad = pad;
        },
        
        render: function() {
            if (this.props.rendered) {
                return;
            }
            
            this.components.pad.appendTo(this.vector().container());
            this.props.rendered = true;
        },
        
        suspend: function() {
            this.props.suspended = true;
            this.components.pad.detach();
        },
        
        resume: function() {
            if (this.props.suspended) {
                
                this.props.suspended = false;
                
                if ( ! this.props.rendered) {
                    this.render();
                } else {
                    this.components.pad.appendTo(this.vector().container());
                }
            }
        },
        
        onShapeSelect: function(e) {
            var shape = e.shape,
                meta = shape.metadata,
                pad = this.components.pad;

            var body = '';

            // pad.find('.pad-header').html('<a href="javascript:void(0);"><i class="' + meta.icon + '"></i></a>');            
            // pad.find('.pad-header').html('<a href="javascript:void(0);"><i class="ion-navicon-round"></i></a>');            
            
            _.forEach(meta.tools, function(tool, index){
                if (tool.enabled) {
                    if (index > 0) {
                        body += '<div class="splitter"></div>';    
                    }
                    body += '<a data-shape-tool="' + tool.name + '" href="javascript:void(0)" title="' + tool.title + '">' + tool.icon + '</a>';
                }
            });
            
            pad.find('.pad-body').html(body);

            this.cached.tools = meta.tools;
            this.cached.shape = shape;

            this.resume();
        },
        
        onShapeDeselect: function(e) {
            this.suspend();
        },
        

        onLinkSelect: function(e) {
            var link = e.link,
                meta = link.metadata,
                pad = this.components.pad;
            
            // pad.find('.pad-header').html('<a><i class="' + meta.icon + '"></i></a>');
            // pad.find('.pad-header').html('<a><i class="ion-navicon-round"></i></a>');
            
            var body = '';
            
            _.forEach(meta.tools, function(tool, index){
                if (tool.enabled) {
                    if (index > 0) {
                        body += '<div class="splitter"></div>';        
                    }
                    body += '<a data-link-tool="' + tool.name + '" href="#" title="' + tool.title + '">'+ tool.icon +'</a>';                    
                }
            });
            
            pad.find('.pad-body').html(body);
            
            this.cached.tools = meta.tools;
            this.cached.link = link;
            this.resume();
        },

        onLinkDeselect: function(e) {
            this.suspend();
        },
        
        onShapeToolClick: function(e) {
            var target = Graph.$(e.currentTarget),
                name = target.data('shapeTool');

            var tool = _.find(this.cached.tools, function(t){
                return t.name == name;
            });

            if (tool) {
                if (tool.name == 'config') {
                    var paper = this.vector();
                    paper.fire('shapetoolclick', {
                        shape: this.cached.shape
                    });
                } else if (tool.handler) {
                    tool.handler(e);
                }
            }
            
            e.preventDefault();
        },

        onLinkToolClick: function(e) {
            var target = Graph.$(e.currentTarget),
                name = target.data('linkTool');
            
            var tool = _.find(this.cached.tools, function(t){
                return t.name == name;
            });

            if (tool) {
                if (tool.name == 'config') {
                    var paper = this.vector();
                    paper.fire('linktoolclick', {
                        link: this.cached.link
                    });
                } else if (tool.handler) {
                    tool.handler(e);
                }
            }
            
            e.preventDefault();  
        },

        toString: function() {
            return 'Graph.plugin.Toolpad';
        }
        
    });

}());