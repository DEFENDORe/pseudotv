/**
 * @fileoverview Sql query to create tables on database files. This file is used by ./db.js
 */

const MediaServiceAccounts = `
CREATE TABLE IF NOT EXISTS mediaServiceAccounts(
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    token TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type in ('plex','jellyfin')) DEFAULT 'plex'
);`;

const Channel = `
CREATE TABLE IF NOT EXISTS channels(
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    rating TEXT NOT NULL CHECK (rating in ('TV-Y','TV-G','TV-PG','TV-14','TV-MA','G','PG','PG-13','R','R+','Rx','NC-17','NR')) DEFAULT 'NR',
    icon TEXT DEFAULT 'https://raw.githubusercontent.com/DEFENDORe/pseudotv/master/resources/pseudotv.png',
    channelNumber INTEGER NOT NULL
);`;

const Program = `
CREATE TABLE IF NOT EXISTS programs(
    id INTEGER PRIMARY KEY,
    channelId INTEGER NOT NULL,
    programType NOT NULL CHECK (programType in ('TvShow','Movie')),
    file TEXT NOT NULL,
    duration INTEGER NOT NULL,
    programTitle TEXT NOT NULL,
    episodeTitle TEXT,
    season INTEGER,
    episode INTEGER,
    summary TEXT NOT NULL,
    rating TEXT NOT NULL CHECK (rating in ('TV-Y','TV-G','TV-PG','TV-14','TV-MA','G','PG','PG-13','R','R+','Rx','NC-17','NR')) DEFAULT 'NR',
    thumbnail TEXT NOT NULL
);`;

const ChannelOpts = `
CREATE TABLE IF NOT EXISTS channelOpts(
    id INTEGER PRIMARY KEY,
    channelId INTEGER NOT NULL,
    overlay BOOLEAN NOT NULL CHECK (overlay IN (0,1)) DEFAULT 0,
    overlayPos INTEGER NOT NULL DEFAULT 0,
    overlayWidth INTEGE NOT NULL DEFAULT 120,
    overlayDuration INTEGER NOT NULL DEFAULT 60,
    commercials BOOLEAN NOT NULL CHECK (commercials IN (0,1)) DEFAULT 0,
    shuffle BOOLEAN NOT NULL CHECK (shuffle IN (0,1)) DEFAULT 0,
    commercialBreaks INTEGER NOT NULL DEFAULT 0
);`;

const ProgramOpts = `
CREATE TABLE IF NOT EXISTS programOpts(
    id INTEGER PRIMARY KEY,
    programId INTEGER NOT NULL,
    audioTrack INTEGER NOT NULL,
    videoTrack INTEGER NOT NULL,
    SubtitleTrack INTEGER NOT NULL
);`;

const Commercials = `
CREATE TABLE IF NOT EXISTS commercials(
    id INTEGER PRIMARY KEY,
    channelId INTEGER NOT NULL,
    file TEXT NOT NULL,
    duration INTEGER NOT NULL,
    commercialTitle TEXT NOT NULL
);`;

export default {
    MediaServiceAccounts,
    Channel,
    Program,
    ChannelOpts,
    ProgramOpts,
    Commercials,
}
