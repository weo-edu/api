var actions = module.exports;
var mongoose = require('mongoose');

actions.get = function(req, res) {
  var name = req.param('name');
  if(name) res.json(req.me.preferences[name]);
  else res.json(req.me.preferences);
};

actions.set = function(req, res, next) {
  var name = req.param('name');
  var User = mongoose.model('User');

  var set = {};
  set['preferences.' + name] = req.body.value;
  User.update({_id: req.me._id}, {$set:set}, {strict: false}, function(err) {
    if(err) return next(err);
    res.send(200);
  });
};