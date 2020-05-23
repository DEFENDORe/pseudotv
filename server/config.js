import bodyParser from 'body-parser';
import mediaServiceRouters from './src/router/mediaServiceRouters.js';

import HPM from 'http-proxy-middleware';

function createProxyToClient(env) {
    if(env.ENVIRONMENT === 'development') {
        const excludeAPI = (pathname) => {
            return !pathname.match('^/api');
        };
        return HPM.createProxyMiddleware(excludeAPI, {target: 'http://localhost:8080/', ws: true});
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