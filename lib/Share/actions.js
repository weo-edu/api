var Share = require('./model');
var actions = exports;
var errors = require('lib/errors');
var access = require('lib/access');
var Student = require('lib/Student').model;

/**
 * Interface
 */
// Mixin crud
require('lib/crud')(actions, Share);

actions.to = to;
actions.publish = publish;
actions.returnInstance = returnInstance;
actions.redoInstance = redoInstance;
actions.save = save;
actions.getMembers = getMembers;
actions.getContexts = getContexts;
actions.getInstances = getInstances;


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
    .where('status').ne('draft')
    .sort({publishedAt: 'desc', createdAt: 'desc'})
    .skip(page.skip)
    .limit(page.limit)
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
    .exec(function(err, instances) {
      if(err) return next(err);
      res.json(instances);
    });
}

function publish(req, res, next) {
  req.share.status = 'active';
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

function getMembers(req, res, next) {
  var contexts = req.paramAsArray('context');
  var individuals = [];
  var groups = [];

  req.share.contextList(contexts).forEach(function(address) {
    address.allow.map(function(allow) {
      return access.decode(allow.id);
    }).filter(function(entry) {
      // Skip public
      return !! entry.id;
    }).forEach(function(entry) {
      if(entry.type === 'user')
        individuals.push(entry.id);
      else if(entry.type === 'group' && entry.role === 'student')
        groups.push(entry.id);
    });
  });

  Student.find()
    .or([{_id: {$in: individuals}}, {'groups.id': {$in: groups}}])
    .exec(function(err, users) {
    if(err) return next(errors.Server(err));
    res.json(users);
  });
}