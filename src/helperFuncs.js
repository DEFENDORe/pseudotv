module.exports = {
    getCurrentProgramAndTimeElapsed: getCurrentProgramAndTimeElapsed,
    createLineup: createLineup,
    getWatermark: getWatermark,
}

let channelCache = require('./channel-cache');
const SLACK = require('./constants').SLACK;
const randomJS = require("random-js");
const Random = randomJS.Random;
const random = new Random( randomJS.MersenneTwister19937.autoSeed() );

module.exports.random = random;

function getCurrentProgramAndTimeElapsed(date, channel) {
    let channelStartTime = (new Date(channel.startTime)).getTime();
    if (channelStartTime > date) {
        let t0 = date;
        let t1 = channelStartTime;
        console.log(t0, t1);
        console.log("Channel start time is above the given date. Flex time is picked till that.");
        return {
            program: {
                isOffline: true,
                duration : t1 - t0,
            },
            timeElapsed: 0,
            programIndex: -1,
        }
    }
    let timeElapsed = (date - channelStartTime) % channel.duration
    let currentProgramIndex = -1
    for (let y = 0, l2 = channel.programs.length; y < l2; y++) {
        let program = channel.programs[y]
        if (timeElapsed - program.duration < 0) {
            currentProgramIndex = y
            if ( (program.duration > 2*SLACK) && (timeElapsed > program.duration - SLACK) ) {
                timeElapsed = 0;
                currentProgramIndex = (y + 1) % channel.programs.length;
            }
            break;
        } else {
            timeElapsed -= program.duration
        }
    }

    if (currentProgramIndex === -1)
        throw new Error("No program found; find algorithm fucked up")

    return { program: channel.programs[currentProgramIndex], timeElapsed: timeElapsed, programIndex: currentProgramIndex }
}

function createLineup(obj, channel, fillers, isFirst) {
    let timeElapsed = obj.timeElapsed
    // Start time of a file is never consistent unless 0. Run time of an episode can vary. 
    // When within 30 seconds of start time, just make the time 0 to smooth things out
    // Helps prevents loosing first few seconds of an episode upon lineup change
    let activeProgram = obj.program

    let lineup = []

    if ( typeof(activeProgram.err) !== 'undefined') {
        let remaining = activeProgram.duration - timeElapsed;
        lineup.push( {
            type: 'offline',
            title: 'Error',
            err: activeProgram.err,
            streamDuration: remaining,
            duration: remaining,
            start: 0
        })
        return lineup;
    }


    if (activeProgram.isOffline === true) {
        //offline case
        let remaining = activeProgram.duration - timeElapsed;
        //look for a random filler to play
        let filler = null;
        let special = null;

            if ( (channel.offlineMode === 'clip') && (channel.fallback.length != 0) ) {
                special = JSON.parse(JSON.stringify(channel.fallback[0]));
            }
            let randomResult = pickRandomWithMaxDuration(channel, fillers, remaining + (isFirst? (7*24*60*60*1000) : 0) );
            filler = randomResult.filler;
            if (filler == null && (typeof(randomResult.minimumWait) !== undefined) && (remaining > randomResult.minimumWait) ) {
                remaining = randomResult.minimumWait;
            }

        let isSpecial = false;
        if (filler == null) {
            filler = special;
            isSpecial = true;
        }
        if (filler != null) {
            let fillerstart = 0;
            if (isSpecial) {
                if (filler.duration > remaining) {
                    fillerstart = filler.duration - remaining;
                } else {
                    ffillerstart = 0;
                }
            } else if(isFirst) {
                fillerstart = Math.max(0, filler.duration - remaining);
                //it's boring and odd to tune into a channel and it's always
                //the start of a commercial.
                let more = Math.max(0, filler.duration - fillerstart - 15000 - SLACK);
                fillerstart +=  random.integer(0, more);
            }
            lineup.push({   // just add the video, starting at 0, playing the entire duration
                type: 'commercial',
                title: filler.title,
                key: filler.key,
                plexFile: filler.plexFile,
                file: filler.file,
                ratingKey: filler.ratingKey,
                start: fillerstart,
                streamDuration: Math.max(1, Math.min(filler.duration - fillerstart, remaining) ),
                duration: filler.duration,
                fillerId: filler.fillerId,
                serverKey: filler.serverKey
            });
            return lineup;
        }
        // pick the offline screen
        remaining = Math.min(remaining, 10*60*1000);
        //don't display the offline screen for longer than 10 minutes. Maybe the
        //channel's admin might change the schedule during that time and then
        //it would be better to start playing the content.
        lineup.push( {
            type: 'offline',
            title: 'Channel Offline',
            streamDuration: remaining,
            duration: remaining,
            start: 0
        })
        return lineup;
    }
    if (timeElapsed < 30000) {
        timeElapsed = 0
    }

    return [ {
                        type: 'program',
                        title: activeProgram.title,
                        key: activeProgram.key,
                        plexFile: activeProgram.plexFile,
                        file: activeProgram.file,
                        ratingKey: activeProgram.ratingKey,
                        start:  timeElapsed,
                        streamDuration: activeProgram.duration - timeElapsed,
                        duration: activeProgram.duration,
                        serverKey: activeProgram.serverKey
    } ];
}

