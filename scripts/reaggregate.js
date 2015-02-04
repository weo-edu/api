require('lib/db');

var Share = require('lib/Share/model');
var channel = require('lib/channel');
var _ = require('lodash');

var num = 0;
var done = false;
Share.find({}).stream()
.on('data', function(doc) {
  doc.channels.forEach(reaggregate);
})
.on('error', function(err) {
  console.log('error', err);
})
.on('close', function() {
  // done
  done = true;
});


var complete = {};

function resetSelflink(model, prop) {
  if(model.schema.path(prop + '.canonicalTotal'))
    model[prop].canonicalTotal = undefined;
  model[prop].total.length = 0;
}

function reaggregate(chan) {
  if(complete[chan])
    return;

  // Set this even before we're done,
  // we don't want it getting entered
  // twice
  complete[chan] = true;


  channel.withModel(chan, function(err, parent) {
    if(err) throw err;

    function reset(parent) {

    }

    // Reset the selflink
    var model = parent.model;
    var prop = parent.property;
    var leaf = parent.leaf;

    if(leaf)
      model = model.object.find(leaf);

    if(! model || ! model.selfLink || ! model[prop])
      return;

    var old = model[prop].toJSON();
    resetSelflink(model, prop);

    num++;
    Share.find({channel: chan}).stream()
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
        num--;
        if(num === 0 && done)
          process.exit(0);
      });
    });
  });
}