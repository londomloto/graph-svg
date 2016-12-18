
(function(){

    angular
        .module('app', [])
        .controller('AppController', AppController)
        .provider('modal', modalProvider)
        .provider('tool', toolProvider)
        .provider('api', apiProvider)
        .directive('uitool', uitool)
        .directive('uimodal', uimodal)
        .directive('uipaper', uipaper)
        .directive('uipallet', uipallet)
        .directive('uitemplate', uitemplate)
        .directive('uifocus', uifocus);

    function AppController($timeout, $scope, $q, api, modal) {
        
        ///////// DATA /////////

        $scope.paper = null;
        $scope.pallet = null;
        $scope.diagrams = [];
        
        $scope.diagram = {

        };

        $scope.shape = {
            
        };

        $scope.link = {
            
        };

        $scope.download = {
            type: 'png',
            name: 'example.png'
        };

        $scope.shapeParam = {
            focus: false,
            key: '',
            value: ''
        };

        $scope.linkParam = {
            focus: false,
            key: '',
            value: ''
        };

        $scope.saveDiagram = saveDiagram;
        $scope.removeDiagram = removeDiagram;

        $scope.showDiagramBrowser = function() {
            modal.open('diagram-browser').then(function(){
                loadDiagrams();
            });
        };

        $scope.showDiagramSimulator = function() {
            $.snackbar({content: 'Not implemented yet!'});
        };

        $scope.showDiagramCreator = function() {
            if ($scope.paper.diagram().current()) {
                $scope.paper.diagram().remove();
            }
            modal.open('diagram-editor');
        };

        $scope.showDiagramUpdater = function() {
            modal.open('diagram-editor');
        };

        $scope.showDiagramDownloader = function() {
            modal.open('download-dialog');
        };

        $scope.showPaperConfig = function() {
            $.snackbar({content: 'Not implemented yet!'});
        };

        $scope.showShapeEditor = function(shape) {
            $scope.shape = shape.toJson();
            
            _.forEach($scope.shape.params, function(item){
                item.editing = false;
            });

            modal.open('shape-editor');
        };

        $scope.showLinkEditor = function(link) {
            $scope.link = link.toJson();
            _.forEach($scope.link.params, function(item){
                item.editing = false;
            });
            modal.open('link-editor');
        };

        $scope.openDiagram = function(id) {
            modal.hide('diagram-browser');

            api.get('diagrams/' + id).then(function(result){
                if (result.success) {
                    $scope.paper.diagram().remove();
                    
                    $timeout(function(){
                        var diagram = diagram = $scope.paper.diagram().create('activity', result.data.props, true);
                        diagram.render(result.data);
                        $scope.diagram = diagram.toJson();
                    });
                }
            });
        };

        $scope.saveDiagramEditor = function() {
            var diagram = $scope.paper.diagram().current(),
                options = angular.copy($scope.diagram);

            if ( ! diagram) {
                diagram = $scope.paper.diagram().create('activity', options.props, true);
                diagram.update(options);
            } else {
                diagram.update(options);
            }

            saveDiagram().then(function(){
                $scope.diagram = diagram.toJson();
            });

            modal.hide('diagram-editor');
        };

        $scope.saveShapeEditor = function() {
            var diagram = $scope.paper.diagram().current();
            var shape;

            if (diagram) {
                shape = diagram.getShapeBy(function(shape){ return shape.props.guid == $scope.shape.props.guid; })
            } else {
                shape = Graph.registry.shape.get($scope.shape.props.guid);
            }

            if (shape) {
                shape.redraw($scope.shape.props);
            }

            modal.hide('shape-editor');
        };

        $scope.addShapeParam = function() {
            var entry = $scope.shapeParam;

            $scope.shape.params.push({
                key: entry.key,
                value: entry.value
            });

            entry.key = '';
            entry.value = '';

            $timeout(function(){
                entry.focus = true;    
            }, 200);
        };

        $scope.addLinkParam = function() {
            var entry = $scope.linkParam;

            $scope.link.params.push({
                key: entry.key,
                value: entry.value
            });

            entry.key = '';
            entry.value = '';

            $timeout(function(){
                entry.focus = true;    
            }, 200);
        };

        $scope.locateLink = function(guid) {
            var link = Graph.registry.link.get(guid);
            if (link) {
                link.select(true);
            }

            modal.hide('shape-editor');
        };

        $scope.locateShape = function(guid) {
            var shape = Graph.registry.shape.get(guid);
            if (shape) {
                shape.select(true);
            }

            modal.hide('shape-editor');
        };

        $scope.trash = function() {
            if ($scope.paper) {
                $scope.paper.diagram().removeSelection();
            }
        };

        $scope.undo = function() {
            $scope.paper.diagram().undo();
        };

        $scope.redo = function() {
            $scope.paper.diagram().redo();
        };

        $scope.downloadDiagram = function() {
            var type = $scope.download.type,
                ext = type == 'jpeg' ? 'jpg' : type;
                name = $scope.download.name;

            name = name.replace(/\.?([^.]+)$/, '.' + ext);

            $scope.paper.diagram().saveAsImage(type, name);
            modal.hide('download-dialog');  
        };

        $scope.activateTool = function(name) {
            if ($scope.paper) {
                $scope.paper.tool().activate(name);
            }
        };

        $scope.deactivateTool = function(name) {
            if ($scope.paper) {
                $scope.paper.tool().deactivate(name);
            }
        };

        $scope.hideModal = function(name) {
            modal.hide(name);
        };  

        $scope.$watch('pallet', function(pallet){
            if ($scope.paper && pallet) {
                $scope.paper.diagram().addPallet(pallet);
            }
        });

        ///////// HELPERS /////////

        Graph.topic.subscribe('graph:message', function(e){
            $.snackbar({
                content: e.message,
                style: e.type
            });
        });

        function loadDiagrams() {
            api.get('diagrams').then(function(result){
                if (result.success) {
                    $scope.diagrams = result.data;
                }
            });
        }

        function saveDiagram() {
            var def = $q.defer(),
                diagram = $scope.paper.diagram().current();
            
            $scope.paper.tool().activate('panzoom');

            if (diagram) {
                var data = diagram.toJson();

                if (data.props.id) {
                    api.put('diagrams/' + data.props.id, data).then(function(result){
                        if (result.success) {
                            diagram.update(result.data);
                            $.snackbar({ content: 'Diagram updated!' });
                        }

                        upload(diagram).then(function(){
                            def.resolve(diagram);
                        });
                    });
                } else {
                    api.post('diagrams', data).then(function(result){
                        if (result.success) {
                            diagram.update(result.data);
                            $.snackbar({ content: 'Diagram created!' });
                        }
                        upload(diagram).then(function(){
                            def.resolve(diagram);
                        });
                    });
                }
            } else {
                $.snackbar({ content: 'No diagram', style: 'warning' });
                def.resolve(null);
            }

            return def.promise;
        }

        function removeDiagram(id) {
            api.del('diagrams/' + id).then(function(result){
                if (result.success) {
                    loadDiagrams();
                    
                    var diagram = $scope.paper.diagram().current();

                    if (diagram && diagram.props.id == id) {
                        $scope.paper.diagram().remove();
                    }
                }
            });
        }

        function upload(diagram) {
            var def = $q.defer(),
                json = diagram.toJson();

            $scope.paper.diagram().saveAsFile(function(file){
                var data = new FormData();

                data.append('userfile', file);
                
                for (var key in json) {
                    data.append(key, JSON.stringify(json[key]));
                }
                
                api.post('upload/diagrams/' + diagram.props.id, data, {upload: true}).then(function(){
                    def.resolve(diagram);
                });
            });

            return def.promise;
        }
    }

    function apiProvider() {
        var base = '../server/';

        this.$get = function($http) {
            return {
                get: function(api, data) {
                    var options = { method: 'GET' },
                        params = false;

                    if (data) {
                        var key, val;

                        params = [];

                        for (key in data) {
                            val = data[key];
                            if (_.isArray(val)) {
                                val = JSON.stringify(val);
                            }
                            params.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
                        }

                        params = params.join('&');
                    }

                    if (params) {
                        api += (api.indexOf('?') > -1 ? '&' : '?') + params;
                    }

                    return request(api, options);
                },
                post: function(api, data, options) {
                    options = options || {};

                    options.method = 'POST';
                    options.data = data || {};

                    return request(api, options);
                },
                put: function(api, data, options) {
                    options = options || {};

                    options.method = 'PUT';
                    options.data = data || {};

                    return request(api, options);
                },
                del: function(api, data) {
                    var options = { 
                        method: 'DELETE',
                        data: data || {}
                    };

                    return request(api, options);
                }
            };

            /////////
            
            function request(url, options) {
                options = options || {};

                options.url = base + url;
                options.headers = options.headers || {};

                if (options.upload) {
                    options.transformRequest = angular.identity;
                    options.headers['Content-Type'] = undefined;
                } else {
                    options.headers['Content-Type'] = 'application/json';    
                    options.headers['X-Accept'] = 'application/json';
                }

                return $http(options).then(function(response){
                    return response.data;
                });
            }
        };
    }

    function modalProvider() {
        var modals = {};

        this.$get = function($q) {
            return {
                add: function(name, instance) {
                    modals[name] = {
                        instance: instance,
                        onshow: null,
                        onhide: null
                    };
                },
                fire: function(name, event) {
                    var modal = modals[name],
                        promise = 'on' + event;
                    if (modal && modal[promise]) {
                        modal[promise].resolve();
                    }
                },
                open: function(name) {
                    var def = $q.defer(),
                        modal = modals[name];

                    if (modal) {
                        modal.onshow = def;
                        modal.instance.show();
                    }

                    return def.promise;
                },
                hide: function(name) {
                    var modal = modals[name];
                    if (modal) {
                        modal.instance.hide();
                        modal.onshow = null;
                        modal.onhide = null;
                    }
                }
            }
        };
    }

    function toolProvider() {
        var tools = {};

        this.$get = function() {
            return {
                add: function(name, tool) {
                    tools[name] = tool;
                },
                activate: function(name) {
                    for (var prop in tools) {
                        if (tools.hasOwnProperty(prop)) {
                            tools[prop].deactivate();
                        }
                    }
                    tools[name] && tools[name].activate();
                },
                deactivate: function(name) {
                    tools[name] && tools[name].deactivate();
                }
            }
        };
    }

    function uitool(tool) {
        var directive = {
            restrict: 'A',
            link: link,
            scope: true
        };

        return directive;

        function link(scope, element, attrs) {
            var name = attrs.uitool;
            tool.add(name, scope);

            scope.activate = function() {
                element.addClass('active');
            };

            scope.deactivate = function() {
                element.removeClass('active');
            };
        }
    }

    function uifocus($parse) {
        var directive = {
            link: link,
            restrict: 'A'
        };
        
        return directive;

        function link(scope, element, attrs) {
            var model = attrs.uifocus;

            scope.$watch(model, function(value){
                if (value) {
                    element.focus();
                    $parse(model).assign(scope, false);
                }
            });

        }
    }

    function uitemplate($templateRequest, $compile) {
        var directive = {
            link: link,
            restrict: 'A',
            scope: true
        };

        return directive;

        function link(scope, element, attrs) {
            var name = attrs.uitemplate + '.html';
            $templateRequest('templates/' + name).then(function(html){
                element.html(html);
                $compile(element.contents())(scope);
            });
        }
    }

    function uimodal(modal) {
        var directive = {
            restrict: 'A',
            link: link
        };

        return directive;

        function link(scope, element, attrs) {
            var name = attrs.uimodal,
                instance = element.modal('hide').data('bs.modal');

            modal.add(name, instance);

            element.on('show.bs.modal', function(e){
                modal.fire(name, 'show');
            });
        }
    }

    function uipallet() {
        var directive = {
            restrict: 'A',
            link: link
        };

        return directive;

        function link(scope, element, attrs) {
            var pallet = Graph.pallet('activity');
            pallet.render(element);

            scope.pallet = pallet;
        }
    }

    function uipaper($timeout, tool) {
        var directive = {
            restrict: 'A',
            link: link
        };

        return directive;

        function link(scope, element, attrs) {

            var paper = Graph.paper();

            scope.paper = paper;

            paper.on({
                activatetool: function(e) {
                    tool.activate(e.name);
                },
                deactivatetool: function(e) {
                    tool.deactivate(e.name);
                },
                shapetoolclick: function(e) {
                    _apply(function(){
                        scope.showShapeEditor(e.shape);    
                    });
                },
                linktoolclick: function(e) {
                    _apply(function(){
                        scope.showLinkEditor(e.link);   
                    })
                },
                'diagram.create': function(e) {
                    _apply(function(){
                        scope.diagram = e.diagram.toJson();
                    });
                },
                'diagram.destroy': function(e) {
                    _apply(function(){
                        scope.diagram = { };
                    });
                }
            });

            paper.render(element);

            /////////
            
            function _apply(applyHandler) {
                $timeout(function(){
                    applyHandler();
                });
            }

        }
    }



}());
