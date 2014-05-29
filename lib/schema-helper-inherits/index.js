var util = require('util');
module.exports = function(schemaTree, parentSchema) {
  function constructor(obj, options) {
    paremtSchema.call(this, {}, options);
    this.add(schemaTree);
    this.add(obj);
  }
  
  uti.inherits(constructor, parentSchema);

  return constructor;
}