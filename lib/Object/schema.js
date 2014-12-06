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
 * @field voters {object} Votes on post
 * @field voters.selfLink {string} url to retreive votes
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
  }
}, {id: false, _id: true, discriminatorKey: 'objectType'});

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

ObjectSchema.method('verb', function() {
  return 'shared';
});

// Objects are embedded in shares
ObjectSchema.virtual('id').get(function() {
  return this.share().id + '.' + this._id;
});

ObjectSchema.method('find', function(objectId) {
  if (this._id.toString() === objectId.toString()) return this;

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

ObjectSchema.method('attach', function(objType) {
  var obj = 'string' === typeof objType
    ? {objectType: objType}
    : objType;

  this.attachments.push(obj);
  return this.attachments[this.attachments.length - 1];
});

/**
 * Grading
 */

ObjectSchema.method('isGradable', function() {
  return false;
});

ObjectSchema.method('isGraded', function() {
  if(this.isGradable()) {
    return this.points.raw !== undefined;
  }
  return false;
});

ObjectSchema.method('grade', function() {
  // Do nothing for most objects
});

ObjectSchema.method('regrade', function(dontGrade) {
  if(!dontGrade)
    this.grade();
  this.parent().regrade && this.parent().regrade();
});

ObjectSchema.method('instanceData', function() {
  return this.attachments.reduce(function(memo, object) {
    return memo.concat(object.instanceData());
  }, []);
});

ObjectSchema.add({
  attachments: [ObjectSchema]
});

ObjectSchema.plugin(require('lib/schema-plugin-selflink'));
ObjectSchema.plugin(require('lib/schema-plugin-path'));