var express = require('express');
var app = module.exports = express();


// include item schemas
require('./Item/model');

app.use('/poll', require('./Poll'));
app.use('/response', require('./Response'));