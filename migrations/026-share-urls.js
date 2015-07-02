var chug = require('mongo-chug')(require('../lib/config/').mongo)
var es = require('event-stream')

exports.up = function(next){
  chug
    .src('shares', {})
    .pipe(es.through(function(share) {
      fixProp(share, '_root')
      fixProp(share, '_parent')
      fixProp(share, '_forked')
      fixProp(share, '_forkedSource')
      this.emit('data', share)
    }))
    .pipe(chug.dest('shares'))
    .on('end', next)
};

exports.down = function(next){
  next()
}

function fixProp(share, prop) {
  if(share[prop] && share[prop][0] && isBad(share[prop][0].url))
    share[prop][0].url = fix(share[prop][0].url)
}

function isBad(url) {
  return url && url.indexOf('/share/') !== -1
}

function fix(url) {
  return url.replace('/share/', '/activity/')
}
