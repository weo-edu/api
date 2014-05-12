var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var debug = require('debug')('weo:client-models');

// noBuild option is so tests can require this without doing a full build
module.exports = function(noBuild) {
  // Browserify our schemas for the client
  noBuild || browserify()
    .require('lib/client-models/schemas', {expose: 'eos-schemas'})
    .bundle()
    .pipe(fs.createWriteStream('assets/eos-schemas.js'))
    .on('close', function() {
      debug('browserify of eos-schemas finished');
    });

  return require('./schemas');
};