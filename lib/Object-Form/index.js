var express = require('express');
var app = module.exports = express();

// include form question schemas
require('./Form');
require('./FormQuestion/model');

app.use('/poll', require('./Poll'));
app.use('/response', require('./FormResponse'));