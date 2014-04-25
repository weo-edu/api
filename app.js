var debug = require('debug')('weo:pre-boot');
var fs    = require('fs');
var path  = require('path');

if(! fs.existsSync('node_modules/lib')) {
  debug('symlinking lib folder...');
  fs.symlinkSync(path.join(process.cwd(), 'lib'), 'node_modules/lib', 'dir');
} else
  debug('node_modules/lib already exists...skipping symlink');

module.exports = require('lib/boot');