var ourPost = require('lib/schema-plugin-post');

module.exports = function() {
  var self = this;
  var args = [].slice.call(arguments);

  ourPost.onFlush(function() {
    self(null, args[0]);
  });
  // setTimeout(function() {
  //   self(null, args[0]);
  // }, 500);
};