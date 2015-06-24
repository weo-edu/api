var fs = require('fs');
var browserify = require('browserify');
var debug = require('debug')('weo:router.io-client');
var prelude = require('lib/browserify-prelude');

// noBuild option is just so tests can use the module
// without generating the assets
module.exports = function(noBuild) {
  // Browserify our schemas for the client
  noBuild || browserify({
    fullPaths: true,
    prelude: prelude.src,
    preludePath: prelude.path
  })
    .require('./lib/router.io-client/router.io-client.js', {expose: 'router.io-client'})
    .external('mongoose')
    .bundle()
    .pipe(fs.createWriteStream('assets/router.io-client.js'))
    .on('close', function() {
      debug('browserify of router.io finished');
    });

  return require('./router.io-client');
};