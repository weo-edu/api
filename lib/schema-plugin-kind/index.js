var mongoose = require('mongoose');
var _ = require('lodash');
var cache = {};


function rootModelName(model) {
  var db = mongoose;

  function isRoot(modelName) {
    return !! (db.models[modelName] && db.models[modelName].discriminators);
  }

  function isRelated(A, B) {
    return A.collection.name === B.collection.name;
  }

  if(cache[model.modelName]) return cache[model.modelName];
  var childName = model.modelName;
  if(! isRoot(childName)) {
    // Find any other model on the same collection that is a
    // 'root model' (i.e. has discriminators).  If one is not found
    // then this model must be a root model that just doesn't
    // have any discriminators, so it is its own root.
    model = _.find(db.models, function(cur) {
      return cur !== model && isRelated(cur, model) && isRoot(cur.modelName);
    }) || model;
  }

  return (cache[childName] = model.modelName);
}

module.exports = function(Schema) {
  Schema.add({
    kind: {
      type: String,
      default: function() {
        return rootModelName(this.constructor);
      },
      get: function() {
        return rootModelName(this.constructor);
      },
      set: function() {
        return rootModelName(this.constructor);
      }
    }
  });
};