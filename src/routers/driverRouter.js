import { Driver } from '../driver.js';
import { ErrorResponse } from '../errorResponse.js';

import express from 'express';
const router = express.Router();

const driver = new Driver();

function getDrivers(req, res) {
    res.send(['plex']);
}

async function getLibrary(req, res) {
    try {
        const library = await driver.getLibrary({
            service: req.query.service
        });
        res.send(library);
    } catch (error) {
        res.send(
            ErrorResponse.errorMessage({
                code: 10001,
                message: error
            })
        );
    }
}

async function login(req, res) {
    try {
        const login = await driver.login({
            service: req.query.service,
            host: {
                protocol: 'http',
                host: '192.168.25.11',
                port: '32400'
            }
        });
        res.send(login);
    } catch (error) {
        res.send(
            ErrorResponse.errorMessage({
                code: 10001,
                message: error
            })
        );
    }
}

// Routes
router.get('/', getDrivers);
router.get('/library', getLibrary);
router.get('/login', login);

export default router;