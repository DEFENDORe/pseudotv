
const db = require('diskdb')
const fs = require('fs')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')

const api = require('./src/api')
const dbMigration = require('./src/database-migration');
const video = require('./src/video')
const HDHR = require('./src/hdhr')

const xmltv = require('./src/xmltv')
const Plex = require('./src/plex');
const channelCache = require('./src/channel-cache');
const constants = require('./src/constants')
const ChannelDB = require("./src/dao/channel-db");
const FillerDB = require("./src/dao/filler-db");
const TVGuideService = require("./src/tv-guide-service");
const onShutdown = require("node-graceful-shutdown").onShutdown;

console.log(
`         \\
   dizqueTV ${constants.VERSION_NAME}
.------------.
|:::///### o |
|:::///###   |
':::///### o |
'------------'
`);


for (let i = 0, l = process.argv.length; i < l; i++) {
    if ((process.argv[i] === "-p" || process.argv[i] === "--port") && i + 1 !== l)
        process.env.PORT = process.argv[i + 1]
    if ((process.argv[i] === "-d" || process.argv[i] === "--database") && i + 1 !== l)
        process.env.DATABASE = process.argv[i + 1]
}

process.env.DATABASE = process.env.DATABASE || './.dizquetv'
process.env.PORT = process.env.PORT || 8000

if (!fs.existsSync(process.env.DATABASE)) {
    if (fs.existsSync("./.pseudotv")) {
        throw Error(process.env.DATABASE + " folder not found but ./.pseudotv has been found. Please rename this folder or create an empty " + process.env.DATABASE + " folder so that the program is not confused about.");
    }
    fs.mkdirSync(process.env.DATABASE)
}

if(!fs.existsSync(path.join(process.env.DATABASE, 'images'))) {
    fs.mkdirSync(path.join(process.env.DATABASE, 'images'))
}

if(!fs.existsSync(path.join(process.env.DATABASE, 'channels'))) {
    fs.mkdirSync(path.join(process.env.DATABASE, 'channels'))
}
if(!fs.existsSync(path.join(process.env.DATABASE, 'filler'))) {
    fs.mkdirSync(path.join(process.env.DATABASE, 'filler'))
}


channelDB = new ChannelDB( path.join(process.env.DATABASE, 'channels') );
fillerDB = new FillerDB( path.join(process.env.DATABASE, 'filler') , channelDB, channelCache );

db.connect(process.env.DATABASE, ['channels', 'plex-servers', 'ffmpeg-settings', 'plex-settings', 'xmltv-settings', 'hdhr-settings', 'db-version', 'client-id'])

initDB(db, channelDB)

const guideService = new TVGuideService(xmltv, db);



let xmltvInterval = {
    interval: null,
    lastRefresh: null,
    updateXML: async () => {
        let getChannelsCached = async() => {
            let channelNumbers = await channelDB.getAllChannelNumbers();
            return await Promise.all( channelNumbers.map( async (x) => {
                return (await channelCache.getChannelConfig(channelDB, x))[0];
            }) );
        }

        let channels = [];

        try {
            channels = await getChannelsCached();
            let xmltvSettings = db['xmltv-settings'].find()[0];
            let t = guideService.prepareRefresh(channels, xmltvSettings.cache*60*60*1000);
            channels = null;

            await guideService.refresh(t);
            xmltvInterval.lastRefresh = new Date()
            console.log('XMLTV Updated at ', xmltvInterval.lastRefresh.toLocaleString());
        } catch (err) {
            console.error("Unable to update TV guide?", err);
            return;
        }
        channels = await getChannelsCached();

        let plexServers = db['plex-servers'].find()
        for (let i = 0, l = plexServers.length; i < l; i++) {       // Foreach plex server
            let plex = new Plex(plexServers[i])
            let dvrs;
            if ( !plexServers[i].arGuide && !plexServers[i].arChannels) {
                continue;
            }
            try {
                dvrs = await plex.GetDVRS() // Refresh guide and channel mappings
            } catch(err) {
                console.error(`Couldn't get DVRS list from ${plexServers[i].name}. This error will prevent 'refresh guide' or 'refresh channels' from working for this Plex server. But it is NOT related to playback issues.` , err );
                continue;
            }
            if (plexServers[i].arGuide) {
                try {
                    await plex.RefreshGuide(dvrs);
                } catch(err) {
                    console.error(`Couldn't tell Plex ${plexServers[i].name} to refresh guide for some reason. This error will prevent 'refresh guide' from working for this Plex server. But it is NOT related to playback issues.` , err);
                }
            }
            if (plexServers[i].arChannels && channels.length !== 0) {
                try {
                    await plex.RefreshChannels(channels, dvrs);
                } catch(err) {
                    console.error(`Couldn't tell Plex ${plexServers[i].name} to refresh channels for some reason. This error will prevent 'refresh channels' from working for this Plex server. But it is NOT related to playback issues.` , err);
                }
            }
        }
    },
    startInterval: () => {
        let xmltvSettings = db['xmltv-settings'].find()[0]
        if (xmltvSettings.refresh !== 0) {
            xmltvInterval.interval = setInterval( async () => {
                try {
                    await xmltvInterval.updateXML()
                } catch(err) {
                    console.error("update XMLTV error", err);
                }
            }, xmltvSettings.refresh * 60 * 60 * 1000)
        }
    },
    restartInterval: () => {
        if (xmltvInterval.interval !== null)
            clearInterval(xmltvInterval.interval)
        xmltvInterval.startInterval()
    }
}

