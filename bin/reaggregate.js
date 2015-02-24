#!/usr/bin/env node

require('lib/io/mock');
require('lib/db');
require('lib/main');

var Share = require('lib/Share/model');
var channel = require('lib/channel');
var _ = require('lodash');
var async = require('async');

var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');


async.parallel([runShareClear, runGroupClear, runUserClear], function() {
  runReaggregate();
});

function runGroupClear(cb) {
  chug.src('groups', {})
    .pipe(es.through(function(doc) {

      clearDoc(doc);
      this.emit('data', doc);
    }))
    .pipe(chug.dest('groups'))
    .on('end', cb);
}

function runUserClear(cb) {
  chug.src('users', {})
    .pipe(es.through(function(doc) {

      clearDoc(doc);
      this.emit('data', doc);
    }))
    .pipe(chug.dest('users'))
    .on('end', cb);
}

function runShareClear(cb) {
  chug.src('shares', {})
    .pipe(es.through(function(doc) {

      clearDoc(doc);
      this.emit('data', doc);
    }))
    .pipe(chug.dest('shares'))
    .on('end', cb);
}

function clearDoc(doc) {
   _.each(doc, function(val, key) {
      if (val && val.selfLink) {
        val.total = [];
        delete val.canonicalTotal;
        delete val.last;
      }
    });
}


var q = async.queue(function (chan, done) {
  reaggregate(chan, done)
}, 50);

q.drain = function() {
  process.exit(0);
}

function runReaggregate() {
  Share.find({}).stream()
  .on('data', function(doc) {
    doc.channels.forEach(function(chan) {
      q.push(chan);
    });
  })
  .on('error', function(err) {
    console.log('error', err);
  })
}





var complete = {};

function resetSelflink(model, prop) {
  if(model.schema.path(prop + '.canonicalTotal'))
    model[prop].canonicalTotal = undefined;
  model[prop].total.length = 0;
}

function reaggregate(chan, done) {
  if(complete[chan])
    return done();

  // Set this even before we're done,
  // we don't want it getting entered
  // twice
  complete[chan] = true;

  channel.withModel(chan, function(err, parent) {
    if(err) throw err;

    // Reset the selflink
    var model = parent.model;
    var prop = parent.property;
    var leaf = parent.leaf;

    if(leaf)
      model = model.object.find(leaf);

    if(! model || ! model.selfLink || ! model[prop]) {
      done && done();
      return parent.done();
    }

    var old = model[prop].toJSON();
    resetSelflink(model, prop);

    Share.find({channels: chan}).stream()
    .on('data', function(doc) {
      // All operations are pushes for us
      // since we have reset the self link
      doc.aggregate('push', parent);
    })
    .on('error', function() {
      console.log('error retrieving channel', chan);
    })
    .on('close', function() {
      // done
      parent.model.save(function(err) {
        if(err) console.log('err saving', parent.model.id, err);
        parent.done();
        done();
      });
    });
  });
}