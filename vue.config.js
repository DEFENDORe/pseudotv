const configExpressApp = require('./server/config')
module.exports = {
    runtimeCompiler: true,
    devServer: {
        before: configExpressApp
    }
}