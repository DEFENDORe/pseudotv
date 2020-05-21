import axios from 'axios';
import xml2js from 'xml2js';

export class Plex {
    constructor(token) {
        this._headers = {
            'Accept': 'application/json',
            'X-Plex-Device': 'PseudoTV',
            'X-Plex-Device-Name': 'PseudoTV',
            'X-Plex-Product': 'PseudoTV',
            'X-Plex-Version': '0.1',
            'X-Plex-Client-Identifier': 'rg14zekk3pa5zp4safjwaa8z',
            'X-Plex-Platform': 'Chrome',
            'X-Plex-Platform-Version': '80.0',
            'X-Plex-Token': token
        }
    }

    get URL() { return `${this._server.protocol}://${this._server.host}:${this._server.port}` }

    GetServers() {
        var req = {
            method: 'GET',
            url: `https://plex.tv/api/resources`,
            headers: this._headers
        }
        return new Promise(async (resolve, reject) => {
            try {
                let res = await axios(req)
                xml2js.parseString(res.data, (err, result) => {
                    if (err)
                        reject(err)
                    let servers = []
                    for (let i = 0, l = result.MediaContainer.Device.length; i < l; i++) {
                        if (result.MediaContainer.Device[i].$.provides.indexOf('server') > -1) {
                            let connections = []
                            for (let y = 0, l2 = result.MediaContainer.Device[i].Connection.length; y < l2; y++)
                                connections.push(result.MediaContainer.Device[i].Connection[y].$)
                            servers.push({
                                name: result.MediaContainer.Device[i].$.name,
                                connections: connections
                            })
                        }
                    }
                    resolve(servers)
                })
            } catch (err) {
                reject(err)
            }
        })
        
    }

    Get(path, optionalHeaders = {}) {
        var req = {
            method: 'GET',
            url: path,
            headers: this._headers
        }
        Object.assign(req.headers, optionalHeaders)
        return axios(req).then((res) => {
            return res.data
        })
    }
    Put(path, query = {}, optionalHeaders = {}) {
        var req = {
            method: 'put',
            url: `${path}`,
            headers: this._headers,
            qs: query,
            jar: false
        }
        Object.assign(req, optionalHeaders)
        return new Promise((resolve, reject) => {
            if (this._token === '')
                reject("No Plex token provided. Please use the SignIn method or provide a X-Plex-Token in the Plex constructor.")
            else
                request(req, (err, res) => {
                    if (err || res.statusCode !== 200)
                        reject(`Plex 'Put' request failed. URL: ${this.URL}${path}`)
                    else
                        resolve(res.body)
                })
        })
    }
    Post(path, query = {}, optionalHeaders = {}) {
        var req = {
            method: 'post',
            url: `${path}`,
            headers: this._headers,
            qs: query,
            jar: false
        }
        Object.assign(req, optionalHeaders)
        return new Promise((resolve, reject) => {
            if (this._token === '')
                reject("No Plex token provided. Please use the SignIn method or provide a X-Plex-Token in the Plex constructor.")
            else
                request(req, (err, res) => {
                    if (err || res.statusCode !== 200)
                        reject(`Plex 'Post' request failed. URL: ${this.URL}${path}`)
                    else
                        resolve(res.body)
                })
        })
    }
}