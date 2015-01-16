var StatusSchema = require('./schema');

StatusSchema.method('verb', function() {
  if (this.status === 'active' && this.share().parent.id === this.share().root.id) {
    return 'published';
  } else if (this.status === 'active') {
    return 'turned in';
  }
});

module.exports = {schema: StatusSchema}