import path from 'path';
import express from 'express';
import configExpressServer from './config.js';

const __dirname = path.resolve(path.dirname(''));

process.env.PORT = typeof process.env.PORT === 'undefined' ? 8000 : process.env.PORT;

let app = express();

configExpressServer(app);

app.use(express.static(path.join(__dirname, '../dist')));

app.listen(process.env.PORT, () => {
    console.log(`Server started on port: ${ process.env.PORT }`);
});
