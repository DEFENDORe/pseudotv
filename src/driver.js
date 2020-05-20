import { Plex } from './plex.js';

export class Driver {
    constructor(){
        this.plex = new Plex({});
    }

    
    login(option = { service: null, host: null }) {
        return new Promise(async (resolve, reject) => {
            try {
                switch(option.service) {
                    case 'plex':
                        console.log(option);
                        resolve(await this.plex.Login(option.host));
                        break;
                    default: 
                        reject('This service is not compatible');
                }
            } catch (error) {
                reject(error.message);
            }
        });
    }

    /**
     *
     *
     * @param {*} option {service: plex}
     * @memberof Driver
     */
    getLibrary(option = { service: null }) {
        return new Promise((resolve, reject) => {
            try {
                switch(option.service) {
                    case 'plex':
                        console.log(this.plex.GetLibrary());
                        resolve('Ok');
                        break;
                    default: 
                        reject('This service is not compatible');
                }
            } catch (error) {
                reject(error.message);
            }
        });
    }
}