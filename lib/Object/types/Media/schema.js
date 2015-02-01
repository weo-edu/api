var ObjectSchema = require('lib/Object/schema');
var MediaSchema = {
  displayName: String,
  originalContent: {
    type: String,
    required: true
  },
  content: String,
  image: {
    url: String
  },
  description: String,
  embed: {
    url: String,
    type: {
      type: String
    }
  }
};

/**
 * LinkSchema
 */
var LinkSchema = ObjectSchema.discriminator('link', MediaSchema);

/**
 * DocumentSchema
 */
 var DocumentSchema = ObjectSchema.discriminator('document', MediaSchema);
 /**
  * ImageSchema
  */
 var ImageSchema = ObjectSchema.discriminator('image', MediaSchema);

 /**
  * VideoSchema
  */
 var VideoSchema = ObjectSchema.discriminator('video', MediaSchema);

 module.exports = {
  Link: LinkSchema,
  Document: DocumentSchema,
  ImageSchema: ImageSchema,
  VideoSchema: VideoSchema
};