
(function(){

    angular
        .module('app', [])
        .controller('AppController', AppController)
        .service('modalManager', modalManager)
        .service('toolManager', toolManager)
        .directive('uitool', uitool)
        .directive('uimodal', uimodal)
        .directive('uipaper', uipaper)
        .directive('uipallet', uipallet);

    function AppController($scope, $http, modalManager) {

        $scope.diagrams = [];
        $scope.paper = null;
        $scope.pallet = null;

        $scope.loadDiagrams = function() {
            $http.get('../server/load').then(function(response){
                $scope.diagrams = response.data.data;
            });
        };

        $scope.open = function() {
            modalManager.open('open-diagram').then(function(){
                $scope.loadDiagrams();
            });
        };

        $scope.create = function() {
            modalManager.open('create-diagram');
        };

        $scope.trash = function() {
            if ($scope.paper) {
                $scope.paper.removeSelection();
            }
        };

        $scope.export = function() {
            if ($scope.paper) {
                $scope.paper.saveAsImage('example.png');
            }
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
            modalManager.hide(name);
        };

    }

    function modalManager($q) {
        this.modals = {};

        this.add = function(name, instance) {
            this.modals[name] = {
                instance: instance,
                onshow: null,
                onhide: null
            };
        };

        this.fire = function(name, event) {
            var modal = this.modals[name],
                promise = 'on' + event;
            if (modal && modal[promise]) {
                modal[promise].resolve();
            }
        };

        this.open = function(name) {
            var def = $q.defer(),
                modal = this.modals[name];

            if (modal) {
                modal.onshow = def;
                modal.instance.show();
            }

            return def.promise;
        };

        this.hide = function(name) {
            var modal = this.modals[name];
            if (modal) {
                modal.instance.hide();
                modal.onshow = null;
                modal.onhide = null;
            }
        };
    }

    function toolManager() {
        this.tools = {};

        this.add = function(name, tool) {
            this.tools[name] = tool;
        };

        this.activate = function(name) {
            for (var prop in this.tools) {
                if (this.tools.hasOwnProperty(prop)) {
                    this.tools[prop].deactivate();
                }
            }
            this.tools[name] && this.tools[name].activate();
        };

        this.deactivate = function(name) {
            this.tools[name] && this.tools[name].deactivate();
        };
    }

    function uitool(toolManager) {
        var directive = {
            restrict: 'A',
            link: link,
            scope: true
        };
        
        return directive;

        function link(scope, element, attrs) {
            var name = attrs.uitool;
            toolManager.add(name, scope);

            scope.activate = function() {
                element.addClass('active');
            };

            scope.deactivate = function() {
                element.removeClass('active');
            };
        }
    }

    function uimodal(modalManager) {
        var directive = {
            restrict: 'A',
            link: link
        };
        
        return directive;

        function link(scope, element, attrs) {
            var name = attrs.uimodal,
                instance = element.modal('hide').data('bs.modal');

            modalManager.add(name, instance);

            element.on('show.bs.modal', function(e){
                modalManager.fire(name, 'show');
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

    function uipaper(toolManager) {
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
                    toolManager.activate(e.name);  
                },
                deactivatetool: function(e) {
                    toolManager.deactivate(e.name);
                }
            });

            paper.render(element);

            ///////// examples /////////
            
            var s1 = Graph.shape('activity.action', {left: 300, top: 100});
            var s2 = Graph.shape('activity.action', {left: 100, top: 300});
            var s3 = Graph.shape('activity.action', {left: 300, top: 400});
            var s4 = Graph.shape('activity.action', {left: 500, top: 100});
            var s5 = Graph.shape('activity.start', {left: 600, top: 300});
            var s6 = Graph.shape('activity.lane', {left: 100, top: 100});
            var s7 = Graph.shape('activity.router', {left: 500, top: 400});
            var s8 = Graph.shape('activity.final', {left: 300, top: 400});

            s1.render(paper);
            
            s2.render(paper);
            s3.render(paper);
            s4.render(paper);
            s5.render(paper);
            s6.render(paper);
            s7.render(paper);
            s8.render(paper);

            var s9 = s6.addSiblingBellow();
            s9.height(100);
            var s10 = s9.addSiblingBellow();
        }
    }

    

}());