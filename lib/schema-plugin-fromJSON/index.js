var mongoose = require('mongoose');
var DocumentArray = mongoose.Types.DocumentArray;

module.exports = function(schema) {
  schema.method('fromJSON', function fromJSON(doc, opts) {
    opts = opts || {};
    
    // If we get passed a mongoose model, use its
    // _doc property
    if(doc._doc) {
      // Do nothing if we're trying to update from an old
      // version of the document
      if(doc.__v < this.__v)
        return;
      doc = doc.toJSON();
    }


    function get(doc, path) {
      return path.split('.').reduce(function(memo, part) {
        return memo && memo[part];
      }, doc);
    }
    
    var model = this;
    model.schema.eachPath(function(key, path) {
      // Dont manipulate trusted fields in an untrusted
      // fromJSON
      if(opts.trusted === false && path.options.trusted) {
        return;
      }
      
      var old = model.get(key);
      if(old && old.fromJSON) {
        old.fromJSON(get(doc, key), opts);
      } else if(old instanceof DocumentArray) {
        var newArr = get(doc, key) || [];       
        newArr.forEach(function(item, idx) {
          var subkey = key + '.' + idx;
          var subdoc = get(doc, subkey);
          
          if(! old[idx]) {
            old.push(subdoc);
            return;
          }
          
          fromJSON.call(old[idx], subdoc, opts);
        });
        
        // If the old array is longer than the new one
        // get rid of the trailing elements
        while(old.length > newArr.length)
          old.pop();
      } else {
        model.set(key, get(doc, key));
      }
    });

    if(opts.reset !== false)
      this.$__reset();

    return this;
  });
};