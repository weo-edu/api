/**
 * Imports
 */

var ObjectId = require('mongodb').ObjectID
var mongoose = require('mongoose')
var Share = require('lib/Share')
var selfLink = require('lib/schema-plugin-selflink')
var awaitHooks = require('lib/schema-plugin-post')
var findIndex = require('@f/find-index')
var q = require('q')
var io = require('lib/io')

/**
 * Actions
 */

function opened (req, res, next) {
  req.share.setOpened()

  req.share
    .save(function (err) {
      if (err) return next(err)
      res.send(200)
    })
}

function redo (req, res, next) {
  req.share.setOpened()

  req.share.showIncorrect = req.body.showIncorrect
  req.share
    .save(function (err) {
      if (err) return next(err)
      res.send(200)
    })
}

function turnedIn (req, res, next) {
  req.share.setTurnedIn()

  req.share
    .save(function (err) {
      if (err) return next(err)
      awaitHooks.onFlush(function () {
        res.send(200)
      })
    })
}

function graded (req, res, next) {
  req.share.setGraded()

  req.share
    .save(function (err) {
      if (err) return next(err)
      res.send(200)
    })
}

function returned (req, res, next) {
  req.share.setReturned()

  req.share
    .save(function (err) {
      if (err) return next(err)
      res.send(200)
    })
}

function autograde (req, res, next) {
  // If it has already been turned in, then
  // it's already been autograded.
  if (req.share.hasTurnedIn()) {
    return next()
  }

  q.resolve(req.share.object.autograde())
    .then(function () { next() }, next)
}

function update (req, res, next) {
  var inst = req.body
  selfLink.strip(inst)

  if (inst.__v >= req.share.__v) {
    var tmp = new Share.ShareInstance(inst)
    var data = tmp.instanceData()

    req.share.applyInstanceData(data)
    delete inst._object
    delete inst.object
    req.share.set(inst)

    req.share
      .save(function (err) {
        if (err) return next(err)
        res.send(200)
      })
  } else {
    next(errors.VersionMismatch('version mismatch', '__v', inst.__v, req.share.toJSON()))
  }
}

function answerQuestion (req, res, next) {
  var id = req.param('id')
  var questionId = req.param('questionId')
  var answer = [].concat(req.body.answer).filter(Boolean)

  mongoose
    .model('Share')
    .update(
      {_id: ObjectId(id), '_object.0.attachments': {$elemMatch: {_id: ObjectId(questionId)}}},
      {'_object.0.attachments.$.response': answer}
    )
    .exec(function (err) {
      err ? next(err) : res.status(200).send()

      mongoose
        .model('Share')
        .findOne({_id: ObjectId(id)})
        .lean()
        .exec(function (err, inst) {
          if (err) return next(err)

          const idx = findIndex(inst._object[0].attachments, obj => obj._id.toString() === questionId)

          io.sockets.to(inst.channels[0])
          io.sockets.to(inst._id)
          io.sockets.send({
            params: {
              id: inst._id,
              channel: inst.channels[0]
            },
            verb: 'diff',
            model: 'Share',
            data: {
              [`_object.0.attachments.${idx}.response`]: answer
            }
          })
        })
    })
}

function score (req, res, next) {
  var itemId = req.param('itemId')
  var scaled = req.body.scaled
  var item = req.share.object.find(itemId)

  item.points.scaled = scaled
  req.share.object.grade()
  req.share
    .save(function (err) {
      if (err) return next(err)
      res.send(200)
    })
}

function updateKhan (share, user) {
  return q.all(share.object.attachments.map(function (att) {
    if (att.objectType === 'khan' && att.isGradable()) {
      return att.updateKhan(user)
    }
  }))
}

function annotate (req, res, next) {
  var objectId = req.param('objectId')

  var classId = req.share.contexts[0].descriptor.id
  var sectionId = req.share._object[0]._id
  var id = req.share._id

  var annotation = req.share.annotate(`share!${id}.${sectionId}.${objectId}`)

  annotation.set({
    actor: req.me.toKey()
  })
  annotation.object.originalContent = req.body.originalContent
  annotation.save(function (err, model) {
    if (err) return next(err)
    res.send(model)
  })
}

/**
 * Exports
 */

module.exports = {
  opened: opened,
  redo: redo,
  turnedIn: turnedIn,
  graded: graded,
  returned: returned,
  autograde: autograde,
  update: update,
  answerQuestion: answerQuestion,
  score: score,
  annotate: annotate
}
