import prisma from '@carla/database';
import Express from 'express';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const router = Express.Router();

router.get('/tweetMedia/:id', async (req, res) => {
    const media = req.params.id;

    if (!media) {
        return res.status(404).send({error: 'Media not found'});
    }

    const presignedUrl = await getPreSignedUrl(media);
    if (!presignedUrl) {
        return res.status(404).send({error: 'File not found'});
    }

    res.redirect(307, presignedUrl);
});

/**
 * generates a pre signed url to get a file from S3
 * @param key the s3 key of the file
 */
async function getPreSignedUrl(key: string): Promise<string> {
    const accessKeyId = process.env.AWS_KEY_ID as string;
    const secretAccessKey = process.env.AWS_SECRET_KEY as string;
    const bucketName = process.env.AWS_BUCKET_NAME as string;

    const client = new S3Client({
        region: 'eu-west-1',
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
        },
    });

    const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
    });

    return await getSignedUrl(client, getCommand, {expiresIn: (120)});
}


export default router;