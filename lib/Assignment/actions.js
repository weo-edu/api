var Assignment = require('./model');
var actions = module.exports;

actions.score = function(req, res, next) {
  var id = req.param('id')
    , group = req.param('group')
    , userId = req.auth.id
    , score = req.param('score');

  console.log('score', id, group, userId, score);
  Assignment.score(id, group, userId, score, function(err, update) {
    if (err) return next(err);
    res.json(update);
  });
};

require('lib/crud')(actions, Assignment);