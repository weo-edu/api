module.exports = {
  required: true,
  type: 'object',
  properties: {
    email: {
      type: 'string',
      required: true
    },
    username: {
      type: 'string',
      required: true
    }
    displayName: {
      type: 'string',
      required: true
    },
    name: {
      type: 'object',
      required: true,
      givenName: {
        type: 'string',
        required: true
      },
      familyName: {
        type: 'string',
        required: true
      },
      honorificPrefix: {
        type: 'string',
        required: true
      }
    },
    password: {
      type: 'string',
      required: true,
      minLength: 6
    },
    preferences: {
      type: 'object'
    },
    profile: {
      type: 'object',
      properties: {
        color: {type: 'string'},
        description: {type: 'string'}
      }
    },
    reset: {
      token: {type: 'string'},
      createdAt: {type: 'date'}
    }
  }
};