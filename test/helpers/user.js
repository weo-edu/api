/**
 * Imports
 */

var Faker = require('Faker')
var chai = require('chai')
var Seq = require('seq')
var Group = require('./group')
var _ = require('lodash')

/**
 * User Helper
 */

var User = module.exports = {
  me: function(authToken) {
    return request
      .get('/user')
      .set('Authorization', authToken)
      .end()
  },
  generate: function(opts) {
    opts = opts || {}
    var defaults = null
    if (opts.userType === 'student') {
      defaults = studentDefaults()
    } else {
      defaults = teacherDefaults()
    }
    _.defaults(opts, defaults)
    return opts
  },
  create: function(opts) {
    opts = User.generate(opts || {})
    return request
      .post('/auth/user')
      .send(opts)
      .end()
  },
  login: function(username, password) {
    return request
      .post('/auth/login')
      .send({username: username, password: password})
      .end()
  },
  get: function(id) {
    return request
      .get('/user/' + id)
      .end()
      .then(function(res) {
        return res.body
      })
  },
  follow: function(id, user) {
    return request
      .put('/user/' + id + '/follow')
      .set('Authorization', user.token)
      .end()
  },
  unfollow: function(id, user) {
    return request
      .del('/user/' + id + '/follow')
      .set('Authorization', user.token)
      .end()
  },
  followers: function(id, cb) {
    return request
      .get('/user/' + id + '/followers')
      .end()
      .then(function(res) {
        return res.body.items
      })
  },
  createAndLogin: function(opts) {
    var user
    opts = User.generate(opts || {})
    return User
      .create(opts)
      .then(function(res) {
        if(res.statusCode !== 201) throw new Error('User creation failed')
        user = res.body
        return User.login(opts.username, opts.password)
      })
      .then(function(res) {
        if(res.statusCode !== 200) throw new Error('User login failed')
        user.token = 'Bearer ' + res.body.token
        user.socketToken = res.body.token
        return user
      })
  },
  createTeacherStudentAndGroupAndLogin: function() {
    var res = {}
    return User
      .createAndLogin()
      .then(function(teacher) {
        res.teacher = teacher
        return Group.create({}, teacher)
      })
      .then(function(group) {
        res.group = group
        return User.createAndLogin({userType: 'student'})
      })
      .then(function(student) {
        res.student = student
        return Group.join(res.group, res.student).then(function() {
          return res
        })
      })
  },
  createStudentJoinGroupAndLogin: function(group) {
    return User
      .createAndLogin({userType: 'student'})
      .then(function(student) {
        return Group.join(group, student).then(function() {
          return student
        })
      })
  },
  updated: function(user, cb) {
    Seq()
      .seq(function() {
        User.me(user.token, this)
      })
      .seq(function(res) {
        var updated = res.body
        updated.token = user.token
        updated.socketToken = user.socketToken
        cb(null, updated)
      })
  },
  reset: function(token, password, cb) {
    request
      .put('/user/reset')
      .send({token: token, password: password})
      .end(cb)
  }
}

function teacherDefaults() {
  return {
    userType: 'teacher',
    name: {
      givenName: sanitize(Faker.Name.firstName()),
      familyName: sanitize(Faker.Name.lastName()),
      honorificPrefix: 'Mr.'
    },
    // Meaningless, but real-looking mongo id
    //groups: ['535729acad50c37bb9c84df3'],
    email: sanitize(Faker.Internet.email()).toLowerCase(),
    username: sanitize(Faker.Internet.userName()),
    password: 'testpassword'
  }
}

function studentDefaults() {
  var defaults = teacherDefaults()
  delete defaults.name.honorificPrefix
  delete defaults.email
  defaults.userType = 'student'
  return defaults
}

function sanitize(str) {
  return str.replace(/[^\s0-9a-zA-Z\@\.]/g, 'a')
}
