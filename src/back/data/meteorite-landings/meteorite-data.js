const path = require('path');
const Datastore = require('@seald-io/nedb');

const db = new Datastore({
    filename: path.join(process.cwd(), "data", "meteoritos.db"),
    autoload: true
});

module.exports = db;