import Express from 'express';
import { Main } from './index.js';
import { TextChannel } from 'discord.js';
import { music } from './commands/music.js';

const app = Express();
const PORT = process.env.WEBHOOK_PORT as string || 3333;

app.use(Express.json());

app.use(async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET as string;
    if (WEBHOOK_SECRET && req.headers.secret !== WEBHOOK_SECRET) {
        console.log('Access denied, wrong secret.');
        res.sendStatus(403);
        return;
    }
    next();
});

app.post('/', async (req: Express.Request, res: Express.Response) => {
    const guild = await Main.Client.guilds.fetch('970439367715856384');
    const channel = await guild.channels.fetch('977891287036461066') as TextChannel;

    await channel.send('Hello World!');

    res.send('Hello World!');
});

app.post('/playSong', async (req: Express.Request, res: Express.Response) => {
    if (!req.body.song) {
        return res.status(400).send({error: 'Missing song attribute'});
    }
    if (!req.body.guild) {
        return res.status(400).send({error: 'Missing guild attribute'});
    }
    if (!req.body.user) {
        return res.status(400).send({error: 'Missing user attribute'});
    }

    const guild = await Main.Client.guilds.fetch(req.body.guild);
    if (!guild) {
        return res.status(400).send({error: 'Guild not found'});
    }
    const member = await guild.members.fetch(req.body.user);
    if (!member) {
        return res.status(400).send({error: 'User not found'});
    }

    const player = new music();
    const result = await player.playFromWeb(guild, member, req.body.song);
    if (result.success) {
        return res.send({success: result.success});
    }
    return res.status(400).send({error: result.error});
});

app.post('/getSong', async (req: Express.Request, res: Express.Response) => {
    if (!req.body.guild) {
        return res.status(400).send({error: 'Missing guild attribute'});
    }
    if (!req.body.user) {
        return res.status(400).send({error: 'Missing user attribute'});
    }

    const guild = await Main.Client.guilds.fetch(req.body.guild);
    if (!guild) {
        return res.status(400).send({error: 'Guild not found'});
    }

    const member = await guild.members.fetch(req.body.user);
    if (!member) {
        return res.status(400).send({error: 'User not found'});
    }

    const player = new music();
    const currentTrack = await player.getCurrentlyPlaying(guild);
    if (currentTrack.error) {
        return res.status(400).send({error: currentTrack.error});
    }
    if (!currentTrack.track) {
        return res.status(400).send({error: 'No track playing'});
    }
    return res.send({
        success: true,
        link: currentTrack.track.metadata.source,
    });
});

export function start() {
    app.listen(PORT, () => {
        console.log(`Listening on port ${PORT}`);
    });
}
