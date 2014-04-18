anchor-schema   [![Build Status](https://travis-ci.org/weo-edu/anchor-schema.png?branch=master)](https://travis-ci.org/weo-edu/anchor-schema)
=============

## Example

### Pass/fail validation

```javascript
var anchorSchema = require('anchor-schema');
var schema = anchorSchema({
  username: 'string', 
  email: {
    type: 'string', 
    required: true
  }
});

function isModelValid(model) {
  return schema(model);
}
```

### Detailed property/rule error messages
```javascript
var anchorSchema = require('anchor-schema');
var schema = anchorSchema({
  username: 'string',
  email: {
    type: 'string',
    email: true
  }
});

function onSubmit(model) {
  schema(model, function(prop, rule, valid) {
    // Log property and rule specific errors here
  });
}
```
