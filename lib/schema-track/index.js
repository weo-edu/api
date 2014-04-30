var propertyPath = require('property-path');

module.exports = function(Schema) {

  Schema.post('init', function() {
    this.$previous = this.toObject();
  });

  Schema.post('save', function() {
    this.$previous = this.toObject();
  })

  Schema.method('previous', function(path) {
    return propertyPath.get(this.$old, path);
  });

}