var actions = module.exports;

actions.get = function(req, res) {
  var name = req.param('name');
  if(name) res.json(req.me.preferences[name]);
  else res.json(req.me.preferences);
};

actions.set = function(req, res, next) {
  var name = req.param('name');
  req.me.preferences[name] = req.body.value;
  req.me.markModified('preferences.' + name);
  req.me.save(function(err) {
    if(err) return next(err);
    res.send(200);
  });
};