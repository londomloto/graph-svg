
/** --------------------------------CONFIG---------------------------------- */

Graph.setup({
    base: '../'
});

/** --------------------------------START---------------------------------- */

Graph(function(){

    /** --------------------------------STENCIL--------------------------------- */
    
    $('.e-stencil-item').on('click', function(e){
        var shape = $(e.currentTarget).data('shape');
        if (shape) {
            shape = paper.draw(shape);
        }
    });

    /** --------------------------------CANVAS--------------------------------- */

    var paper = Graph.paper(2000, 2000);

    paper.on({
        activatetool: function(e) {
            $('[data-tool=' + e.name + ']').addClass('active');
        },
        deactivatetool: function(e) {
            $('[data-tool=' + e.name + ']').removeClass('active');
        }
    });

    paper.render('#page0');

    var s1 = Graph.shape('activity.action', {left: 300, top: 100});
    var s2 = Graph.shape('activity.action', {left: 100, top: 300});
    var s3 = Graph.shape('activity.action', {left: 300, top: 400});
    var s4 = Graph.shape('activity.action', {left: 500, top: 100});

    s1.render(paper);
    s2.render(paper);
    s3.render(paper);
    s4.render(paper);

    var L1 = paper.connect(s1, s2);
    var L2 = paper.connect(s1, s3);
    var L3 = paper.connect(s2, s4);

    L1.label('indonesia');

    var v1 = paper.rect(700, 100, 100, 100);
    v1.draggable({ghost: true});
    v1.resizable();
    v1.snappable();
    v1.animable();
    // v1.rotate(45).commit();
    
    /** -----------------------------EXAMPLE DATA------------------------------ */

    

    /**
     * Comming from database
     */
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

    /** -----------------------EASYFLOW SKELETON----------------------- */
    
    $('[data-tool]').on('click', function(e){
        e.preventDefault();
        var tool = $(this).data('tool');
        tool && paper.tool().toggle(tool);
    });

    $('[data-util]').on('click', function(e){
        e.preventDefault();
        var util = $(this).data('util');

        switch(util) {
            case 'export':

                paper.saveAsImage('example.png');

                break;

            case 'diagram':

                var popup = new Graph.popup.Dialog({
                    baseClass: 'e-dialog'
                });
                
                popup.content(Graph.$('#create-dialog').html()).open();
                
                popup.on('close', function(e){
                    popup.destroy();
                    popup = null;
                });

                popup.component().on('click', function(e){
                    console.log(e);
                });

                break;

            case 'save':
                
                paper.save();

                break;
        }

    });
    
});