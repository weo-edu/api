var actions = module.exports;
var Auth = require('./model');
var moment = require('moment');

actions.login = function(req, res, next) {
  var user = req.user;
  if(! req.user) {
    return res.send(404, {message: 'User not found'});
  }

  var password = req.param('password');
  if(user.checkPassword(password)) {
    var data = {id: user.id, username: user.username, role: user.type};
    Auth.createToken(data, moment.duration(365, 'days').asSeconds(), function(err, token) {
      if(err) throw err;
      data.token = token;
      res.json(data);
    });
  } else {
    // XXX Maybe abstract this error creation process in some way
    res.send(401, {
      name: 'ValidationError',
      message: 'Incorrect password',
      errors: {
        password: {
          message: 'Invalid password',
          name: 'ValidationError',
          path: 'password',
          type: 'required',
          value: password
        }
      }
    });
  }
};

actions.logout = function(req, res, next) {
  Auth.destroyToken(req.access_token, function(err) {
    if(err) throw err;
    res.end();
  });
};