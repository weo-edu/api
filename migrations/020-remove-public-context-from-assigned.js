var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');
var _ = require('lodash');


exports.up = function(next){
  chug.src('shares', {})
    .pipe(es.through(function(doc) {
      if (isSheet(doc)) {
        addOwnerContext(doc);
        removePublicContext(doc);
      }
      this.emit('data', doc);
    }))
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};

var meDescriptor = {displayName: "Me", id: "me", url: "/"};

function addOwnerContext(doc) {
  var lastContext = doc.contexts[doc.contexts.length - 1];
  if (lastContext.descriptor.id === 'me')
    return;

  var context = {
    allow: [_.extend(doc.actor, {id: 'user:teacher:' + doc.actor.id})],
    descriptor: meDescriptor
  };

  doc.contexts.push(context);
}

function removePublicContext(doc){
  var findIdx = _.findIndex(doc.contexts, function(ctx) {
    return ctx.descriptor.id === 'public';
  });
  if (findIdx > 0)
    doc.contexts.splice(findIdx, 1);
}

function isSheet(doc) {
  return doc.shareType === 'share' && doc._object && doc._object.length && doc._object[0].objectType === 'section';
}