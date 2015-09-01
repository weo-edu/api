/**
 * Imports
 */

var QuestionSchema = require('./schema')
var markdown = require('lib/markdown')
var strip = require('strip')
var _ = require('lodash')

/**
 * Vars
 */

var katexMathMLRegEx = /<math>.*<\/math>/g

/**
 * Question model
 */

QuestionSchema.method('autograde', function () {
  if (this.isAutoGradable()) {
    this.points.scaled = +this.isCorrect()
  }
})

// XXX This is duplicated in Post/model, it would be nice
// to not have to duplicate this code
QuestionSchema.pre('validate', function (next) {
  var share = this.share()

  if (share.isSheet() && (this.isModified('originalContent') || this.isNew)) {
    this.content = markdown(this.originalContent || '')
    this.displayName = strip(this.content.replace(katexMathMLRegEx, ''))
  }

  next()
})

QuestionSchema.pre('save', function randomizeChoices (next) {
  var share = this.share()

  if (share.isNew && share.isInstance()
    && this.responseType === 'choice' && this.isGradable()) {
    this.attachments = _.shuffle(this.attachments)
  }

  next()
})

/**
 * Exports
 */

module.exports = {schema: QuestionSchema}
