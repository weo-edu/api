var nodemailer = require('nodemailer');
var config = require('lib/config');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: config.emailUser,
        pass: config.emailPass
    }
});

console.log('config', config.emailUser, config.emailPass);
exports.send = function(options, cb) {
  transporter.sendMail(options, cb);
};