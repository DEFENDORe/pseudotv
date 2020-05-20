import db from 'diskdb';
import dotenv from 'dotenv';
dotenv.config();

process.env.DATABASE = process.env.DATABASE || './.pseudotv';

db.connect(process.env.DATABASE, ['channels', 'media-servers', 'ffmpeg-settings', 'xmltv-settings', 'hdhr-settings']);

export class Database {
    constructor(tableName) {
        this.tableName = tableName;
    }

    save(data) {
        db[this.tableName].save(data);
        return db[this.tableName].find();
    }
}