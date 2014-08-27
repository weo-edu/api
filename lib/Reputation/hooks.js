var Share = require('lib/Share').model;
var User = require('lib/User').model;
var _ = require('lodash');



function createReputation(parent, receiver, rep) {
  var share = parent.createChild('reputation', {
    channels: User.path(receiver, 'reputation')
  });
  share.set({actor: {id: 'system', url: 'system'}});
  _.extend(share.object, rep);
  share.save();
}

var hooks = module.exports;
hooks.noCharge = true;

hooks.charge = function(points) {
  return function(share, next) {
    if (hooks.noCharge) return next();
    User.findById(share.actor.id, function(err, user) {
      if (user.reputationPoints >= points) {
        createReputation(share, share.actor, {
          displayName: 'charge for ' + share.displayName, 
          points: -points
        });
        next();
      } else {
        next(new Error(points + ' reputation required.'));
      } 
    });
  };
};

hooks.giveParent = function(reputationMap) {
  // calc versus last action
  return function(share, next) {
    var points = reputationMap[share.object.action];
    createReputation(share, share.parent.actor, {
      points: points,
      displayName: share.object.displayName
    });
    next();
  };
};


// TODO: filter out your own vote
hooks.giveVotes = function(reputationMap) {
  return function(share, next) {
    Share.findById(share.parent.id, function(err, parent) {
      if (err)
        return next(err);

      var votes = parent
        .selfLink('votes')
        .context(share.contextIds);

      votes
        .actors()
        .forEach(function(actorId) {
          var rep = {};
          var vote = votes.get('points', actorId);
          var points = reputationMap[share.object.action];
          rep.points = points * vote;

          // can't give reputation to your own vote
          if (!rep.points || actorId === share.actor.id)
            return;
          
          rep.action = share.object.action + '-' + (rep.points === 1 ? 'up' : 'down');

          rep.displayName = {
            'undocheck-up': 'undo agreement with vote',
            'switchcheck-up': 'agrees with vote (used to disagree)',
            'check-up': 'agrees with vote',
            'switchex-up': 'disagrees with vote (used to agree)',
            'undoex-up': 'undo disagreement with vote',
            'ex-up': 'disagrees with vote',
            'undocheck-down': 'undo disagreement with vote',
            'switchcheck-down': 'disagrees with vote (used to agree)',
            'check-down': 'disagrees with vote',
            'switchex-down': 'agrees with vote (used to disagree)',
            'undoex-down': 'undo agreement with vote',
            'ex-down': 'agrees with vote'
          }[rep.action];

          createReputation(share, actorId, rep);
        });

      next();
    });
  };
};

hooks.giveRootActor = function(points) {
  return function(share, next) {
    if (!share.root)
      return next();

    // filter actions on your own share
    if (share.actor.id === share.root.actor.id)
      return next();

    createReputation(share, share.root.actor.id, {
      points: points,
      displayName: 'student participation'
    });
    next();
  };
};