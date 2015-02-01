var fs = require('fs');
var browserify = require('browserify');
var debug = require('debug')('weo:client-models');
var es = require('event-stream');
var prelude = require('lib/browserify-prelude');
var production = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'ci';
var maybeUglify = production
  ? require('uglifyify')
  : function() { return es.through(); };

// noBuild option is so tests can require this without doing a full build
module.exports = function(noBuild) {

  // Browserify our schemas for the client
  noBuild || browserify({
      fullPaths: true,
      debug: !production,
      prelude: prelude.src,
      preludePath: prelude.path
    })
    .external('mongoose')
    .require('./lib/client-models/schemas.js', {expose: 'eos-schemas'})
    .require('./lib/Group/schema', {expose: 'GroupSchema'})
    .require('./lib/User/schema', {expose: 'UserSchema'})
    .require('./lib/Teacher/schema', {expose: 'TeacherSchema'})
    .require('./lib/Student/schema', {expose: 'StudentSchema'})
    .require('./lib/S3/schema', {expose: 'S3Schema'})
    .require('./lib/Share/schema', {expose: 'ShareSchema'})
    .require('./lib/Object/schema', {expose: 'ObjectSchema'})
    .require('./lib/Object/types/schema', {expose: 'PostSchema'})
    .require('./lib/Question/schema', {expose: 'QuestionSchema'})
    .bundle()
    .pipe(maybeUglify('assets/eos-schemas.js'))
    .pipe(fs.createWriteStream('assets/eos-schemas.js'))
    .on('close', function() {
      debug('browserify of eos-schemas finished');
    });

  return require('./schemas');
};