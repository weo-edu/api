/**
 * Imports
 */
var config = require('lib/config')
var request = require('superagent')
var mandrill = require('mandrill-api/mandrill')
var client = new mandrill.Mandrill(config.mandrillApiKey)
var asArray = require('as-array')

/**
 * Exports
 */
module.exports = function(opts, cb) {
  var to = translateTo(opts.to)
  var params = translateParams(opts.params)

  // sendTemplate({
  //   from: 'info@weo.io',
  //   to: to,
  //   // template_name: opts.template,
  //   // template_content: [],
  //   async: false,
  //   message: {
  //     text: 'this is a test',
  //     subject: 'test subject'
  //     // merge_language: 'handlebars',
  //     // global_merge_vars: params
  //   }
  // })

  sendTemplate({
    "template_name": "example template_name",
    "template_content": [
        {
            "name": "example name",
            "content": "example content"
        }
    ],
    "message": {
        "html": "<p>Example HTML content</p>",
        "text": "Example text content",
        "subject": "example subject",
        "from_email": "info@weo.io",
        "from_name": "Example Name",
        "to": [
            {
                "email": "darawk@gmail.com",
                "name": "Andrew Shaffer",
                "type": "to"
            }
        ],
        "headers": {
            "Reply-To": "message.reply@example.com"
        },
        "important": false,
        "track_opens": null,
        "track_clicks": null,
        "auto_text": null,
        "auto_html": null,
        "inline_css": null,
        "url_strip_qs": null,
        "preserve_recipients": null,
        "view_content_link": null,
        "bcc_address": "message.bcc_address@example.com",
        "tracking_domain": null,
        "signing_domain": null,
        "return_path_domain": null,
        "merge": true,
        "merge_language": "mailchimp",
        "global_merge_vars": [
            {
                "name": "merge1",
                "content": "merge1 content"
            }
        ],
        "merge_vars": [
            {
                "rcpt": "recipient.email@example.com",
                "vars": [
                    {
                        "name": "merge2",
                        "content": "merge2 content"
                    }
                ]
            }
        ],
        "tags": [
            "password-resets"
        ],
        "subaccount": "customer-123",
        "google_analytics_domains": [
            "example.com"
        ],
        "google_analytics_campaign": "message.from_email@example.com",
        "metadata": {
            "website": "www.example.com"
        },
        "recipient_metadata": [
            {
                "rcpt": "recipient.email@example.com",
                "values": {
                    "user_id": 123456
                }
            }
        ],
        "attachments": [
            {
                "type": "text/plain",
                "name": "myfile.txt",
                "content": "ZXhhbXBsZSBmaWxl"
            }
        ],
        "images": [
            {
                "type": "image/png",
                "name": "IMAGECID",
                "content": "ZXhhbXBsZSBmaWxl"
            }
        ]
    },
    "async": false,
    "ip_pool": "Main Pool"
  })
}

var sendTemplateUrl = 'https://mandrillapp.com/api/1.0/messages/send.json'

function sendTemplate(params, cb) {
  params.key = 'th8iROwNdNvoML_doP7wew'
  request
    .post(sendTemplateUrl)
    .send(params)
    .end(function(err, res) {
      console.log('err', err, res.status, res.body)
    })
}

function translateTo(to) {
  return asArray(to).map(function(recipient) {
    return 'string' === typeof recipient
      ? {email: recipient}
      : recipient
  })
}

function translateParams(params) {
  return Object.keys(params).reduce(function(memo, key) {
    memo.push({name: key, content: params[key]})
    return memo
  }, [])
}