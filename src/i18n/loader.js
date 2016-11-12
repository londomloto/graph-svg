
(function(){

    var isLocal = /file/.test(location.protocol);
    var i18n;

    if (isLocal) {
        i18n = {
            translate: function(message) {
                return {
                    fetch: function() {
                        return message;
                    }
                };
            }
        };
    } else {
        
        $.ajax({
            url: Graph.config.base + 'i18n/languages/' + Graph.config.locale + '.json',
            type: 'GET',
            dataType: 'json',
            async: false
        })
        .done(function(json){
            var data = {
                graph: {
                    '': {
                        domain: 'graph',
                        lang: Graph.config.locale,
                        plural_forms: 'nplurals=2; plural=(n != 1)'
                    }
                }
            };

            _.assign(data.graph, json);
            
            i18n = new Jed({
                domain: 'graph',
                locale_data: data
            });
            
        });
        
    }

    Graph._ = function(message) {
        return i18n.translate(message).fetch();
    };

}());