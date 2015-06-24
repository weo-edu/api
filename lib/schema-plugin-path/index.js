var uncapitalize = require('uncapitalize');

module.exports = function(Schema) {
  Schema.method('path', function(str) {
    if(this.__parent)
      p = this.parent().path() + '.';
    else {
      p = this.kind;
      p = uncapitalize(p);
      p += '!';
    }

    p += this._id;
    if(str) p += '.' + str;

    return p;
  });

  function getChannel(kind, id, channelName) {
    return uncapitalize(kind) + '!' + id + '.' + channelName;
  }

  Schema.static('getChannel', getChannel);
  Schema.method('getChannel', function(channelName) {
    var root = this;
    while(root.__parent)
      root = root.parent();

    return getChannel(root.kind, this.id, channelName);
  });
};