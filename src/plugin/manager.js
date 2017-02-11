
(function(){

    var Manager = Graph.plugin.Manager = function() {
        this.installed = {};
    };

    Manager.prototype.get = function(plugin) {
        var installed = this.installed[plugin];

        return {

            plugin: function() {
                if (installed) {
                    var target = Graph.registry.vector.get(installed.target);
                    return target[installed.handler]();
                }
                return null;
            },

            component: function() {
                if (installed) {
                    return Graph.registry.vector.get(installed.target);
                }
                return null;
            }
        };
    };

    Manager.prototype.install = function(plugin, target, options) {
        var handler = this.getPluginHandler(plugin);

        if (handler) {
            options = options || {};
            target[handler](options);

            this.installed[plugin] = {
                handler: handler,
                target: target.guid()
            };
        }
    };

    Manager.prototype.uninstall = function(plugin) {
        var installed = this.installed[plugin];
        if (installed) {
            var target = Graph.registry.vector.get(installed.target);
            target[handler]({destroy: true});
            
            delete this.installed[plugin];
        }
    };

    Manager.prototype.getPluginHandler = function(plugin) {
        var maps = {
            'network': 'connectable',
            'resizer': 'resizable',
            'snapper': 'snappable',
            'dragger': 'draggable',
            'editor': 'editable',
            'rotator': 'rotatable'
        };

        return maps[plugin];
    };

}());
