var clone = require('clone');

var image = {
  url: {
    type: String
  },
  width: {
    type: Number
  },
  height: {
    type: Number
  },
  type: {
    type: String
  }
};

/**
 * Object
 *
 * @field id {string} object id of object
 * @field objectType {string} type of object
 * @field displayName {string} title of object, suitable for display
 * @field content {string} HTML-formatted content, suitable for dispaly
 * @field originalContent {string} The content as provided by the author
 * @field url {string} The url that points to the linked resource
 * @field image {object} Image preview of media
 * @field image.url {string} Image url
 * @field image.type {string} Image content type
 * @field image.height {number} Image height in pixels
 * @field image.width {number} Image width in pixels
 * @field fullImage {object} Full image
 * @field fullImage.url {string} Image url
 * @field fullImage.type {string} Image content type
 * @field fullImage.height {number} Image height in pixels
 * @field fullImage.width {number} Image width in pixels
 * @field embed {object} Embeddable link
 * @field embed.url {string} Url of link
 * @field embed.type {string} Media type
 * @field replies {object} Replies to post
 * @field replies.selfLink {string} url to retrieve replies
 * @field voters {object} Votes on post
 * @field voters.selfLink {string} url to retreive vots
 * @field resharers {object} Reshares of post
 * @field resharers.selfLink {string} url to retrieve resharers
 *
 */
var Schema = require('mongoose').Schema;
var ObjectSchema = module.exports = new Schema({
  objectType: {
    type: String,
    required: true
  },
  displayName: {
    type: String
  },
  url: {
    type: String
  },
  content: {
    type: String
  },
  originalContent: {
    type: String
  },
  image: clone(image),
  fullImage: clone(image),
  embed: {
    url: {
      type: String
    },
    type: {
      type: String
    }
  },
  tags: [String]
}, {id: false, _id: true, discriminatorKey: 'objectType'});

ObjectSchema.static('fromOembed', function(oembed) {
  var image = {};
  if(oembed.type === 'image') {
    image.url = oembed.url;
    image.width = oembed.width;
    image.height = oembed.height;
  } else {
    image.url = oembed.thumbnail_url;
    image.width = oembed.thumbnail_width;
    image.height = oembed.thumbnail_height;
  }

  var content = oembed.html || oembed.description;
  return {
    providerName: oembed.provider_name,
    objectType: oembed.type,
    image: image,
    content: content,
    displayName: oembed.title,
    embed: {
      url: oembed.url,
      type: oembed.type
    }
  }
});

// Objects are always embedded in shares (for now)
ObjectSchema.method('share', function() {
  var root = this;
  while (root.__parent) {
    root = root.parent();
  }
  if (root === this) {
    throw new Error('object not embedded in share');
  }
  return root;
});

ObjectSchema.method('detach', function() {
  var idx = this.parent().attachments.indexOf(this);
  this.parent().attachments.splice(idx, 1);
});

ObjectSchema.method('attach', function(object) {
  this.attachments.push(object);
});

ObjectSchema.method('verb', function() {
  return 'shared';
});

ObjectSchema.method('transformOriginalContent', function(transform) {
  if(this.originalContent && (this.isModified('originalContent') || this.isNew)) {
    // Escape regular content
    this.content = transform(this.originalContent);
  }
});

// Objects are embedded in shares
ObjectSchema.virtual('id').get(function() {
  return this.share().id + '.' + this._id;
});

ObjectSchema.method('path', function() {
  if (this.__parent) {
    return this.parent().path() + '.' + this._id;
  } else {
    return this._id;
  }
});

ObjectSchema.method('channel', function(property) {
  return this.path() + '.' + property;
});

ObjectSchema.method('isLeaf', function() {
  return !this.attachments || !this.attachments.length;
});

ObjectSchema.method('find', function(objectId) {
  if (this._id == objectId) return this;

  var object;
  for(var i = 0; i < this.attachments.length; i++) {
    object = this.attachments[i].find(objectId);
    if(object) return object;
  }
});

ObjectSchema.method('invoke', function(method, args) {
  if (this[method])
    this[method].apply(this, args);
  this.attachments.forEach(function(object) {
    object.invoke(method, args);
  });
});

ObjectSchema.add({
  attachments: [ObjectSchema]
});

ObjectSchema.plugin(require('lib/schema-plugin-selflink'));
