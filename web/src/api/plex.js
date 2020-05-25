import axios from "axios"
import xml2js from "xml2js"

function SignIn() {
    let plexHeaders = {
        'Accept': 'application/json',
        'X-Plex-Product': 'PseudoTV',
        'X-Plex-Version': 'Plex OAuth',
        'X-Plex-Client-Identifier': 'rg14zekk3pa5zp4safjwaa8z',
        'X-Plex-Model': 'Plex OAuth'
    }
    return new Promise(async (resolve, reject) => {
        try {
            let res = await axios({
                method: 'POST',
                url: 'https://plex.tv/api/v2/pins?strong=true',
                headers: plexHeaders
            })
            window.open(`https://app.plex.tv/auth/#!?clientID=rg14zekk3pa5zp4safjwaa8z&context[device][version]=Plex OAuth&context[device][model]=Plex OAuth&code=${res.data.code}&context[device][product]=Plex Web`)            
            plexHeaders['X-Plex-Token'] = await pollForToken(res.data.id, plexHeaders)
            let res2 = await axios({
                method: 'GET',
                url: 'https://plex.tv/users/account',
                headers: plexHeaders
            })
            xml2js.parseString(res2.data, (err, jsonData) => {
                resolve(jsonData.user.$)
            })
        } catch (err) {
            reject(err)
        }
    })
    
}

function getPlexAccounts() {
    return axios({
        method: 'GET',
        url: '/api/plex/accounts'
    }).then((res) => {
        return res.data
    })
}

function postPlexAccount(title, token) {
    return axios({
        method: 'POST',
        url: '/api/plex/accounts',
        data: { title: title, token: token}
    }).then((res) => {
        return res.data
    })
}

function deletePlexAccount(id) {
    return axios({
        method: 'DELETE',
        url: `/api/plex/accounts/${id}`
    }).then((res) => {
        return res.data
    })
}

function getPlexServers(id) {
    return axios({
        method: 'GET',
        url: `/api/plex/${id}}/servers`
    }).then((res) => {
        return res.data
    })
}

function getSections(account, connection) {
    return axios({
        method: 'GET',
        url: `/api/plex/sections`,
        params: {
            token: account.token,
            uri: connection.uri
        }
    }).then((res) => {
        return res.data
    })
}

export const plex = {
    SignIn: SignIn,
    getPlexAccounts: getPlexAccounts,
    postPlexAccount: postPlexAccount,
    deletePlexAccount: deletePlexAccount,
    getPlexServers: getPlexServers,
    getSections: getSections
}


function pollForToken(id, plexHeaders) {
    return new Promise((resolve, reject) => {
        let timeout = 10
        let interval = setInterval(async () => {
            if (timeout <= 0) {
                clearInterval(interval)
                reject('Plex Sign-in Timed Out.')
                return
            }
            try {
                let token = await getAccountToken(id, plexHeaders)
                if (token !== null) {
                    clearInterval(interval)
                    resolve(token)
                }
            } catch (err) {
                clearInterval(interval)
                reject('Failed to communicate with Plex authentication servers')
            }
            timeout -= 2
        }, 2000)
        
    })
    
}


function getAccountToken(id, plexHeaders) {
    return axios({
        method: 'GET',
        url: `https://plex.tv/api/v2/pins/${id}`,
        headers: plexHeaders
    }).then((res) => {
        return res.data.authToken
    })
}
