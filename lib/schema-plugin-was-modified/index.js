module.exports = function(Schema) {
  Schema.pre('save', function(next) {
    this.wasNew = this.isNew;
    next();
  });

  Schema.pre('save', function(next) {
    var paths = this.modifiedPaths();

    this.wasModified = function(path) {
      return paths.indexOf(path) !== -1;
    };
    next();
  });
};