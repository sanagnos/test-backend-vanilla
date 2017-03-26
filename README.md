# test-backend-vanilla

## Prerequisites
1. MySQL for storage
2. Mocha for testing

## Configurations

The configurations to set up the server & database can be accessed or modified in `./config.js`.

### Server
1. `port`: Server port (optional; defaults to 80)
2. `pkeyFile`: Private key file to enable https (optional)
3. `certFile`: Certificate file to enable https (optional)

### Database
1. `host`    : MySQL host
2. `user`    : MySQL user
3. `password`: MySQL password
4. `database`: MySQL database name (database have already been created via the `create database [name]` SQL command)

## Getting started

Once the database has been created and the configurations (eg. the database name) have been set correctly, then
1. Run `npm install` from the local directory
2. Run `npm start` to fire up the server OR `npm test` to run the tests

## Interacting with the User model

The user model is defined in `./api/user.js` and can be interacted with via a simple REST API that supports basic CRUD operations:
* Create: `POST /user`
  * Accepts JSON that specifies the following properties:
    * `name`
    * `dob`
    * `address`
    * `description`
  * Returns the new user's id
* Read: `GET /user/:id`
  * Accepts the user id as a URL parameter
  * Returns JSON with the following properties populated from the database
    * `id`
    * `name`
    * `dob`
    * `address`
    * `description`
    * `created_at`
* Update: `PUT /user/:id`
  * Accepts the user id as a URL parameter
  * Accepts JSON that specifies any of the following properties:
    * `name`
    * `dob`
    * `address`
    * `description`
  * Does not return data
* Delete: `DELETE /user/:id`
  * Accepts the user id as a URL parameter
  * Does not return data

## Extending models and routes

Any additional models along with routes & handlers to change data reflected on MySQL can be declared in the `./api` directory, along the same lines that the `./api/user.js` module has been specified. Once a new such module has been declared, it must be registered in `./main.js`.

For example, the `./api/user.js` module serves two actions:
1. Defines the user model as a MySQL table with appropriate fields
2. Registers the REST routes and handlers to create, access, and modify user data.

Then, `./main.js` is where the `./api/user.js` module is registered, by calling `require('./api/user.js')`.

For each module declared in `./api`, test cases may be written in `./tests`.

## Directory structure
* `./config.js`: Server and database configurations
* `./main.js`: App entrypoint
* `./lib`: Server and Database routines
  * `./lib/io.js`: Network I/O module, managing server lifecycle & routing
  * `./lib/db.js`: MySQL database module, abstracting access to database
* `./api`: Models & routing
  * `./api/user.js`: Declares user model and appropriate REST routes to access it
* `./tests`: Tests of modules in `./api`
  * `./tests/user.js`: Test cases on the user model declared in `./api/user.js`
