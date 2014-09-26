var marked = require('marked');
var renderer = new marked.Renderer();

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