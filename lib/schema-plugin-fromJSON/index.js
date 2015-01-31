var mongoose = require('mongoose');
var DocumentArray = mongoose.Types.DocumentArray;

module.exports = function(schema) {
  schema.method('fromJSON', function(doc, opts) {
    // If we get passed a mongoose model, use its
    // _doc property
    if(doc._doc) {
      // Do nothing if we're trying to update from an old
      // version of the document
      if(doc.__v < this.__v)
        return;
      doc = doc.toJSON();
    }

    var self = this;

    function get(doc, path) {
      return path.split('.').reduce(function(memo, part) {
        return memo && memo[part];
      }, doc);
    }

    Object.keys(this.schema.paths).forEach(function(key) {
      var old = self.get(key);
      if(old && old.fromJSON) {
        old.fromJSON(get(doc, key), opts);
      } else if(old instanceof DocumentArray) {
        // We do it in this weird iterative way so that we can be sure
        // mongoose captures all the removals and additions properly
        while(old.length)
          old.shift();

        var newArr = get(doc, key);
        newArr.forEach(function(item) {
          old.push(item);
        });
      } else {
        self.set(key, get(doc, key));
      }
    });

    opts = opts || {};
    if(opts.reset !== false)
      this.$__reset();

    return this;
  });
};