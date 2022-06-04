import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

const accessKeyId = process.env.AWS_KEY_ID as string;
const secretAccessKey = process.env.AWS_SECRET_KEY as string;
const bucketName = process.env.AWS_BUCKET_NAME as string;

export async function deleteObjects(keys: string[]) {
    if (!accessKeyId || !secretAccessKey || !bucketName) return;

    const client = new S3Client({
        region: 'eu-west-1',
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
        },
    });

    const s3Promises = keys.map((key) => {
        return client.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
        }));
    });

    try {
        await Promise.all(s3Promises);
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}