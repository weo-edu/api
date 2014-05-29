var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var debug = require('debug')('weo:client-models');
var browserResolve = require('browser-resolve');

// noBuild option is so tests can require this without doing a full build
module.exports = function(noBuild) {
  // Browserify our schemas for the client
  noBuild || browserify({
      resolve: function(pkg, opts, cb) {
        if(pkg === 'mongoose')
          return cb(null, 'mongoose');
        return browserResolve.apply(this, arguments);
      }
    })
    .external('mongoose')
    .require('lib/client-models/schemas', {expose: 'eos-schemas'})
    .require('lib/Group/schema', {expose: 'GroupSchema'})
    .require('lib/User/schema', {expose: 'UserSchema'})
    .require('lib/Teacher/schema', {expose: 'TeacherSchema'})
    .require('lib/Student/schema', {expose: 'StudentSchema'})
    .require('lib/S3/schema', {expose: 'S3Schema'})
    .require('lib/Share/schema', {expose: 'ShareSchema'})
    .require('lib/Object/schema', {expose: 'ObjectSchema'})
    .require('lib/Object-Posts/schema', {expose: 'PostSchema'})
    .require('lib/Object-Form/schema', {expose: 'FormSchema'})
    .bundle({debug: true})
    .pipe(fs.createWriteStream('assets/eos-schemas.js'))
    .on('close', function() {
      debug('browserify of eos-schemas finished');
    });

  return require('./schemas');
};