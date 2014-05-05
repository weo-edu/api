var debug = require('debug')('weo:pre-boot');
var fs    = require('fs');
var path  = require('path');

debug('symlinking lib folder...');
var lib = 'node_modules/lib';

try {
  var stat = fs.lstatSync(lib);
  if(stat.isSymbolicLink()) {
    debug('unlinking symlink');
    fs.unlinkSync(lib);
  } else {
    debug('deleting folder');
    fs.rmdirSync(lib);
  }
} catch(e) {
  debug("lib folder symlink didn't exist...creating it");
}


fs.symlinkSync(path.join(process.cwd(), 'lib'), lib, 'dir');

module.exports = require('lib/boot');