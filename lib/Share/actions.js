var Share = require('./model');
var actions = exports;

actions.to = function(req, res, next) {
  var boards = req.param('board');
  var channel = req.param('channel');

  boards = [].concat(boards) //XXX why is this necessare?
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

// Mixin crud
require('lib/crud')(actions, Share);