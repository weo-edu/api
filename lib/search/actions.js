var getShares = require('lib/Share').actions.to;
var Group = require('lib/Group/model');
var User = require('lib/User/model');


exports.getShares = getShares;

exports.getBoards = function(req, res, next) {
  var page = req.page;
  var text = req.param('query');

  Group.find(
    {
      $text: {$search: text}, 
      groupType: 'board', 
      status: 'active'
    })
    .skip(page.skip)
    .limit(page.limit)
    .lean()
    .exec(function(err, boards) {
      if (err) return next(err);
      res.json(boards);
    });
};


exports.getPeople = function(req, res, next) {
  var page = req.page;
  var text = req.param('query');

  User.find(
    {
      $text: {$search: text}, 
      userType: 'teacher'
    })
    .skip(page.skip)
    .limit(page.limit)
    .lean()
    .exec(function(err, users) {
      if (err) return next(err);
      res.json(users);
    });
}