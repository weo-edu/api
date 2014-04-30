var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var debug = require('debug')('weo:clientModels');

// Browserify our schemas for the client
browserify()
  .require('lib/clientModels/schemas', {expose: 'eos-schemas'})
  .bundle()
  .pipe(fs.createWriteStream('assets/eos-schemas.js'))
  .on('close', function() {
    debug('browserify finished');
  });