const constants = require("../constants");

const random = require('../helperFuncs').random;

const MINUTE = 60*1000;
const DAY = 24*60*MINUTE;
const LIMIT = 40000;



//This is a triplicate code, but maybe it doesn't have to be?
function getShow(program) {
    //used for equalize and frequency tweak
    if (program.isOffline) {
        if (program.type == 'redirect') {
            return {
                description : `Redirect to channel ${program.channel}`,
                id: "redirect." + program.channel,
                channel: program.channel,
            }
        } else {
            return null;
        }
    } else if ( (program.type == 'episode') && ( typeof(program.showTitle) !== 'undefined' ) ) {
        return {
            description: program.showTitle,
            id: "tv." + program.showTitle,
        }
    } else {
        return {
            description: "Movies",
            id: "movie.",
        }
    }
}


function shuffle(array, lo, hi ) {
    if (typeof(lo) === 'undefined') {
        lo = 0;
        hi = array.length;
    }
    let currentIndex = hi, temporaryValue, randomIndex
    while (lo !== currentIndex) {
        randomIndex =  random.integer(lo, currentIndex-1);
        currentIndex -= 1
        temporaryValue = array[currentIndex]
        array[currentIndex] = array[randomIndex]
        array[randomIndex] = temporaryValue
    }
    return array
}

function _wait(t) {
    return new Promise((resolve) => {
      setTimeout(resolve, t);
    });
}

function getProgramId(program) {
    let s = program.serverKey;
    if (typeof(s) === 'undefined') {
        s = 'unknown';
    }
    let p = program.key;
    if (typeof(p) === 'undefined') {
        p = 'unknown';
    }
    return s + "|" + p;
}

function addProgramToShow(show, program) {
    if ( (show.id == 'flex.') || show.id.startsWith("redirect.")  ) {
        //nothing to do
        return;
    }
    let id = getProgramId(program)
    if(show.programs[id] !== true) {
        show.programs.push(program);
        show.programs[id] = true
    }
}

function getShowOrderer(show) {
    if (typeof(show.orderer) === 'undefined') {

        let sortedPrograms = JSON.parse( JSON.stringify(show.programs) );
        sortedPrograms.sort((a, b) => {
            if (a.season === b.season) {
                if (a.episode > b.episode) {
                    return 1
                } else {
                    return -1
                }
            } else if (a.season > b.season) {
                return 1;
            } else if (b.season > a.season) {
                return -1;
            } else {
                return 0
            }
        });

        let position = 0;
        while (
            (position + 1 < sortedPrograms.length )
            &&
            (
                show.founder.season !== sortedPrograms[position].season
                ||
                show.founder.episode !== sortedPrograms[position].episode
            )
        ) {
            position++;
        }


        show.orderer = {

            current : () => {
                return sortedPrograms[position];
            },

            next: () => {
                position = (position + 1) % sortedPrograms.length;
            },

        }
    }
    return show.orderer;
}


function getShowShuffler(show) {
    if (typeof(show.shuffler) === 'undefined') {
        if (typeof(show.programs) === 'undefined') {
            throw Error(show.id + " has no programs?")
        }

        let randomPrograms = JSON.parse( JSON.stringify(show.programs) );
        let n = randomPrograms.length;
        shuffle( randomPrograms, 0, n);
        let position = 0;

        show.shuffler  = {

            current : () => {
                return randomPrograms[position];
            },

            next: () => {
                position++;
                if (position == n) {
                    let a = Math.floor(n / 2);
                    shuffle(randomPrograms, 0, a );
                    shuffle(randomPrograms, a, n );
                    position = 0;
                }
            },

        }
    }
    return show.shuffler;
}

