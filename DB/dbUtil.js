const mysql = require('mysql2/promise');
const config = require('./db.js');

const pool = mysql.createPool(config);

pool.on('error', err => {
    console.log('err in dbUtil:', err.name + " : " + err.message);
})

module.exports = pool;
