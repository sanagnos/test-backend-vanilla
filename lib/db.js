/// ===========================================================================
/// lib/db.js
/// ===========================================================================
/// Copyright (c) 2017, Stelios Anagnostopoulos <stelios@outlook.com>
/// All rights reserved
/// ===========================================================================

'use strict'

/// imports
/// ===========================================================================

var mysql = require('mysql')

/// cache
/// ===========================================================================

var conn = null // connection instance
var pool = null // pool of connection instances

/// base
/// ===========================================================================

/**
 * Connects to MySQL instance.
 * @param  {Object} config
 */
function connect (config) {
  conn = mysql.createConnection(config)
  pool = mysql.createPool(config)
}

/**
 * Defines MySQL table.
 * @param  {String}   table   Table name
 * @param  {Array}    columns Table column attributes
 * @param  {Function} cb      Propagates (err)
 */
function define (table, columns, cb) {

  var searchFields = []
  var indexFields  = []

  var spec = []

  for (var i = 0, l = columns.length; i < l; ++i) {

    var column = columns[i]
    var line   = []

    // name and type
    line.push(column.name + ' ' + column.type)

    // value length or enum options
    if (column.length)
      line.push('(' + column.length + ')')
    else if (column.options)
      line.push('(' + column.options.map(function (option) { return '\'' + option + '\'' }).join(', ') + ')')

    // unsigned
    if (column.unsigned) line.push('unsigned')

    // defaults
    if (column.optional)
      line.push('default null')
    else if (column.default)
      line.push('default ' + (column.default.constructor === String ? '\'' + column.default + '\'' : column.default))
    else if (column.required)
      line.push('not null')
    if (column.timestamp)
      line.push('default current_timestamp')

    // uniqueness
    if (column.unique) line.push('unique')

    // primary key
    if (column.primaryKey) line.push('primary key')

    // autoincrement property
    if (column.autoincr) line.push('auto_increment')

    spec.push(line.join(' '))

    // foreign key
    if (column.foreign) {
      var line = []
      line.push('foreign key (' + column.name + ') references ' + column.foreign.table + '(' + column.foreign.name + ')')
      if (column.foreign.cascadeDelete)
        line.push('on delete cascade')
      spec.push(line.join(' '))
    }

    if (column.searchable) searchFields.push(column.name)
    if (column.index)      indexFields.push(column.name)
  }

  if (searchFields.length)
    spec.push('fulltext (' + searchFields.join(', ') + ')')
  if (indexFields.length)
    spec.push('index (' + indexFields.join(', ') + ')')

  conn.query('create table if not exists ' + table + ' (\n' + spec.join(',\n') + '\n)', cb)
}

/**
 * Creates entry.
 * @param  {String}   table
 * @param  {Object}   data
 * @param  {Function} cb    Propagates (err, id)
 */
function create (table, data, cb) {
  var fields = []
  var values = []
  for (var field in data) {
    fields.push(field)
    values.push(data[field])
  }
  pool.query(mysql.format(`insert into ${table} (??) values (?)`, [fields, values]), function (err, res) {
    cb(err, !err && res ? res.insertId : undefined)
  })
}

/**
 * Reads entry by id.
 * @param  {String}   table
 * @param  {Number}   id
 * @param  {Function} cb     Propagates (err, data)
 */
function read (table, id, cb) {
  pool.query(mysql.format(`select * from ${table} where id=?`, [id]), function (err, res) {
    cb(err, !err && res && res.length ? res[0] : undefined)
  })
}

/**
 * Updates entry by id.
 * @param  {String}   table
 * @param  {Number}   id
 * @param  {Object}   data
 * @param  {Function} cb    Propagates (err)
 */
function update (table, id, data, cb) {
  var fieldset = ''
  var values   = []
  for (var name in data) {
    fieldset += '??=?, '
    values.push(name, data[name])
  }
  fieldset = fieldset.slice(0, -2)
  pool.query(mysql.format(`update ${table} set ${fieldset} where id=?`, values.concat(id)), cb)
}

/**
 * Deletes entry by id.
 * @param  {String}   table
 * @param  {Number}   id
 * @param  {Function} cb     Propagates (err)
 */
function delete_ (table, id, cb) {
  pool.query(mysql.format(`delete from ${table} where id=?`, [id]), cb)
}

/**
 * Flushes all rows from table.
 * @param  {String}   table
 * @param  {Function} cb    Propagates (err)
 */
function flush (table, cb) {
  pool.query(`delete from ${table}`, cb)
}

/// exports
/// ===========================================================================


module.exports = {
  connect: connect,
  define : define,
  create : create,
  read   : read,
  update : update,
  delete : delete_,
  flush  : flush
}
