
Graph(function(){

    ///////////////////////////////////////////
    /// pallet
    ///////////////////////////////////////////
    
    var pallet = Graph.pallet('activity');
    pallet.render('#pallet');

    pallet.on({
        shapeclick: function(e) {
            console.log(e);
        }
    });

    ///////////////////////////////////////////
    /// CANVAS
    ///////////////////////////////////////////

    var paper = Graph.paper(2000, 2000);
    paper.addPallet(pallet);

    paper.on({
        activatetool: function(e) {
            $('[data-tool=' + e.name + ']', '.e-toolbar').addClass('active');
        },
        deactivatetool: function(e) {
            $('[data-tool=' + e.name + ']', '.e-toolbar').removeClass('active');
        }
    });

    paper.render('#page');

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

    /*var L1 = paper.connect(s1, s2);
    var L2 = paper.connect(s1, s3);
    var L3 = paper.connect(s2, s4);

    L1.label('indonesia');*/

    var v1 = paper.rect(700, 100, 100, 100);
    v1.rotate(45).commit();
    v1.draggable({ghost: true});
    v1.resizable();
    v1.snappable();
    v1.connectable();

    var v2 = paper.rect(700, 300, 100, 100);
    
    v2.draggable({ghost: true});
    v2.resizable();
    v2.snappable();

    v2.connectable();
    
    // paper.connect(v1, v2);
    

    ///////////////////////////////////////////
    /// EXAMPLE DATA
    ///////////////////////////////////////////

    var data = {

        flow: 'NBWO Flow',
        type: 'activity',

        shapes: [
            {
                type: 'activity.lane',
                data: { id: 1, parent: 0, label: 'Administrator', left: 50, top: 50 }
            },
            {
                type: 'activity.lane',
                data: { id: 2, parent: 0, label: 'Manager', left: 50, top: 250 }
            },
            {
                type: 'activity.start',
                data: { id: 3, parent: 1, label: 'Mulai', left: 100, top: 100 }
            },
            {
                type: 'activity.action', 
                data: { id: 4, parent: 1, label: 'Menjalankan Proses', left: 250, top: 100 }
            },
            {
                type: 'activity.action', 
                data: { id: 5, parent: 2, label: 'Approval', left: 250, top: 300 }
            },
            {
                type: 'activity.final', 
                data: { id: 6, parent: 2, label: 'Stop', left: 500, top: 300 }
            }
        ],

        // rows
        links: [
            {source: 3, target: 4},
            {source: 4, target: 5},
            {source: 5, target: 6}
        ]
    };

    // paper.parse(data);

    ///////////////////////////////////////////
    /// JQUERY EASYFLOW
    ///////////////////////////////////////////
    
    $('[data-tool]', '.e-toolbar').on('click', function(e){
        e.preventDefault();
        var tool = $(this).data('tool');
        tool && paper.tool().toggle(tool);
    });

    $('[data-util]', '.e-toolbar').on('click', function(e){
        e.preventDefault();
        var util = $(this).data('util');

        switch(util) {
            case 'trash':
                
                paper.removeSelection();

                break;
            case 'export':

                paper.saveAsImage('example.png');

                break;

            case 'diagram':

                var popup = Graph.dialog('#create-dialog', {
                    buttons: [
                        {
                            element: '.btn-save',
                            onclick: function(e) {
                                // var data = {};
                                
                                // popup.element().find('input').each(function(index, input){
                                //     input = Graph.$(input);
                                //     data[input.attr('name')] = input.val();
                                //     input = null;
                                // });
                            }
                        },
                        {
                            element: '.btn-close',
                            onclick: function(e) {
                                popup.close();
                            }
                        }
                    ]
                });

                popup.on('close', function(){
                    popup = null;
                });

                popup.open();

                break;

            case 'save':
                
                paper.save();

                break;
        }

    });
    
});