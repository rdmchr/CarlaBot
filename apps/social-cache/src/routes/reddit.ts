import Express from 'express';

const router = Express.Router();

router.get('/r/:subreddit/comments/:id/:title', async (req, res) => {
    console.log("HIT REDDIT ROUTE");
    console.log(req.params.id);
    console.log(req.params.subreddit);

    return res.send('Ok');
})

export default router;