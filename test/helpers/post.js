var Faker = require('Faker')
var Share = require('./share')
var _ = require('lodash')

var Post = module.exports = {
  generate: function(opts, groups) {
    var share = Share.generate(opts, groups)
    delete share.verb
    _.defaults(share.object, {
      originalContent: Faker.Lorem.paragraph(),
      objectType: 'post'
    })
    return share
  },

  create: function(token, type, opts, groups) {
    var share = Post.generate(opts, groups)
    share.object.objectType = type
    return request
      .post('/share')
      .send(share)
      .set('Authorization', token)
  }
}
