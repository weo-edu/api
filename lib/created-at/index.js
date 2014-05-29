/*
  Mongoose plugin that adds a createdAt field to every object
 */
module.exports = function(schema, options) {
  schema.add({createdAt: Date});

  schema.pre('save', function(next) {
    if(this.isNew)
      this.createdAt = new Date;
    next();
  });
};