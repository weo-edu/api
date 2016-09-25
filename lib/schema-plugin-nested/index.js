module.exports = function(schema) {
  schema.nested = function(name, nestedSchema, opts) {
    var obj = {};
    var privName = '_' + name;

    opts = opts || {};
    opts.type = [nestedSchema];
    obj[privName] = opts;
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
