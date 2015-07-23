var User = require('lib/User').model
var errors = require('lib/errors')
var access = require('lib/access')

module.exports = function() {
  return function(req, res, next) {
    if(! req.socket.auth) {
      req.socket.userType === 'guest'
      req.socket.tokens = [access.encode('public', 'teacher')]
      return next()
    }

    User.findById(req.socket.auth.id, function(err, user) {
      if(err) throw err
      if(! user) return errors.NotFound('User not found')

      req.socket.userType = user.userType
      req.socket.tokens = user.tokens().reduce(function(memo, token) {
        memo[token] = true
        return memo
      }, {})

      next()
    })
  }
}