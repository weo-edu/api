var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');

var types = ['link', 'video', 'image', 'document'];

exports.up = function(next){
  chug.src('shares', {})
    .pipe(es.through(function(doc) {
      var arr = doc._object[0].attachments || [];
      arr.forEach(function(att) {
        if(! att.originalContent && types.indexOf(att.objectType) !== -1)
          att.originalContent = att.embed && att.embed.url;
        delete att.providerName;
      });

      this.emit('data', doc);
    }))
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
