var StatusSchema = require('./schema');

StatusSchema.method('verb', function() {
  var share = this.share();
  if (this.status === 'active' && share.parent.id === share.root.id) {
    return 'published';
  } else if (this.status === 'active') {
    return 'turned in';
  }
});

module.exports = {schema: StatusSchema};