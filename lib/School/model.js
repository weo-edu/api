/**
 * Imports
 */

const io = require('./io')
const _ = require('lodash')
const db = require('lib/monk')
const Schools = db.get('schools')
const User = require('lib/User').model
const Channels = require('lib/Channels').model

Schools.index({
  name: 'text',
  location: 'text'
})

/**
 * Model
 */

function create (name, ownerId, logo, color, street, city, state, zip, extras = {}) {
  // Convert ObjectId's to strings if they aren't
  // already
  ownerId = (ownerId || '').toString()

  return Schools
    .insert(_.extend({name, ownerId, logo, color, street, city, state, zip}, extras))
    .then(
      school => {
        io.emit('add', school._id)

        return Channels
          .create('School Discussion', school._id)
          .then(
            () => school
          )
      })

}

function get (id) {
  return Schools.findOne(id).then(prepareOne)
}

function getTeachers (id) {
  return new Promise((resolve, reject) => {
    User
      .find({userType: 'teacher', school: id})
      .exec((err, users) => err ? reject(err) : resolve(users))
  })
}

function getStudents (id, sort, skip, limit) {
  return new Promise((resolve, reject) => {
    const query = User
      .find({userType: 'student', school: id})

    if (sort) query.sort(sort)
    if (skip) query.skip(skip)
    if (limit) query.limit(limit)

    query.exec((err, users) => err ? reject(err) : resolve(users))
  })
}

function setProp (id, path, value) {
  return Schools
    .update(id, {$set: {[path]: value}})
    .then(res => {
      io.emit('update', id)
      return res
    })
}

function setLocation (id, city, state) {
  return Schools
    .update(id, {$set: {city, state}})
    .then(res => {
      io.emit('update', id)
      return res
    })
}

function lookup (query = '') {
  return Schools
    .find({$text: {$search: query}}, {limit: 100})
}

function join (id, user) {
  return Schools
    .findOne(id)
    .then(
      school => {
        if (!school) return

        const classIds = user.groups
          .filter(g => g.groupType === 'class')
          .map(g => g.id)

        return new Promise((resolve, reject) => {
          User
            .find({userType: 'student', 'groups.id': {$in: classIds}})
            .exec((err, students) => {
              if (err) return reject(err)

              Promise.all(students.map(student => {
                student.school = school._id
                return student.save()
              })).then(resolve, reject)
            })
        })
      }
    )
    .then(
      () => {
        user.school = id
        return user.save()
      })
}

function prepareOne (school) {
  return school && Channels
    .list(school._id)
    .then(channels => {
      school.channels = channels
      return school
    })
}

/**
 * Exports
 */

exports.create = create
exports.get = get
exports.getTeachers = getTeachers
exports.getStudents = getStudents
exports.setProp = setProp
exports.lookup = lookup
exports.join = join
exports.db = Schools
exports.setLocation = setLocation
