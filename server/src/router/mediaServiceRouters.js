/** 
 * @fileoverview MediaServiceRouters is used to manager all child routers of `/api/media_service`.
 * This file is used to get express router/request information and manager HTTP response with right information or with a error.
*/
import express from 'express';
import { MediaService } from '../mediaService.js';

const router = express.Router();
const mediaService = new MediaService();

/**
 * Return all Media Services available.
 *
 * @param {*} req
 * @param {*} res
 */
function getMediaServices(req, res) {
    res.json(['plex']);
}

async function getMediaServiceAccounts(req, res) {
    try {
        const accounts = await mediaService.getAccounts({
            service: req.query.service
        });
        res.send(accounts);
    } catch (error) {
        res.status(500).json({
            code: 10001,
            message: error
        });
    }
}

async function postMediaServiceAccounts(req, res) {
    try {
        const accounts = await mediaService.createAccount({
            service: req.query.service,
            token: req.body.token,
            title: req.body.title
        });
        res.send(accounts);
    } catch (error) {
        res.status(500).json({
            code: 10002,
            message: error
        });
    }
}

async function deleteMediaServiceAccounts(req, res) {
    try {
        const accounts = await mediaService.deleteAccount({
            id: req.params.service,
        });
        res.send(accounts);
    } catch (error) {
        res.status(500).json({
            code: 10002,
            message: error
        });
    }
}

async function getMediaServiceSections(req, res) {
    try {
        const sections = await mediaService.getMediaServiceSections({
            service: req.params.service,
            token: req.params.token
        });
        res.send(sections);
    } catch (error) {
        res.status(500).json({
            code: 10002,
            message: error
        });
    }
}

// Routes
router.get('/', getMediaServices);

// Routes:Account
router.get('/accounts', getMediaServiceAccounts);
router.post('/accounts', postMediaServiceAccounts);
router.delete('/accounts/:id', deleteMediaServiceAccounts);

// Routes:Sections
router.get('/sections', getMediaServiceSections);

export default router; 