function weighedPick(a, total) {
    return random.bool(a, total);
}

function pickRandomWithMaxDuration(channel, fillers, maxDuration) {
    let list = [];
    for (let i = 0; i < fillers.length; i++) {
        list = list.concat(fillers[i].content);
    }
    let pick1 = null;
    let pick2 = null;
    let t0 = (new Date()).getTime();
    let minimumWait = 1000000000;
    const D = 7*24*60*60*1000;
    if (typeof(channel.fillerRepeatCooldown) === 'undefined') {
        channel.fillerRepeatCooldown = 30*60*1000;
    }
    let listM = 0;
    let fillerId = undefined;
    for (let j = 0; j < fillers.length; j++) {
      list = fillers[j].content;
      let pickedList = false;
      let n = 0;
      let m = 0;
      for (let i = 0; i < list.length; i++) {
        let clip = list[i];
        // a few extra milliseconds won't hurt anyone, would it? dun dun dun
        if (clip.duration <= maxDuration + SLACK ) {
            let t1 = channelCache.getProgramLastPlayTime( channel.number, clip );
            let timeSince = ( (t1 == 0) ?  D :  (t0 - t1) );


            if (timeSince < channel.fillerRepeatCooldown - SLACK) {
                let w = channel.fillerRepeatCooldown - timeSince;
                if (clip.duration + w <= maxDuration + SLACK) {
                    minimumWait = Math.min(minimumWait, w);
                }
                timeSince = 0;
                //30 minutes is too little, don't repeat it at all
            } else if (!pickedList) {
                let t1 = channelCache.getFillerLastPlayTime( channel.number, fillers[j].id );
                let timeSince = ( (t1 == 0) ?  D :  (t0 - t1) );
                if (timeSince + SLACK >= fillers[j].cooldown) {
                    //should we pick this list?
                    listM += fillers[j].weight;
                    if ( weighedPick(fillers[j].weight, listM) ) {
                        pickedList = true;
                        fillerId = fillers[j].id;
                    } else {
                        break;
                    }
                } else {
                    let w = fillers[j].cooldown - timeSince;
                    if (clip.duration + w <= maxDuration + SLACK) {
                        minimumWait = Math.min(minimumWait, w);
                    }
    
                    break;
                }
            }
            if (timeSince >= D) {
                let p = 200, q = Math.max( maxDuration - clip.duration, 1 );
                let pq = Math.min( Math.ceil(p / q), 10 );
                let w =  pq;
                n += w;
                if (  weighedPick(w, n) ) {
                    pick1 = clip;
                }
            } else {
                let adjust = Math.floor(timeSince / (60*1000));
                if (adjust > 0) {
                    adjust = adjust * adjust;
                    //weighted
                    m += adjust;
                    if (  weighedPick(adjust, m) )  {
                        pick2 = clip;
                    }
                }
            }
        }
      }
    }
    let pick = (pick1 == null) ? pick2: pick1;
    let pickTitle = "null";
    if (pick != null) {
        pickTitle = pick.title;
        pick = JSON.parse( JSON.stringify(pick) );
        pick.fillerId = fillerId;
    }
    
   
    return {
        filler: pick,
        minimumWait : minimumWait,
    }
}

function getWatermark(  ffmpegSettings, channel, type) {
    if (! ffmpegSettings.enableFFMPEGTranscoding || ffmpegSettings.disableChannelOverlay ) {
        return null;
    }
    let d = channel.disableFillerOverlay;
    if (typeof(d) === 'undefined') {
        d = true;
    }
    if ( (typeof type !== `undefined`) && (type == 'commercial') && d ) {
        return null;
    }
    let e = false;
    let icon = undefined;
    let watermark = {};
    if (typeof(channel.watermark) !== 'undefined') {
        watermark = channel.watermark;
        e = (watermark.enabled === true);
        icon = watermark.url;
    }
    if (! e) {
        return null;
    }
    if ( (typeof(icon) === 'undefined') || (icon === '') ) {
        icon = channel.icon;
        if ( (typeof(icon) === 'undefined') || (icon === '') ) {
            return null;
        }
    }
    let result = {
        url: icon,
        width: watermark.width,
        verticalMargin: watermark.verticalMargin,
        horizontalMargin: watermark.horizontalMargin,
        duration: watermark.duration,
        position: watermark.position,
        fixedSize: (watermark.fixedSize === true),
        animated: (watermark.animated === true),
    }
    return result;
}

