var actions = module.exports;

actions.update = function(req, res) {
  var update = req.body;
  _.each(update, function(value, key) {
    req.object[key] = value;
  });
  req.share.save(function() {
    res.send(200, req.object);
  });
};

actions.get = function(req, res) {
  res.send(req.object);
};

