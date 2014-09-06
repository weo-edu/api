module.exports = function(Schema) {
  Schema.method('path', function(str) {
    if(this.__parent)
      p = this.parent().path() + '.';
    else {
      p = this.kind;
      p = p[0].toLowerCase() + p.slice(1);
      p += '!';
    }

    p += this._id;
    if(str) p += '.' + str;

    return p;
  });

  Schema.method('getChannel', function(str) {
    var root = this;
    while(root.__parent)
      root = root.parent();
    var kind = root.kind;
    kind = kind[0].toLowerCase() + kind.slice(1);
    return kind + '!' + this.id + '.' + str;
  });
};

