var Share = require('./model');
var actions = exports;
var errors = require('lib/errors');
var _ = require('lodash');

// Mixin crud
require('lib/crud')(actions, Share);

actions.to = function(req, res, next) {
  var boards = [].concat(req.param('board'));
  var channel = req.param('channel');
  Share.findTo(boards, req.me, channel)
    .sort({publishedAt: 'desc', createdAt: 'desc'})
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
  var to = req.me.groups;
  var id = req.param('id');
  Share.findTo(_.invoke(to, 'toString'), req.me)
    .where('_id', id)
    .exec(function(err, shares) {
      if(err) return next(err);
      if(! shares.length) return next(errors.NotFound());
      res.json(shares[0].contextualize(to));
    });
};
