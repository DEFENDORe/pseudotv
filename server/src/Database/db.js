import sqlite3 from 'sqlite3';
import path from 'path';
import initQueryDb from './init_db.js';

const __dirname = path.resolve(path.dirname(''));

const db = new sqlite3.Database(path.join(__dirname, './pseudotv.db'), (err) => {
    if (err) {
        throw new Error(err.message)
    }

    console.log('Connected to the test database.');
})

/**
 * Create tables based on init_db.
 *
 */
function createDatabaseTables() {
    Object.keys(initQueryDb).forEach(queryIndex => {
        db.run(initQueryDb[queryIndex], [], (err) => {
            if (err)
                return console.error(err.message)
            console.log(`Created ${queryIndex} Table.`)
        })
    });
}

function getPrograms(channel) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM programs WHERE channelId = ?`
        db.all(sql, [channelId], (err, rows) => {
            if (err)
                reject(err)
            resolve(rows)
        })
    })
}

function getProgramOpts(programId) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM programOpts WHERE programId = ?`
        db.all(sql, [programId], (err, rows) => {
            if (err)
                reject(err)
            resolve(rows)
        })
    })
}

function getChannels() {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM channels
                  ORDER BY id`
        db.all(sql, [], (err, rows) => {
            if (err)
                reject(err)
            resolve(rows)
        })
    })
}

function getChannelOpts(channelId) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM channelOpts WHERE channel = ?`
        db.all(sql, [channelId], (err, rows) => {
            if (err)
                reject(err)
            resolve(rows)
        })
    })
}

function getCommercials(channelId) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM commercials WHERE channelId = ?`
        db.all(sql, [channelId], (err, rows) => {
            if (err)
                reject(err)
            resolve(rows)
        })
    })
}

function getMediaServiceAccount(id) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM media_service_accounts WHERE id = ?`
        db.all(sql, [id], (err, rows) => {
            if (err)
                reject(err)
            resolve(rows)
        })
    })
}
function getMediaServiceAccounts(type = '*') {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM media_service_accounts WHERE type = ?`
        db.all(sql, [type], (err, rows) => {
            if (err)
                reject(err)
            resolve(rows)
        })
    })
}
function addMediaServiceAccount(title, token, type = '*') {
    return new Promise((resolve, reject) => {
        let sql = `INSERT INTO media_service_accounts(title,token,type) VALUES(?,?,?)`
        db.run(sql, [title, token, type], async (err) => {
            if (err)
                reject(err)
            try {
                let accounts = await getMediaServiceAccounts(type);
                resolve(accounts)
            } catch (err) {
                reject(err)
            }
        })
    })
}
function deleteMediaServiceAccount (id) {
    return new Promise((resolve, reject) => {
        let sql = `DELETE FROM media_service_accounts WHERE id = ?`
        db.run(sql, [id], async (err) => {
            if (err)
                reject(err)
            try {
                let accounts = await getMediaServiceAccounts()
                resolve(accounts)
            } catch (err) {
                reject(err)
            }
        })
    })
}

// Starting Database.
createDatabaseTables();

export default {
    getMediaServiceAccount: getMediaServiceAccount,
    getMediaServiceAccounts: getMediaServiceAccounts,
    addMediaServiceAccount: addMediaServiceAccount,
    deleteMediaServiceAccount: deleteMediaServiceAccount,
    db: db
};

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

function shutDown() {
    db.close((err) => {
        if (err) {
            console.error(err.message);
            process.exit(1);
        }
        console.log('Closed the database connection.');
        process.exit(0);
    })
}
