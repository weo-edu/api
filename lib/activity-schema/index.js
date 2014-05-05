var util = require('util');
var validations = require('lib/validations');


module.exports = function(Schema) {
  var Activity;
  function ActivitySchema(obj, options) {
    Schema.call(this, {}, options);
    this.add(Activity);
    this.add(obj);
  }

  util.inherits(ActivitySchema, Schema);



  Activity = {
    /**
     * The person who performs the activity
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
    }

  };



  return ActivitySchema;

};


