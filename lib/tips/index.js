var fs = require('fs');
var glob = require('glob');
var path = require('path');
var Handlebars = require('handlebars');

var templates = module.exports = {};

glob.sync(path.join(__dirname, '*.html')).forEach(function(file) {
  var base = path.basename(file, '.html');
  var source = fs.readFileSync(file, 'utf8');

  templates[base] = Handlebars.compile(source);
});