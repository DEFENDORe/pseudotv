const sqlite3 = require('sqlite3')
const path = require('path')

let db = new sqlite3.Database(path.join(__dirname, '../../pseudotv.db'), (err) => {
    if (err)
      return console.error(err.message)
    console.log('Connected to the test database.')
})

let createPlexAccountsSql = `
CREATE TABLE IF NOT EXISTS plex_accounts(
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    token TEXT NOT NULL
);`

db.run(createPlexAccountsSql, [], (err) => {
    if (err)
        return console.error(err.message)
    console.log('Created plex_accounts Table.')
})

function getPlexAccount(id) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM plex_accounts WHERE id = ?`
        db.all(sql, [id], (err, rows) => {
            if (err)
                reject(err)
            resolve(rows)
        })
    })
}
function getPlexAccounts() {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM plex_accounts`
        db.all(sql, [], (err, rows) => {
            if (err)
                reject(err)
            resolve(rows)
        })
    })
}
function addPlexAccount(title, token) {
    return new Promise((resolve, reject) => {
        let sql = `INSERT INTO plex_accounts(title,token) VALUES(?,?)`
        db.run(sql, [title, token], async (err) => {
            if (err)
                reject(err)
            try {
                let accounts = await getPlexAccounts()
                resolve(accounts)
            } catch (err) {
                reject(err)
            }
        })
    })
}
function deletePlexAccount (id) {
    return new Promise((resolve, reject) => {
        let sql = `DELETE FROM plex_accounts WHERE id = ?`
        db.run(sql, [id], async (err) => {
            if (err)
                reject(err)
            try {
                let accounts = await getPlexAccounts()
                resolve(accounts)
            } catch (err) {
                reject(err)
            }
        })
    })
}

module.exports = {
    getPlexAccount: getPlexAccount,
    getPlexAccounts: getPlexAccounts,
    addPlexAccount: addPlexAccount,
    deletePlexAccount: deletePlexAccount,
    db: db
}

process.on('SIGTERM', shutDown)
process.on('SIGINT', shutDown)

function shutDown() {
    db.close((err) => {
        if (err) {
            console.error(err.message)
            process.exit(1)
        }
        console.log('Closed the database connection.')
        process.exit(0)
    })
}