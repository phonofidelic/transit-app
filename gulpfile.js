/*eslint-env node*/
var gulp = require('gulp'),
	fs = require('fs'),
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
	inject = require('gulp-inject'),
	flatten = require('gulp-flatten'),
	rev = require('gulp-rev'),
	revReplace = require('gulp-rev-replace'),
	gulpSw = require('gulp-serviceworker'),
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

gulp.task('build-sync', function() {
	browserSync.init({
		server: {
			baseDir: './dist'
		}
	});
	browserSync.stream();
});

/**
 * clean
**/
gulp.task('clean-dist', function() {
	// from http://www.geedew.com/remove-a-directory-that-is-not-empty-in-nodejs/
	var deleteFolderRecursive = function(path) {
	  if( fs.existsSync(path) ) {
	    fs.readdirSync(path).forEach(function(file,index){
	      var curPath = path + "/" + file;
	      if(fs.lstatSync(curPath).isDirectory()) { // recurse
	        deleteFolderRecursive(curPath);
	      } else { // delete file
	        fs.unlinkSync(curPath);
	      }
	    });
    fs.rmdirSync(path);
  }
};
	deleteFolderRecursive('dist');
});

/**
 * markup
*/
gulp.task('index', function() {
	gulp.src('src/index.html')
	.pipe(htmlReplace({
		// 'headScripts': [
		// 	'lib/jquery.min.js',
		// 	'lib/angular.min.js',
		// 	'lib/angular-route.min.js',
		// 	'lib/bootstrap.min.js',
		// 	'lib/idb.js',
		// 	'lib/leaflet.js',
		// 	'lib/tangram.min.js',
		// 	'lib/leaflet-routing-machine.min.js',
		// 	'lib/leaflet-geocoder-mapzen.js',
		// 	'lib/L.Control.Locate.min.js'
		// ],
		'headScripts': 'lib/deps.min.js',
		'tangram': 'lib/tangram.min.js',
		'appScripts': 'app/app.min.js',
		'depCss': 'css/deps.min.css',
		'mainCss': 'css/main.min.css'
	}))
	.pipe(gulp.dest('dist'))
	.pipe(browserSync.stream());
});

/**
 * deps
**/
gulp.task('deps', function() {
	gulp.src(['src/lib/angular/angular.min.js', 		  
			  'src/lib/leaflet/dist/leaflet.js', 
			  'src/lib/leaflet-geocoder-mapzen/src/leaflet-geocoder-mapzen.js', 
			  'src/lib/indexeddb-promised/lib/idb.js',
			  'src/lib/**/*.min.js'])
	.pipe(flatten())
	.pipe(concat('deps.min.js'))
	.pipe(gulp.dest('dist/lib'));
});
// depsStandalone
gulp.task('depsStandalone', function() {
	gulp.src(['src/lib/tangram/dist/tangram.min.js'])
	.pipe(gulp.dest('dist/lib'));
})

/*
 * assets
*/
gulp.task('assets', function() {
	gulp.src('src/lib/leaflet-geocoder-mapzen/dist/images/search@2x.png')
	.pipe(gulp.dest('dist/leaflet-geocoder-mapzen/src/images'));
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
	.pipe(gulp.dest('src/css'))
	.pipe(minCss())
	.pipe(rename({
		extname: '.min.css'
	}))
	.pipe(gulp.dest('dist/css'))
	// .pipe(rev())
	// .pipe(gulp.dest('dist/css'))
	// .pipe(rev.manifest('main.manifest.json'))
	// .pipe(gulp.dest('dist/css'))
	.pipe(browserSync.stream());
});
gulp.task('watch-css', function() {
	gulp.watch('src/assets/sass/**/*.scss', ['styles']);	
});

/*
 * depCss
*/
gulp.task('depCss', function() {
	gulp.src([
		'src/lib/bootstrap/dist/css/bootstrap.min.css', 
		'src/lib/leaflet/dist/leaflet.css',
		'src/lib/leaflet-geocoder-mapzen/src/leaflet-geocoder-mapzen.css',
		'src/lib/leaflet.locatecontrol/dist/L.Control.Locate.css'
	])
	.pipe(minCss())
	.pipe(concatCss('deps.min.css'))
	.pipe(gulp.dest('dist/css'));
});

/*
 * templates
*/
gulp.task('templates', function() {
	gulp.src('src/app/templates/**/*.html')
	.pipe(gulp.dest('dist/app/templates'))
	// .pipe(rev())
	// .pipe(gulp.dest('dist/app/templates'))
	// .pipe(rev.manifest('templates.manifest.json'))
	// .pipe(gulp.dest('dist/app/templates'));
});

/**
 * app
*/
gulp.task('app', function() {
	return gulp.src(['src/app/app.module.js', 'src/app/app.config.js', 'src/app/**/*.js'])
	.pipe(concat('app.min.js'))
	.pipe(uglify())
	.pipe(gulp.dest('dist/app'))
	// .pipe(rev())
	// .pipe(gulp.dest('dist/app'))
	// .pipe(rev.manifest('app.manifest.json'))
	// .pipe(gulp.dest('dist/app'))
	.pipe(browserSync.stream());
});
gulp.task('watch-app', function() {
	gulp.watch('src/app/**/*.js', ['app']);
});

/*
 * serviceWorker
*/
gulp.task('serviceWorker', function() {
	return gulp.src('src/sw.js')
	// .pipe(uglify())
	.pipe(gulp.dest('dist'))
	.pipe(browserSync.stream());
});
gulp.task('watch:serviceWorker', ['serviceWorker'], function(done) {
	browserSync.reload();
	done();
});

// try rev task
gulp.task('revision', ['styles', 'app', 'templates'], function() {
	return gulp.src(['dist/css/**/*.css', 'dist/app/**/*.js', 'dist/app/**/*.html'])
	.pipe(rev())
	.pipe(gulp.dest('dist/assets')) // need multiple dests
	.pipe(rev.manifest())
	.pipe(gulp.dest('dist/assets'))
});
gulp.task('revreplace', ['revision'], function() {
	var manifest = gulp.src('./' + 'dist/assets' + '/rev.manifest.json');

	return gulp.src('dist' + '/index.html')
	.pipe(revReplace({manifest: manifest}))
	.pipe(gulp.dest('dist'));
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
gulp.task('build', ['clean-dist', 'styles', 'depCss', 'deps', 'depsStandalone', 'app', 'templates', 'assets', 'index', 'serviceWorker', 'revreplace', 'build-sync'], function() {
	gulp.watch(['src/assets/sass/**/*.scss'], ['styles', browserSync.reload]);
	gulp.watch(['src/app/**/*.html'], ['templates', browserSync.reload]);
	gulp.watch(['src/lib/**/*'], ['deps', 'depCss', browserSync.reload]);
	gulp.watch(['src/app/**/*.js'], ['app', browserSync.reload]);
	gulp.watch(['src/sw.js'], ['serviceWorker', browserSync.reload]);
});

gulp.task('default', ['watch-app', 'build-sync']);

