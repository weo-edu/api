var marked = require('@weo-edu/marked');
var renderer = new marked.Renderer();

renderer.heading = function(text, level) {
  var escapedText = 'md-header-' + text.toLowerCase().replace(/[^\w]+/g, '-');
  return '<h' + level + ' id="' + escapedText + '">' + text + '</h' + level + '>\n';
};

marked.setOptions({
  renderer: renderer,
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: true
});


/*
  Wrap marked so that we can change its options or switch to a different
  library and only have to change the code here
 */
module.exports = function(str) {
  return marked(str);
};
