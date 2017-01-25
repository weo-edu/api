/**
 * Imports
 */

const Group = require('lib/Group').model
const User = require('lib/User').model
const Schools = require('./model')
const io = require('./io')

/**
 * Actions
 */

function create (req, res, next) {
  Schools
    .insert(req.body)
    .then(
      school => {
        req.me.school = school._id
        req.me
          .save(function (err, user) {
            if (err) return next(err)
            io.emit('add', school._id)
            res.json(school)
          })
      }
    )
    .then(null, next)
}

function get (req, res, next) {
  Schools
    .findOne(req.param('id'))
    .then(
      school => res.json(school),
      next
    )
}

function mySchool (req, res, next) {
  if (!req.me || !req.me.school) return res.send(404)

  Schools
    .findOne(req.me.school)
    .then(
      school => res.json(school),
      next
    )
}

function getTeachers (req, res, next) {
  User
    .find({userType: 'teacher', school: req.param('id')})
    .exec((err, users) => {
      if (err) return next(err)
      res.json(users)
    })
}

function getStudents (req, res, next) {
  const sort = req.param('sort') || 'name.familyName'
  const dir = req.param('dir') || 'asc'

  const query = User
    .find({userType: 'student', school: req.param('id')})
    .sort({[sort]: dir})
    .skip(req.page.skip)
    .limit(req.page.limit)
    .exec((err, users) => {
      if (err) return next(err)
      res.json(users)
    })
}

function setProp (path) {
  return function (req, res, next) {
    const id = req.param('id')

    Schools
      .update(id, {$set: {[path]: req.body.value}})
      .then(
        () => {
          io.emit('update', id)
          res.send(200)
        }
      )
      .then(null, next)
  }
}

function lookup (req, res, next) {
  const query = req.param('query') || ''

  Schools
    .find({$text: {$search: query}})
    .then(
      schools => res.json(schools),
      next
    )
}

function joinSchool (req, res, next) {
  Schools
    .findOne(req.param('id'))
    .then(
      school => {
        if (!school) return res.send(404)

        const classes = req.me.groups
          .filter(g => g.groupType === 'class')
          .map(g => g.id)

        User
          .find({userType: 'student', 'groups.id': {$in: classes}})
          .exec((err, students) => {
            if (err) return next(err)
            if (!students) return res.send(200)

            Promise.all(students.map(student => {
              student.school = school._id
              return student.save()
            })).then(
              () => res.send(200),
              next
            )
          })
      }
    )
    .then(null, next)
}

/**
 * Exports
 */

module.exports = {
  create,
  get,
  getTeachers,
  getStudents,
  setProp,
  lookup,
  joinSchool,
  mySchool
}
