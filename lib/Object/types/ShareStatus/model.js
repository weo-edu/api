var StatusSchema = require('./schema')

StatusSchema.method('verb', function() {
  return this.status
})

module.exports = {schema: StatusSchema}