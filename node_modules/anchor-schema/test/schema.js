var _ = require('lodash')
  , anchorSchema = require('../')
  , sinon = require('sinon')
  , chai = require('chai')
  , expect = chai.expect;

chai.use(require('sinon-chai'));

describe('anchor-schema', function() {
  var validators;
  beforeEach(function() {
    validators = anchorSchema({
      str: 'string',
      reqStr: {
        type: 'string',
        required: true
      }
    });
  });

  describe('invalid data', function() {
    it('should return false', function() {
      var o = {};
      expect(validators.$validate(o)).to.be.false;
      // str isn't required, so it should be valid
      expect(validators.str(o.str, o)).to.be.true;
      expect(validators.reqStr(o.reqStr, o)).to.be.false;
    });

    it('should call the callback with false for all keys', function() {
      var o = {str: 4}
        , spy = sinon.spy();

      expect(validators.$validate(o, spy)).to.be.false;
      expect(spy).to.have.been.calledWith('str', 'string', false);
      expect(spy).to.have.been.calledWith('reqStr', 'string', false);
      expect(spy).to.have.been.calledWith('reqStr', 'required', false);
    })
  });

  describe('valid data', function() {
    it('should return true', function() {
      var o = {str: 'test', reqStr: 'test2'};
      expect(validators.$validate(o)).to.be.true;
    });

    it('should call the callback with true for all keys', function() {
      var o = {str: 'test', reqStr: 'test2'}
        , spy = sinon.spy();

      expect(validators.$validate(o, spy)).to.be.true;
      expect(spy).to.have.been.calledWith('str', 'string', true);
      expect(spy).to.have.been.calledWith('reqStr', 'string', true);
      expect(spy).to.have.been.calledWith('reqStr', 'required', true);
    });
  });

  // it('should validate the schema', function() {
  //   var schema = {test: 'string'}
  //     , validators = anchorSchema(schema);

  //   var o = {test: 4}
  //     , spy = sinon.spy();
  //   expect(validators.$validate(o, spy)).to.be.false;
  //   expect(spy).to.have.been.calledWith('test', 'string', false);

  //   var o2 = {test: 'this is a string'}
  //     , spy2 = sinon.spy();
  //   expect(validators.$validate(o2, spy2)).to.be.true;
  //   expect(spy2).to.have.been.calledWith('test', 'string', true);
  // });
});