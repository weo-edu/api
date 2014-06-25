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
};