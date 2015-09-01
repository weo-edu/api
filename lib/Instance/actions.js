/**
 * Imports
 */

var Share = require('lib/Share')
var selfLink = require('lib/schema-plugin-selflink')

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

function turnedIn (req, res, next) {
  req.share.setTurnedIn()
  req.share
    .save(function (err) {
      if (err) return next(err)
      res.send(200)
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

  req.share.object
    .autograde()
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
  var question = req.share.object.find(req.param('questionId'))
  if(! question || question.objectType !== 'question')
    return next(new Error('Question not found (' + req.param('questionId') + ')'))

  question.response = req.body.answer
  req.share.save(function (err) {
    if(err) return next(err)
    res.status(200).send()
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



/**
 * Exports
 */

module.exports = {
  opened: opened,
  turnedIn: turnedIn,
  graded: graded,
  returned: returned,
  autograde: autograde,
  update: update,
  answerQuestion: answerQuestion,
  score: score
}