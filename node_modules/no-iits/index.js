var glob = require('glob');
var fs = require('fs');
var blacklist = ['it.only(', 'iit(', 'describe.only('];

function read(path) {
  return {
    contents: fs.readFileSync(path, 'utf8'),
    path: path
  };
}

function checkItemFactory(file) {
  return function(item) {
    var idx = file.contents.indexOf(item);
    if(idx !== -1) {
      file.invalid = file.invalid || {};
      file.invalid[item.slice(0, -1)] = true;
    }
    return file;
  };
}

function validate(file) {
  blacklist.forEach(checkItemFactory(file));
  return file;
}

module.exports = function(patterns) {
  var files = patterns.reduce(function(memo, pattern) {
    return memo.concat(glob.sync(pattern));
  }, []);

  return files.map(read).map(validate);
};