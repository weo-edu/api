var Share = require('./model');
var actions = exports;

actions.subscribe = function(req, res, next) {

};

actions.unsubscribe = function(req, res, next) {

};

actions.to = function(req, res, next) {
  var to = req.param('to');
  Share.receivedBy(to, req.auth.role)
    .sort({published_at: 'desc', createdAt: 'desc'})
    .exec(function(err, shares) {
      if(err) return res.mongooseError;
      res.json(shares);
    });
};

actions.publish = function(req, res, next) {
  req.share.status = 'active';
  actions.save(req, res, next);
};

actions.save = function(req, res, next) {
  req.share.save(function(err) {
    if(err) return res.mongooseError(err);
    res.send(200);
  });
};

// Mixin crud
require('lib/crud')(actions, Share);