/// ===========================================================================
/// main.js
/// ===========================================================================
/// Copyright (c) 2017, Stelios Anagnostopoulos <stelios@outlook.com>
/// All rights reserved
/// ===========================================================================

'use strict'

/// imports
/// ===========================================================================

var config = require('./config')
var io     = require('./lib/io')
var db     = require('./lib/db')

/// initialization
/// ===========================================================================

// fire up the server
io.start(config.io)

// connect to MySQL instance
db.connect(config.db)

/// registration
/// ===========================================================================

// register user model and routes
require('./api/user')
