
var gulp = require('gulp'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    pump = require('pump');

// minification
gulp.task('build', function(cb){
    pump([
        gulp.src([
            
            '../src/poly.js',
            '../src/core.js',
            '../src/util.js',

            '../src/lang/class.js',
            '../src/lang/error.js',
            '../src/lang/event.js',
            '../src/lang/point.js',
            '../src/lang/line.js',
            '../src/lang/curve.js',
            '../src/lang/bbox.js',
            '../src/lang/path.js',
            '../src/lang/matrix.js',

            '../src/collection/point.js',
            '../src/collection/vector.js',
            '../src/collection/shape.js',
            '../src/collection/tree.js',
            '../src/collection/link.js',

            '../src/dom/element.js',

            '../src/svg/vector.js',
            '../src/svg/ellipse.js',
            '../src/svg/circle.js',
            '../src/svg/rect.js',
            '../src/svg/path.js',
            '../src/svg/polyline.js',
            '../src/svg/polygon.js',
            '../src/svg/group.js',
            '../src/svg/text.js',
            '../src/svg/image.js',
            '../src/svg/line.js',
            '../src/svg/paper.js',

            '../src/registry/vector.js',
            '../src/registry/link.js',
            '../src/registry/shape.js',
            '../src/registry/pallet.js',

            '../src/layout/layout.js',
            
            '../src/router/router.js',
            '../src/router/directed.js',
            '../src/router/orthogonal.js',

            '../src/link/link.js',
            '../src/link/directed.js',
            '../src/link/orthogonal.js',
            
            '../src/util/sweeplink.js',

            '../src/plugin/plugin.js',
            '../src/plugin/manager.js',
            '../src/plugin/definer.js',
            '../src/plugin/reactor.js',
            '../src/plugin/transformer.js',
            '../src/plugin/animator.js',
            '../src/plugin/resizer.js',
            '../src/plugin/rotator.js',
            '../src/plugin/collector.js',
            '../src/plugin/dragger.js',
            '../src/plugin/dropper.js',
            '../src/plugin/network.js',
            '../src/plugin/history.js',
            '../src/plugin/panzoom.js',
            '../src/plugin/linker.js',
            '../src/plugin/toolmanager.js',
            '../src/plugin/pencil.js',
            '../src/plugin/editor.js',
            '../src/plugin/snapper.js',
            '../src/plugin/toolpad.js',
            '../src/plugin/clipper.js',
            
            '../src/shape/shape.js',
            '../src/shape/activity/start.js',
            '../src/shape/activity/final.js',
            '../src/shape/activity/action.js',
            '../src/shape/activity/router.js',
            '../src/shape/activity/fork.js',
            '../src/shape/activity/join.js',
            '../src/shape/activity/lane.js',
            '../src/shape/activity/pool.js',
            '../src/shape/common/label.js',

            '../src/data/exporter.js',
            '../src/data/importer.js',

            '../src/diagram/manager.js',
            '../src/diagram/parser.js',
            '../src/diagram/pallet/activity.js',
            '../src/diagram/type/Diagram.js',
            '../src/diagram/type/Activity.js',
            
            '../src/popup/dialog.js',

            '../src/init.js'
            
        ]),
        sourcemaps.init(),
        concat('graph.js'),
        gulp.dest('../dist'),
        rename('graph.min.js'),
        uglify({
            output: {
                max_line_len: 3000
            }
        }),
        sourcemaps.write('../dist/'),
        gulp.dest('../dist')
    ], cb);
});