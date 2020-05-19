let api = require('express').Router()
let db = require('./db')

let Plex = require('./plex')

api.get('/api/plex/accounts', async (req, res) => {
    try {
        let accounts = await db.getPlexAccounts()
        for (let i = 0, l = accounts.length; i < l; i++) {
            let plex = new Plex(accounts[i].token)
            accounts[i].servers = await plex.GetServers()
        }
        res.json(accounts)
    } catch (err) {
        res.status(500).send(`Database Error. Code: ${err.code} - Errno: ${err.errno}`)
    }
})

api.post('/api/plex/accounts', async (req, res) => {
    try {
        let accounts = await db.addPlexAccount(req.body.title, req.body.token)
        for (let i = 0, l = accounts.length; i < l; i++) {
            let plex = new Plex(accounts[i].token)
            accounts[i].servers = await plex.GetServers()
        }
        res.json(accounts)
    } catch (err) {
        res.status(500).send(err)
    }
})

api.delete('/api/plex/accounts/:id', async (req, res) => {
    try {
        let accounts = await db.deletePlexAccount(req.params.id)
        for (let i = 0, l = accounts.length; i < l; i++) {
            let plex = new Plex(accounts[i].token)
            accounts[i].servers = await plex.GetServers()
        }
        res.json(accounts)
    } catch (err) {
        res.status(500).send(err)
    }
})

api.get('/api/plex/sections', async (req, res) => {
    let plex = new Plex(req.query.token)
    try {
        let result = await plex.Get(req.query.uri + `/library/sections`)
        res.json(result.MediaContainer.Directory)
    } catch (err) {
        res.status(500).send(err)
    }
})

module.exports = api