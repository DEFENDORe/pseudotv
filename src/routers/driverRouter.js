import { Driver } from '../driver.js';

import express from 'express';
const router = express.Router();

const driver = new Driver();

function getDrivers(req, res) {
    res.send(['plex']);
}

function getLibrary(req, res) {
    res.send('xxxx');
}

// Routes
router.get('/', getDrivers);
router.get('/library', getLibrary);

export default router;