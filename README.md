# Craft CMS, Zurb Foundation, Sass and Grunt Boilerplate

This project includes boilerplate for /craft/templates files, and /public files. No other Craft files are included here, so you will need to first install Craft CMS.

## Installation instructions

1. Install Craft: [https://craftcms.com/docs/installing](https://craftcms.com/docs/installing)
2. Copy the contents of the craft-templates folder to your local Craft's craft/templates folder, overwriting files if prompted.
3. Copy the contents of the public folder to your local Craft's public folder.
4. From the public folder, run ```npm install```. This will install Foundation 6, Grunt, and accompanying tools.

## Notes on Craft

The main Twig template is ```_master.twig```, which holds all the HTML markup that is loaded on every page.

The ```_templates.twig``` file allows you to set the Twig template you want based on the page's Craft entry type. In order for this to work, in Craft, you will need to set the "Entry Template" on each Section to ```_templates```.

Using this method is helpful if you have multiple entry types for a section which require different templates. However, if this wouldn't be helpful for your needs, you can simply delete ```_templates.twig``` and set the Entry Template to the ```.twig``` file you want for that section.

## Sass customization

The ```/scss/main.scss file``` loads all necessary .scss files. I've just included ```/scss/_foundation-custom.scss``` for now. In that file, I've added Foundation components manually to reduce the final CSS file size. Feel free to add or remove components as you like. Just check the ```/node_modules/foundation-sites/scss/foundation.scss``` file for the correct names, as they shift from version to version of Foundation.

## Grunt customization

The ```Gruntfile.js``` file loads Foundation from your node_modules directory once the npm package is installed. It also includes the Foundation Sass files in the build. 

In the ```concat:js``` task, I've included JS components manually to reduce the size of the JS file. You can add or remove components as you like-- just check the ```/foundation-sites/js``` folder to make sure you're naming them correctly, as things may shift from version to version of Foundation.

I've also included some plugins that I often use:
- [Velocity.js](https://github.com/julianshapiro/velocity)
- [jQuery Validation Engine](https://github.com/posabsolute/jQuery-Validation-Engine)

I've included the default Grunt task, run by typing ```grunt``` into the console, and a production task, run with ```grunt prod``` . They are identical except that the prod task doesn't have the watch task.