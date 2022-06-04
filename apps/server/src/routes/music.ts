import Express from "express";
import { getUserFromJWT } from '../utils.js';

const router = Express.Router();

router.get('/music', async (req, res) => {
    const jwt = req.headers.authorization as string;
    if (!jwt) {
        return res.sendStatus(401);
    }
    const user = await getUserFromJWT(jwt);
    console.log(user);
    if (!user) {
        return res.sendStatus(403);
    }
    return res.status(200).send({userId: user});
})

export default router;