let gulp = require('gulp'), 
	tslint = require('gulp-tslint'),
	tsc = require('gulp-typescript');

gulp.task('lint', function() {
	return gulp.src([
		'source/**/**.ts',
		'test/**/**.test.ts'
	])
	.pipe(tslint({
		formatter: 'verbose',
		configuration: 'tslint.json'
	}))
	.pipe(tslint.report())
});

let tsProject = tsc.createProject('tsconfig.json');

gulp.task('build-app', function() {
    return gulp.src([
            'source/**/**.ts',
            'typings/main.d.ts/',
            'source/interfaces/interfaces.d.ts'
        ])
        .pipe(tsProject())
        .js.pipe(gulp.dest('build/'));
});