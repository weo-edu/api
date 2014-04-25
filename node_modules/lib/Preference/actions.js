var actions = module.exports;
var User = require('lib/User').model;

actions.get = function(req, res, next) {
  var name = req.param('name');
  if(name) res.json(req.me.preferences[name]);
  else res.json(req.me.preferences);
};

actions.set = function(req, res, next) {
  var name = req.param('name');
  req.me.preferences[name] = req.body.value;
  req.me.save(function(err) {
    if(err) return res.mongooseError(err);
    res.send(200);
  });
};