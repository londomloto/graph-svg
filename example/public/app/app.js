
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

    function AppController($timeout, $scope, api, modal) {

        ///////// DATA /////////

        $scope.diagrams = [];
        
        $scope.diagram = {
            props: {},
            phantom: true
        };

        $scope.download = {
            type: 'png',
            name: 'example.png'
        };

        $scope.paper = null;
        $scope.pallet = null;
        $scope.shape = {
            props: {},
            links: [],
            params: []
        };

        $scope.link = {
            props: {},
            params: {}
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

        ///////// HELPERS /////////

        $scope.showBrowseDiagram = function() {
            modal.open('diagram-browser').then(function(){
                api.get('diagrams').then(function(result){
                    $scope.diagrams = result.data;
                });
            });
        };

        $scope.openDiagram = function(id) {
            modal.hide('diagram-browser');

            api.get('diagrams/' + id).then(function(result){
                if (result.success) {
                    var diagram = $scope.paper.diagram().current();
                    
                    if ( ! diagram) {
                        diagram = $scope.paper.diagram().create('activity', result.data.props, true);
                    }

                    diagram.render(result.data);
                }
            });
        };

        $scope.showCreateDiagram = function() {
            _.assign($scope.diagram, {
                props: {},
                phantom: true
            });
            modal.open('diagram-editor');
        };

        $scope.saveDiagramEditor = function() {
            var diagram = $scope.paper.diagram().current(),
                options = angular.copy($scope.diagram);

            if ( ! diagram) {
                diagram = $scope.paper.diagram().create('activity', options.props, true);
            }

            diagram.update(options);
            modal.hide('diagram-editor');
        };

        $scope.showUpdateDiagram = function() {
            modal.open('diagram-editor');
        };

        $scope.saveDiagram = function() {
            var diagram = $scope.paper.diagram().current();
            if (diagram) {
                var json = diagram.toJson(),
                    diagramId = json.props.id;

                if (diagramId) {
                    api.put('diagrams/' + diagramId, json).then(function(result){
                        if (result.success) {
                            diagram.update(result.data);
                            $.snackbar({ content: 'Diagram updated!' });
                        }
                    });
                } else {
                    api.post('diagrams', json).then(function(result){
                        if (result.success) {
                            diagram.update(result.data);
                            $.snackbar({ content: 'Diagram created!' });
                        }
                    });
                }
            }
        };

        $scope.showShapeEditor = function(shape) {
            $scope.shape = shape.toJson();
            
            _.forEach($scope.shape.params, function(item){
                item.editing = false;
            });

            modal.open('shape-editor');
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

        $scope.showLinkEditor = function(link) {
            $scope.link = link.toJson();
            _.forEach($scope.link.params, function(item){
                item.editing = false;
            });
            modal.open('link-editor');
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

        $scope.showDownload = function() {
            modal.open('download-dialog');
        };

        $scope.downloadDiagram = function() {
            var type = $scope.download.type,
                ext = type == 'jpeg' ? 'jpg' : type;
                name = $scope.download.name;

            name = name.replace(/\.?([^.]+)$/, '.' + ext);

            $scope.paper.diagram().saveAs(type, name);
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

        Graph.topic.subscribe('graph:message', function(e){
            $.snackbar({
                content: e.message,
                style: e.type
            });
        });

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
                post: function(api, data) {
                    var options = { 
                        method: 'POST',
                        data: data || {}
                    };

                    return request(api, options);
                },
                put: function(api, data) {
                    var options = { 
                        method: 'PUT',
                        data: data || {}
                    };

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
                options.headers['Content-Type'] = 'application/json';

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

    function uipaper(tool) {
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
                    scope.$apply(function(){
                        scope.showShapeEditor(e.shape);    
                    });
                },
                linktoolclick: function(e) {
                    scope.$apply(function(){
                        scope.showLinkEditor(e.link);
                    });
                },
                'diagram.create': function(e) {
                    scope.$apply(function(){
                        scope.diagram = e.diagram.toJson();
                    });
                }
            });

            paper.render(element);

            var s1 = Graph.shape('activity.action', {left: 300, top: 120, label: 'Business Process'});
            var s2 = Graph.shape('activity.action', {left: 150, top: 340, label: 'Approval'});

            s1.render(paper);
            s2.render(paper);

            s1.connect(s2);

            ///////// examples /////////
            /*
            var s1 = Graph.shape('activity.action', {left: 300, top: 120, label: 'Business Process'});
            var s2 = Graph.shape('activity.action', {left: 150, top: 340, label: 'Approval'});
            var s3 = Graph.shape('activity.action', {left: 300, top: 450});
            var s4 = Graph.shape('activity.action', {left: 500, top: 120});
            var s5 = Graph.shape('activity.start', {left: 1200, top: 200});
            var s6 = Graph.shape('activity.lane', {left: 100, top: 100, label: 'Administrator'});
            var s7 = Graph.shape('activity.router', {left: 580, top: 430});
            var s8 = Graph.shape('activity.final', {left: 600, top: 640});

            s1.render(paper);
            s2.render(paper);
            s3.render(paper);
            s4.render(paper);
            s5.render(paper);
            s6.render(paper);
            s7.render(paper);
            s8.render(paper);

            var s9 = s6.addSiblingBellow({label: 'Project Manager'});
            var s10 = s9.addSiblingBellow();

            s6.addChild([s1, s2, s4]);
            s9.addChild([s3]);
            s10.addChild([s8]);

            s1.connect(s2, {
                label: "Indonesia\nRaya\nMerdeka",
                labelDistance: .14
            });

            var l = s1.connect(s3, {
                label: 'Indonesia Merdeka',
                labelDistance: .1
            });

            s2.connect(s4);*/

        }
    }



}());
