var fs = require('fs')
  , through = require('through')
  , Minimatch = require('minimatch').Minimatch;


module.exports = function(map) {
  var patterns = Object.keys(map)
    , minimatchers = patterns.map(function(pat, idx) {
      return new Minimatch(pat).makeRe();
    });

  return function(file) {
    for(var i = 0; i < minimatchers.length; i++) {
      if(minimatchers[i].test(file)) {
        var data = fs.readFileSync(map[patterns[i]]);
        return through(function() {
        }, function() {
          this.queue(data);
          this.queue(null);
        });
      }
    }
    return through();
  }
};