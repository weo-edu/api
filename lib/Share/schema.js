var validations = require('lib/validations');
var access = require('lib/access');
var Schema = require('mongoose').Schema;
var ObjectSchema = require('lib/Object/schema');

var AddressSchema = new Schema({
  board: {
    type: String,
    required: true
  },
  allow: {
    type: [String],
    validate: [
      function(allow) {
        return allow.every(function(entry) {
          entry = access.decode(entry);
          // type and role are required, id is only required
          // if type is not equal to 'public'
          return entry.type && entry.role && (entry.id || entry.type === 'public');
        });
      }
      , 'Invalid access in allow'
    ]
  },
  deny: String
}, {_id: false, id: false});

var ShareSchema = module.exports = new Schema({

  title: {
    type: String,
  },

  /**
   * type of share
   * @type {Object}
   *
   * Implemented by virtual
   */

  /**
   * time share is `activated`
   * @type {Date}
   */
  publishedAt: Date,

  /**
   * The person who performs the activity
   * @type {Object}
   *
   * @field id The id of the user
   * @field displayName The display name of the user
   * @field url The link to the profile of the user
   * @field image.url The url of the avatar for the user
   */

  actor: {
    id: {
      type: String,
      required: true,
      ref: 'User'
    },
    displayName: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    image: {
      url: {
        type: String,
        required: true
      }
    }
  },

  /**
   * The shares verb, indicating kind of share performed.
   * @type {Object}
   */
  verb: {
    type: String,
    required: true
  },



  /**
   * The object of the share.
   * @type {Object}
   *
   * @field type Type of object.
   * @field content Formatted content, suitable for display.
   * @field content The content provided by the author.
   */
  _object: [ObjectSchema],

  /**
   * Intanced data associated with the object.
   * @type {Object}
   */
  payload: {
    type: Schema.Types.Mixed,
    required: true,
    default: {}
  },

  /**
   * Specifies who will receive share.
   * @type {Object}
   *
   * @field to[].id Id of location where share is sent. Typically a class.
   * @field to[].access[] Describes who can see the share at the specified location. `type`:`role`:`id`
   * @field to[].deny Which role temporarily can't see the share.
   */
  to: [AddressSchema],

  /**
   * Channel to post share on.
   * @type {String}
   */
  channel: String,

  /**
   * Status of the share. Only active share are posted.
   * @type {Object}
   */
  status: {
    type: String,
    enum: ['active', 'pending'],
    default: 'active',
    required: true
  }
});

ShareSchema.virtual('boards').get(function() {
  return this.to.map(function(to) {
    return to.board;
  });
});

ShareSchema.path('to').validate(function(val) {
  return !!val.length;
}, 'To required', 'required');

ShareSchema.virtual('object').get(function() {
  return this._object && this._object[0];
})
.set(function(val) {
  console.log('set', val);
  this._object.length = 0;
  this._object.push(val);
  console.log('after set', this._object[0].objectType)
})

ShareSchema.pre('validate', function(next) {
  if (!this._id)
    this._id = new mongoose.Schema.Types.ObjectId;
  console.log('id validate', this._object.length);
  next();
});

ShareSchema.pre('validate', function(next) {
  if (!this.verb) {
    if (this.object.attachments.length) {
      this.verb = this.object.attachments[0].verb();
    } else
      this.verb = this.object.verb();
  }
  console.log('verb validate', this._object.length);
  next();
});

ShareSchema.method('address', function(board) {
  return this.to.filter(function(to) {
    return to.board === board;
  })[0];
});

ShareSchema.method('ensureAddress', function(board, defaultAccess) {
  var address = this.address(board);
  if (!address) {
    this.to.push({
      board: board,
      allow: defaultAccess ? [defaultAccess] : []
    });
  }
});

ShareSchema.method('allow', function(board, access) {
  this.ensureAddress(board);
  var address = this.address(board);
  address.allow.push(access);
});

ShareSchema.method('withClass', function(board) {
  this.ensureAddress(board, access.entry('public', 'teacher'));
  this.allow(board, access.entry('group', 'student', board));
});

ShareSchema.method('withStudent', function(board, studentId) {
  this.ensureAddress(board, access.entry('public', 'teacher'));
  this.allow(board, access.entry('user', 'student', studentId));
});

ShareSchema.method('isPublished', function() {
  return ! this.isNew && this.status === 'active';
});

ShareSchema.method('isQueued', function() {
  return this.status === 'pending';
});

ShareSchema.method('path', function() {
  return this._id;
});

ShareSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.object;
  }
});