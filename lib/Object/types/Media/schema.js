/**
 * Imports
 */

var ObjectSchema = require('lib/Object/schema')

/**
 * MediaScheam
 */

var MediaSchema = {
  displayName: String,
  providerName: String,
  originalContent: {
    type: String,
    required: true
  },
  originalFilename: String,
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
}

/**
 * LinkSchema
 */

var LinkSchema = ObjectSchema.discriminator('link', MediaSchema)

/**
 * DocumentSchema
 */

var DocumentSchema = ObjectSchema.discriminator('document', MediaSchema)

/**
 * ImageSchema
 */

var ImageSchema = ObjectSchema.discriminator('image', MediaSchema)

/**
 * VideoSchema
 */

var VideoSchema = ObjectSchema.discriminator('video', MediaSchema)

/**
 * FileSchema
 */

var FileSchema = ObjectSchema.discriminator('file', MediaSchema)

/**
 * Exports
 */

module.exports = {
  Link: LinkSchema,
  Document: DocumentSchema,
  ImageSchema: ImageSchema,
  VideoSchema: VideoSchema,
  FileSchema: FileSchema
}
