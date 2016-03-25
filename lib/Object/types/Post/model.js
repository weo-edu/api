var PostSchema = require('./schema')
var markdown = require('lib/markdown')
var striptags = require('striptags')
var katexMathMLRegEx = /<math>.*?<\/math>/g

PostSchema.method('verb', function() {
  return 'shared'
})

PostSchema.method('autograde', function () {})

// XXX This is duplicated in Question/model, it would be nice
// to not have to duplicate this code
PostSchema.pre('validate', function(next) {
  var share = this.share()

  if(share.isSheet() && (this.isModified('originalContent') || this.isNew)) {
    this.content = markdown(this.originalContent || '')
    this.displayName = striptags(this.content.replace(katexMathMLRegEx, ''))
  }

  next()
})

module.exports = {schema: PostSchema}