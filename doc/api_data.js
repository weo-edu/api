define({ api: [
  {
    "type": "get",
    "url": "/share/:id/contexts",
    "title": "Get list of contexts",
    "name": "GetContexts",
    "group": "Share",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "<p>unique id of the share</p>"
          }
        ]
      }
    },
    "description": "<p>Retrieve the list of contexts this sharehas been sent to, intersected with the list of contextsthat the requesting user belongs to.</p>",
    "version": "0.0.0",
    "filename": "lib/Share/index.js"
  },
  {
    "type": "get",
    "url": "/share/:id/members",
    "title": "Get list of associated students",
    "name": "GetMembers",
    "group": "Share",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "<p>unique id of the share to be published</p>"
          },
          {
            "group": "Parameter",
            "type": "[String]",
            "field": "context",
            "optional": false,
            "description": "<p>List of contexts ids (a single context may also be passed)</p>"
          }
        ]
      }
    },
    "description": "<p>Retrieve the list of students who have access to thisshare in the contexts specified by <code>context</code></p>",
    "version": "0.0.0",
    "filename": "lib/Share/index.js"
  },
  {
    "type": "put",
    "url": "/share/:id/published",
    "title": "Publish Share",
    "name": "Publish",
    "group": "Share",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "<p>unique id of the share to be published</p>"
          }
        ]
      }
    },
    "description": "<p>Publish the share referenced by <code>id</code></p>",
    "version": "0.0.0",
    "filename": "lib/Share/index.js"
  }
] });