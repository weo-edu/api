var Share = require('./model');
var actions = exports;

actions.to = function(req, res, next) {
  var to = req.param('to');
  to = [].concat(to);
  Share.findTo(to, req.me)
    .sort({published_at: 'desc', createdAt: 'desc'})
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

// Mixin crud
require('lib/crud')(actions, Share);