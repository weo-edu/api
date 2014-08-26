var mongoose = require('mongoose');

var cache = {};

function isRoot(model) {
  return !! mongoose.models[model.modelName];
}

function rootModelName(model) {
  if(cache[model.modelName]) return cache[model.modelName];
  if(isRoot(model))
    return (cache[model.modelName] = model.modelName);

  for(var key in mongoose.models) {
    if(mongoose.models.hasOwnProperty(key)) {
      if(mongoose.models[key].collection.name === model.collection.name) {
        return (cache[model.modelName] = key);
      }
    }
  }
}

module.exports = function(Schema) {
  console.log('Schema', Schema);
  Schema.virtual('kind').get(function() {
    return rootModelName(this.constructor);
  });
};