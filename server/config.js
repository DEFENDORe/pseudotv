import bodyParser from 'body-parser';
import mediaServiceRouters from './src/router/mediaServiceRouters.js';

import proxy from 'express-http-proxy';

function createProxyToClient(env) {
    if(env.ENVIRONMENT === 'development') {
        return proxy('http://localhost:8080/');
    }
    return false;
}

export default (app, env) => {
    app.use(bodyParser.json());
    app.use('/api/media_service', mediaServiceRouters);
    const devProxy = createProxyToClient(env);

    if(devProxy){
        app.use('/', devProxy);
    }

    return app;
}