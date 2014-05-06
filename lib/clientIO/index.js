var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var debug = require('debug')('weo:clientModels');

// Browserify our schemas for the client
browserify()
  .require('lib/clientIO/io.js', {expose: 'eos-io'})
  .bundle()
  .pipe(fs.createWriteStream('assets/eos-io.js'))
  .on('close', function() {
    debug('browserify finished');
  });