/**
 * Imports
 */

const Schools = require('./model')

/**
 * Actions
 */

function create (req, res, next) {
  const {name, logo, ownerId = req.me.id, color, location} = req.body

  Schools
    .create(name, ownerId, logo, color, location)
    .then(school => Schools.join(school._id, req.me))
    .then(
      () => res.send(200),
      next
    )
}

function get (req, res, next) {
  Schools
    .get(req.param('id'))
    .then(
      school => school ? res.json(school) : res.send(404),
      next
    )
}

function mySchool (req, res, next) {
  if (!req.me || !req.me.school) return res.send(404)

  Schools
    .get(req.me.school)
    .then(
      school => school ? res.json(school) : res.send(404),
      next
    )
}

function getTeachers (req, res, next) {
  Schools
    .getTeachers(req.param('id'))
    .then(
      users => res.json(users),
      next
    )
}

function getStudents (req, res, next) {
  const sort = req.param('sort') || 'name.familyName'
  const dir = req.param('dir') || 'asc'

  return School.getStudents(
    req.param('id'),
    {[sort]: dir},
    req.page.skip,
    req.page.limit
  ).then(
    students => res.json(students),
    next
  )
}

function setProp (path) {
  return function (req, res, next) {
    Schools
      .setProp(req.param('id'), path, req.body.value)
      .then(
        () => res.send(200),
        next
      )
  }
}

function lookup (req, res, next) {
  Schools
    .lookup(req.param('query'))
    .then(
      schools => res.json(schools),
      next
    )
}

function joinSchool (req, res, next) {
  Schools
    .join(req.param('id'), req.me)
    .then(
      () => res.send(200),
      next
    )
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
