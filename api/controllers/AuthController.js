/**
 * AuthController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */
var passwordHash = require('password-hash')
  , moment = require('moment')
  , _ = require('lodash')
  , Seq = require('seq');

module.exports = {
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to AuthController)
   */
  _config: {},
  _routes: {
    '@/login': 'login',
    '@/logout': 'logout',
    '@/user': 'user'
  },
  login: function(req, res) {
    var username = req.param('username')
      , password = req.param('password');

    User.findOne({username: username})
    .exec(function(err, user) {
      if(err) throw err;
      if(! user) {
        return res.clientError('User not found')
          .missing('auth', 'username')
          .send(404);
      }

      if(passwordHash.verify(password, user.password)) {
        Auth.createToken({id: user.id, username: user.username, role: user.type}
            , moment.duration(7, 'days').asSeconds()
            , function(err, token) {
              if(err) throw err;
              res.json({
                id: user.id,
                username: user.username,
                token: token,
                role: user.type
              });
            });
      } else {
        res.clientError('Incorrect password')
          .invalid('auth', 'password')
          .send(401);
      }
    });
  },
  logout: function(req, res) {
    // Stub, to maybe do something with later
    res.send(200);
  },
  user: function(req, res) {
    console.log('user');
    if(! req.user)
      return res.json(404);
    User.findOne(req.user.id)
      .exec(function(err, user) {
        if(err) throw err;
        res.json(user);
      });
  }
};