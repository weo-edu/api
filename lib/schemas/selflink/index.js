module.exports = function() {
  var schema = {
    context: {
      type: 'string',
      oneOf: [
        {
          type: 'string',
          enum: ['public']
        },
        {
          type: 'string',
          format: 'objectid'
        }
      ]
    },
    items: {
      type: 'number'
    },
    actors: {
      type: 'object'
    }
  };

  return schema;
};