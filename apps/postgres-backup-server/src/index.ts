import express from 'express';
import Docker from 'dockerode';
import {resolve} from 'path';
import {exec} from "child_process";
import { getENVValue } from '@carla/variable_provider';

const docker = new Docker();
const PORT = 5000 || getENVValue("BACKUP_PORT");

const app = express();

app.get('/', async (req, res) => {
    const dumpName = resolve() + `dump_${new Date().getTime()}.sql`;
    exec(`docker exec -t postgres pg_dumpall -c -U postgres > ${dumpName}`);
    await docker.getContainer('postgres').exec({Cmd: ['pg_dumpall', '-c', '-U', 'postgres', '>', `${dumpName}`]})
    return res.sendFile(`${dumpName}`);
});

app.listen(PORT, () => {
    console.log("Version 1.0.2")
    console.log(`Listening on port ${PORT}`);
});