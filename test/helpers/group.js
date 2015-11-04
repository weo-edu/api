var idx = 0
var assign = require('object-assign')

var Group = module.exports = {
  generate: function(opts) {
    opts = opts || {}
    return assign({}, {
      displayName: 'Test Group ' + (idx++),
      groupType: 'class'
    }, opts)
  },
  addMember: function(group, user, token) {
    return request
      .put('/group/' + group.id + '/members/' + user)
      .set('Authorization', token)
  },
  join: function(group, user) {
    return request
      .put('/group/join/' + group.code)
      .set('Authorization', user.token)
  },
  create: function(opts, user) {
    opts = Group.generate(opts)
    return request
      .post('/group')
      .send(opts)
      .set('Authorization', user.token)
      .then(function(res) {
        return res.body
      })
  },
  createBoard: function(opts, user) {
    opts = Group.generate(opts)
    delete opts.groupType
    return request
      .post('/board')
      .send(opts)
      .set('Authorization', user.token)
      .then(function(res) {
        return res.body
      })
  },
  follow: function(id, user) {
    return request
      .put('/board/' + id + '/follow')
      .set('Authorization', user.token)
  },
  unfollow: function(id, user) {
    return request
      .del('/board/' + id + '/follow')
      .set('Authorization', user.token)
  },
  followers: function(id) {
    return request
      .get('/board/' + id + '/followers')
      .then(function(res) {
        return res.body.items
      })
  }
}
