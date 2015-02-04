var mongoose = require('mongoose');
var moduleTests = require('lib/boot-module-tests');
var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;

chai.use(require('sinon-chai'));

describe('schema-plugin-was-modified', function() {
  var Schema;

  beforeEach(function() {
    moduleTests.prepare();
    mongoose.plugin(require('../'));
    Schema = mongoose.Schema;
  });

  beforeEach(moduleTests.connect);
  afterEach(moduleTests.cleanup);

  it('should work', function(done) {
    var A = new Schema({str: String});

    var wasNew, wasModified;
    A.post('save', function(doc) {
      wasNew = doc.wasNew;
      wasModified = doc.wasModified('str');
    });

    var Model = mongoose.model('A', A);
    var doc = new Model();

    doc.str = 'test';
    doc.save(function() {
      expect(wasNew).to.equal(true);
      expect(wasModified).to.equal(true);

      doc.save(function() {
        expect(wasNew).to.equal(false);
        expect(wasModified).to.equal(false);

        doc.str = 'asdf';
        doc.save(function() {
          expect(wasNew).to.equal(false);
          expect(wasModified).to.equal(true);

          // Make sure it doesn't mark this
          // as a modification
          doc.str = 'asdf';
          doc.save(function() {
            expect(wasNew).to.equal(false);
            expect(wasModified).to.equal(false);
            done();
          });
        });
      });
    });
  });

  it('should work with nested objects', function(done) {
    var A = new Schema({str: String});
    A.plugin(require('../'));
    var B = new Schema({object: [A]});

    var Model = mongoose.model('B', B);
    var doc = new Model();

    doc.object = {str: 'test'};
    doc.save(function() {
      expect(doc.object[0].wasNew).to.equal(true);
      expect(doc.wasNew).to.equal(true);

      expect(doc.wasModified('object')).to.equal(true);
      expect(doc.wasModified('object.0.str')).to.equal(false);

      expect(doc.object[0].wasModified('str')).to.equal(true);

      doc.object[0].str = 'asdf';
      doc.save(function() {
        expect(doc.object[0].wasModified('str')).to.equal(true);
        expect(doc.wasModified('object')).to.equal(true);
        expect(doc.wasModified('object.0')).to.equal(true);
        expect(doc.wasModified('object.0.str')).to.equal(true);

        doc.object.push({str: 'a'});
        doc.save(function() {
          expect(doc.wasModified('object')).to.be.true;
          expect(doc.wasModified('object.0')).to.be.false;
          expect(doc.wasModified('object.1')).to.be.false;

          expect(doc.object[1].wasModified('str')).to.be.true;
          done();
        });
      });
    });
  });
});
