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
    rating TEXT NOT NULL,
    icon TEXT DEFAULT 'https://raw.githubusercontent.com/DEFENDORe/pseudotv/master/resources/pseudotv.png',
    channelNumber INTEGER NOT NULL
);`;

const Program = `
CREATE TABLE IF NOT EXISTS programs(
    id INTEGER PRIMARY KEY,
    file TEXT NOT NULL,
    length INTEGER NOT NULL,
    showTitle TEXT NOT NULL,
    episodeTitle TEXT NOT NULL,
    season INTEGER NOT NULL,
    episode INTEGER NOT NULL,
    summary TEXT NOT NULL,
    rating TEXT NOT NULL,
    thumbnail TEXT NOT NULL,
    channel INTEGER NOT NULL
);`;

const ChannelOpts = `
CREATE TABLE IF NOT EXISTS channelOpts(
    id INTEGER PRIMARY KEY,
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
    program INTEGER NOT NULL,
    audioTrack INTEGER NOT NULL,
    videoTrack INTEGER NOT NULL,
    SubtitleTrack INTEGER NOT NULL
);`;

const Commercials = `
CREATE TABLE IF NOT EXISTS commercials(
    id INTEGER PRIMARY KEY,
    file TEXT NOT NULL,
    length INTEGER NOT NULL,
    commercialTitle TEXT NOT NULL,
    channel INTEGER NOT NULL
);`;

export default {
    MediaServiceAccounts,
    Channel,
    Program,
    ChannelOpts,
    ProgramOpts,
    Commercials,
}