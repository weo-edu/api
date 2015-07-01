var lock = require('redis-lock')(require('lib/redis').default)
var mongoose = require('mongoose')
var user

module.exports = function createWeoUser(next) {
  if(user) return next(null, user)

  lock('weo-user', function(done) {
    function complete(err, data) {
      next(err, data)
      done()
    }

    mongoose.model('User')
      .findOne({username: 'weotip'}, function(err, u) {
      if(err) return complete(err)
      if(u) return complete(null, user = u)

      mongoose.model('User').create({
        name: {
          givenName: 'Weo',
          familyName: 'Tips'
        },
        username: 'weotip',
        password: 'elliotTheMang',
        userType: 'admin'
      }, function(err, doc) {
        if(err) return complete(err)
        Avatar.set(doc._id, 'weo', function(err) {
          if(err) return complete(err)
          complete(nul, doc)
        })
      })
    })
  })
}