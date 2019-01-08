var gulp = require('gulp'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    uglify = require('gulp-uglify'),
    minifyCss = require('gulp-clean-css');

gulp.task('html', function () {
    return gulp.src('index.html')
        .pipe(useref())
        // .pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', minifyCss()))
        .pipe(gulp.dest('dist'));
});

gulp.task('img', function () {
   return gulp.src(['img/**/*'], {base:"."}).pipe(gulp.dest('dist'));
});

gulp.task('demo', function () {
    gulp.watch('js/**/*.js', gulp.series('html', 'img'));
    gulp.watch('css/**/*.css', gulp.series('html', 'img'))
    gulp.watch('index.html', gulp.series('html', 'img'));
})