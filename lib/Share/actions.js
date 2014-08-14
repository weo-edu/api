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
    .where('status').ne('draft')
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

actions.getMembers = function(req, res, next) {
  var contexts = [].concat(req.param('context'));
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
};