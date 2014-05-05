var actions = module.exports;
var Response = require('./model');
require('lib/crud')(actions, Response);

actions.find = function(req, res) {
  var collection = req.param('collection');
  var user = req.param('user');
  var options = {collection: collection};
  if (user)
    options.user = user;
  Response.find(options, function(err, responses) {
    if (err) return next(err);
    res.json(responses);
  });
};