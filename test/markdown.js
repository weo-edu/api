var markdown = require('lib/markdown');

require('./helpers/boot');

describe('Markdown tests', function() {
  it('should have hashtags (pound symbol) disabled', function() {
    expect(markdown('#test')).to.equal('<p>#test</p>\n');
    expect(markdown('test\n====')).to.equal('<h1 id="test">test</h1>\n');
  });
});