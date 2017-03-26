/// ===========================================================================
/// config.js
/// ===========================================================================
/// Copyright (c) 2017, Stelios Anagnostopoulos <stelios@outlook.com>
/// All rights reserved
/// ===========================================================================

'use strict'

/// exports
/// ===========================================================================

module.exports = {
  io: {
    port    : 80,
    certFile: null,
    pkeyFile: null
  },
  db: {
    host    : 'localhost',
    user    : 'root',
    password: 'admin',
    database: 'test_backend'
  }
}
