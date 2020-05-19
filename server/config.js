const bodyParser = require('body-parser')
const api = require('./src/api')

module.exports = (app) => {
    app.use(bodyParser.json())
    app.use(api)
}