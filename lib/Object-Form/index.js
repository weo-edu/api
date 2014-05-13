var express = require('express');
var app = module.exports = express();


app.use('/poll', require('./Poll'));
app.use('/response', require('./Response'));