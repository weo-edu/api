var express = require('express');
var app = module.exports = express();
app.actions = require('./actions');
app.model = require('./model');

/**
 * Express App
 */

app.get('/:collection', actions.find);

app.post('/', actions.create);

app.patch('/:id', actions.update);


/**
 * RouterIO App
 */

var io = app.io = require('lib/routerware')();
var ioActions = require('./io');

io.post('/:collection/subscription', ioActions.subscribe);
io.del('/:collection/subscription', ioActions.unsubscribe);

/**
 * Hooks
 */

var hooks = require('./hooks');
Response.schema.when('post:add', hooks.broadcast(io, 'add'));
Response.schema.when('post:change', hooks.broadcast(io, 'change'));