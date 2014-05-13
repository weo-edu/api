var express = require('express');
var app = module.exports = express();

app.use('/post', require('./Post'));
app.use('/question', require('./Question'));
app.use('/comment', require('./Comment'));
app.use('/answer', require('./Answer'));

// Post Attachments
require('./attachments');
