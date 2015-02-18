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
      if(doc.__v < this.__v) {
        return;
      }
      doc = doc.toJSON();
    }


    function get(doc, path) {
      return path.split('.').reduce(function(memo, part) {
        return memo && memo[part];
      }, doc);
    }

    var model = this;
    // If this model has a schema discriminator, make sure that
    // we rediscriminate before we do anything else
    var discKey = model.schema.options.discriminatorKey;
    if(discKey && model[discKey] !== doc[discKey]) {
      model[discKey] = doc[discKey];
    }

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
        var idMap = {};
        old.forEach(function(item) {
          if(item._id) idMap[item._id] = item;
        });

        var newArr = get(doc, key) || [];

        // First re-order the old list to look as similar
        // to the new one as possible
        //
        // These cannot be collapsed into a single .forEach
        // without risking overwriting something that we
        // still need during the loop
        newArr.forEach(function(item, idx) {
          if(idMap[item._id]) {
            // We can't use mongoose's splice here because it gets upset
            // when if an item we are splicing *in* has no parent, because
            // we had spliced it out previously
            Array.prototype.splice.call(old, idx, 1, idMap[item._id]);
            old._registerAtomic('$set', old);
            old._markModified();
          }
        });

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
        var val = get(doc, key);
        var type = model.schema.path(key);

        if(val === undefined)
          val = type.getDefault(model, true);

        model.set(key, val);
      }
    });

    if(opts.reset !== false)
      this.$__reset();

    return this;
  });
};