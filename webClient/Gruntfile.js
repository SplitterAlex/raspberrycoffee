// Generated on 2015-02-23 using generator-angular 0.11.1
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Configurable paths for the application
    var appConfig = {
        app: require('./bower.json').appPath || 'app',
        dist: '../webServer/app'
    };

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        yeoman: appConfig,

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: {
                src: [
          'Gruntfile.js',
          '<%= yeoman.app %>/scripts/**/*.js'
        ]
            }
        },

        watch: {
            js: {
                files: ['<%= yeoman.app %>/scripts/**'],
                tasks: ['copy:scripts'],
                options: {
                    spawn: false,
                }
            },
            styles: {
                files: ['<%= yeoman.app %>/styles/{,*/}*.css'],
                tasks: ['copy:styles'],
                options: {
                    spawn: false,
                }
            },
            html: {
                files: ['<%= yeoman.app %>/views/**'],
                tasks: ['copy:html'],
                options: {
                    spawn: false
                }
            },
            index: {
                files: ['<%= yeoman.app %>/index.html'],
                tasks: ['dev'],
                options: {
                    spawn: false   
                }
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
        },

        // Empties folders to start fresh
        clean: {
            options: {
                force: true
            },
            dist: {
                files: [{
                    dot: true,
                    src: [
            '.tmp',
            '<%= yeoman.dist %>/{,*/}*',
            '!<%= yeoman.dist %>/.git{,*/}*'
          ]
        }]
            },
            server: '.tmp'
        },

        // Add vendor prefixed styles
        autoprefixer: {
            options: {
                browsers: ['last 1 version']
            },
            server: {
                options: {
                    map: true,
                },
                files: [{
                    expand: true,
                    cwd: '.tmp/styles/',
                    src: '{,*/}*.css',
                    dest: '.tmp/styles/'
                }]
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: '.tmp/styles/',
                    src: '{,*/}*.css',
                    dest: '.tmp/styles/'
                }]
            }
        },

        // Automatically inject Bower components into the app
        wiredep: {
            app: {
                src: ['<%= yeoman.app %>/index.html'],
                ignorePath: /\.\.\//
            }
        },

        // Renames files for browser caching purposes
        filerev: {
            dist: {
                src: [
          '<%= yeoman.dist %>/scripts/{,*/}*.js',
          '<%= yeoman.dist %>/styles/{,*/}*.css',
          '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
          '<%= yeoman.dist %>/styles/fonts/*'
        ]
            }
        },

        // Reads HTML for usemin blocks to enable smart builds that automatically
        // concat, minify and revision files. Creates configurations in memory so
        // additional tasks can operate on them
        useminPrepare: {
            html: '<%= yeoman.app %>/index.html',
            options: {
                dest: '<%= yeoman.dist %>',
                flow: {
                    html: {
                        steps: {
                            js: ['concat', 'uglifyjs'],
                            css: ['cssmin']
                        },
                        post: {}
                    }
                }
            }
        },

        // Performs rewrites based on filerev and the useminPrepare configuration
        usemin: {
            html: ['<%= yeoman.dist %>/**/*.html'],
            css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
            options: {
                assetsDirs: [
                    '<%= yeoman.dist %>',
                    '<%= yeoman.dist %>/images',
                    '<%= yeoman.dist %>/styles'
                ],
                blockReplacements: {
                    dev: function (block) {
                        return '<script src="' + block.dest + '"></script>';   
                    }
                }
            }
        },

        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.{png,jpg,jpeg,gif}',
                    dest: '<%= yeoman.dist %>/images'
        }]
            }
        },

        svgmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.svg',
                    dest: '<%= yeoman.dist %>/images'
        }]
            }
        },

        htmlmin: {
            dist: {
                options: {
                    collapseWhitespace: true,
                    conservativeCollapse: true,
                    collapseBooleanAttributes: true,
                    removeCommentsFromCDATA: true,
                    removeOptionalTags: true
                },
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.dist %>',
                    src: ['*.html', 'views/**/*.html'],
                    dest: '<%= yeoman.dist %>'
        }]
            }
        },

        // ng-annotate tries to make the code safe for minification automatically
        // by using the Angular long form for dependency injection.
        ngAnnotate: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '.tmp/concat/scripts',
                    src: '*.js',
                    dest: '.tmp/concat/scripts'
                }]
            }
        },

        // Replace Google CDN references
        cdnify: {
            dist: {
                html: ['<%= yeoman.dist %>/*.html']
            }
        },

        // Copies remaining files to places other tasks can use
        copy: {
            dev: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '*.{ico,png,txt}',
                        '.htaccess',
                        '*.html',
                        'views/**',
                        'images/**',
                        'styles/fonts/{,*/}*.*',
                        'scripts/**',
                        'styles/**/*.css'
                    ]
                }, {
                    expand: true,
                    cwd: '.tmp/images',
                    dest: '<%= yeoman.dist %>/images',
                    src: ['generated/*']
                }, {
                    expand: true,
                    cwd: 'bower_components/bootstrap/dist',
                    src: 'fonts/*',
                    dest: '<%= yeoman.dist %>/lib'
                }, {
                    expand: true,
                    cwd: 'bower_components/font-awesome',
                    src: 'fonts/*',
                    dest: '<%= yeoman.dist %>/lib'
                }]
            },
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '*.{ico,png,txt}',
                        '.htaccess',
                        '*.html',
                        'views/**/*.html',
                        'images/{,*/}*.{webp}',
                        'styles/fonts/{,*/}*.*'
                    ]
                }, {
                    expand: true,
                    cwd: '.tmp/images',
                    dest: '<%= yeoman.dist %>/images',
                    src: ['generated/*']
                }, {
                    expand: true,
                    cwd: 'bower_components/bootstrap/dist',
                    src: 'fonts/*',
                    dest: '<%= yeoman.dist %>'
                }, {
                    expand: true,
                    cwd: 'bower_components/font-awesome',
                    src: 'fonts/*',
                    dest: '<%= yeoman.dist %>'
                }]
            },
            styles: {
                expand: true,
                cwd: '<%= yeoman.app %>/styles',
                dest: '.tmp/styles/',
                src: '{,*/}*.css'
            },
            lib: {
                expand: true,
                cwd: '<%= yeoman.app %>',
                dest: '<%= yeoman.dist %>',
                src: [ 'lib/**/*.*' ]
            },
            scripts: {
                expand: true,
                cwd: '<%= yeoman.app %>',
                dest: '<%= yeoman.dist %>',
                src: [ 'scripts/**/*.js' ]
            },
            html: {
                expand: true,
                cwd: '<%= yeoman.app %>',
                dest: '<%= yeoman.dist %>',
                src: [ 'views/**/*.html' ]
            }
        },

        // Run some tasks in parallel to speed up the build process
        concurrent: {
            dist: [
                'copy:styles',
                'imagemin',
                'svgmin'
            ]
        },
        /*
        uglify: {
            options: {
                mangle: false
            }
        },
        */
        //add new bower_components here, and don't forget to include them in the index.html file
        bowercopy: {
            options: {
                clean: false   
            },
            styles: {
                options: {
                    destPrefix: '<%= yeoman.app %>/lib/css'   
                },
                files: {
                    'bootstrap.css': 'bootstrap/dist/css/bootstrap.css',
                    'font-awesome.css': 'font-awesome/css/font-awesome.css',
                    'metisMenu.css': 'metisMenu/dist/metisMenu.css',
                    'angular-chart.css': 'angular-chart.js/dist/angular-chart.css',
                    'bootstrap-switch.css': 'bootstrap-switch/dist/css/bootstrap3/bootstrap-switch.css',
                    'daterangepicker-bs3.css': 'bootstrap-daterangepicker/daterangepicker-bs3.css',
                    'datetimepicker.css': 'angular-bootstrap-datetimepicker/src/css/datetimepicker.css',
                }
            },
            scripts: {
                options: {
                    destPrefix: '<%= yeoman.app %>/lib/js' 
                },
                files: {
                    'jquery.js': 'jquery/dist/jquery.js',
                    'angular.js': 'angular/angular.js',
                    'bootstrap.js': 'bootstrap/dist/js/bootstrap.js',
                    'angular-animate.js': 'angular-animate/angular-animate.js',
                    'angular-cookies.js': 'angular-cookies/angular-cookies.js',
                    'angular-resource.js': 'angular-resource/angular-resource.js',
                    'angular-route.js': 'angular-route/angular-route.js',
                    'angular-sanitize.js': 'angular-sanitize/angular-sanitize.js',
                    'angular-touch.js': 'angular-touch/angular-touch.js',
                    'metisMenu.js': 'metisMenu/dist/metisMenu.js',
                    'Chart.js': 'Chart.js/Chart.js',
                    'angular-chart.js': 'angular-chart.js/dist/angular-chart.js',
                    'bootstrap-switch.js': 'bootstrap-switch/dist/js/bootstrap-switch.js',
                    'angular-bootstrap-switch.js': 'angular-bootstrap-switch/dist/angular-bootstrap-switch.js',
                    'moment.js': 'moment/moment.js',
                    'daterangepicker.js': 'bootstrap-daterangepicker/daterangepicker.js',
                    'angular-daterangepicker.js': 'angular-daterangepicker/js/angular-daterangepicker.js',
                    'datetimepicker.js': 'angular-bootstrap-datetimepicker/src/js/datetimepicker.js',
                    'angular-route-segment.js': 'angular-route-segment/build/angular-route-segment.js',
                }
            }
            
        }

    });


grunt.registerTask('default', 'Production task', function () {
    grunt.task.run([
        'newer:jshint',
        'clean:dist',
        'bowercopy',
        //'wiredep',
        'useminPrepare',
        'concurrent:dist',
        'autoprefixer',
        'concat',
        'ngAnnotate',
        'copy:dist',
        'cdnify',
        'cssmin',
        'uglify',
        'filerev',
        'usemin',
        'htmlmin'
    ]);
});
    
grunt.registerTask('dev', 'Development task', function () {
    grunt.task.run([
        'newer:jshint',
        'clean:dist',
        'bowercopy',
        'copy:styles',
        'copy:lib',
        'copy:dev',
    ]);
});
    
grunt.registerTask('dev watch', 'Development task', function () {
    grunt.task.run([
        'newer:jshint',
        'clean:dist',
        'bowercopy',
        'copy:styles',
        'copy:lib',
        'copy:dev',
    ]);
});
    
};