module.exports = async( programs, schedule  ) => {
    if (! Array.isArray(programs) ) {
        return { userError: 'Expected a programs array' };
    }
    if (typeof(schedule) === 'undefined') {
        return { userError: 'Expected a schedule' };
    }
    if (typeof(schedule.timeZoneOffset) === 'undefined') {
        return { userError: 'Expected a time zone offset' };
    }
    //verify that the schedule is in the correct format
    if (! Array.isArray(schedule.slots) ) {
        return { userError: 'Expected a "slots" array in schedule' };
    }
    for (let i = 0; i < schedule.slots.length; i++) {
        if (typeof(schedule.slots[i].time) === 'undefined') {
            return { userError: "Each slot should have a time" };
        }
        if (typeof(schedule.slots[i].showId) === 'undefined') {
            return { userError: "Each slot should have a showId" };
        }
        if (
            (schedule.slots[i].time < 0)
            || (schedule.slots[i].time >= DAY)
            || (Math.floor(schedule.slots[i].time) != schedule.slots[i].time)
        ) {
            return { userError: "Slot times should be a integer number of milliseconds since the start of the day." };
        }
        schedule.slots[i].time = ( schedule.slots[i].time  + 10*DAY + schedule.timeZoneOffset*MINUTE) % DAY;
    }
    schedule.slots.sort( (a,b) => {
        return (a.time - b.time);
    } );
    for (let i = 1; i < schedule.slots.length; i++) {
        if (schedule.slots[i].time == schedule.slots[i-1].time) {
            return { userError: "Slot times should be unique."};
        }
    }
    if (typeof(schedule.pad) === 'undefined') {
        return { userError: "Expected schedule.pad" };
    }

    if (typeof(schedule.lateness) == 'undefined') {
        return { userError: "schedule.lateness must be defined." };
    }
    if (typeof(schedule.maxDays) == 'undefined') {
        return { userError: "schedule.maxDays must be defined." };
    }
    if (typeof(schedule.flexPreference) === 'undefined') {
        schedule.flexPreference = "distribute";
    }
    if (schedule.flexPreference !== "distribute" && schedule.flexPreference !== "end") {
        return { userError: `Invalid schedule.flexPreference value: "${schedule.flexPreference}"` };
    }
    let flexBetween = ( schedule.flexPreference !== "end" );

    // throttle so that the stream is not affected negatively
    let steps = 0;
    let throttle = async() => {
        if (steps++ == 10) {
            steps = 0;
            await _wait(1);
        }
    }

    let showsById = {};
    let shows = [];

    function getNextForSlot(slot, remaining) {
        //remaining doesn't restrict what next show is picked. It is only used
        //for shows with flexible length (flex and redirects)
        if (slot.showId === "flex.") {
            return {
                isOffline: true,
                duration: remaining,
            }
        }
        let show = shows[ showsById[slot.showId] ];
        if (slot.showId.startsWith("redirect.")) {
            return {
                isOffline: true,
                type: "redirect",
                duration: remaining,
                channel: show.channel,
            }
        } else if (slot.order === 'shuffle') {
            return getShowShuffler(show).current();
        } else if (slot.order === 'next') {
            return getShowOrderer(show).current();
        }
    }
    
    function advanceSlot(slot) {
        if ( (slot.showId === "flex.") || (slot.showId.startsWith("redirect") ) ) {
            return;
        }
        let show = shows[ showsById[slot.showId] ];
        if (slot.order === 'shuffle') {
            return getShowShuffler(show).next();
        } else if (slot.order === 'next') {
            return getShowOrderer(show).next();
        }
    }

    function makePadded(item) {
        let x = item.duration;
        let m = x % schedule.pad;
        let f = 0;
        if ( (m > constants.SLACK) && (schedule.pad - m > constants.SLACK) ) {
            f = schedule.pad - m;
        }
        return {
            item: item,
            pad: f,
            totalDuration: item.duration + f,
        }

    }

    // load the programs
    for (let i = 0; i < programs.length; i++) {
        let p = programs[i];
        let show = getShow(p);
        if (show != null) {
            if (typeof(showsById[show.id] ) === 'undefined') {
                showsById[show.id] = shows.length;
                shows.push( show );
                show.founder = p;
                show.programs = [];
            } else {
                show = shows[ showsById[show.id] ];
            }
            addProgramToShow( show, p );
        }
    }

    let s = schedule.slots;
    let d = (new Date() );
    d.setUTCMilliseconds(0);
    d.setUTCSeconds(0);
    d.setUTCMinutes(0);
    d.setUTCHours(0);
    d.setUTCMilliseconds( s[0].time );
    let t0 = d.getTime();
    let p = [];
    let t = t0;
    let wantedFinish = t % DAY;
    let hardLimit = t0 + schedule.maxDays * DAY;

    let pushFlex = (d) => {
        if (d > 0) {
            t += d;
            if ( (p.length > 0) && p[p.length-1].isOffline && (p[p.length-1].type != 'redirect') ) {
                p[p.length-1].duration += d;
            } else {
                p.push( {
                    duration: d,
                    isOffline : true,
                } );
            }
        }
    }

    while ( (t < hardLimit) && (p.length < LIMIT) ) {
        await throttle();
        //ensure t is padded
        let m = t % schedule.pad;
        if ( (t % schedule.pad > constants.SLACK) && (schedule.pad - m > constants.SLACK) )  {
            pushFlex( schedule.pad - m );
            continue;
        }

        let dayTime = t % DAY;
        let slot = null;
        let remaining = null;
        let late = null;
        for (let i = 0; i < s.length; i++) {
            let endTime;
            if (i == s.length - 1) {
                endTime = s[0].time + DAY;
            } else {
                endTime = s[i+1].time;
            }

            if ((s[i].time <= dayTime) && (dayTime < endTime)) {
                slot = s[i];
                remaining = endTime - dayTime;
                late = dayTime - s[i].time;
                break;
            }
            if ((s[i].time <= dayTime + DAY) && (dayTime + DAY < endTime)) {
                slot = s[i];
                dayTime += DAY;
                remaining = endTime - dayTime;
                late = dayTime + DAY - s[i].time;
                break;
            }
        }
        if (slot == null) {
            throw Error("Unexpected. Unable to find slot for time of day " + t + " " + dayTime);
        }
        let item = getNextForSlot(slot, remaining);

        if (late >= schedule.lateness + constants.SLACK ) {
            //it's late.
            item = {
                isOffline : true,
                duration: remaining,
            }
        }

        if (item.isOffline) {
            //flex or redirect. We can just use the whole duration
            p.push(item);
            t += remaining;
            continue;
        }
        if (item.duration > remaining) {
            // Slide
            p.push(item);
            t += item.duration;
            advanceSlot(slot);
            continue;
        }

        let padded = makePadded(item);
        let total = padded.totalDuration;
        advanceSlot(slot);
        let pads = [ padded ];

        while(true) {
            let item2 = getNextForSlot(slot);
            if (total + item2.duration > remaining) {
                break;
            }
            let padded2 = makePadded(item2);
            pads.push(padded2);
            advanceSlot(slot);
            total += padded2.totalDuration;
        }
        let rem = Math.max(0, remaining - total);

        if (flexBetween) {
            let div = Math.floor(rem / schedule.pad );
            let mod = rem % schedule.pad;
            // add mod to the latest item
            pads[ pads.length - 1].pad += mod;
            pads[ pads.length - 1].totalDuration += mod;

            let sortedPads = pads.map( (p, $index) => {
                return {
                    pad: p.pad,
                    index : $index,
                }
            });
            sortedPads.sort( (a,b) => { return a.pad - b.pad; } );
            for (let i = 0; i < pads.length; i++) {
                let q = Math.floor( div / pads.length );
                if (i < div % pads.length) {
                    q++;
                }
                let j = sortedPads[i].index;
                pads[j].pad += q * schedule.pad;
            }
        } else {
            //also add div to the latest item
            pads[ pads.length - 1].pad += rem;
            pads[ pads.length - 1].totalDuration += rem;
        }
        // now unroll them all
        for (let i = 0; i < pads.length; i++) {
            p.push( pads[i].item );
            t += pads[i].item.duration;
            pushFlex( pads[i].pad );
        }
    }
    while ( (t > hardLimit) || (p.length >= LIMIT) ) {
        t -= p.pop().duration;
    }
    let m = t % DAY;
    let rem = 0;
    if (m > wantedFinish) {
        rem = DAY + wantedFinish - m;
    } else if (m < wantedFinish) {
        rem = wantedFinish - m;
    }
    if (rem > constants.SLACK) {
        pushFlex(rem);
    }


    return {
        programs: p,
        startTime: (new Date(t0)).toISOString(),
    }

}




