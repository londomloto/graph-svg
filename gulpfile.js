
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
            'src/core.js',

            'src/lang/class.js',
            'src/lang/matrix.js',
            'src/lang/point.js',
            'src/lang/line.js',
            'src/lang/path.js',
            'src/lang/bbox.js',
            'src/lang/curve.js',

            'src/dom/element.js',

            'src/svg/vector.js',
            'src/svg/paper.js',
            'src/svg/circle.js',
            'src/svg/ellipse.js',
            'src/svg/group.js',
            'src/svg/image.js',
            'src/svg/line.js',
            'src/svg/path.js',
            'src/svg/polyline.js',
            'src/svg/polygon.js',
            'src/svg/rect.js',
            'src/svg/text.js',

            'src/collection/vector.js',
            
            'src/router/router.js',
            'src/router/manhattan.js',
            'src/router/orthogonal.js',

            'src/util/**/*.js',
            'src/plugin/**/*.js',
            'src/shape/base.js',
            'src/shape/page.js',
            'src/shape/common/**/*.js',
            'src/shape/activity/**/*.js',

            'src/collection/shape.js'
        ]),
        sourcemaps.init(),
        concat('graph.js'),
        gulp.dest('dist'),
        rename('graph.min.js'),
        uglify({
            output: {
                max_line_len: 1000
            }
        }),
        sourcemaps.write('../dist/'),
        gulp.dest('dist')
    ], cb);
});