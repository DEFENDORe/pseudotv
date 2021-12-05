module.exports = function ($http) {
    return {
        getVersion: () => {
            return $http.get('/api/version').then((d) => { return d.data })
        },
        getPlexServers: () => {
            return $http.get('/api/plex-servers').then((d) => { return d.data })
        },
        addPlexServer: (plexServer) => {
            return $http({
                method: 'PUT',
                url: '/api/plex-servers',
                data: plexServer,
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }).then((d) => { return d.data })
        },
        updatePlexServer: (plexServer) => {
            return $http({
                method: 'POST',
                url: '/api/plex-servers',
                data: plexServer,
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }).then((d) => { return d.data })
        },
        checkExistingPlexServer: async (serverName) => {
            let d = await $http({
                method: 'POST',
                url: '/api/plex-servers/status',
                data: { name: serverName },
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            })
            return d.data;
        },
        checkNewPlexServer: async (server) => {
            let d = await $http({
                method: 'POST',
                url: '/api/plex-servers/foreignstatus',
                data: server,
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            })
            return d.data;
        },
        removePlexServer: async (serverName) => {
            let d = await $http({
                method: 'DELETE',
                url: '/api/plex-servers',
                data: { name: serverName },
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            });
            return d.data;
        },
        getPlexSettings: () => {
            return $http.get('/api/plex-settings').then((d) => { return d.data })
        },
        updatePlexSettings: (config) => {
            return $http({
                method: 'PUT',
                url: '/api/plex-settings',
                data: angular.toJson(config),
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }).then((d) => { return d.data })
        },
        resetPlexSettings: (config) => {
            return $http({
                method: 'POST',
                url: '/api/plex-settings',
                data: angular.toJson(config),
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }).then((d) => { return d.data })
        },
        getFfmpegSettings: () => {
            return $http.get('/api/ffmpeg-settings').then((d) => { return d.data })
        },
        updateFfmpegSettings: (config) => {
            return $http({
                method: 'PUT',
                url: '/api/ffmpeg-settings',
                data: angular.toJson(config),
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }).then((d) => { return d.data })
        },
        resetFfmpegSettings: (config) => {
            return $http({
                method: 'POST',
                url: '/api/ffmpeg-settings',
                data: angular.toJson(config),
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }).then((d) => { return d.data })
        },
        getXmltvSettings: () => {
            return $http.get('/api/xmltv-settings').then((d) => { return d.data })
        },
        updateXmltvSettings: (config) => {
            return $http({
                method: 'PUT',
                url: '/api/xmltv-settings',
                data: angular.toJson(config),
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }).then((d) => { return d.data })
        },
        resetXmltvSettings: (config) => {
            return $http({
                method: 'POST',
                url: '/api/xmltv-settings',
                data: angular.toJson(config),
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }).then((d) => { return d.data })
        },
        getHdhrSettings: () => {
            return $http.get('/api/hdhr-settings').then((d) => { return d.data })
        },
        updateHdhrSettings: (config) => {
            return $http({
                method: 'PUT',
                url: '/api/hdhr-settings',
                data: angular.toJson(config),
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }).then((d) => { return d.data })
        },
        resetHdhrSettings: (config) => {
            return $http({
                method: 'POST',
                url: '/api/hdhr-settings',
                data: angular.toJson(config),
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }).then((d) => { return d.data })
        },
        getChannels: () => {
            return $http.get('/api/channels').then((d) => { return d.data })
        },

        getChannel: (number) => {
            return $http.get(`/api/channel/${number}`).then( (d) => { return d.data })
        },

        getChannelDescription: (number) => {
            return $http.get(`/api/channel/description/${number}`).then( (d) => { return d.data } )
        },


        getChannelNumbers: () => {
            return $http.get('/api/channelNumbers').then( (d) => { return d.data } )
        },

        addChannel: (channel) => {
            return $http({
                method: 'POST',
                url: '/api/channel',
                data: angular.toJson(channel),
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }).then((d) => { return d.data })
        },
        updateChannel: (channel) => {
            return $http({
                method: 'PUT',
                url: '/api/channel',
                data: angular.toJson(channel),
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }).then((d) => { return d.data })
        },
        removeChannel: (channel) => {
            return $http({
                method: 'DELETE',
                url: '/api/channel',
                data: angular.toJson(channel),
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }).then((d) => { return d.data })
        },

        /*======================================================================
        * Filler stuff
        */
        getAllFillersInfo: async () => {
            let f = await $http.get('/api/fillers');
            return f.data;
        },

        getFiller: async (id) => {
            let f = await $http.get(`/api/filler/${id}`);
            return f.data;
        },

        updateFiller: async(id, filler) => {
            return (await $http({
                method: "POST",
                url : `/api/filler/${id}`,
                data: angular.toJson(filler),
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }) ).data;
        },

        createFiller: async(filler) => {
            return (await $http({
                method: "PUT",
                url : `/api/filler`,
                data: angular.toJson(filler),
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }) ).data;
        },

        deleteFiller: async(id) => {
            return ( await $http({
                method: "DELETE",
                url : `/api/filler/${id}`,
                data: {},
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            }) ).data;
        },

        getChannelsUsingFiller: async(fillerId)  => {
            return (await $http.get( `/api/filler/${fillerId}/channels` )).data;
        },

        /*======================================================================
        * TV Guide endpoints
        */
        getGuideStatus: async () => {
            let d = await $http( {
                method: 'GET',
                url : '/api/guide/status',
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
            } );
            return d.data;
        },

        getChannelLineup: async (channelNumber, dateFrom, dateTo) => {
            let a = dateFrom.toISOString();
            let b = dateTo.toISOString();
            let d = await $http( {
                method: 'GET',
                url : `/api/guide/channels/${channelNumber}?dateFrom=${a}&dateTo=${b}`,
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
            } );
            return d.data;
        },

        /*======================================================================
        * Channel Tool Services
        */
        calculateTimeSlots: async( programs, schedule) => {
            let d = await $http( {
                method: "POST",
                url : "/api/channel-tools/time-slots",
                data: {
                    programs: programs,
                    schedule: schedule,
                },
                headers: { 'Content-Type': 'application/json; charset=utf-8' },
            } );
            return d.data;
        }


    }
}