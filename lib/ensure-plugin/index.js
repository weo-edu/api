var mongoose = require('mongoose');
module.exports = function(fn, opts) {
  for (var i = 0; i < mongoose.plugins.length; i++) {
    var plugin = mongoose.plugins[i];
    if (plugin[0] === fn && plugin[1] === opts) {
      return;
    } else if (plugin[0] === fn) {
      throw new Error('Conflicting opts for this plugin', plugin.opts);
    }
  }
  mongoose.plugin(fn, opts);
};