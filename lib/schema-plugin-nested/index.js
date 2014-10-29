module.exports = function(schema) {
  schema.nested = function(name, nestedSchema) {
    var obj = {};
    var privName = '_' + name;
    obj[privName] = [nestedSchema];
    schema.add(obj);

    schema.virtual(name).get(function() {
      return this[privName] && this[privName][0];
    }).set(function(val) {
      if(this[privName].length)
        this[privName].pop();
      // Dont actually push the value if its null
      val && this[privName].push(val);
    });
  };
};