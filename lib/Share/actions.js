var Share = require('./model');
var actions = exports;
var errors = require('lib/errors');
var access = require('lib/access');
var Student = require('lib/Student').model;

// Mixin crud
require('lib/crud')(actions, Share);

actions.to = function(req, res, next) {
  var channels = [].concat(req.param('channel')).filter(Boolean);
  var contexts = [].concat(req.param('context')).filter(Boolean);
  var text = req.param('query');

  var page = req.page;
  Share.findForUser(req.me, contexts)
    .where('channels').in(channels)
    .where(text ? {$text: {$search: text}} : {})
    .where({createdAt: {$lt: page.before}})
    .sort({publishedAt: 'desc', createdAt: 'desc'})
    .skip(page.skip)
    .limit(page.limit)
    .exec(function(err, shares) {
      if(err) return next(err);
      res.json(shares);
    });
};

actions.publish = function(req, res, next) {
  req.share.status = 'active';
  actions.save(req, res, next);
};

actions.save = function(req, res, next) {
  req.share.save(function(err) {
    if(err) return next(err);
    res.send(200);
  });
};

actions.get = function(req, res, next) {
  var id = req.param('id');
  Share.findById(id)
    .exec(function(err, share) {
      if(err) return next(err);
      res.json(share);
    });
};


actions.getMembers = function(req, res, next) {
  var contexts = [].concat(req.param('context'));
  var individuals = [];
  var groups = [];

  req.share.contexts.filter(function(ctx) {
    return contexts.indexOf(ctx.id) !== -1;
  }).forEach(function(address) {
    address.allow.map(access.decode).filter(function(entry) {
      // Skip public
      return !! entry.id;
    }).forEach(function(entry) {
      if(entry.type === 'user')
        individuals.push(entry.id);
      else if(entry.type === 'group')
        groups.push(entry.id);
    });
  });

  Student.find()
    .or([{_id: {$in: individuals}}, {groups: {$in: groups}}])
    .exec(function(err, users) {
    if(err) return next(errors.Server(err));
    res.json(users);
  });
};