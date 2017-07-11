(function ($) {

	$.extend({

		app: {
			global: {
				init: function(){
					console.log("global fired");

					// Initialize Foundation
					$(document).foundation();
				}
			},
			modules: {

			},
			pages: {
				homepage: {
					init: function(){
						console.log("homepage fired");
					}
				}
			}
		}
	});

	// Fire global.init on all pages
	$(document).ready(function(){	
		$.app.global.init();
	});

})(jQuery);