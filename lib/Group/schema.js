var Schema = require('mongoose').Schema;
var selfLink = require('lib/schema-plugin-selflink');

var GroupSchema = module.exports = new Schema({
  groupType: {
    type: String,
    default: 'class',
    enum: ['class', 'group']
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'archived']
  },
  displayName: {
    type: String,
    required: true
  },
  code: {
    type: String,
    unique: true,
    required: true
  },
  owners: {
    type: [{type: 'ObjectId', ref: 'Teacher'}],
    required: true
  },
  parent: {
    type: 'ObjectId',
    ref: 'Group'
  },
  access: {
    allow: {
      type: [String]
    },
    deny: {
      type: String
    }
  },
  board: selfLink.embed()
});

GroupSchema.plugin(selfLink);