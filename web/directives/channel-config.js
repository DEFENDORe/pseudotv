module.exports = function ($timeout, $location, dizquetv, resolutionOptions) {
    return {
        restrict: 'E',
        templateUrl: 'templates/channel-config.html',
        replace: true,
        scope: {
            visible: "=visible",
            channels: "=channels",
            channel: "=channel",
            onDone: "=onDone"
        },
        link: {

          post: function (scope, element, attrs) {
            scope.screenW = 1920;
            scope.screenh = 1080;

            scope.maxSize = 50000;

            scope.programming = {
                maxHeight:  30,
                step : 1,
            }


            try {
                let h = parseFloat( localStorage.getItem("channel-programming-list-height" ) );
                if (isNaN(h)) {
                    h = 30;
                }
                h = Math.min(64, Math.max(1, h));
                console.log("loaded=" + h);
                scope.programming.maxHeight =  h;
            } catch (e) {
                console.error(e);
            }

            scope.blockCount = 1;
            scope.showShuffleOptions = (localStorage.getItem("channel-tools") === "on");
            scope.reverseTools = (localStorage.getItem("channel-tools-position") === "left");
    
            scope.hasFlex = false;
            scope.showHelp = { check: false }
            scope._frequencyModified = false;
            scope._frequencyMessage = "";
            scope.minProgramIndex = 0;
            scope.libraryLimit =  50000;
            scope.displayPlexLibrary = false;
            scope.episodeMemory = {
                saved : false,
            };
            if (typeof scope.channel === 'undefined' || scope.channel == null) {
                scope.channel = {}
                scope.channel.programs = []
                scope.channel.watermark = defaultWatermark();
                scope.channel.fillerCollections = []
                scope.channel.guideFlexPlaceholder = "";
                scope.channel.fillerRepeatCooldown = 30 * 60 * 1000;
                scope.channel.fallback = [];
                scope.channel.guideMinimumDurationSeconds = 5 * 60;
                scope.isNewChannel = true
                scope.channel.icon = `${$location.protocol()}://${location.host}/images/dizquetv.png`
                scope.channel.disableFillerOverlay = true;
                scope.channel.iconWidth = 120
                scope.channel.iconDuration = 60
                scope.channel.iconPosition = "2"
                scope.channel.startTime = new Date()
                scope.channel.startTime.setMilliseconds(0)
                scope.channel.startTime.setSeconds(0)
                scope.channel.offlinePicture = `${$location.protocol()}://${location.host}/images/generic-offline-screen.png`
                scope.channel.offlineSoundtrack = ''
                scope.channel.offlineMode = "pic";
                if (scope.channel.startTime.getMinutes() < 30)
                    scope.channel.startTime.setMinutes(0)
                else
                    scope.channel.startTime.setMinutes(30)
                if (scope.channels.length > 0) {
                    scope.channel.number = scope.channels[scope.channels.length - 1].number + 1
                    scope.channel.name = "Channel " + scope.channel.number
                } else {
                    scope.channel.number = 1
                    scope.channel.name = "Channel 1"
                }
                scope.showRotatedNote = false;
                scope.channel.transcoding = {
                    targetResolution: "",
                }
            } else {
                scope.beforeEditChannelNumber = scope.channel.number

                if (
                    (typeof(scope.channel.watermark) === 'undefined')
                    || (scope.channel.watermark.enabled !== true)
                ) {
                    scope.channel.watermark = defaultWatermark();
                }

                if (typeof(scope.channel.fillerRepeatCooldown) === 'undefined') {
                    scope.channel.fillerRepeatCooldown = 30 * 60 * 1000;
                }
                if (typeof(scope.channel.offlinePicture)==='undefined') {
                    scope.channel.offlinePicture = `${$location.protocol()}://${location.host}/images/generic-offline-screen.png`
                    scope.channel.offlineSoundtrack = '';
                }
                if (typeof(scope.channel.fillerCollections)==='undefined') {
                    scope.channel.fillerCollections = [];
                }
                if (typeof(scope.channel.fallback)==='undefined') {
                    scope.channel.fallback = [];
                    scope.channel.offlineMode = "pic";
                }
                if (typeof(scope.channel.offlineMode)==='undefined') {
                    scope.channel.offlineMode = 'pic';
                }
                if (typeof(scope.channel.disableFillerOverlay) === 'undefined') {
                    scope.channel.disableFillerOverlay = true;
                }
                if (
                    (typeof(scope.channel.guideMinimumDurationSeconds) === 'undefined')
                    || isNaN(scope.channel.guideMinimumDurationSeconds)
                ) {
                    scope.channel.guideMinimumDurationSeconds = 5 * 60;
                }

                if (typeof(scope.channel.transcoding) ==='undefined') {
                    scope.channel.transcoding = {};
                }
                if (
                    (scope.channel.transcoding.targetResolution == null)
                    || (typeof(scope.channel.transcoding.targetResolution) === 'undefined')
                    || (scope.channel.transcoding.targetResolution === '')
                ) {
                    scope.channel.transcoding.targetResolution = "";
                }

                
                adjustStartTimeToCurrentProgram();
                updateChannelDuration();
                setTimeout( () => { scope.showRotatedNote = true }, 1, 'funky');
            }

            function defaultWatermark() {
                return {
                    enabled: false,
                    position: "bottom-right",
                    width: 10.00,
                    verticalMargin: 0.00,
                    horizontalMargin: 0.00,
                    duration: 0,
                }
            }

            function adjustStartTimeToCurrentProgram() {
                let t = Date.now();
                let originalStart = scope.channel.startTime.getTime();
                let n = scope.channel.programs.length;
                let totalDuration = scope.channel.duration;
                let m = (t - originalStart) % totalDuration;
                let x = 0;
                let runningProgram = -1;
                let offset = 0;
                for (let i = 0; i < n; i++) {
                    let d = scope.channel.programs[i].duration;
                    if (x + d > m) {
                        runningProgram = i
                        offset = m - x;
                        break;
                    } else {
                        x += d;
                    }
                }
                // move runningProgram to index 0
                scope.channel.programs = scope.channel.programs.slice(runningProgram)
                    .concat(scope.channel.programs.slice(0, runningProgram) );
                    scope.channel.startTime = new Date(t - offset);

            }



            let addMinuteVersionsOfFields = () => {
                //add the minutes versions of the cooldowns:
                scope.channel.fillerRepeatCooldownMinutes = scope.channel.fillerRepeatCooldown / 1000 / 60;
                for (let i = 0; i < scope.channel.fillerCollections.length; i++) {
                    scope.channel.fillerCollections[i].cooldownMinutes = scope.channel.fillerCollections[i].cooldown / 1000 / 60;

                }
            }
            addMinuteVersionsOfFields();

            let removeMinuteVersionsOfFields = (channel) => {
                channel.fillerRepeatCooldown = channel.fillerRepeatCooldownMinutes * 60 * 1000;
                delete channel.fillerRepeatCooldownMinutes;
                for (let i = 0; i < channel.fillerCollections.length; i++) {
                    channel.fillerCollections[i].cooldown = channel.fillerCollections[i].cooldownMinutes * 60 * 1000;
                    delete channel.fillerCollections[i].cooldownMinutes;
                }
            }

            scope.tabOptions = [
                { name: "Properties", id: "basic" },
                { name: "Programming", id: "programming" },
                { name: "Flex", id: "flex" },
                { name: "EPG", id: "epg" },
                { name: "FFmpeg", id: "ffmpeg" },
            ];
            scope.setTab = (tab) => {
                scope.tab = tab;
            }

            if (scope.isNewChannel) {
                scope.tab = "basic";
            } else {
                scope.tab = "programming";
            }

            scope.getTitle = () => {
                if (scope.isNewChannel) {
                    return "Create Channel";
                } else {
                    let x = "?";
                    if ( (scope.channel.number != null) && ( typeof(scope.channel.number) !== 'undefined') && (! isNaN(scope.channel.number) ) ) {
                        x = "" + scope.channel.number;
                    }
                    let y = "Unnamed";
                    if (typeof(scope.channel.name) !== 'undefined') {
                        y = scope.channel.name;
                    }
                    return `${x} - ${y}`;
                }
            }

            scope._selectedRedirect = {
                isOffline : true,
                type : "redirect",
                duration : 60*60*1000,
            }

            scope.finshedProgramEdit = (program) => {
                scope.channel.programs[scope.selectedProgram] = program
                scope._selectedProgram = null
                updateChannelDuration()
            }
            scope.dropFunction = (dropIndex, program) => {
                let y = program.$index;
                let z = dropIndex + scope.currentStartIndex - 1;
                scope.channel.programs.splice(y, 1);
                if (z >= y) {
                    z--;
                }
                scope.channel.programs.splice(z, 0, program );
                updateChannelDuration();
                $timeout();
                return false;
            }
            scope.setUpWatcher = function setupWatchers() {
                this.$watch('vsRepeat.startIndex', function(val) {
                    scope.currentStartIndex = val;
                });
            };

            scope.finishedOfflineEdit = (program) => {
                let editedProgram = scope.channel.programs[scope.selectedProgram];
                let duration = program.durationSeconds * 1000;
                editedProgram.duration = duration;
                editedProgram.isOffline = true;
                scope._selectedOffline = null
                updateChannelDuration()
            }
            scope.finishedAddingOffline = (result) => {
                let duration = result.durationSeconds * 1000;
                let program = {
                    duration: duration,
                    isOffline: true
                }
                scope.channel.programs.splice(scope.minProgramIndex, 0, program);
                scope._selectedOffline = null
                scope._addingOffline = null;
                updateChannelDuration()
            }

            scope.$watch('channel.startTime', () => {
                updateChannelDuration()
            })
            scope.sortShows = () => {
                scope.removeOffline();
                let shows = {}
                let movies = []
                let newProgs = []
                let progs = scope.channel.programs
                for (let i = 0, l = progs.length; i < l; i++) {
                    if ( progs[i].isOffline || (progs[i].type === 'movie') ) {
                        movies.push(progs[i])
                    } else {
                        if (typeof shows[progs[i].showTitle] === 'undefined')
                            shows[progs[i].showTitle] = []
                        shows[progs[i].showTitle].push(progs[i])
                    }
                }
                let keys = Object.keys(shows)
                for (let i = 0, l = keys.length; i < l; i++) {
                    shows[keys[i]].sort((a, b) => {
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
                    })
                    newProgs = newProgs.concat(shows[keys[i]])
                }
                scope.channel.programs = newProgs.concat(movies)
                updateChannelDuration()
            }
            scope.dateForGuide = (date) => {
                let t = date.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                });
                if (t.charCodeAt(1) == 58) {
                    t = "0" + t;
                }
                return date.toLocaleDateString(undefined,{
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                }) + " " + t;
            }
            scope.sortByDate = () => {
                scope.removeOffline();
                scope.channel.programs.sort( (a,b) => {
                    let aHas = ( typeof(a.date) !== 'undefined' );
                    let bHas = ( typeof(b.date) !== 'undefined' );
                    if (!aHas && !bHas) {
                        return 0;
                    } else if (! aHas) {
                        return 1;
                    } else if (! bHas) {
                        return -1;
                    }
                    if (a.date < b.date ) {
                        return -1;
                    } else if (a.date > b.date) {
                        return 1;
                    } else {
                        let aHasSeason = ( typeof(a.season) !== 'undefined' );
                        let bHasSeason = ( typeof(b.season) !== 'undefined' );
                        if (! aHasSeason && ! bHasSeason) {
                            return 0;
                        } else if (! aHasSeason) {
                            return 1;
                        } else if (! bHasSeason) {
                            return -1;
                        }
                        if (a.season < b.season) {
                            return -1;
                        } else if (a.season > b.season) {
                            return 1;
                        } else if (a.episode < b.episode) {
                            return -1;
                        } else if (a.episode > b.episode) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }
                });
                updateChannelDuration()
            }
            scope.slideAllPrograms = (offset) => {
                let t0 = scope.channel.startTime.getTime();
                let t1 = t0 - offset;
                let t = (new Date()).getTime();
                let total = scope.channel.duration;
                while(t1 > t) {
                    //TODO: Replace with division
                    t1 -= total;
                }
                scope.channel.startTime = new Date(t1);
                adjustStartTimeToCurrentProgram();
                updateChannelDuration();
            }
            let removeDuplicatesSub = (progs) => {
                let tmpProgs = {}
                for (let i = 0, l = progs.length; i < l; i++) {
                    if ( progs[i].type ==='redirect' ) {
                        tmpProgs['_redirect ' + progs[i].channel + ' _ '+ progs[i].duration ] = progs[i];
                    } else  if (progs[i].type === 'movie') {
                        tmpProgs[progs[i].title + progs[i].durationStr] = progs[i]
                    } else {
                        tmpProgs[progs[i].showTitle + '-' + progs[i].season + '-' + progs[i].episode] = progs[i]
                    }
                }
                let newProgs = []
                let keys = Object.keys(tmpProgs)
                for (let i = 0, l = keys.length; i < l; i++) {
                    newProgs.push(tmpProgs[keys[i]])
                }
                return newProgs;
            }
            scope.removeDuplicates = () => {
                scope.channel.programs = removeDuplicatesSub(scope.channel.programs);
                updateChannelDuration(); //oops someone forgot to add this
            }
            scope.removeOffline = () => {
                let tmpProgs = []
                let progs = scope.channel.programs
                for (let i = 0, l = progs.length; i < l; i++) {
                    if ( (progs[i].isOffline !== true) || (progs[i].type === 'redirect') ) {
                        tmpProgs.push(progs[i]);
                    }
                }
                scope.channel.programs = tmpProgs
                updateChannelDuration()
            }

            scope.wipeSpecials = () => {
                let tmpProgs = []
                let progs = scope.channel.programs
                for (let i = 0, l = progs.length; i < l; i++) {
                    if (progs[i].season !== 0) {
                        tmpProgs.push(progs[i]);
                    }
                }
                scope.channel.programs = tmpProgs
                updateChannelDuration()
            }

            scope.getShowTitle = (program) => {
                if (program.isOffline && program.type == 'redirect') {
                    return `Redirect to channel ${program.channel}`;
                } else {
                    return program.showTitle;
                }
            }

            scope.startRemoveShows = () => {
                scope._removablePrograms = scope.channel.programs
                    .map(scope.getShowTitle)
                    .reduce((dedupedArr, showTitle) => {
                        if (!dedupedArr.includes(showTitle)) {
                            dedupedArr.push(showTitle)
                        }
                        return dedupedArr
                    }, [])
                    .filter(showTitle => !!showTitle);
                scope._deletedProgramNames = [];
            }
            scope.removeShows = (deletedShowNames) => {
                const p = scope.channel.programs;
                let set = {};
                deletedShowNames.forEach( (a) => set[a] = true  );
                scope.channel.programs = p.filter( (a) => (set[scope.getShowTitle(a)]!==true) );
            }

            scope.describeFallback = () => {
                if (scope.channel.offlineMode === 'pic') {
                    if (
                        (typeof(scope.channel.offlineSoundtrack) !== 'undefined')
                        && (scope.channel.offlineSoundtrack.length > 0)
                    ) {
                        return "pic+sound";
                    } else {
                        return "pic";
                    }
                } else {
                    return "clip";
                }
            }

            let interpolate = ( () => {
                let h = 60*60*1000;
                let ix = [0, 1*h, 2*h, 4*h, 8*h, 24*h];
                let iy = [0, 1.0, 1.25, 1.5, 1.75, 2.0];
                let n = ix.length;

                return (x) => {
                    for (let i = 0; i < n-1; i++) {
                        if( (ix[i] <= x) && ( (x < ix[i+1]) || i==n-2 ) ) {
                            return iy[i] + (iy[i+1] - iy[i]) * ( (x - ix[i]) / (ix[i+1] - ix[i]) );
                        }
                    }
                }

            } )();

            scope.programSquareStyle = (program) => {
                let background ="";
                if  ( (program.isOffline) && (program.type !== 'redirect') ) {
                    background = "rgb(255, 255, 255)";
                } else {
                    let r = 0, g = 0, b = 0, r2=0, g2=0,b2=0;
                    let angle = 45;
                    let w = 3;
                    if (program.type === 'redirect') {
                        angle = 0;
                        w = 4 + (program.channel % 10);
                        let c = (program.channel * 100019);
                        //r = 255, g = 0, b = 0;
                        //r2 = 0, g2 = 0, b2 = 255;

                        r = ( (c & 3) * 77 );
                        g = ( ( (c >> 1) & 3) * 77 );
                        b = ( ( (c >> 2) & 3) * 77 );
                        r2 = ( ( (c >> 5) & 3) * 37 );
                        g2 = ( ( (c >> 3) & 3) * 37 );
                        b2 = ( ( (c >> 4) & 3) * 37 );
                        
                    } else if (program.type === 'episode') {
                        let h = Math.abs(scope.getHashCode(program.showTitle, false));
                        let h2 = Math.abs(scope.getHashCode(program.showTitle, true));
                        r = h % 256;
                        g = (h / 256) % 256;
                        b = (h / (256*256) ) % 256;
                        r2 = (h2 / (256*256) ) % 256;
                        g2 = (h2 / (256*256) ) % 256;
                        b2 = (h2 / (256*256) ) % 256;
                        angle = (360 - 90 + h % 180) % 360;
                        if ( angle >= 350 || angle < 10 ) {
                            angle += 53;
                        }
                    } else {
                        r = 10, g = 10, b = 10;
                        r2 = 245, g2 = 245, b2 = 245;
                        angle = 45;
                        w = 6;
                    }
                    let rgb1 = "rgb("+ r + "," + g + "," + b +")";
                    let rgb2 = "rgb("+ r2 + "," + g2 + "," + b2 +")"
                    angle += 90;
                    background = "repeating-linear-gradient( " + angle + "deg, " + rgb1 + ", " + rgb1 + " " + w + "px, " + rgb2 + " " + w + "px, " + rgb2 + " " + (w*2) + "px)";

                }
                let f = interpolate;
                let w = 15.0;
                let t = 4*60*60*1000;
                //let d = Math.log( Math.min(t, program.duration) ) / Math.log(2);
                //let a = (d * Math.log(2) ) / Math.log(t);
                let a = ( f(program.duration) *w) / f(t);
                a = Math.min( w, Math.max(0.3, a) );
                b = w - a + 0.01;

                return {
                    'width': `${a}%`,
                    'height': '1.3em',
                    'margin-right': `${b}%`,
                    'background': background,
                    'border': '1px solid black',
                    'margin-top': "0.01em",
                    'margin-bottom': '1px',
                };
            }
            scope.getHashCode = (s, rev) => {
                var hash = 0;
                if (s.length == 0) return hash;
                let inc = 1, st = 0, e = s.length;
                if (rev) {
                    inc = -1, st = e - 1, e = -1;
                }
                for (var i = st; i != e; i+= inc) {
                    hash = s.charCodeAt(i) + ((hash << 5) - hash);
                    hash = hash & hash; // Convert to 32bit integer
                }
                return hash;
            }

            scope.doReruns = (rerunStart, rerunBlockSize, rerunRepeats) => {
                let o =(new Date()).getTimezoneOffset() * 60 * 1000;
                let start = (o + rerunStart * 60 * 60 * 1000) % (24*60*60*1000);
                let blockSize = rerunBlockSize * 60*60* 1000;
                let repeats = rerunRepeats;

                let programs = [];
                let block = [];
                let currentBlockSize = 0;
                let currentSize = 0;
                let addBlock = () => {

                    let high = currentSize + currentBlockSize;
                    let m = high % blockSize;
                    if (m >= 1000) {
                        high = high - m + blockSize;
                    }
                    high -= currentSize;
                    let rem = Math.max(0, high - currentBlockSize);
                    if (rem >= 1000) {
                        currentBlockSize += rem;
                        let t = block.length;
                        if (
                            (t > 0)
                            && block[t-1].isOffline
                            && (block[t-1].type !== 'redirect')
                        ) {
                            block[t-1].duration += rem;
                        } else {
                            block.push( {
                                isOffline: true,
                                duration: rem,
                            } );
                        }
                    }
                    for (let i = 0; i < repeats; i++) {
                        for (let j = 0; j < block.length; j++) {
                            programs.push( JSON.parse( JSON.stringify(block[j]) ) );
                        }
                    }
                    currentSize += repeats * currentBlockSize;
                    block = [];
                    currentBlockSize = 0;

                };
                for (let i = 0; i < scope.channel.programs.length; i++) {
                    if (currentBlockSize + scope.channel.programs[i].duration - 500 > blockSize) {
                        addBlock();
                    }
                    block.push( scope.channel.programs[i] );
                    currentBlockSize += scope.channel.programs[i].duration;
                }
                if (currentBlockSize != 0) {
                    addBlock();
                }
                scope.channel.startTime = new Date( scope.channel.startTime.getTime() - scope.channel.startTime % (24*60*60*1000) + start );
                scope.channel.programs = programs;
                scope.updateChannelDuration();
            };

            scope.nightChannel = (a, b, ch) => {
                let o =(new Date()).getTimezoneOffset() * 60 * 1000;
                let m = 24*60*60*1000;
                a = (m + a * 60 * 60 * 1000 + o) % m;
                b = (m + b * 60 * 60 * 1000 + o) % m;
                if (b < a) {
                    b += m;
                }
                b -= a;
                let progs = [];
                let t = scope.channel.startTime.getTime();
                function pos(x) {
                    if (x % m < a) {
                        return m + x % m - a;
                    } else {
                        return x % m - a;
                    }
                }
                t -= pos(t);
                scope.channel.startTime = new Date(t);
                for (let i = 0, l = scope.channel.programs.length; i < l; i++) {
                    let p = pos(t);
                    if ( (p != 0) && (p + scope.channel.programs[i].duration > b) ) {
                        if (b - 30000 > p) {
                            let d = b- p;
                            t += d;
                            p = pos(t);
                            progs.push(
                                {
                                    duration: d,
                                    isOffline: true,
                                }
                            )
                        }
                        //time to pad
                        let d = m - p;
                        progs.push(
                            {
                                duration: d,
                                isOffline: true,
                                channel: ch,
                                type: (typeof(ch) === 'undefined') ? undefined: "redirect",
                            }
                        )
                        t += d;
                        p = 0;
                    }
                    progs.push( scope.channel.programs[i] );
                    t += scope.channel.programs[i].duration;
                }
                if (pos(t) != 0) {
                    if (b >  pos(t)) {
                        let d = b - pos(t) % m;
                        t += d;
                        progs.push(
                            {
                                duration: d,
                                isOffline: true,
                            }
                        )
                    }
                    let d = m - pos(t);
                    progs.push(
                        {
                            duration: d,
                            isOffline: true,
                            channel: ch,
                            type: (typeof(ch) === 'undefined') ? undefined: "redirect",
                        }
                    )
                }
                scope.channel.programs = progs;
                updateChannelDuration();
            }
            scope.savePositions = () => {
                scope.episodeMemory = {
                    saved : false,
                };
                let array = scope.channel.programs;
                for (let i = 0; i < array.length; i++) {
                    if (array[i].type === 'episode' && array[i].season != 0) {
                        let key = array[i].showTitle;
                        if (typeof(scope.episodeMemory[key]) === 'undefined') {
                            scope.episodeMemory[key] = {
                                season: array[i].season,
                                episode: array[i].episode,
                            }
                        }
                    }
                }
                scope.episodeMemory.saved = true;
            }
            scope.recoverPositions = () => {
                //this is basically the code for cyclic shuffle
                let array = scope.channel.programs;
                let shows = {};
                let next = {};
                let counts = {};
                // some precalculation, useful to stop the shuffle from being quadratic...
                for (let i = 0; i < array.length; i++) {
                    let vid = array[i];
                    if (vid.type === 'episode' && vid.season != 0) {
                        let countKey = {
                            title: vid.showTitle,
                            s: vid.season,
                            e: vid.episode,
                        }
                        let key = JSON.stringify(countKey);
                        let c = ( (typeof(counts[key]) === 'undefined') ? 0 : counts[key] );
                        counts[key] = c + 1;
                        let showEntry = {
                            c: c,
                            it: vid
                        }
                        if ( typeof(shows[vid.showTitle]) === 'undefined') {
                            shows[vid.showTitle] = [];
                        }
                        shows[vid.showTitle].push(showEntry);
                    }
                }
                //this is O(|N| log|M|) where |N| is the total number of TV
                // episodes and |M| is the maximum number of episodes
                // in a single show. I am pretty sure this is a lower bound
                // on the time complexity that's possible here.
                Object.keys(shows).forEach(function(key,index) {
                    shows[key].sort( (a,b) => {
                        if (a.c == b.c) {
                            if (a.it.season == b.it.season) {
                                if (a.it.episode == b.it.episode) {
                                    return 0;
                                } else {
                                    return (a.it.episode < b.it.episode)?-1: 1;
                                }
                            } else {
                                return (a.it.season < b.it.season)?-1: 1;
                            }
                        } else {
                            return (a.c < b.c)? -1: 1;
                        }
                    });
                    next[key] = 0;
                    if (typeof(scope.episodeMemory[key]) !== 'undefined') {
                        for (let i = 0; i < shows[key].length; i++) {
                            if (
                                (shows[key][i].it.season === scope.episodeMemory[key].season)
                              &&(shows[key][i].it.episode === scope.episodeMemory[key].episode)
                            ) {
                                next[key] = i;
                                break;
                            }
                        }
                    }
                });
                for (let i = 0; i < array.length; i++) {
                    if (array[i].type === 'episode' && array[i].season != 0) {
                        let title = array[i].showTitle;
                        var sequence = shows[title];
                        let j = next[title];
                        array[i] = sequence[j].it;
                        
                        next[title] = (j + 1) % sequence.length;
                    }
                }
                scope.channel.programs = array;
                updateChannelDuration();

            }
            scope.cannotRecoverPositions  = () => {
                return scope.episodeMemory.saved !== true;
            }

            scope.addBreaks = (afterMinutes, minDurationSeconds, maxDurationSeconds) => {
                let after = afterMinutes * 60 * 1000 + 5000; //allow some seconds of excess
                let minDur = minDurationSeconds;
                let maxDur = maxDurationSeconds;
                let progs = [];
                let tired = 0;
                for (let i = 0, l = scope.channel.programs.length; i <= l; i++) {
                    let prog = scope.channel.programs[i % l];
                    if (prog.isOffline && prog.type != 'redirect') {
                        tired = 0;
                    } else {
                        if (tired + prog.duration >= after) {
                            tired = 0;
                            let dur = 1000 * (minDur + Math.floor( (maxDur - minDur) * Math.random() ) );
                            progs.push( {
                                isOffline : true,
                                duration: dur,
                            });
                        }
                        tired += prog.duration;
                    }
                    if (i < l) {
                        progs.push(prog);
                    }
                }
                scope.channel.programs = progs;
                updateChannelDuration();
            }
            scope.padTimes = (paddingMod, allow5) => {
                let mod = paddingMod * 60 * 1000;
                if (mod == 0) {
                    mod = 60*60*1000;
                }
                scope.removeOffline();
                let progs = [];
                let t = scope.channel.startTime.getTime();
                t = t - t  % mod;
                scope.channel.startTime = new Date(t);
                function addPad(force) {
                    let m = t % mod;
                    let r = (mod - t % mod) % mod;
                    if ( (force && (m != 0)) || ((m >= 15*1000) && (r >= 15*1000)) ) {
                        if (allow5 && (m <= 5*60*1000) ) {
                            r = 5*60*1000 - m;
                        }
                        // (If the difference is less than 30 seconds, it's
                        // not worth padding it
                        progs.push( {
                            duration : r,
                            isOffline : true,
                        });
                        t += r;
                    }
                }
                for (let i = 0, l = scope.channel.programs.length; i < l; i++) {
                    let prog = scope.channel.programs[i];
                    progs.push(prog);
                    t += prog.duration;
                    addPad(i == l - 1);
                }
                scope.channel.programs = progs;
                updateChannelDuration();
            }
            scope.blockShuffle = (blockCount, randomize) => {
                if (typeof blockCount === 'undefined' || blockCount == null)
                    return
                let shows = {}
                let movies = []
                let newProgs = []
                let progs = scope.channel.programs
                for (let i = 0, l = progs.length; i < l; i++) {
                    if (progs[i].type === 'movie') {
                        movies.push(progs[i])
                    } else {
                        if (typeof shows[progs[i].showTitle] === 'undefined')
                            shows[progs[i].showTitle] = []
                        shows[progs[i].showTitle].push(progs[i])
                    }
                }
                let keys = Object.keys(shows)
                let index = 0
                if (randomize)
                    index = getRandomInt(0, keys.length - 1)
                while (keys.length > 0) {
                    if (shows[keys[index]].length === 0) {
                        keys.splice(index, 1)
                        if (randomize) {
                            let tmp = index
                            index = getRandomInt(0, keys.length - 1)
                            while (keys.length > 1 && tmp == index)
                                index = getRandomInt(0, keys.length - 1)
                        } else {
                            if (index >= keys.length)
                                index = 0
                        }
                        continue
                    }
                    for (let i = 0, l = blockCount; i < l; i++) {
                        if (shows[keys[index]].length > 0)
                            newProgs.push(shows[keys[index]].shift())
                    }
                    if (randomize) {
                        let tmp = index
                        index = getRandomInt(0, keys.length - 1)
                        while (keys.length > 1 && tmp == index)
                            index = getRandomInt(0, keys.length - 1)
                    } else {
                        index++
                        if (index >= keys.length)
                            index = 0
                    }
                }
                scope.channel.programs = newProgs.concat(movies)
                updateChannelDuration()
            }
            scope.randomShuffle = () => {
                shuffle(scope.channel.programs)
                updateChannelDuration()
            }
            scope.cyclicShuffle = () => {
                cyclicShuffle(scope.channel.programs);
                updateChannelDuration();
            }
            scope.equalizeShows = () => {
                scope.removeDuplicates();
                scope.channel.programs = equalizeShows(scope.channel.programs, {} );
                updateChannelDuration();
            }
            scope.startFrequencyTweak = () => {
                let programs = {};
                for (let i = 0; i < scope.channel.programs.length; i++) {
                    if ( !scope.channel.programs[i].isOffline || (scope.channel.programs[i].type === 'redirect')  ) {
                        let c = getShowCode(scope.channel.programs[i]);
                        if ( typeof(programs[c]) === 'undefined') {
                            programs[c] = 0;
                        }
                        programs[c] += scope.channel.programs[i].duration;
                    }
                }
                let mx = 0;
                Object.keys(programs).forEach(function(key,index) {
                    mx = Math.max(mx, programs[key]);
                });
                let arr = [];
                Object.keys(programs).forEach( (key,index) => {
                    let w = Math.ceil( (24.00*programs[key]) / mx );
                    let obj = {
                        name : key,
                        weight: w,
                        specialCategory: false,
                        displayName: key,
                    }
                    if (key.startsWith("_internal.")) {
                        obj.specialCategory = true;
                        obj.displayName = key.slice("_internal.".length);
                    }
                    arr.push(obj);
                });
                if (arr.length <= 1) {
                    scope._frequencyMessage  = "Add more TV shows to the programming before using this option.";
                } else {
                    scope._frequencyMessage  = "";
                }
                scope._frequencyModified = false;
                scope._programFrequencies = arr;
                
            }
            scope.tweakFrequencies = (freqs) => {
                var f = {};
                for (let i = 0; i < freqs.length; i++) {
                    f[freqs[i].name] = freqs[i].weight;
                }
                scope.removeDuplicates();
                scope.channel.programs = equalizeShows(scope.channel.programs, f );
                updateChannelDuration();
                scope.startFrequencyTweak();
                scope._frequencyMessage  = "TV Show weights have been applied.";
            }


            scope.wipeSchedule = () => {
                scope.channel.programs = [];
                updateChannelDuration();
            }
            scope.makeOfflineFromChannel = (duration) => {
                return {
                    durationSeconds: duration,
                }
            }
            scope.addOffline = () => {
                scope._addingOffline = scope.makeOfflineFromChannel(10*60);
            }

            function getShowCode(program) {
                //used for equalize and frequency tweak
                let showName = "_internal.Unknown";
                if ( program.isOffline && (program.type == 'redirect') ) {
                    showName = `Redirect to channel ${program.channel}`;
                } else if ( (program.type == 'episode') && ( typeof(program.showTitle) !== 'undefined' ) ) {
                    showName = program.showTitle;
                } else {
                    showName = "_internal.Movies";
                }
                return showName;
            }

            function getRandomInt(min, max) {
                min = Math.ceil(min)
                max = Math.floor(max)
                return Math.floor(Math.random() * (max - min + 1)) + min
            }
            function shuffle(array, lo, hi ) {
                if (typeof(lo) === 'undefined') {
                    lo = 0;
                    hi = array.length;
                }
                let currentIndex = hi, temporaryValue, randomIndex
                while (lo !== currentIndex) {
                    randomIndex = lo + Math.floor(Math.random() * (currentIndex -lo) );
                    currentIndex -= 1
                    temporaryValue = array[currentIndex]
                    array[currentIndex] = array[randomIndex]
                    array[randomIndex] = temporaryValue
                }
                return array
            }
            function equalizeShows(array, freqObject) {
                let shows = {};
                let progs = [];
                for (let i = 0; i < array.length; i++) {
                    if (array[i].isOffline && array[i].type !== 'redirect') {
                        continue;
                    }
                    let vid = array[i];
                    let code = getShowCode(vid);
                    if ( typeof(shows[code]) === 'undefined') {
                        shows[code] = {
                            total: 0,
                            episodes: []
                        }
                    }
                    shows[code].total += vid.duration;
                    shows[code].episodes.push(vid);
                }
                let maxDuration = 0;
                Object.keys(shows).forEach(function(key,index) {
                    let w = 3;
                    if ( typeof(freqObject[key]) !== 'undefined') {
                        w = freqObject[key];
                    }
                    shows[key].total = Math.ceil(shows[key].total / w );
                    maxDuration = Math.max( maxDuration, shows[key].total );
                });
                let F = 2;
                let good = true;
                Object.keys(shows).forEach(function(key,index) {
                    let amount =  Math.floor( (maxDuration*F) / shows[key].total);
                    good = (good && (amount % F == 0) );
                });
                if (good) {
                    F = 1;
                }
                Object.keys(shows).forEach(function(key,index) {
                    let amount =  Math.floor( (maxDuration*F) / shows[key].total);
                    let episodes = shows[key].episodes;
                    if (amount % F != 0) {
                    }
                    for (let i = 0; i < amount; i++) {
                        for (let j = 0; j < episodes.length; j++) {
                            progs.push( JSON.parse( angular.toJson(episodes[j]) ) );
                        }
                    }
                });
                return progs;
            }
            scope.replicate = (t) => {
                let arr = [];
                for (let j = 0; j < t; j++) {
                    for (let i = 0; i < scope.channel.programs.length; i++) {
                        arr.push( JSON.parse( angular.toJson(scope.channel.programs[i]) ) );
                        arr[i].$index = i;
                    }
                }
                scope.channel.programs = arr;
                updateChannelDuration();
            }
            scope.shuffleReplicate =(t) => {
                shuffle( scope.channel.programs );
                let n = scope.channel.programs.length;
                let a = Math.floor(n / 2);
                scope.replicate(t);
                for (let i = 0; i < t; i++) {
                    shuffle( scope.channel.programs, n*i, n*i + a);
                    shuffle( scope.channel.programs, n*i + a, n*i + n);
                }
                updateChannelDuration();

            }
            function cyclicShuffle(array) {
                let shows = {};
                let next = {};
                let counts = {};
                // some precalculation, useful to stop the shuffle from being quadratic...
                for (let i = 0; i < array.length; i++) {
                    let vid = array[i];
                    if (vid.type === 'episode' && vid.season != 0) {
                        let countKey = {
                            title: vid.showTitle,
                            s: vid.season,
                            e: vid.episode,
                        }
                        let key = JSON.stringify(countKey);
                        let c = ( (typeof(counts[key]) === 'undefined') ? 0 : counts[key] );
                        counts[key] = c + 1;
                        let showEntry = {
                            c: c,
                            it: array[i],
                        }
                        if ( typeof(shows[vid.showTitle]) === 'undefined') {
                            shows[vid.showTitle] = [];
                        }
                        shows[vid.showTitle].push(showEntry);
                    }
                }
                //this is O(|N| log|M|) where |N| is the total number of TV
                // episodes and |M| is the maximum number of episodes
                // in a single show. I am pretty sure this is a lower bound
                // on the time complexity that's possible here.
                Object.keys(shows).forEach(function(key,index) {
                    shows[key].sort( (a,b) => {
                        if (a.c == b.c) {
                            if (a.it.season == b.it.season) {
                                if (a.it.episode == b.it.episode) {
                                    return 0;
                                } else {
                                    return (a.it.episode < b.it.episode)?-1: 1;
                                }
                            } else {
                                return (a.it.season < b.it.season)?-1: 1;
                            }
                        } else {
                            return (a.c < b.c)? -1: 1;
                        }
                    });
                    next[key] = Math.floor( Math.random() * shows[key].length );
                });
                shuffle(array);
                for (let i = 0; i < array.length; i++) {
                    if (array[i].type === 'episode' && array[i].season != 0) {
                        let title = array[i].showTitle;
                        var sequence = shows[title];
                        let j = next[title];
                        array[i] = sequence[j].it;
                        
                        next[title] = (j + 1) % sequence.length;
                    }
                }
                return array
            }

            scope.updateChannelDuration = updateChannelDuration
            function updateChannelDuration() {
                scope.showRotatedNote = false;
                scope.channel.duration = 0
                scope.hasFlex = false;

                for (let i = 0, l = scope.channel.programs.length; i < l; i++) {
                    scope.channel.programs[i].start = new Date(scope.channel.startTime.valueOf() + scope.channel.duration)
                    scope.channel.programs[i].$index = i;
                    scope.channel.duration += scope.channel.programs[i].duration
                    scope.channel.programs[i].stop = new Date(scope.channel.startTime.valueOf() + scope.channel.duration)
                    if (scope.channel.programs[i].isOffline) {
                        scope.hasFlex = true;
                    }
                }
                scope.maxSize = Math.max(scope.maxSize, scope.channel.programs.length);
                scope.libraryLimit = Math.max(0, scope.maxSize - scope.channel.programs.length );
                scope.endTime = new Date( scope.channel.startTime.valueOf() + scope.channel.duration );
            }
            scope.error = {}
            scope._onDone = async (channel) => {
                if (typeof channel === 'undefined') {
                    await scope.onDone()
                    $timeout();
                } else {
                    channelNumbers = []
                    for (let i = 0, l = scope.channels.length; i < l; i++)
                        channelNumbers.push(scope.channels[i].number)
                    // validate
                    var now = new Date()
                    scope.error.any = true;

   
                    if (typeof channel.number === "undefined" || channel.number === null || channel.number === "") {
                        scope.error.number = "Select a channel number"
                        scope.error.tab = "basic";
                    } else if (channelNumbers.indexOf(parseInt(channel.number, 10)) !== -1 && scope.isNewChannel) { // we need the parseInt for indexOf to work properly
                        scope.error.number = "Channel number already in use."
                        scope.error.tab = "basic";
                    } else if (!scope.isNewChannel && channel.number !== scope.beforeEditChannelNumber && channelNumbers.indexOf(parseInt(channel.number, 10)) !== -1) {
                        scope.error.number = "Channel number already in use."
                        scope.error.tab = "basic";
                    } else if (channel.number < 0 || channel.number > 9999) {
                        scope.error.name = "Enter a valid number (0-9999)"
                        scope.error.tab = "basic";
                    } else if (typeof channel.name === "undefined" || channel.name === null || channel.name === "") {
                        scope.error.name = "Enter a channel name."
                        scope.error.tab = "basic";
                    } else if (channel.icon !== "" && !validURL(channel.icon)) {
                        scope.error.icon = "Please enter a valid image URL. Or leave blank."
                        scope.error.tab = "basic";
                    } else if (channel.overlayIcon && !validURL(channel.icon)) {
                        scope.error.icon = "Please enter a valid image URL. Cant overlay an invalid image."
                        scope.error.tab = "basic";
                    } else if (now < channel.startTime) {
                        scope.error.startTime = "Start time must not be set in the future."
                        scope.error.tab = "programming";
                    } else if (channel.programs.length === 0) {
                        scope.error.programs = "No programs have been selected. Select at least one program."
                        scope.error.tab = "programming";
                    } else if ( channel.watermark.enabled && notValidNumber(scope.channel.watermark.width, 0.01,100)) {
                        scope.error.watermark = "Please include a valid watermark width.";
                        scope.error.tab = "ffmpeg";
                    } else if ( channel.watermark.enabled && notValidNumber(scope.channel.watermark.verticalMargin, 0.00,100)) {
                        scope.error.watermark = "Please include a valid watermark vertical margin.";
                        scope.error.tab = "ffmpeg";
                    } else if ( channel.watermark.enabled && notValidNumber(scope.channel.watermark.horizontalMargin, 0.00,100)) {
                        scope.error.watermark = "Please include a valid watermark horizontal margin.";
                        scope.error.tab = "ffmpeg";
                    } else if ( channel.watermark.enabled && (scope.channel.watermark.width + scope.channel.watermark.horizontalMargin > 100.0) ) {
                        scope.error.watermark = "Horizontal margin + width should not exceed 100.";
                        scope.error.tab = "ffmpeg";
                    } else if ( channel.watermark.enabled && notValidNumber(scope.channel.watermark.duration, 0)) {
                        scope.error.watermark = "Please include a valid watermark duration.";
                        scope.error.tab = "ffmpeg";
                    } else if (
                        channel.offlineMode != 'pic'
                        && (channel.fallback.length == 0)
                    ) {
                        scope.error.fallback = 'Either add a fallback clip or change the fallback mode to Picture.';
                        scope.error.tab = "flex";
                    } else {
                        scope.error.any = false;
                        for (let i = 0; i < scope.channel.programs.length; i++) {
                            delete scope.channel.programs[i].$index;
                        }
                        try {
                            removeMinuteVersionsOfFields(channel);
                            let s = angular.toJson(channel);
                            addMinuteVersionsOfFields();
                            if (s.length > 50*1000*1000) {
                                scope.error.any = true;
                                scope.error.programs = "Channel is too large, can't save.";
                                scope.error.tab = "programming";
                            } else {
                                let cloned = JSON.parse(s);
                                //clean up some stuff that's only used by the UI:
                                cloned.fillerCollections = cloned.fillerCollections.filter( (f) => { return f.id != 'none'; } );
                                cloned.fillerCollections.forEach( (c) => {
                                    delete c.percentage;
                                    delete c.options;
                                } );
                                await scope.onDone(cloned)
                                s = null;
                            }
                        } catch(err) {
                            addMinuteVersionsOfFields();
                            $timeout();
                            console.error(err);
                            scope.error.any = true;
                            scope.error.programs = "Unable to save channel."
                            scope.error.tab = "programming";
                        }
                    }
                    $timeout(() => { scope.error = {} }, 60000)
                }
            }

            scope.importPrograms = (selectedPrograms) => {
                for (let i = 0, l = selectedPrograms.length; i < l; i++) {
                    delete selectedPrograms[i].commercials;
                }
                scope.channel.programs = scope.channel.programs.concat(selectedPrograms)
                updateChannelDuration()
                setTimeout(
                    () => {
                        scope.$apply( () => {
                            scope.minProgramIndex = Math.max(0, scope.channel.programs.length - 100);
                        } )
                    },  0
                );
            }
            scope.finishRedirect = (program) => {
                if (scope.selectedProgram == -1) {
                    scope.channel.programs.splice(scope.minProgramIndex, 0, program);
                } else {
                    scope.channel.programs[ scope.selectedProgram ] = program;
                }
                updateChannelDuration();
            }
            scope.addRedirect = () => {
                scope.selectedProgram = -1;
                scope._displayRedirect = true;
                scope._redirectTitle = "Add Redirect";
                scope._selectedRedirect = {
                    isOffline : true,
                    type : "redirect",
                    duration : 60*60*1000,
                }

            };
            scope.selectProgram = (index) => {
                scope.selectedProgram = index;
                let program = scope.channel.programs[index];

                if(program.isOffline) {
                    if (program.type === 'redirect') {
                        scope._displayRedirect = true;
                        scope._redirectTitle = "Edit Redirect";
                        scope._selectedRedirect = JSON.parse(angular.toJson(program));
                    } else {
                        scope._selectedOffline = scope.makeOfflineFromChannel( Math.round( (program.duration + 500) / 1000 ) );
                    }
                } else {
                    scope._selectedProgram = JSON.parse(angular.toJson(program));
                }
            }
            scope.maxReplicas = () => {
                if (scope.channel.programs.length == 0) {
                    return 1;
                } else {
                    return Math.floor( scope.maxSize / (scope.channel.programs.length) );
                }
            }
            scope.removeItem = (x) => {
                scope.channel.programs.splice(x, 1)
                updateChannelDuration()
            }
            scope.knownChannels = [
                { id: -1, description: "# Channel #"},
            ]
            scope.loadChannels = async () => {
                let channelNumbers = await dizquetv.getChannelNumbers();
                try {
                    await Promise.all( channelNumbers.map( async(x) => {
                        let desc = await dizquetv.getChannelDescription(x);
                        if (desc.number != scope.channel.number) {
                            scope.knownChannels.push( {
                                id: desc.number,
                                description: `${desc.number} - ${desc.name}`,
                            });
                        }
                    }) );
                } catch (err) {
                    console.error(err);
                }
                scope.knownChannels.sort( (a,b) => a.id - b.id);
                scope.channelsDownloaded = true;
                $timeout( () => scope.$apply(), 0);


            };
            scope.loadChannels();

            scope.setTool = (toolName) => {
                scope.tool = toolName;
            }

            scope.hasPrograms = () => {
                return scope.channel.programs.length > 0;
            }

            scope.showPlexLibrary = () => {
                scope.displayPlexLibrary = true;
            }

            scope.toggleTools = () => {
                scope.showShuffleOptions = !scope.showShuffleOptions
                localStorage.setItem("channel-tools", (scope.showShuffleOptions? 'on' :  'off') );
            }

            scope.toggleToolsDirection = () => {
                scope.reverseTools = ! scope.reverseTools;
                localStorage.setItem("channel-tools-position", (scope.reverseTools? 'left' :  'right') );
            }

            scope.disablePadding = () => {
                return (scope.paddingOption.id==-1) || (2*scope.channel.programs.length > scope.maxSize);
            }
            scope.paddingOptions = [
                { id: -1, description: "Allowed start times", allow5: false },
                { id: 30, description: ":00, :30", allow5: false },
                { id: 15, description: ":00, :15, :30, :45", allow5: false },
                { id: 60, description: ":00", allow5: false },
                { id: 20, description: ":00, :20, :40", allow5: false },
                { id: 10, description: ":00, :10, :20, ..., :50", allow5: false },
                { id:  5, description: ":00, :05, :10, ..., :55", allow5: false },
                { id: 60, description: ":00, :05", allow5: true },
                { id: 30, description: ":00, :05, :30, :35", allow5: true },

            ]
            scope.paddingOption  = scope.paddingOptions[0];

            scope.breaksDisabled = () => {
                return scope.breakAfter==-1
                    || scope.minBreakSize==-1 || scope.maxBreakSize==-1
                    || (scope.minBreakSize > scope.maxBreakSize)
                    || (2*scope.channel.programs.length > scope.maxSize);
            }

            scope.breakAfterOptions = [
                { id: -1, description: "After" },
                { id: 5, description: "5 minutes" },
                { id: 10, description: "10 minutes" },
                { id: 15, description: "15 minutes" },
                { id: 20, description: "20 minutes" },
                { id: 25, description: "25 minutes" },
                { id: 30, description: "30 minutes" },
                { id: 60, description: "1 hour" },
                { id: 90, description: "90 minutes" },
                { id: 120, description: "2 hours" },
            ]
            scope.breakAfter = -1;
            scope.minBreakSize = -1;
            scope.maxBreakSize = -1;
            let breakSizeOptions = [
                { id: 10, description: "10 seconds" },
                { id: 15, description: "15 seconds" },
                { id: 30, description: "30 seconds" },
                { id: 45, description: "45 seconds" },
                { id: 60, description: "60 seconds" },
                { id: 90, description: "90 seconds" },
                { id: 120, description: "2 minutes" },
                { id: 180, description: "3 minutes" },
                { id: 300, description: "5 minutes" },
                { id: 450, description: "7.5 minutes" },
                { id: 10*60, description: "10 minutes" },
                { id: 20*60, description: "20 minutes" },
                { id: 30*60, description: "30 minutes" },
            ]
            scope.minBreakSizeOptions = [
                { id: -1, description: "Min Duration" },
            ]
            scope.minBreakSizeOptions = scope.minBreakSizeOptions.concat(breakSizeOptions);
            scope.maxBreakSizeOptions = [
                { id: -1, description: "Max Duration" },
            ]
            scope.maxBreakSizeOptions = scope.maxBreakSizeOptions.concat(breakSizeOptions);

            scope.rerunStart = -1;
            scope.rerunBlockSize = -1;
            scope.rerunBlockSizes = [
                { id: -1, description: "Block" },
                { id: 4, description: "4 Hours" },
                { id: 6, description: "6 Hours" },
                { id: 8, description: "8 Hours" },
                { id: 12, description: "12 Hours" },
            ];
            scope.rerunRepeats = -1;
            scope.rerunRepeatOptions = [
                { id: -1, description: "Repeats" },
                { id: 2, description: "2" },
                { id: 3, description: "3" },
                { id: 4, description: "4" },
                { id: 6, description: "6" },
            ];
            scope.rerunsDisabled = () => {
                return scope.rerunStart == -1 || scope.rerunBlockSize == -1 || scope.rerunRepeats == -1
                   || (scope.channel.programs.length * scope.rerunRepeats > scope.maxSize)

            }

            scope.openFallbackLibrary = () => {
                scope.showFallbackPlexLibrary = true
            }

            scope.importFallback = (selectedPrograms) => {
                for (let i = 0, l = selectedPrograms.length; i < l && i < 1; i++) {
                    selectedPrograms[i].commercials = []
                }
                scope.channel.fallback = [];
                if (selectedPrograms.length > 0) {
                    scope.channel.fallback = [ selectedPrograms[0] ];
                }
                scope.showFallbackPlexLibrary = false;
            }

            scope.fillerOptions = scope.channel.fillerCollections.map( (f) => {
                return {
                    id: f.id,
                    name: `(${f.id})`,
                }
            });

            scope.slide = {
                value: -1,
                options: [
                    {id:-1, description: "Time Amount" },
                    {id: 1 * 60 * 1000, description: "1 minute" },
                    {id: 10 * 60 * 1000, description: "10 minutes" },
                    {id: 15 * 60 * 1000, description: "15 minutes" },
                    {id: 30 * 60 * 1000, description: "30 minutes" },
                    {id: 60 * 60 * 1000, description: "1 hour" },
                    {id: 2 * 60 * 60 * 1000, description: "2 hours" },
                    {id: 4 * 60 * 60 * 1000, description: "4 hours" },
                    {id: 8 * 60 * 60 * 1000, description: "8 hours" },
                    {id:12 * 60 * 60 * 1000, description: "12 hours" },
                    {id:24 * 60 * 60 * 1000, description: "1 day" },
                    {id: 7 * 24 * 60 * 60 * 1000, description: "1 week" },
                ]
            }

            scope.resolutionOptions = [
                { id: "", description: "(Use global setting)" },
            ];
            resolutionOptions.get()
                .forEach( (a) => {
                    scope.resolutionOptions.push(a)
                } );

            scope.nightStartHours = [ { id: -1, description: "Start" } ];
            scope.nightEndHours   = [ { id: -1, description: "End" } ];
            scope.nightStart = -1;
            scope.nightEnd = -1;
            scope.atNightChannelNumber = -1;
            scope.atNightStart = -1;
            scope.atNightEnd = -1;
            for (let i=0; i < 24; i++) {
                let v = { id: i, description: ( (i<10) ? "0" : "") + i + ":00" };
                scope.nightStartHours.push(v);
                scope.nightEndHours.push(v);
            }
            scope.rerunStartHours = scope.nightStartHours;
            scope.paddingMod = 30;

            let fillerOptionsFor = (index) => {
                let used = {};
                let added = {};
                for (let i = 0; i < scope.channel.fillerCollections.length; i++) {
                    if (scope.channel.fillerCollections[i].id != 'none' && i != index) {
                        used[ scope.channel.fillerCollections[i].id ] = true;
                    }
                }
                let options = [];
                for (let i = 0; i < scope.fillerOptions.length; i++) {
                    if ( used[scope.fillerOptions[i].id] !== true) {
                        added[scope.fillerOptions[i].id] = true;
                        options.push( scope.fillerOptions[i] );
                    }
                }
                if (scope.channel.fillerCollections[index].id == 'none') {
                    added['none'] = true;
                    options.push( {
                        id: 'none',
                        name: 'Add a filler list...',
                    } );
                }
                if ( added[scope.channel.fillerCollections[index].id] !== true ) {
                    options.push( {
                        id: scope.channel.fillerCollections[index].id,
                        name: `[${f.id}]`,
                    } );
                }
                return options;
            }

            scope.programmingHeight = () => {
                return scope.programming.maxHeight + "rem";
            }
            let setProgrammingHeight = (h) => {
                scope.programming.step++;
                $timeout( () => {
                    scope.programming.step--;
                }, 1000 )
                scope.programming.maxHeight = h;
                localStorage.setItem("channel-programming-list-height", "" + h );
            };
            scope.programmingZoomIn = () => {
                let h = scope.programming.maxHeight;
                h = Math.min( Math.ceil(h + scope.programming.step ), 64);
                setProgrammingHeight(h);
            }
            scope.programmingZoomOut = () => {
                let h = scope.programming.maxHeight;
                h = Math.max( Math.floor(h - scope.programming.step ), 2 );
                setProgrammingHeight(h);
            }

            scope.refreshFillerStuff = () => {
                if (typeof(scope.channel.fillerCollections) === 'undefined') {
                    return;
                }
                addAddFiller();
                updatePercentages();
                refreshIndividualOptions();
            }

            let updatePercentages = () => {
                let w = 0;
                for (let i = 0; i < scope.channel.fillerCollections.length; i++) {
                    if (scope.channel.fillerCollections[i].id !== 'none') {
                        w += scope.channel.fillerCollections[i].weight;
                    }
                }
                for (let i = 0; i < scope.channel.fillerCollections.length; i++) {
                    if (scope.channel.fillerCollections[i].id !== 'none') {
                        scope.channel.fillerCollections[i].percentage = (scope.channel.fillerCollections[i].weight * 100 / w).toFixed(2) + "%";
                    }
                }

            };
            

            let addAddFiller = () => {
                if ( (scope.channel.fillerCollections.length == 0) || (scope.channel.fillerCollections[scope.channel.fillerCollections.length-1].id !== 'none') ) {
                    scope.channel.fillerCollections.push ( {
                        'id': 'none',
                        'weight': 300,
                        'cooldown': 0,
                    } );
                }
            }


            let refreshIndividualOptions = () => {
                for (let i = 0; i < scope.channel.fillerCollections.length; i++) {
                    scope.channel.fillerCollections[i].options = fillerOptionsFor(i);
                }
            }

            let refreshFillerOptions = async() => {

                try {
                    let r = await dizquetv.getAllFillersInfo();
                    scope.fillerOptions = r.map( (f) => {
                        return {
                            id: f.id,
                            name: f.name,
                        };
                    } );
                    scope.refreshFillerStuff();
                    scope.$apply();
                } catch(err) {
                    console.error("Unable to get filler info", err);
                }
            };
            scope.refreshFillerStuff();
            refreshFillerOptions();

            function parseResolutionString(s) {
                var i = s.indexOf('x');
                if (i == -1) {
                    i = s.indexOf("×");
                    if (i == -1) {
                       return {w:1920, h:1080}
                    }
                }
                return {
                    w: parseInt( s.substring(0,i) , 10 ),
                    h: parseInt( s.substring(i+1) , 10 ),
                }
            }

            scope.videoRateDefault = "(Use global setting)";
            scope.videoBufSizeDefault = "(Use global setting)";

            let refreshScreenResolution = async () => {

               
                try {
                    let ffmpegSettings = await dizquetv.getFfmpegSettings()
                    if (
                        (ffmpegSettings.targetResolution != null)
                        && (typeof(ffmpegSettings.targetResolution) !== 'undefined')
                        && (typeof(ffmpegSettings.targetResolution) !== '')
                    ) {
                        let p = parseResolutionString( ffmpegSettings.targetResolution );
                        scope.resolutionOptions[0] = {
                            id: "",
                            description: `Use global setting (${ffmpegSettings.targetResolution})`,
                        }
                        ffmpegSettings.targetResolution
                        scope.screenW = p.w;
                        scope.screenH = p.h;
                        scope.videoRateDefault = `global setting=${ffmpegSettings.videoBitrate}`;
                        scope.videoBufSizeDefault = `global setting=${ffmpegSettings.videoBufSize}`;
           
                        $timeout();
                    }
                } catch(err) {
                    console.error("Could not fetch ffmpeg settings", err);
                }
            }
            refreshScreenResolution();

            scope.showList = () => {
                return ! scope.showFallbackPlexLibrary;
            }


            scope.deleteFillerList =(index) => {
                scope.channel.fillerCollections.splice(index, 1);
                scope.refreshFillerStuff();
            }



            scope.durationString = (duration) => {
                var date = new Date(0);
                date.setSeconds( Math.floor(duration / 1000) ); // specify value for SECONDS here
                return date.toISOString().substr(11, 8);
            }

            scope.getCurrentWH = () => {
                if (scope.channel.transcoding.targetResolution !== '') {
                    return parseResolutionString( scope.channel.transcoding.targetResolution );
                }
                return {
                    w: scope.screenW,
                    h: scope.screenH
                }
            }
            scope.getWatermarkPreviewOuter = () => {
                let tm = scope.getCurrentWH();
                let resolutionW = tm.w;
                let resolutionH = tm.h;
                let width = 100;
                let height = width / ( resolutionW / resolutionH );


                return {
                    width: `${width}%`,
                    "overflow" : "hidden",
                    "padding-top": 0,
                    "padding-left": 0,
                    "padding-right": 0,
                    "padding-bottom": `${height}%`,
                    position: "relative",
                }
            }

            scope.getWatermarkPreviewRectangle = (p,q) => {
                let s = scope.getCurrentWH();
                if ( (s.w*q) == (s.h*p) ) {
                    //not necessary, hide it
                    return {
                        position: "absolute",
                        visibility: "hidden",
                    }
                } else {
                    //assume width is equal
                    // s.w / h2 = p / q
                    let h2 = (s.w * q * 100) / (p * s.h);
                    let w2 = 100;
                    let left = undefined;
                    let top = undefined;
                    if (h2 > 100) {
                        //wrong
                        //the other way around
                        w2 = (s.h / s.w) * p * 100 / q;
                        left = (100 - w2) / 2;
                    } else {
                        top = (100 - h2) / 2;
                    }
                    let padding = (100 * q) / p;
                    return {
                        "width" : `${w2}%`,
                        "padding-top": "0",
                        "padding-left": "0",
                        "padding-right": "0",
                        "padding-bottom": `${padding}%`,
                        "margin" : "0",
                        "left": `${left}%`,
                        "top" : `${top}%`,
                        "position": "absolute",
                    }
                }

            }

            scope.getWatermarkSrc = () => {
                let url = scope.channel.watermark.url;
                if ( url == null || typeof(url) == 'undefined' || url == '') {
                    url = scope.channel.icon;
                }
                return url;
            }

            scope.getWatermarkPreviewInner = () => {
                let width = Math.max(Math.min(100, scope.channel.watermark.width), 0);
                let res = {
                    width: `${width}%`,
                    margin: "0",
                    position: "absolute",
                }
                if (scope.channel.watermark.fixedSize === true) {
                    delete res.width;
                }
                let mH = scope.channel.watermark.horizontalMargin;
                let mV = scope.channel.watermark.verticalMargin;
                if (scope.channel.watermark.position == 'top-left') {
                    res["top"] = `${mV}%`;
                    res["left"] = `${mH}%`;
                } else if (scope.channel.watermark.position == 'top-right') {
                    res["top"] = `${mV}%`;
                    res["right"] = `${mH}%`;
                } else if (scope.channel.watermark.position == 'bottom-right') {
                    res["bottom"] = `${mV}%`;
                    res["right"] = `${mH}%`;
                } else if (scope.channel.watermark.position == 'bottom-left') {
                    res["bottom"] = `${mV}%`;
                    res["left"] = `${mH}%`;
                } else {
                    console.log("huh? " + scope.channel.watermark.position );
                }
                return res;
            }

            function notValidNumber(x, lower, upper) {
                if ( (x == null) || (typeof(x) === 'undefined') || isNaN(x) ) {
                    return true;
                }
                if ( (typeof(lower) !== 'undefined') && (x < lower) ) {
                    return true;
                }
                if ( (typeof(upper) !== 'undefined') && (x > upper) ) {
                    return true;
                }
                return false;
            }

            
            scope.onTimeSlotsDone = (slotsResult) => {
                scope.channel.programs = slotsResult.programs;

                let t = (new Date()).getTime();
                let t1 =new Date( (new Date( slotsResult.startTime ) ).getTime() );
                let total = 0;
                for (let i = 0; i < slotsResult.programs.length; i++) {
                    total += slotsResult.programs[i].duration;
                }
                
                scope.channel.scheduleBackup = slotsResult.schedule;

                while(t1 > t) {
                    //TODO: Replace with division
                    t1 -= total;
                }
                scope.channel.startTime = new Date(t1);
                adjustStartTimeToCurrentProgram();
                updateChannelDuration();
            }
            scope.onTimeSlotsButtonClick = () => {
                let progs = removeDuplicatesSub( scope.channel.programs );
                scope.timeSlots.startDialog( progs, scope.maxSize, scope.channel.scheduleBackup );
            }

          },

          pre: function(scope) {
            scope.timeSlots = null;
            scope.registerTimeSlots = (timeSlots) => {
                scope.timeSlots = timeSlots;
            }
          },

        }
    }
}
function validURL(url) {
    return /^(ftp|http|https):\/\/[^ "]+$/.test(url);
}
