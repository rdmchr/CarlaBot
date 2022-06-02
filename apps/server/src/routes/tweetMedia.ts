import prisma from '@carla/database';
import Express from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const router = Express.Router();

router.get('/tweetMedia:id', async (req, res) => {
    const media = await prisma.tweetMedia.findUnique({
        where: {
            id: req.params.id
        }
    });

    if (!media) {
        return res.status(404).send({ error: 'Media not found' });
    }

    const file = await getFromS3(media.awsKey);

    res.send(file);
});



export async function getFromS3(fileName: string) {
    const accessKeyId = process.env.AWS_KEY_ID as string;
    const secretAccessKey = process.env.AWS_SECRET_KEY as string;
    const bucketName = process.env.AWS_BUCKET_NAME as string;

    if (!accessKeyId || !secretAccessKey || !bucketName) return null;

    const client = new S3Client({
        region: 'eu-west-1',
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        },
    });

    const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
    });

    const res = await client.send(getCommand);

    if (res.Body) {
        return res.Body;
    }
    return null;
}


export default router;