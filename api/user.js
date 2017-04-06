/// ===========================================================================
/// api/user.js
/// ===========================================================================
/// Copyright (c) 2017, Stelios Anagnostopoulos <stelios@outlook.com>
/// All rights reserved
/// ===========================================================================

'use strict'

/// imports
/// ===========================================================================

var io = require('../lib/io') // network i/o
var db = require('../lib/db') // database routines

/// model
/// ===========================================================================

db.define('user', [
  { name: 'id', type: 'int', length: 11, unsigned: true, autoincr: true, primaryKey: true },
  { name: 'name', type: 'varchar', length: 32, required: true },
  { name: 'dob', type: 'date' },
  { name: 'address', type: 'varchar', length: 128 },
  { name: 'description', type: 'text' },
  { name: 'created_at', type: 'timestamp', currentTimestamp: true }
], function (err) {
  if (err) throw err
})

/// routes
/// ===========================================================================

io.post('/user', function (req, res) {
  db.create('user', req.body, function (err, id) {
    if (err) {
      if (/ER_NO_DEFAULT_FOR_FIELD/.test(err.toString()))
        return res.send(400, 'Missing required field')
      else if (/ER_PARSE_ERROR/.test(err.toString()))
        return res.send(400, 'Corrupt body')
      else return res.send(500, err.toString())
    }
    res.send(201, id)
  })
})

io.get('/user/:id', function (req, res) {
  db.read('user', req.param.id, function (err, data) {
    if (err) return res.send(500, err.toString())
    if (!data) return res.send(404)
    res.send(200, data)
  })
})

io.put('/user/:id', function (req, res) {
  delete req.body.id         // remove attempted changes
  delete req.body.created_at // to read-only fields
  db.update('user', req.param.id, req.body, function (err, data) {
    if (err) {
      if (/ER_BAD_FIELD_ERROR/.test(err.toString()))
        return res.send(400, 'Unexpected field')
      else if (/ER_PARSE_ERROR/.test(err.toString()))
        return res.send(400, 'Corrupt body')
      else return res.send(500, err.toString())
    }
    if (!data.changedRows) return res.send(404)
    res.send(200)
  })
})

io.delete('/user/:id', function (req, res) {
  db.delete('user', req.param.id, function (err, data) {
    if (err) return res.send(500, err.toString())
    if (!data.affectedRows) return res.send(404)
    res.send(200)
  })
})
