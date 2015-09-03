var Group = require('./model')
var Student = require('lib/Student').model
var errors = require('lib/errors')
var asArray = require('as-array')
var mail = require('lib/mail')
var q = require('q')

require('lib/crud')(exports, Group)

var create = exports.create
exports.create = function(req, res, next) {
  req.body.owners = req.body.owners || []
  req.body.owners.push(req.me.toKey())
  create(req, res, next)
}

exports.join = function(req, res, next) {
  req.params.id = req.group.id
  req.user = req.me
  exports.addUser(req, res, next)
}

exports.addUser = function(req, res, next) {
  if(! req.user) return next('addUser requires req.user')
  if(! req.group) return next('addUser requires req.group')

  if(! req.user.joinGroup(req.group))
    return next(errors.Client('User is already a member of that group', 'code'))

  req.user.save(function(err) {
    if (err) return next(err)
    res.json(req.group)
  })
}

exports.removeUser = function(req, res, next) {
  if(! req.user) return next('removeUser requires req.user')
  if(! req.group) return next('removeUser requires req.group')

  if(! req.user.leaveGroup(req.group)) {
    return next(errors.Client('User is not a member of that group'))
  }

  req.user.save(function(err) {
    if(err) return next(err)
    res.json(req.group)
  })
}

exports.archive = function(req, res, next) {
  if(! req.group)
    return next('Archive action requires req.group')

  req.group.archive().save(function(err, group) {
    if(err) return next(err)
    res.json(group)
  })
}

exports.lookup = function(req, res) {
  res.json(req.group)
}

exports.studentsInGroups = function(req, res, next) {
  var groups = asArray(req.param('group'))
  if (!groups.length)
    return res.json([])

  Student.find()
    .in('groups.id', groups)
    .lean()
    .exec(function(err, students) {
      if(err) return next(err)
      res.json(students)
    })
}

exports.invite = function (req, res, next) {
  var emails = req.body.emails || []

  q
    .all(emails.map(function (email) {
      return q.nfcall(mail.inviteStudent, email)
    }))
    .then(function () {
      res.send(200)
    }, next)
}