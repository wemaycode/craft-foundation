module.exports = function(grunt) {

  /*
  Strict Mode is a new feature in ECMAScript 5 that allows you to 
  place a program, or a function, in a "strict" operating context. 
  This strict context prevents certain actions from being taken and 
  throws more exceptions.
  */
  //"use strict";

  // Load plugins as needed, using a "just in time" approach
  require('jit-grunt')(grunt, {
      replace: 'grunt-text-replace'
  });

  // Load plugins

  //grunt.loadNpmTasks('grunt-contrib-jshint');
  //grunt.loadNpmTasks("grunt-modernizr");
  //grunt.loadNpmTasks('grunt-browserify');

  // Project configuration.
  grunt.initConfig({

    /* #### VARIABLES #### */
    appPath: 'app/',
    sassPath: 'app/scss/',
    cssPath: 'app/css/',
    jsPath: 'app/js/',
	foundationjs: 'node_modules/foundation-sites/js',
    imgPath: 'app/img',
    imgFileTypes: 'gif,jpg,jpeg,png',
    docFileTypes: '.twig',
    distPath: 'dist/',


    /* #### TASK CONFIG #### */
    
    // Read data from package.json
    //pkg: grunt.file.readJSON('package.json'),


	// Modernizr
	modernizr: {		
		"crawl": false,
		"customTests": [],
		"dest": "<%= jsPath %>modernizr.js",
		"tests": [
			"touchevents"
		],
		"options": [
			"setClasses"
		],
		"uglify": false		
	},

    // Sass compiling
    sass: {
      options: {
        includePaths: [
          'node_modules/foundation-sites/scss'
        ]        
      },
      prod: {
        options: {
          style: "compressed",
          lineNumbers: true,
          sourceMap: true
        },
        src: '<%= sassPath %>main.scss',
        dest: '<%= cssPath %>main.css'
      }
    },

    // JS Hint
    jshint: {
      options: {
        reporterOutput: ""
      },
      all: ['Gruntfile.js', '<%= jsPath %>main.js']
    },

    // Concatenate files
    concat: {
      options: {},
	  	  
      // JS files
      js: {
        src: [
		  // Modernizr (not sure if needed?)
		  //'node_modules/modernizr/modernizr.js', 
		  
		  // Foundation Components
		  //*Note: names may change w/ versions of Foundation. Check /foundation-sites/js 
		  '<%= foundationjs %>/foundation.core.js',
		  '<%= foundationjs %>/foundation.util.box.js',
		  '<%= foundationjs %>/foundation.util.keyboard.js',
		  '<%= foundationjs %>/foundation.util.mediaQuery.js',
		  '<%= foundationjs %>/foundation.util.motion.js',
		  '<%= foundationjs %>/foundation.util.nest.js',
		  '<%= foundationjs %>/foundation.util.timerAndImageLoader.js',
		  '<%= foundationjs %>/foundation.util.touch.js',
		  '<%= foundationjs %>/foundation.util.triggers.js',
		  '<%= foundationjs %>/foundation.reveal.js',

		  // Velocity.js and UI pack
          'node_modules/velocity-animate/velocity.js',
          'node_modules/velocity-animate/velocity.ui.js',
		  
		  // jQuery Validation Engine
		  '<%= jsPath %>jquery-validation/jquery.validationEngine-en.js',
		  '<%= jsPath %>jquery-validation/jquery.validationEngine.js',
          
		  // Main JS file
		  '<%= jsPath %>main.js',
        ],
        dest: '<%= distPath %>app.js',
        nonull: true // warn if a file is missing or invalid
      },

      // CSS files (add other CSS files)
      css: {
        options: {},
        src: [
          '<%= cssPath %>main.css',
          //'<%= cssPath %>plugins.css'
        ],
        dest: '<%= distPath %>app.css',
        nonull: true
      }
    },

    // Post CSS / Autoprefixer
    postcss: {
      options: {
        map: true,
        processors: [
          require('autoprefixer')
        ]
      },
      dist: {
        src: '<%= cssPath %>main.css'
      }
    },

    // Minify CSS
    cssmin: {
      minify: {
        src: '<%= distPath %>app.css',
        dest: '<%= distPath %>app.min.css'
      }
    },

	// Babel
	babel: {
        options: {
            sourceMap: true,
			presets: ['es2015']
        },
        dist: {
            files: {
                '<%= distPath %>app.js': '<%= distPath %>app.js'
            }
        }
    },

	// Browserify: run after concat and babel, before uglify	
	browserify: {
		dist: {
			files: {
				'dist/app.js': ['dist/app.js']
			},
			options: {
				browserifyOptions: {
					debug: true // source mapping
				}
			}
		}
	},

    // Uglify JS
    uglify: {
      options: {},
      js: {
        options: {
          report: 'min', // report minified vs orig file size
          sourceMap: false
        },
        src: '<%= distPath %>app.js',
        dest: '<%= distPath %>app.min.js'
      }
    },

    // Minify Images
    // https://github.com/gruntjs/grunt-contrib-imagemin
    imagemin: {
      options: {},
      all: {
        options: {},
        files: [{
          expand: true,
          cwd: '<%= appPath %>/img/',
          src: ['*.{<%= imgFileTypes %>}'],
          dest: '<%= distPath %>/img/'
        }]
      }
    },

    // Replace
    replace: {
      // Add "?cb=123" to CSS/JS paths (can be any number)
      cacheBust: {
        src: ['../craft/templates/_master.twig', '../craft/templates/modules/_footer.twig'],
        replacements: [{
          from: /\?cb=[0-9]*/g,
          to: function(){
            var uid = new Date().valueOf();
            return '?cb=' + uid;
          }
        }],
        overwrite: true
      }
    },

    // Notify
    notify: {
      all: {
        options: {
          title: 'Grunt tasks',
          message: 'Run successfully!'
        }
      }
    },

    // Task: when something changes, run specific task(s).
    // https://github.com/gruntjs/grunt-contrib-watch
    watch: {
      options: {},
      sass: {
        options: {},
        files: ['<%= sassPath %>*.scss'],
        tasks: [
          'sass:prod',
          'concat:css',
          'postcss:dist',
          'cssmin:minify',
          'replace:cacheBust',
          'notify:all'
        ]
      },
      js: {
        options: {},
        files: ['<%= jsPath %>*.js'],
        tasks: [
          'jshint:all',
          'concat:js',
          'uglify:js',
          'replace:cacheBust',
          'notify:all'
        ]
      }
    }

  });

  // Default task(s).
  grunt.registerTask('default', [
    'sass:prod',
    'concat:css',
    'postcss:dist',
    'cssmin:minify',
    'jshint:all',
	//'modernizr',
    'concat:js',
	'babel:dist',
	//'browserify',
    'uglify:js',
    'imagemin:all',
    'replace:cacheBust',
    'notify:all',
    'watch'
  ]);

  // Production task(s). Same as default, except with imagemin and without watch.
  grunt.registerTask('prod', [
    'sass:prod',
    'concat:css',
    'postcss:dist',
    'cssmin:minify',
    'jshint:all',
	//'modernizr',
    'concat:js',
	'babel:dist',
	//'browserify',
    'uglify:js',
    'imagemin:all',
    'replace:cacheBust',
    'notify:all'
  ]);

};