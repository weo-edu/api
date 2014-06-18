var Share = require('./model');
var actions = exports;
var errors = require('lib/errors');
var _ = require('lodash');
var Student = require('lib/Student').model;

// Mixin crud
require('lib/crud')(actions, Share);

actions.to = function(req, res, next) {
  var contexts = [].concat(req.param('context'));
  var channel = req.param('channel');
  var text = req.param('query');
  Share.findContext(contexts, req.me, channel)
    .where(text ? {$text: {$search: text}} : {})
    .sort({publishedAt: 'desc', createdAt: 'desc'})
    .exec(function(err, shares) {
      if(err) return next(err);
      res.json(shares.map(function(share) {
        _.remove(share.contexts, {id: req.auth.id});
        return share;
      }));
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
  var to = req.me.groups;
  var id = req.param('id');
  Share.findContext(_.invoke(to, 'toString'), req.me)
    .where('_id', id)
    .exec(function(err, shares) {
      if(err) return next(err);
      if(! shares.length) return next(errors.NotFound());
      res.json(shares[0].contextualize(to));
    });
};

var access = require('lib/access');

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
  Student.find({
    $or: [{
      _id: {
        $in: individuals
      }
    }, {
      groups: {
        $in: groups
      }
    }]
  }).exec(function(err, users) {
    if(err) return next(errors.Server(err));
    res.json(users);
  })
};