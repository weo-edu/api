/**
 * Imports
 */

const db = require('lib/monk')
const User = require('lib/User').model

/**
 * Constants
 */

const schools = db.get('schools')

/**
 * Actions
 */

function create (req, res, next) {
  req.me
  schools
    .insert(req.body)
    .then(
      school => {
        req.me.school = school._id
        req.me
          .save()
          .then(
            () => res.json(school),
            next
          )
      },
      next
    )
}

function get (req, res, next) {
  schools
    .findOne(req.param('id'))
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
  User
    .find({userType: 'student', school: req.param('id')})
    .exec((err, users) => {
      if (err) return next(err)
      res.json(users)
    })
}

function setProp (path) {
  return function (req, res, next) {
    const id = req.param('id')

    schools
      .update(id, {[path]: req.body.value})
      .then(
        () => res.ok(),
        next
      )
  }
}

function lookup (req, res, next) {
  // schools
  //   .find()
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
  lookup
}
