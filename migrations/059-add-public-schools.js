const _ = require('lodash')
const db = require('lib/monk')
const Schools = db.get('schools')
const Channels = db.get('channels')
var to = require('to-case')
var csv = require('csv')
var fs = require('fs')

exports.up = function (cb) {
  var data = fs.readFileSync(process.cwd() + '/migrations/schools.csv', 'utf8')

  setTimeout(() => {
    csv.parse(data, (err, data) => {
      if (err) {
        console.log('err', err)
        throw err
      }

      insert(1, cb)

      function insert (n, cb) {
        console.log('insert', n)
        if (n >= data.length) return cb()
        const school = normalize(data[n])

        create(school[1], '', '', '', school[2], school[3], school[4], school[5], {schid: school[0]})
          .then(() => insert(++n, cb), err => console.log('err', err, cb(err)))
      }
    })
  }, 2000)
}

exports.down = function (next) {
  next()
}


function normalize (school) {
  school[1] = transform(school[1])
  school[2] = to.capital(school[2])
  school[3] = to.capital(school[3])
  school[4] = to.upper(school[4])
  return school
}

function transform (str) {
  return str.split(' ').map(p => {
    if (/^schl\.?$/i.test(p)) return 'School'
    if (/^sch\.?$/i.test(p)) return 'School'
    if (/^elem\.?$/i.test(p)) return 'Elementary'
    if (/^ele\.?$/i.test(p)) return 'Elementary'
    if (/^mid\.?$/i.test(p)) return 'Middle'
    if (/^alt\.?$/i.test(p)) return 'Alternative'
    if (/^educ\.?$/i.test(p)) return 'Education'
    if (/^ed\.?$/i.test(p)) return 'Education'
    if (/^edu\.?$/i.test(p)) return 'Education'
    if (/^acd\.?$/i.test(p)) return 'Academy'
    if (/^acad\.?$/i.test(p)) return 'Academy'
    if (/^acadc\.?$/i.test(p)) return 'Academic'
    if (/^ent\.?$/i.test(p)) return 'Entrepreneurs'
    if (/^lrning\.?$/i.test(p)) return 'Learning'
    if (/^lrng\.?$/i.test(p)) return 'Learning'
    if (/^lrn\.?$/i.test(p)) return 'Learning'
    if (/^sci\.?$/i.test(p)) return 'Science'
    if (/^soc\.?$/i.test(p)) return 'Social'
    if (/^engr\.?$/i.test(p)) return 'Engineering'
    if (/^ctr\.?$/i.test(p)) return 'Center'
    if (/^cntr\.?$/i.test(p)) return 'Center'
    if (/^comm\.?$/i.test(p)) return 'Community'
    if (/^ctr\.?$/i.test(p)) return 'Center'
    if (/^reg\.?$/i.test(p)) return 'Regional'
    if (/^hlth\.?$/i.test(p)) return 'Health'
    if (/^univ\.?$/i.test(p)) return 'University'
    if (/^inter\.?$/i.test(p)) return 'International'
    if (/^interm\.?$/i.test(p)) return 'Intermediate'
    if (/^voc\.?$/i.test(p)) return 'Vocational'
    if (/^perf\.?$/i.test(p)) return 'Performing'
    if (/^pk\.?$/i.test(p)) return 'Park'
    if (/^prg\.?$/i.test(p)) return 'Program'

    if (/^[A-Z\-\/\\\(\)]{3,}$/.test(p) && /[A,E,I,O,U,Y]/.test(p)) {
      return capitalize(p)
    }

    return p
  }).join(' ')
}

function capitalize (word) {
  word = word.toLowerCase()

  return word.replace(/((?:^|[\(\-\\\/)])[a-z])/g, m => m.length === 2
    ? m[0] + m[1].toUpperCase()
    : m[0].toUpperCase()
  )
}

function create (name, ownerId, logo, color, street, city, state, zip, extras = {}) {
  // Convert ObjectId's to strings if they aren't
  // already
  ownerId = (ownerId || '').toString()

  return Schools
    .insert(_.extend({name, ownerId, logo, color, street, city, state, zip}, extras))
    .then(
      school => {
        return createChannel('School Discussion', school._id)
          .then(
            () => school
          )
      })

}

function createChannel (name, ownerId) {
  // Convert ObjectId's to strings, if they aren't
  // already
  ownerId = ownerId.toString()

  return Channels
    .insert({
      name,
      createdAt: +new Date(),
      ownerId
    })
}