xmltvInterval.updateXML()
xmltvInterval.startInterval()

let hdhr = HDHR(db, channelDB)
let app = express()
app.use(bodyParser.json({limit: '50mb'}))
app.get('/version.js', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'application/javascript'
    });

    res.write( `
        function setUIVersionNow() {
            setTimeout( setUIVersionNow, 1000);
            var element = document.getElementById("uiversion");
            if (element != null) {
                element.innerHTML = "${constants.VERSION_NAME}";
            }
        }
        setTimeout( setUIVersionNow, 1000);
    ` );
    res.end();
});
app.use('/images', express.static(path.join(process.env.DATABASE, 'images')))
app.use(express.static(path.join(__dirname, 'web/public')))
app.use('/images', express.static(path.join(process.env.DATABASE, 'images')))
app.use('/favicon.svg', express.static(
    path.join(__dirname, 'resources/favicon.svg')
) );

app.use(api.router(db, channelDB, fillerDB, xmltvInterval, guideService ))
app.use(video.router( channelDB, fillerDB, db))
app.use(hdhr.router)
app.listen(process.env.PORT, () => {
    console.log(`HTTP server running on port: http://*:${process.env.PORT}`)
    let hdhrSettings = db['hdhr-settings'].find()[0]
    if (hdhrSettings.autoDiscovery === true)
        hdhr.ssdp.start()
})

function initDB(db, channelDB) {
    if (!fs.existsSync(process.env.DATABASE + '/images/dizquetv.png')) {
        let data = fs.readFileSync(path.resolve(path.join(__dirname, 'resources/dizquetv.png')))
        fs.writeFileSync(process.env.DATABASE + '/images/dizquetv.png', data)
    }
    dbMigration.initDB(db, channelDB, __dirname);
    if (!fs.existsSync(process.env.DATABASE + '/font.ttf')) {
        let data = fs.readFileSync(path.resolve(path.join(__dirname, 'resources/font.ttf')))
        fs.writeFileSync(process.env.DATABASE + '/font.ttf', data)
    }
    if (!fs.existsSync(process.env.DATABASE + '/images/dizquetv.png')) {
        let data = fs.readFileSync(path.resolve(path.join(__dirname, 'resources/dizquetv.png')))
        fs.writeFileSync(process.env.DATABASE + '/images/dizquetv.png', data)
    }
    if (!fs.existsSync(process.env.DATABASE + '/images/generic-error-screen.png')) {
        let data = fs.readFileSync(path.resolve(path.join(__dirname, 'resources/generic-error-screen.png')))
        fs.writeFileSync(process.env.DATABASE + '/images/generic-error-screen.png', data)
    }
    if (!fs.existsSync(process.env.DATABASE + '/images/generic-offline-screen.png')) {
        let data = fs.readFileSync(path.resolve(path.join(__dirname, 'resources/generic-offline-screen.png')))
        fs.writeFileSync(process.env.DATABASE + '/images/generic-offline-screen.png', data)
    }
    if (!fs.existsSync(process.env.DATABASE + '/images/loading-screen.png')) {
        let data = fs.readFileSync(path.resolve(path.join(__dirname, 'resources/loading-screen.png')))
        fs.writeFileSync(process.env.DATABASE + '/images/loading-screen.png', data)
    }

}

onShutdown("log" , [],  async() => {
    console.log("Received exit signal, attempting graceful shutdonw...");
});
onShutdown("xmltv-writer" , [],  async() => {
    await xmltv.shutdown();
} );

