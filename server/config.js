import bodyParser from 'body-parser';
import api from './src/router/apiRouters.js' ;
import mediaServiceRouters from './src/router/mediaServiceRouters.js';

export default (app) => {
    app.use(bodyParser.json());
    app.use('/api/media_service', mediaServiceRouters);
    return app;
}