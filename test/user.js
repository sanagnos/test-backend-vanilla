/// ===========================================================================
/// test/user.js
/// ===========================================================================
/// Copyright (c) 2017, Stelios Anagnostopoulos <stelios@outlook.com>
/// All rights reserved
/// ===========================================================================

'use strict'

/// imports
/// ===========================================================================

var assert = require('assert')
var http   = require('http')
var config = require('../config')
var io     = require('../lib/io')
var db     = require('../lib/db')

/// tests
/// ===========================================================================

describe('user', function () {

  // user IDs
  var user1
  var user2

  it('should initialize app', function (done) {
    io.start(config.io, function () { // fire up the server
      db.connect(config.db) // connect to MySQL instance
      require('../api/user') // register user model and routes
      db.flush('user', function (err) {
        assert(!err)
        done()
      })
    })
  })

  describe('core crud operations', function () {

    it('should create user #1', function (done) {

      // initialize post request to create new user
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : '/user',
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' }
      }, function (res) {
        var data = ''
        res.on('data', function (chunk) { data += chunk })
        res.on('end', function () {
          user1 = parseInt(data)
          assert(res.statusCode === 201) // created status code
          assert(user1 >= 1) // user id
          done()
        })
      })

      // prepare body
      req.write(JSON.stringify({
        name       : 'John Doe',
        dob        : '1990-05-25',
        address    : '1 User Way, Redmond, WA 98052',
        description: 'John loves dogs'
      }))

      // submit request
      req.end()

    })

    it('should create user #2', function (done) {

      // initialize post request to create new user
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : '/user',
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' }
      }, function (res) {
        var data = ''
        res.on('data', function (chunk) { data += chunk })
        res.on('end', function () {
          user2 = parseInt(data)
          assert(res.statusCode === 201) // created status code
          assert(user2 >= 1) // user id
          done()
        })
      })

      // prepare body
      req.write(JSON.stringify({
        name       : 'Marry Bloggs',
        dob        : '1983-09-29',
        address    : '2 User Avenue, Providence, RI 02912',
        description: 'Marry loves cats'
      }))

      // submit request
      req.end()

    })

    it('should read user #1', function (done) {

      // initialize get request to read user 1
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : `/user/${user1}`,
        method  : 'GET'
      }, function (res) {
        var data = ''
        res.on('data', function (chunk) { data += chunk })
        res.on('end', function () {
          var userData = JSON.parse(data)
          assert(res.statusCode === 200)
          assert(userData.name === 'John Doe')
          done()
        })
      })

      // submit request
      req.end()
    })

    it('should update user #2', function (done) {

      // initialize put request to update user 2
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : `/user/${user2}`,
        method  : 'PUT',
        headers : { 'Content-Type': 'application/json' }
      }, function (res) {
        assert(res.statusCode === 200)
        db.read('user', user2, function (err, data) {
          assert(!err)
          assert(data.name === 'Alice Bloggs')
          assert(data.description === 'Alice loves cats')
          done()
        })
      })

      // prepare body
      req.write(JSON.stringify({
        name       : 'Alice Bloggs',
        description: 'Alice loves cats'
      }))

      // submit request
      req.end()
    })

    it('should delete user #1', function (done) {

      // initialize get request to read user 1
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : `/user/${user1}`,
        method  : 'DELETE'
      }, function (res) {
        assert(res.statusCode === 200)
        db.read('user', user1, function (err, data) {
          assert(!err)
          assert(!data)
          done()
        })
      })

      // submit request
      req.end()
    })
  })

  describe('operations on a deleted user', function () {

    it('should fail gracefully by trying to read deleted user #1', function (done) {

      // initialize get request to read user 1
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : `/user/${user1}`,
        method  : 'GET'
      }, function (res) {
        assert(res.statusCode === 204)
        done()
      })

      // submit request
      req.end()
    })

    it('should fail gracefully by trying to update deleted user #1', function (done) {

      // initialize get request to read user 1
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : `/user/${user1}`,
        method  : 'PUT',
        headers : { 'Content-Type': 'application/json' }
      }, function (res) {
        assert(res.statusCode === 204)
        done()
      })

      // prepare body
      req.write(JSON.stringify({
        name       : 'Bob Doe',
        description: 'Bob loves dogs'
      }))

      // submit request
      req.end()
    })

    it('should fail gracefully by trying to delete deleted user #1', function (done) {

      // initialize get request to read user 1
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : `/user/${user1}`,
        method  : 'DELETE'
      }, function (res) {
        assert(res.statusCode === 204)
        done()
      })

      // submit request
      req.end()
    })
  })

  describe('operations on a non-existing user', function () {

    it('should fail gracefully by trying to read non-existing user', function (done) {

      // initialize get request to read user 1
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : `/user/${user2 + 1}`,
        method  : 'GET'
      }, function (res) {
        assert(res.statusCode === 204)
        done()
      })

      // submit request
      req.end()
    })

    it('should fail gracefully by trying to update non-existing user', function (done) {

      // initialize get request to read user 1
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : `/user/${user2 + 1}`,
        method  : 'PUT',
        headers : { 'Content-Type': 'application/json' }
      }, function (res) {
        assert(res.statusCode === 204)
        done()
      })

      // prepare body
      req.write(JSON.stringify({
        name       : 'Bob Doe',
        description: 'Bob loves dogs'
      }))

      // submit request
      req.end()
    })

    it('should fail gracefully by trying to delete non-existing user', function (done) {

      // initialize get request to read user 1
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : `/user/${user2 + 1}`,
        method  : 'DELETE'
      }, function (res) {
        assert(res.statusCode === 204)
        done()
      })

      // submit request
      req.end()
    })
  })

  describe('operations with invalid data', function () {
    it('should fail gracefully by creating new user with missing required field', function (done) {

      // initialize post request to create new user
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : '/user',
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' }
      }, function (res) {
        assert(res.statusCode === 406)
        done()
      })

      // prepare body
      req.write(JSON.stringify({
        dob        : '1990-05-25',
        address    : '1 User Way, Redmond, WA 98052',
        description: 'John loves dogs'
      }))

      // submit request
      req.end()

    })

    it('should fail gracefully by creating new user with empty body', function (done) {

      // initialize post request to create new user
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : '/user',
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' }
      }, function (res) {
        assert(res.statusCode === 406)
        done()
      })

      // submit request
      req.end()

    })

    it('should fail gracefully by creating new user with corrupt body', function (done) {

      // initialize post request to create new user
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : '/user',
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' }
      }, function (res) {
        assert(res.statusCode === 406)
        done()
      })

      // prepare body
      req.write(JSON.stringify({
        dob: [],
        cat: 123
      }))

      // submit request
      req.end()

    })

    it('should fail gracefully by updating user #2 with corrupt body', function (done) {

      // initialize put request to update user 2
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : `/user/${user2}`,
        method  : 'PUT',
        headers : { 'Content-Type': 'application/json' }
      }, function (res) {
        assert(res.statusCode === 406)
        done()
      })

      // prepare body
      req.write(JSON.stringify({
        name : 'Jane Bloggs',
        email: 'jane@email.com'
      }))

      // submit request
      req.end()
    })
  })

  describe('operations with malformed URLs', function () {
    it('should fail gracefully by attempting to create user with malformed POST request', function (done) {

      // initialize post request to create new user
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : '/user/bad',
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' }
      }, function (res) {
        assert(res.statusCode === 404)
        done()
      })

      // prepare body
      req.write(JSON.stringify({
        name       : 'John Doe',
        dob        : '1990-05-25',
        address    : '1 User Way, Redmond, WA 98052',
        description: 'John loves dogs'
      }))

      // submit request
      req.end()

    })

    it('should fail gracefully by attempting to read user with PUT request', function (done) {

      // initialize post request to create new user
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : `/user/${user2}`,
        method  : 'PUT',
        headers : { 'Content-Type': 'application/json' }
      }, function (res) {
        assert(res.statusCode === 406)
        done()
      })

      // submit request
      req.end()

    })

    it('should fail gracefully with GET request without an id parameter', function (done) {

      // initialize post request to create new user
      var req = http.request({
        hostname: 'localhost',
        port    : config.io.port,
        path    : '/user',
        method  : 'GET'
      }, function (res) {
        assert(res.statusCode === 404)
        done()
      })

      // submit request
      req.end()

    })
  })
})
