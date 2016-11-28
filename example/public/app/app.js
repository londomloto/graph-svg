
Graph(function(){

    var app, diagram, pallet, paper;

    pallet = Graph.pallet('activity');
    pallet.render('[data-ui-pallet]');

    paper = Graph.paper();
    paper.addPallet(pallet);

    paper.on({
        activatetool: function(e) {
            $('[data-tool=' + e.name + ']').addClass('active');
        },
        deactivatetool: function(e) {
            $('[data-tool=' + e.name + ']').removeClass('active');
        }
    });

    paper.render('[data-ui-paper]');

    // example
    var s1 = Graph.shape('activity.action', {left: 300, top: 100});
    var s2 = Graph.shape('activity.action', {left: 100, top: 300});
    var s3 = Graph.shape('activity.action', {left: 300, top: 400});
    var s4 = Graph.shape('activity.action', {left: 500, top: 100});
    var s5 = Graph.shape('activity.start', {left: 600, top: 300});
    var s6 = Graph.shape('activity.lane', {left: 100, top: 100});
    var s7 = Graph.shape('activity.router', {left: 500, top: 400});

    s1.render(paper);
    s2.render(paper);
    s3.render(paper);
    s4.render(paper);
    s5.render(paper);
    s6.render(paper);
    s7.render(paper);


    // setup toolbar
    $('[data-click]').on('click', function(e){
        var el = $(this),
            fn = el.data('click');

        if (fn) {
            var explode = /([a-zA-Z]+)\s?\((.*)\)/g.exec(fn);
            if (explode) {
                var prop = explode[1],
                    args = explode[2].split(/,/);

                args = args.map(function(a){
                    return a.replace(/\'/g, '');
                });

                if (app[prop]) {
                    app[prop].apply(app[prop], args);
                }
            }
        }

        e.preventDefault();
    });

    app = {
        trash: function() {
            paper.removeSelection();
        },
        export: function() {
            paper.saveAsImage('example.png');
        },
        config: function() {

        },
        toggleTool: function(name) {
            paper.tool().toggle(name);
        },
        createDiagram: function() {
            var context = '#create-diagram';
            var name = $('[name=diagram_name]', context).val(),
                desc = $('[name=diagram_desc]', context).val();

            var diagram = paper.diagram('activity', {
                name: name,
                desc: desc
            });

            app.hideModal('#create-diagram');
        },
        updateDiagram: function() {
            $.ajax({
                url: '../server/index.php?action=update'
            })
        },
        showModal: function(selector) {
            $(selector).modal();
        },
        hideModal: function(selector) {
            $(selector).modal('hide');
        }
    };

});