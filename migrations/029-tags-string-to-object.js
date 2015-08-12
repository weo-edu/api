var chug = require('mongo-chug')(require('../lib/config/').mongo)
var es = require('event-stream')

exports.up = function(next){
  chug.src('shares', {})
    .pipe(es.through(function(doc) {
      doc.tags = (doc.tags || []).map(function(tag) {
        return {displayName: tag}
      })
      this.emit('data', doc)
    }))
    .pipe(chug.dest('shares'))
    .on('end', next)
}

exports.down = function(next){
  next()
}
