/*
  Mongoose plugin that adds a createdAt field to every object
 */
module.exports = function(Schema) {
  Schema.add({createdAt: Date});

  Schema.pre('save', function(next) {
    if(this.isNew)
      this.createdAt = new Date;
    next();
  });
};