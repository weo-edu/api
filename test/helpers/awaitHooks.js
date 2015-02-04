var onFlush = require('lib/schema-plugin-events').onFlush;

module.exports = function() {
  var self = this;
  var args = [].slice.call(arguments);

  setTimeout(function() {
    self(null, args[0]);
  }, 500);
};