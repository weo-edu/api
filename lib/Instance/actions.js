/**
 * Imports
 */

const ObjectId = require('mongodb').ObjectID
const mongoose = require('mongoose')
const Share = require('lib/Share')
const selfLink = require('lib/schema-plugin-selflink')
const awaitHooks = require('lib/schema-plugin-post')
const findIndex = require('@f/find-index')
const {grade, isAutoGradable, gradeQuestion, setResponse} = require('./model')
const io = require('lib/io')
const mongo = require('lib/mongo')

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

  const inst = req.share

  Share.model
    .findOne({_id: ObjectId(inst._parent[0].id)})
    .exec(function (err, share) {
      if (err) return next(err)

      share.object.attachments
        .filter(isAutoGradable)
        .forEach(att => {
          const instData = inst.responses[att._id] = inst.responses[att._id] || {response: [], score: 0}
          setResponse(inst, att._id, 'score', gradeQuestion(att, instData.response) ? 1 : 0)
        }, [0, 0])

      const score = grade(share, inst)
      inst.score = score
      inst.save(next)
    })
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
  const id = req.param('id')
  const questionId = req.param('questionId')
  const answer = [].concat(req.body.answer).filter(Boolean)

  mongo
    .collection('shares')
    .findOne({_id: ObjectId(id)})
    .set(`responses.${questionId}.response`, answer)
    .then(() => {
      res.status(200).send()

      mongoose
        .model('Share')
        .findOne({_id: ObjectId(id)}, {channels: true})
        .lean()
        .exec(function (err, inst) {
          if (err) return next(err)

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
              [`responses.${questionId}.response`]: answer
            }
          })
        })
    }, next)
}

function score (req, res, next) {
  const itemId = req.param('itemId')
  const score = req.body.scaled
  const inst = req.share

  setResponse(inst, itemId, 'score', score)

  Share.model
    .findOne({_id: ObjectId(inst._parent[0].id)})
    .exec((err, share) => {
      if (err) return next(err)

      inst.score = grade(share, inst)
      inst.save((err, inst) => {
        if (err) return next(err)
        res.send(200)
      })
    })
}

function annotate (req, res, next) {
  var objectId = req.param('objectId')

  var classId = req.share.contexts[0].descriptor.id
  var id = req.share._id

  var annotation = req.share.annotate(`share!${id}.${objectId}`)

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
