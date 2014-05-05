var validations = require('lib/validations')
  , _ = require('lodash')
  , access = require('lib/access')
  , activity = require('lib/activity-schema');

module.exports = function(Schema) {

  var AddressSchema = new Schema({
    id: {
      type: String,
      required: true
    },
    allow: { 
      type: [String],
      validate: [function(allow) {
        return _.all(allow, function(entry) {
          entry = access.decode(entry);
          if (!entry.type || !entry.role)
            return false;
          if (entry.type !== 'public' && !entry.id)
            return false
          return true;
        });
      }, 'Invalid access in allow']
    },
    deny: String
  }, {_id: false});

  var ActivitySchema = activity(Schema);


  var ShareSchema = new ActivitySchema({
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
    published_at: Date,

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
     * The object of the share.
     * @type {Object}
     *
     * @field type Type of object.
     * @field content Formatted content, suitable for display.
     * @field content The content provided by the author.
     */
    object: {
      content: {
        type: String
      },
      originalContent: {
        type: String,
      }
    },


    /**
     * Used to create share trees. Can often be thought of as inReplyTo.
     * @type {Object}
     *
     * @field id parent id
     * @field path ancestor path
     */
    parent: {
      id: String,
      path: String
    },

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

  ShareSchema.virtual('type').get(function() {
    return this.__t;
  });

  ShareSchema.method('address', function(address) {
    return _.find(this.to, {id: address});
  });

  ShareSchema.method('ensureAddress', function(addressId, defaultAccess) {
    var address = this.address(addressId);
    if (!address) {
      this.to.push({
        id: addressId,
        allow: [defaultAccess]
      });
    }
  });

  ShareSchema.method('allow', function(addressId, access) {
    var address = this.address(addressId);
    address.allow.push(access);
  });

  ShareSchema.method('withClass', function(groupId) {
    this.ensureAddress(groupId, access.entry('public', 'teacher'));
    this.allow(groupId, access.entry('group', 'student', groupId));
  });

  ShareSchema.method('withStudent', function(groupId, studentId) {
    this.ensureAddress(groupId, access.entry('public', 'teacher'));
    this.allow(groupId, access.entry('user', 'student', studentId));
  });

  ShareSchema.method('withParentShare', function(parentShare, addressId) {
    var self = this;
    Share.findById(parentShare, function(err, parentShare) {
      var address = parentShare.address(addressId);
      self.to.push(address);
    });
  });

  return ShareSchema;
};