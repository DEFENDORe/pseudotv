/******************
 * This module has to follow the program-player contract.
 * Async call to get a stream.
 * * If connection to plex or the file entry fails completely before playing
 *   it rejects the promise and the error is an Error() class.
 * * Otherwise it returns a stream.
 **/
const PlexTranscoder = require('./plexTranscoder')
const EventEmitter = require('events');
const helperFuncs = require('./helperFuncs')
const FFMPEG = require('./ffmpeg')
const constants = require('./constants');

let USED_CLIENTS = {};

class PlexPlayer {

    constructor(context) {
        this.context = context;
        this.ffmpeg = null;
        this.plexTranscoder = null;
        this.killed = false;
        let coreClientId = this.context.db['client-id'].find()[0].clientId;
        let i = 0;
        while ( USED_CLIENTS[coreClientId+"-"+i]===true) {
            i++;
        }
        this.clientId = coreClientId+"-"+i;
        USED_CLIENTS[this.clientId] = true;
    }

    cleanUp() {
        USED_CLIENTS[this.clientId] = false;
        this.killed = true;
        if (this.plexTranscoder != null) {
            this.plexTranscoder.stopUpdatingPlex();
            this.plexTranscoder = null;
        }
        if (this.ffmpeg != null) {
            this.ffmpeg.kill();
            this.ffmpeg = null;
        }
    }

    async play(outStream) {
        let lineupItem = this.context.lineupItem;
        let ffmpegSettings = this.context.ffmpegSettings;
        let db = this.context.db;
        let channel = this.context.channel;
        let server = db['plex-servers'].find( { 'name': lineupItem.serverKey } );
        if (server.length == 0) {
            throw Error(`Unable to find server "${lineupItem.serverKey}" specied by program.`);
        }
        server = server[0];
        if (server.uri.endsWith("/")) {
            server.uri = server.uri.slice(0, server.uri.length - 1);
        }

        try {
            let plexSettings = db['plex-settings'].find()[0];
            let plexTranscoder = new PlexTranscoder(this.clientId, server, plexSettings, channel, lineupItem);
            this.plexTranscoder = plexTranscoder;
            let watermark = this.context.watermark;
            let ffmpeg = new FFMPEG(ffmpegSettings, channel);  // Set the transcoder options
            this.ffmpeg = ffmpeg;
            let streamDuration;
            if (typeof(lineupItem.streamDuration)!=='undefined') {
                if (lineupItem.start + lineupItem.streamDuration + constants.SLACK < lineupItem.duration) {
                    streamDuration = lineupItem.streamDuration / 1000;
                }
            }
            let deinterlace = ffmpegSettings.enableFFMPEGTranscoding; //for now it will always deinterlace when transcoding is enabled but this is sub-optimal

            let stream = await plexTranscoder.getStream(deinterlace);
            if (this.killed) {
                return;
            }

            //let streamStart = (stream.directPlay) ? plexTranscoder.currTimeS : undefined;
            //let streamStart = (stream.directPlay) ? plexTranscoder.currTimeS : lineupItem.start;
            let streamStart = (stream.directPlay) ? plexTranscoder.currTimeS : undefined;
            let streamStats = stream.streamStats;
            streamStats.duration = lineupItem.streamDuration;

            let emitter = new EventEmitter();
            //setTimeout( () => {
                let ff = await ffmpeg.spawnStream(stream.streamUrl, stream.streamStats, streamStart, streamDuration, watermark, lineupItem.type); // Spawn the ffmpeg process
                ff.pipe(outStream,  {'end':false} );
            //}, 100);
            plexTranscoder.startUpdatingPlex();

            
            ffmpeg.on('end', () => {
                emitter.emit('end');
            });
            ffmpeg.on('close', () => {
                emitter.emit('close');
            });
            ffmpeg.on('error', async (err) => {
                console.log("Replacing failed stream with error stream");
                ff.unpipe(outStream);
                ffmpeg.removeAllListeners('data');
                ffmpeg.removeAllListeners('end');
                ffmpeg.removeAllListeners('error');
                ffmpeg.removeAllListeners('close');
                ffmpeg = new FFMPEG(ffmpegSettings, channel);  // Set the transcoder options
                ffmpeg.on('close', () => {
                    emitter.emit('close');
                });
                ffmpeg.on('end', () => {
                    emitter.emit('end');
                });
                ffmpeg.on('error', (err) => {
                    emitter.emit('error', err );
                });

                ff = await ffmpeg.spawnError('oops', 'oops', Math.min(streamStats.duration, 60000) );
                ff.pipe(outStream);

                emitter.emit('error', err);
            });
            return emitter;

        } catch(err) {
            if (err instanceof Error) {
                throw err;
            } else {
                return Error("Error when playing plex program: " + JSON.stringify(err) );
            }
        }
    }
}

module.exports = PlexPlayer;
