module.exports = function (grunt) {

    var matchdep = require('matchdep'); // dependencies from package
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        distdir: 'dist',
		karma: {
			unit: {
				configFile: 'karma.conf.js',
				runnerPort: 9999,
				browsers: ['Chrome', 'Firefox']
			}
		},
        concat: {
            options: {
                separator: '\n//End of file\n'
            },
            dev: {
                src: [
                    'src/**/*.js'
                ],
                dest: '<%= distdir %>/ng-scrolling-table.js'
            }
        },
        uglify: {
            production: {
                files: {
                    '<%= distdir %>/ng-scrolling-table.min.js': ['src/**/*.js']
                }
            }
        },
        clean: ["<%= distdir %>"]
    });
    matchdep.filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.registerTask('test', ['karma:unit']);
    grunt.registerTask('all', ['get-dependencies', 'karma:unit']);

    grunt.registerTask('get-dependencies', 'Install js packages listed in bower.json',
        function() {
            var bower = require('bower');
            var done = this.async();

            bower.commands.install()
            .on('data', function(data){
                grunt.log.write(data);
            })
            .on('error', function(data){
                grunt.log.write(data);
                done(false);
            })
            .on('end', function (data) {
                done();
            });
        }
    );

};
