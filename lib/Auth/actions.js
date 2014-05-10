var actions = module.exports;
var Auth = require('./model');
var moment = require('moment');
var errors = require('lib/errors');

actions.login = function(req, res, next) {
  var user = req.user;
  var password = req.param('password');
  if(user.checkPassword(password)) {
    var data = {id: user.id, username: user.username, role: user.userType};
    Auth.createToken(data, moment.duration(365, 'days').asSeconds(), function(err, token) {
      if(err) return next(err);
      data.token = token;
      res.json(data);
    });
  } else
    next(errors.Authentication('Incorrect password', 'password', password));
};

actions.logout = function(req, res, next) {
  Auth.destroyToken(req.access_token, function(err) {
    if(err) return next(err);
    res.end();
  });
};