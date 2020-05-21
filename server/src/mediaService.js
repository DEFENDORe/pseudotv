import db from './Database/db.js';
import { Plex } from './plex.js';

/**
 * MediaService Class manager all information about media service.
 * This class get Media Service information using with base Favorite Service like Plex, Emby or Jellygin.
 *
 * @export
 * @class MediaService
 */
export class MediaService {
    constructor(){}

    /**
     * Get all accounts of all media service type or only one setting `option.service = 'plex'|'jellyfin'`
     *
     * @param {*} [options={service: null}] `service: string`
     * @returns {Promise} Promise with accounts Array or a Error Message
     * @memberof MediaService
     */
    getAccounts(options = {service: null}) {
        return new Promise(async (resolve, reject) => {
            try {
                options.service = options.service ? options.service : null;

                let accounts = await db.getMediaServiceAccounts(options.service);
                switch (options.service) {
                    case 'plex':
                    default:
                        accounts = await accounts.map(async (account) => {
                            let plex = new Plex(account.token);
                            account.servers = await plex.GetServers();
                        });
                        break;
                }
                
                resolve(accounts);
            } catch (err) {
                reject(`Database Error. Code: ${err.code} - Errno: ${err.errno}`);
            }
        });
    };

    /**
     * Create Account for an media service and sabe this on Database.
     *
     * @param {*} [options={service: null, token: null, title: null}] `service: string`, `token: string` and `title: string`
     * @returns {Promise} Promise with account or a Error Message
     * @memberof MediaService
     */
    createAccount(options = {service: null, token: null, title: null}) {
        return new Promise(async (resolve, reject) => {
            try {
                options.service = options.service ? options.service : null;

                let accounts = await db.addMediaServiceAccount(options.title, options.token, options.service);
                switch (options.service) {
                    case 'plex':
                    default:
                        accounts = await accounts.map(async (account) => {
                            let plex = new Plex(account.token);
                            account.servers = await plex.GetServers();
                        });
                        break;
                }
                
                resolve(accounts);
            } catch (err) {
                reject(err);
            }
        });
    };

    /**
     * Delete a Account from any Media Service, using ID
     *
     * @param {*} [options={id: null}] `id:string`
     * @returns {Promise} Promise with accounts or a Error Message
     * @memberof MediaService
     */
    deleteAccount(options = {id: null}) {
        return new Promise(async (resolve, reject) => {
            try {
                let accounts = await db.deleteMediaServiceAccount(options.id);
                switch (options.service) {
                    case 'plex':
                    default:
                        accounts = await accounts.map(async (account) => {
                            let plex = new Plex(account.token);
                            account.servers = await plex.GetServers();
                        });
                        break;
                }
                
                resolve(accounts);
            } catch (err) {
                reject(err);
            }
        });
    };

    /**
     * Get all Sections from Media Service
     *
     * @param {*} [options={service: null, uri: null}] `service: string`, `uri: string`
     * @returns {Promise} Promise with Directory of Medias or a Error Message
     * @memberof MediaService
     */
    getMediaServiceSections(options = {service: null, uri: null}) {
        return new Promise(async (resolve, reject) => {
            try {
                switch (options.service) {
                    case 'plex':
                    default:
                        let plex = new Plex(req.query.token);
                        let result = await plex.Get(req.query.uri + `/library/sections`);
                        resolve(result.MediaContainer.Directory);
                        break;
                }
                
                resolve(accounts);
            } catch (err) {
                reject(err);
            }
        });
    }
}

 