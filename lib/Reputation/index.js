/**
 * Modules
 */

var AsyncEventEmitter = require('async-eventemitter');

/**
 * Local Libs
 */

var hooks = require('./hooks');
require('./model');

/**
 * Activity hooks
 */

var Share = require('lib/Share').model;


/**
 * Pre Activity Create
 */

var activities = new AsyncEventEmitter;
Share.schema.when('pre:add', function(share, next) {
  activities.emit(share.object.objectType, share, function(err) {
    next(err);
  });
});

/**
 * Vote Reputation
 */

//activities.on('vote', hooks.charge(1));

activities.on('vote', hooks.giveParent({
  undoup: -1,
  switchup: 2,
  up: 1,
  switchdown: -2,
  undodown: 1,
  down: -1
}));



/**
 * Check Reputation
 */

/*activities.on('check', hooks.charge(5));

activities.on('check', hooks.giveParent({
  undocheck: -5,
  switchcheck: 10,
  check: 5,
  switchex: -10,
  undoex: 5,
  ex: -5
}));

activities.on('check', hooks.giveVotes({
  undocheck: -5,
  switchcheck: 10,
  check: 5,
  switchex: -10,
  undoex: 5,
  ex: -5
}));*/



/**
 * Teacher Reputation for Student Discussion
 */

activities.on('comment', hooks.giveRootActor(1));



/**
 * Profile hooks
 */

activities.on('profile', hooks.charge(1));



