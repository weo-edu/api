/*
  Mongoose plugin that adds a createdAt field to every object
 */
module.exports = function(schema, options) {
  schema.add({updatedAt: Date});

  schema.pre('save', function(next) {
    if(!this.isNew)
      this.updatedAt = new Date;
    next();
  });
};