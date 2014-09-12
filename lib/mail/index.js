var nodemailer = require('nodemailer');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'info@weo.io',
        pass: 'elliotrileytio'
    }
});

exports.send = function(options, cb) {
  transporter.sendMail(options, cb);
};