var app = module.exports = require('koa')();
var {get, put, post, del} = require('koa-route');
var actions = require('./actions');

app.use(
  post('/'
  , validate({
    properties: {
      username: 'string',
      email: 'string',
      type: 'string',
      name: 'string',
      password: 'string'
    },
    required: ['name', 'type', 'password'],
    // Either username or email is required
    anyOf: [
      {required: ['username']},
      {required: ['email']}
    ],
    additionalProperties: false,
    type: 'object'
  })
  , actions.create);

app.use(
  put('/reset-password'
    , validate({
      properties: {
        token: 'string',
        password: 'string'
      },
      type: 'object',
      required: ['token', 'password']
    })
  )

app.use(get('/:id'
  , actions.get));

