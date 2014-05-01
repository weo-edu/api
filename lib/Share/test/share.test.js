var Share = require('../model');
var chai = require('chai');
var expect = chai.expect;
var mongoose = require('mongoose');

var base = {
  type: 'post',
  actor: {
    id: new mongoose.Types.ObjectId,
    name: 'foo',
    url: 'http://weo.io/foo',
    avatar: 'http://avatar.eos.io/foo'
  },
  verb: 'shared',
  object: {
    type: 'post'
  },
  status: 'active'
}

describe('Share model', function() {
  it('should create new', function(done) {
    var share = Share(base);
    share.validate(function(err) {
      expect(err).to.be.undefined;
      done();
    });
  });

  it('should add class address properly', function() {
    var share = Share(base);
    var classId = 'classId';
    share.withClass(classId);
    var address = share.address(classId);
    address = address.toJSON();
    expect(address).to.have.property('access')
      .that.deep.equals([
        {type: 'public', role: 'teacher'}, 
        {type: 'group', id: classId, role: 'student'}
      ]);
  });

  it('should add class address for user share properly', function() {
    var share = Share(base);
    var classId = 'classId';
    var studentId = 'studentId';
    share.withStudent(classId, studentId);
    var address = share.address(classId);
    address = address.toJSON();
    expect(address).to.have.property('access')
      .that.deep.equals([
        {type: 'public', role: 'teacher'}, 
        {type: 'user', id: studentId, role: 'student'}
      ]);
  });

  it.only('should validate improper add', function(done) {
    var share = Share(base);
    var classId = 'classId';
    var studentId = 'studentId';
    share.withStudent(classId);

    share.validate(function(err) {
      expect(err.errors).to.have.property('to.addresses.0.access.1.id');
      done();
    });
  });
});