var actions = module.exports;
var Auth = require('./model');
var moment = require('moment');
var _ = require('lodash');

actions.login = function(req, res, next) {
  var user = req.user;
  user = user.toJSON();
  var data = _.pick(user, 'id', 'userType', 'username');
  data.username = data.username.toLowerCase();
  Auth.createToken(data, moment.duration(365, 'days').asSeconds(), function(err, token) {
    if(err) return next(err);
    user.token = token;
    res.json(user);
  });
};

actions.logout = function(req, res, next) {
  Auth.destroyToken(req.access_token, function(err) {
    if(err) return next(err);
    res.end();
  });
};

