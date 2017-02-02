/**
 * Imports
 */

var QuestionSchema = require('./schema')
var inputs = require('./inputs')
var markdown = require('lib/markdown')
var strip = require('strip')
var _ = require('lodash')

/**
 * Vars
 */

var katexMathMLRegEx = /<math>.*?<\/math>/g

/**
 * Question model
 */

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

inputs.Choice.pre('validate', function (next) {
  var share = this.share()
  if (share.isSheet() && (this.isModified('originalContent') || this.isNew)) {
    this.content = markdown(this.originalContent || '')
    this.displayName = strip(this.content.replace(katexMathMLRegEx, ''))
  }

  next()
})

/**
 * Exports
 */

module.exports = {schema: QuestionSchema}
