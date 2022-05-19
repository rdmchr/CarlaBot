import fetch from 'node-fetch-native';
import { readFileSync } from "fs";
import { CommandInteraction, MessageEmbed, TextChannel } from "discord.js";
import pg from "pg";
import crypto from 'crypto';
import {prisma} from "./prisma.js";

export async function createNewDatabaseServer(serverName: string, channel: TextChannel) {
    const password = generatePassword();

    const userData = getUserData(password);
    if (!userData) {
        return null;
    }


    const res = await fetch('https://api.hetzner.cloud/v1/servers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.HETZNER_TOKEN}`,
        },
        body: JSON.stringify({
            image: 'ubuntu-20.04',
            name: serverName,
            server_type: 'cx11',
            ssh_keys: ['Home'],
            location: 'nbg1',
            user_data: userData,
        })
    });
    const serverData = await res.json();
    const ip = serverData.server.public_net.ipv4.ip;
    waitForDatabase(ip, password, channel);
    return { serverId: serverData.server.id as number, ip: ip, password: password };
}

/**
 * Deletes a database server
 * @param id the hetzner id of the server
 * @return returns true if successful and false if it encountered an error
 */
export async function deleteDatabaseServer(id: number) {
    const res = await fetch(`https://api.hetzner.cloud/v1/servers/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${process.env.HETZNER_TOKEN}`,
        }
    });
    const data = await res.json();
    return data.status !== 'error';
}

export async function execSQL(serverId: string, sql: string) {

    const dbCredentials = await prisma.server.findUnique({
        where: {
            id: serverId,
        },
        select: {
            ip: true,
            password: true,
            port: true,
            username: true,
            database: true
        }
    });

    if (!dbCredentials) {
        return 'Could not find the database server.';
    }

    const client = new pg.Client({
        user: dbCredentials.username,
        password: dbCredentials.password,
        host: dbCredentials.ip,
        port: dbCredentials.port,
        database: dbCredentials.database,
    });

    try {
        await client.connect();
        const res = await client.query(sql);
        return '```' + sql + '``` \n affected ' + res.rowCount + ' rows and resulted in the following output: \n```' + JSON.stringify(res.rows) + '```';
    } catch (e: any) {
        const error = e as pg.DatabaseError;
        return '```' + sql + '``` \nresulted in the following error: \n```' + error.message + '```';
    }
}

async function isDatabaseOnline(ip: string, password: string) {
    const client = new pg.Client({
        user: 'postgres',
        password: password,
        host: ip,
        port: 5432,
        database: 'postgres',
    });
    try {
        await client.connect();
        return true;
    } catch (_) {
        return false;
    }
}

export async function waitForDatabase(ip: string, password: string, channel: TextChannel) {
    const interval = setInterval(async () => {
        if (await isDatabaseOnline(ip, password)) {
            const embed = new MessageEmbed();
            embed.setTitle('Database created!');
            embed.addField('IP', ip);
            embed.addField('Port', '5432');
            embed.addField('Username', 'postgres');
            embed.addField('Database', 'postgres');
            embed.addField('Password', password);
            embed.setColor('#0099ff');
            channel.send({ embeds: [embed] }).then((mess) => {
                mess.pin();
            });
            clearInterval(interval);
        }
    }, 1000 * 5);
}

function getUserData(password: string) {
    let userData = readFileSync('./server-scripts/cloud-init.yml', 'utf8');
    userData = userData.replaceAll('\r', '');
    userData = userData.replaceAll('REPLACE_WITH_PASSWORD', password);
    return userData;
}

const generatePassword = (
    length = 20,
    wishlist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
) =>
    Array.from(crypto.randomFillSync(new Uint32Array(length)))
        .map((x) => wishlist[x % wishlist.length])
        .join('')
