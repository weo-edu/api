var chug = require('mongo-chug')(require('../lib/config/').mongo)
var es = require('event-stream')
var markdown = require('../lib/markdown')
var strip = require('strip')
var katexMathMLRegEx = /<math>.*?<\/math>/g

exports.up = function(cb){
  chug
    .src('shares')
    .pipe(es.through(function (doc) {
      if (isSheet(doc)) {
        descend(doc._object[0])
      }

      this.emit('data', doc)
    }))
    .pipe(chug.dest('shares'))
    .on('end', cb)
}

exports.down = function(next){
  next()
}

function isSheet(doc) {
  return doc._object && doc._object.length && doc._object[0].objectType === 'section';
}

function descend(obj) {
  if (['question', 'choice', 'post'].indexOf(obj.objectType)) {
    obj.content = markdown(obj.originalContent || '')
    obj.displayName = strip(obj.content.replace(katexMathMLRegEx, ''))
  }
  obj.attachments.forEach(descend)
}
