var ObjectSchema = require('lib/Object/schema');

/**
 * LinkSchema
 */
var LinkSchema = ObjectSchema.discriminator('link', {
  displayName: {
    required: true
  },
  content: {
    required: true
  }
});

/**
 * DocumentSchema
 */
 var DocumentSchema = ObjectSchema.discriminator('document', {
   displayName: {
     required: true
   },
   image: {
     url: {
       required: true
     }
   },
   embed: {
     url: {
       required: true
     },
     type: {
       required: true
     }
   }
 });

 /**
  * ImageSchema
  */
 var ImageSchema = ObjectSchema.discriminator('image', {
  image: {
    url: {
      required: true
    }
  }
});

 /**
  * VideoSchema
  */
 var VideoSchema = ObjectSchema.discriminator('video', {
   providerName: {type: String},
   displayName: {
     required: true
   },
   content: {
     required: true
   },
   image: {
     url: {
       required: true
     }
   },
   embed: {
     url: {
       required: true
     },
     type: {
       required: true
     }
   }
 });


 module.exports = {
  Link: LinkSchema,
  Document: DocumentSchema,
  ImageSchema: ImageSchema,
  VideoSchema: VideoSchema
};