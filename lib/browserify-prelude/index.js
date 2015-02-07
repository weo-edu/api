var fs = require('fs');
var path = require('path');

var p = path.join(__dirname, 'prelude.js');
module.exports = {
  src: fs.readFileSync(p, 'utf8'),
  path: p
};