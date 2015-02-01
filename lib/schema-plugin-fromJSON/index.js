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
        var newArr = get(doc, key);
        newArr.forEach(function(item, idx) {
          var subkey = key + '.' + idx;
          var subdoc = get(doc, subkey);
          
          if(! old[idx]) {
            old.push(subdoc);
            return;
          }
          
          old[idx].fromJSON
            ? old[idx].fromJSON(subdoc, opts)
            : old[idx].set(subdoc);
        });
        
        while(old.length > newArr.length)
          old.pop();
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