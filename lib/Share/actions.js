var Share = require('./model');
var Group = require('lib/Group/model');
var errors = require('lib/errors');
var selfLink = require('lib/schema-plugin-selflink');
var asArray = require('as-array');
var async = require('async');
var queue = require('lib/queue');
var _ = require('lodash');

/**
 * Interface
 */
// Mixin crud
require('lib/crud')(exports, Share);


/**
 * Implementation
 */


exports.to = function(req, res, next) {
  var channels = asArray(req.param('channel'));
  var context = req.param('context');
  var text = req.param('query');

  var page = req.page;
  var find = Share.findForUser(req.me, channels, context);

  if (channels.length)
    find = find.where('channels').in(channels)

  find
    .where(text ? {$text: {$search: text}} : {})
    .where({createdAt: {$lt: page.before}})
    .sort({publishedAt: 'desc', createdAt: 'desc'})
    .skip(page.skip)
    .limit(page.limit)
    .lean()
    .exec(function(err, shares) {
      if(err) return next(err);
      res.json(shares);
    });
};

exports.getContexts = function(req, res) {
  var contexts = req.share.contextsForUser(req.me);
  res.json(contexts.map(function(context) {
    return context.descriptor;
  }));
};

exports.getInstances = function(req, res) {
  var context = req.param('context');
  var id = req.param('id');

  return Share.find()
    .where('shareType', 'shareInstance')
    .where('_root.id', id)
    .where('contexts.descriptor.id', context)
    .lean()
    .exec(function(err, instances) {
      if(err) return next(err);
      res.json(instances);
    });
};

exports.save = function(req, res, next) {
  req.share.save(function(err, share) {
    if(err) return next(err);
    res.send(200, share);
  });
};


exports.updateInstance = function(req, res, next) {
  var inst = req.body;
  selfLink.strip(inst);
  if(inst.__v >= req.share.__v) {
    var tmp = new Share.ShareInstance(inst);
    var data = tmp.instanceData();
    req.share.applyInstanceData(data);
    delete inst._object;
    delete inst.object;
    req.share.set(inst);
    exports.save(req, res, next);
  } else
    next(errors.VersionMismatch('version mismatch', '__v', inst.__v, req.share.toJSON()));
};

var updateInstanceQueue = queue('updateInstanceQueue');

function updateShare(share, cb) {
  share.save(function(err, share) {
    if (err) return cb(err);
    if(share.isSheet() && share.isPublished()) {
      updateInstanceQueue.push(function(cb) {
        updateInstances(share, cb);
      });
    }
    cb(null, share);
  });
}

exports.updateShare = function(req, res, next) {
  if(req.share.isInstance())
    return next();

  updateShare(req.share, function(err, share) {
    if(err) return next(err);
    res.send(200, share);
  });
};

function updateInstances(share, cb) {
  share.findInstances().exec(function(err, instances) {
    if(err) return cb(err);

    var tree = share.object.toJSON();
    async.each(instances, function(inst, cb) {
      var data = inst.instanceData();
      var instProps = share.instanceProperties({context: inst.contextIds});
      inst.set(instProps);

      inst.object = tree;
      inst.applyInstanceData(data);
      inst.__rootUpdate = true;
      inst.save(cb);
    }, cb);
  });
}

exports.getMembers = function(req, res, next) {
  var contexts = asArray(req.param('context'));
  req.share
    .getMembers(contexts)
    .lean()
    .exec(function(err, users) {
    if(err) return next(errors.Server(err));
    res.json(users);
  });
};


exports.publish = function(req, res, next) {
  req.share.published = true;
  exports.updateShare(req, res, next);
};

exports.unpublish = function(req, res, next) {
  req.share.published = false;
  exports.updateShare(req, res, next);
};


exports.sendTo = function(groupType) {
  return function(req, res, next) {
    var to = req.param('to');
    var originalDescription = req.param('originalDescription');
    var displayName = req.param('displayName');
    var groupIds = req.me.groupIds;
    var share = req.share;

    // make sure user is a member of groups it is assigning to
    if (_.union(groupIds, to).length !== groupIds.length) {
      res.send(403);
      return;
    }

    Group.find()
      .where('_id').in(to)
      .where('groupType', groupType)
      .where('status', 'active')
      .exec(function(err, groups) {
        if (groupType === 'class')
          share.withGroups(groups);
        if (groupType === 'board')
          share.withPublic('teacher');

        //add channels
        share.sendToGroups(groups);

        // publish
        share.published = true;

        if (originalDescription)
          share.originalDescription = originalDescription;

        if (displayName)
          share.displayName = displayName;

        updateShare(req.share, function(err, share) {
          if(err) return next(err);
          res.send(200, share);

          // update group
          if (groupType === 'board') {
            groups.forEach(function(group) {
              // add share image to board, no big deal if it fials
              if (group.addImageFromShare(share))
                group.save();

            });
          }

        });


      });
  };
};





exports.answerQuestion = function(req, res, next) {
  var question = req.share.object.find(req.param('questionId'));
  if(! question || question.objectType !== 'question')
    return next(new Error('Question not found (' + req.param('questionId') + ')'));

  question.response = req.body.answer;
  req.share.save(function(err) {
    if(err) return next(err);
    res.status(200).send();
  });
};