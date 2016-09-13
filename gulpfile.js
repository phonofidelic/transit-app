/*eslint-env node*/
var gulp = require('gulp'),
	sass = require('gulp-sass'),
	autoprefixer = require('gulp-autoprefixer'),
	eslint = require('gulp-eslint'),
	jasmine = require('gulp-jasmine-phantom'),
	concat = require('gulp-concat'),
	concatCss = require('gulp-concat-css'),
	minCss = require('gulp-minify-css'),
	uglify = require('gulp-uglify'),
	htmlReplace = require('gulp-html-replace'),
	multiDest = require('gulp-multi-dest'),
	clean = require('gulp-clean'),
	rename = require('gulp-rename'),
	browserSync = require('browser-sync').create();

//  browser sync
gulp.task('dev-sync', function() {
	browserSync.init({
		server: {
			baseDir: './src'
		}
	});
	browserSync.stream();	
});

/**
 * clean
**/
gulp.task('clean-dist', function() {
	gulp.src('dist')
	.pipe(clean({force: true}));
});

/**
 * markup
*/
gulp.task('html', function() {
	gulp.src('src/**/*.html')
	.pipe(browserSync.stream())
});
gulp.task('watch-html', function() {
	gulp.watch('src/**/*.html', ['html']);
});

/**
 * deps
**/
gulp.task('deps', function() {
	gulp.src(['src/lib/**/*.min.js', 'src/lib/leaflet/dist/leaflet.js'])
	.pipe(gulp.dest('dist/lib'));
});

gulp.task('minifyDeps', function() {
	gulp.src(['src/lib/indexeddb-promised/lib/idb.js'])
	.pipe(uglify())
	.pipe(gulp.dest('dist/lib/indexeddb-promised/lib'));
});

/**
 * styles
*/
gulp.task('styles', function() {
	gulp.src('src/assets/sass/**/*.scss')
	.pipe(sass().on('error', sass.logError))
	.pipe(autoprefixer({
		browsers: ['last 3 versions']
	}))
	// TODO: switch to dist directory on build
	// .pipe(gulp.multiDest(['./src/css', './dist/css']));
	.pipe(gulp.dest('src/css'))
	.pipe(minCss())
	.pipe(rename({
		extname: '.min.css'
	}))
	.pipe(gulp.dest('dist/css/'))
	.pipe(browserSync.stream());
});
gulp.task('watch-css', function() {
	gulp.watch('src/assets/sass/**/*.scss', ['styles']);	
});

/**
 * app
*/
gulp.task('app', function() {
	gulp.src('src/app/**/*.js')
	.pipe(browserSync.stream())
});
gulp.task('watch-app', function() {
	gulp.watch('src/app/**/*.js', ['app']);
});

/**
 * js lint
*/
gulp.task('lint', function() {
	return gulp.src(['src/**/*.js', '!node_modules/**', '!bower_components/**', '!src/lib/**'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

// serve
gulp.task('serve', ['watch-html', 'watch-css', 'watch-app', 'dev-sync']);

// lint

// test 

// build
gulp.task('build', ['styles', 'deps', 'minifyDeps']);