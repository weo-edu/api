var Share = require('./model');
var actions = exports;
var errors = require('lib/errors');

// Mixin crud
require('lib/crud')(actions, Share);

actions.to = function(req, res, next) {
  var to = [].concat(req.param('to'));
  var parent = req.param('parent');
  Share.findTo(to, req.me, parent)
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

  Share.findTo(to, req.me)
    .where('_id', id)
    .exec(function(err, shares) {
      if(err) return next(err);
      if(! shares.length) return next(errors.NotFound());
      res.json(shares[0].contextualize(to));
    });
};
