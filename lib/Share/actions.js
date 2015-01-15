var Share = require('./model');
var actions = exports;
var errors = require('lib/errors');
var selfLink = require('lib/schema-plugin-selflink');

/**
 * Interface
 */
// Mixin crud
require('lib/crud')(actions, Share);

actions.to = to;
actions.publish = publish;
actions.queue = queue;
actions.returnInstance = returnInstance;
actions.redoInstance = redoInstance;
actions.save = save;
actions.getMembers = getMembers;
actions.getContexts = getContexts;
actions.getInstances = getInstances;
actions.updateInstance = updateInstance;


/**
 * Implementation
 */


function to(req, res, next) {
  var channels = req.paramAsArray('channel');
  var contexts = req.paramAsArray('context');
  var text = req.param('query');

  var page = req.page;

  Share.findForUser(req.me, contexts, channels)
    .where('channels').in(channels)
    .where(text ? {$text: {$search: text}} : {})
    .where({createdAt: {$lt: page.before}})
    .where({status: {$ne: 'draft'}})
    .sort({publishedAt: 'desc', createdAt: 'desc'})
    .skip(page.skip)
    .limit(page.limit)
    .lean()
    .exec(function(err, shares) {
      if(err) return next(err);
      res.json(shares);
    });
}

function getContexts(req, res) {
  var contexts = req.share.contextsForUser(req.me);
  res.json(contexts.map(function(context) {
    return context.descriptor;
  }));
}

function getInstances(req, res) {
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
}

function publish(req, res, next) {
  req.share.status = 'active';
  actions.save(req, res, next);
}

function queue(req, res, next) {
  req.share.status = 'pending';
  actions.save(req, res, next);
}

function returnInstance(req, res, next) {
  req.share.status = 'returned';
  actions.save(req, res, next);
}

function redoInstance(req, res, next) {
  req.share.status = 'pending';
  actions.save(req, res, next);
}

function save(req, res, next) {
  req.share.save(function(err, share) {
    if(err) return next(err);
    res.send(200, share);
  });
}

function updateInstance(req, res, next) {
  var inst = req.body;
  selfLink.strip(inst);

  if(inst.__v >= req.share.__v) {
    var tmp = new Share.ShareInstance(inst);
    var data = tmp.instanceData();
    req.share.applyInstanceData(data);
    delete inst._object;
    delete inst.object;
  } else {
    next(errors.VersionMismatch('version mismatch', '__v', inst.__v, req.share.toJSON()));
    return;
  }

  req.share.set(inst);
  actions.save(req, res, next);
}

function getMembers(req, res, next) {
  var contexts = req.paramAsArray('context');
  req.share
    .getMembers(contexts)
    .lean()
    .exec(function(err, users) {
    if(err) return next(errors.Server(err));
    res.json(users);
  });
}