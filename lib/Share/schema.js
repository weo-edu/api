var validations = require('lib/validations')
  , _ = require('lodash');

module.exports = function(Schema) {

  var AddressSchema = require('./addressSchema')(Schema);

  var ToSchema = new Schema({});

  var ShareSchema = new Schema({
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
     * The person who performs the share
     * @type {Object}
     *
     * @field id The id of the user
     * @field name The display name of the user
     * @field url The link to the profile of the user
     * @field avatar The url of the avatar for the user
     */
    actor: {
      id: {
        required: true,
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      name: {
        required: true,
        type: String
      },
      url: {
        required: true,
        type: String,
        validate: [validations.url, 'Actor profile link must be a valid url']
      },
      avatar: {
        required: true,
        type: String,
        validate: [validations.url, 'Actor avatar must be a valid url']
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
    object: {
      type: {
        type: String,
        required: true
      },
      content: {
        type: String
      },
      originalContent: {
        type: String,
      }
    },

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
     * @field scope Parent namespace of the share. Null is root scope.
     * @field scope_path Full namespace of the share.
     * @field addresses[].id Id of location where share is sent. Typically a class.
     * @field addresses[].access[] Describes who can see the share at the specified location.
     * @field addresses[].access[].id Id of the viewer. For `individual` or `group` its the id. Otherwise not set.
     * @field addresses[].access[].role Role of the view. Possible value are `teacher` or `student`.
     * @field addresses[].access[].type Type of access. Possible values are `public`, `group`, or `individual`.
     */
    to: {
      scope: {
        type: String,
      },
      scope_path: {
        type: String,
      },
      addresses: [AddressSchema]
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
    return _.find(this.to.addresses, {id: address});
  });

  ShareSchema.method('ensureAddress', function(addressId, defaultAccess) {
    var address = this.address(addressId);
    if (!address) {
      this.to.addresses.push({
        id: addressId,
        access: [defaultAccess]
      });
    }
  });

  ShareSchema.method('addAccess', function(addressId, access) {
    var address = this.address(addressId);
    address.access.push(access);
  });

  ShareSchema.method('withClass', function(groupId) {
    this.ensureAddress(groupId, {type: 'public', role: 'teacher'});
    this.addAccess(groupId, {id: groupId, type: 'group', role: 'student'});
  });

  ShareSchema.method('withStudent', function(groupId, studentId) {
    this.ensureAddress(groupId, {type: 'public', role: 'teacher'});
    this.addAccess(groupId, {id: studentId, type: 'user', role: 'student'});
  });

  ShareSchema.method('withParentShare', function(parentShare, addressId) {
    var self = this;
    Share.findById(parentShare, function(err, parentShare) {
      var address = parentShare.address(addressId);
      self.to.addresses.push(address);
    });
  });

  return ShareSchema;
};