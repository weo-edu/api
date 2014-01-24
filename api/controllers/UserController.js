/**
 * UserController
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
  , redis = require('redis').createClient()
  , crypto = require('crypto')
  , Seq = require('seq');

module.exports = {
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to UserController)
   */
  _config: {},
  _routes: {
    '@/login': 'login',
    '@/testAuthMethod': 'testAuthMethod',
    'POST @/:user/group': {
      controller: 'group',
      action: 'createNew'
    }
  },
  login: function(req, res) {
    var username = req.param('username')
      , password = req.param('password');

    User.findOne({username: username})
    .exec(function(err, user) {
      if(err) throw err;
      if(! user) {
        return res.clientError(404, 'User not found')
          .missing('User', 'username')
          .send(); 
      }

      if(passwordHash.verify(password, user.password)) {
        Seq()
          .seq(function() {
            crypto.randomBytes(16,this);
          })
          .seq(function(buf) {
            this.vars.token = buf.toString('base64');
            redis.set(this.vars.token, user.username, this);
          })
          .seq(function() {
            redis.expire(this.vars.token, 
              moment.duration(7, 'days').asSeconds(), 
              this);
          })
          .seq(function() {
            res.json({token: this.vars.token});
          })
          .catch(function(err) {
            throw err;
          });
      } else {
        res.clientError(401, 'Incorrect password')
          .invalid('User', 'password')
          .send();
      }
    });
  },
  testAuthMethod: function(req, res) {
    console.log('testAuthMethod called!', req.user);
    res.send(200);
  }
};
