var Share = require('lib/Share').model;
var actions = module.exports;

actions.score = function(req, res, next) {
  var shareId = req.param('id')
    , group = req.param('group')
    , studentId = req.auth.id
    , score = req.param('score');

  var shareId = shareId.split('-')[0];
  var update = {};
  update['payload.' + group + '.students.' + studentId + '.progress'] = 1;
  update['payload.' + group + '.students.' + studentId + '.score'] = score;
  Share.update({_id: shareId}, update, function(err) {
    if (err) return next(err);
    res.json({progress: 1, score: score})
  });
};

