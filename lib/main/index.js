var app = module.exports = require('express')();
var auth = require('lib/Auth');
var user = require('lib/User');
var teacher = require('lib/Teacher');
var student = require('lib/Student');
var group = require('lib/Group');
var share = require('lib/Share');

app.use(auth.middleware.token);
app.use(auth.middleware.user);
app.use(auth.middleware.passport);

app.use('/auth', auth);
app.use('/user', user);
app.use('/student', student);
app.use('/teacher', teacher);
app.use('/group', group);
app.use('/share', share);