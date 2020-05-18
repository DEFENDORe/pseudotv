import { Plex } from './plex.js';

export class Driver {
    constructor(){}

    getLibrary(option) {
        try {
            if(option) {
                switch(option.service) {
                    case 'plex':
                        break;
                    default: 
                        new Error('This service is not compatible')
                }
            } else {
                new Error('You need to set a service.')
            }
        } catch (error) {
            
        }
    }
}