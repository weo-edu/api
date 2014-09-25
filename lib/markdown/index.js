var marked = require('marked');
var renderer = new marked.Renderer();

// renderer.heading = function(text, level) {
//   var escapedText = 'md-header-' + text.toLowerCase().replace(/[^\w]+/g, '-');
//   return '<h' + level + ' id="' + escapedText + '">' + text + '</h' + level + '>\n';
// };

// // Disable heading tags
// marked.Lexer.rules.heading = /$^/;
// marked.Lexer.rules.gfm.heading = /$^/;
// marked.Lexer.rules.normal.heading = /$^/;
// marked.Lexer.rules.tables.heading = /$^/;

marked.setOptions({
  renderer: renderer,
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false
});


/*
  Wrap marked so that we can change its options or switch to a different
  library and only have to change the code here
 */
module.exports = function(str) {
  return marked(str);
};