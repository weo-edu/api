/**
 * Modules
 */

var AsyncEventEmitter = require('async-eventemitter');
var propertyPath = require('property-path');
var ware = require('ware');

/**
 * Local Libs
 */

var hooks = require('./hooks');
var hooksMiddle = require('./hookMiddle');

/**
 * Activity hooks
 */

var Share = require('lib/Share');
var User = require('lib/User');


/**
 * Pre Activity Create
 */

var activities = new AsyncEventEmitter;
Share.schema.when('pre:add', function(share, next) {
  activities.dispatch(share.object.objecType, share, function(err) {
    next(err);
  });
});

/**
 * Vote Reputation
 */

activities.on('vote', hooks.charge(1));

activities.on('vote', hooks.giveParent({
  undoup: -1,
  switchup: 2,
  up: 1,
  switchdown: -2,
  undodown: 1,
  down: -1
});



/**
 * Check Reputation
 */

activities.on('check', hooks.charge(5));

activities.on('check', hooks.giveParent({
  undocheck: -5,
  switchcheck: 10,
  check: 5,
  switchex: -10,
  undoex: 5,
  ex: -5
});

activities.on('check', hooks.giveVotes({
  undocheck: -5,
  switchcheck: 10,
  check: 5,
  switchex: -10,
  undoex: 5,
  ex: -5
});



/**
 * Teacher Reputation for Student Discussion
 */

acvities.on('comment', hooks.giveRootActor(1));



/**
 * Profile hooks
 */

activities.on('profile', hooks.charge(1));


