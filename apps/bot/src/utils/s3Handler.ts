import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

export async function uploadToS3(file: any, fileName: string) {
    const accessKeyId = process.env.AWS_KEY_ID as string;
    const secretAccessKey = process.env.AWS_SECRET_KEY as string;
    const bucketName = process.env.AWS_BUCKET_NAME as string;

    if (!accessKeyId || !secretAccessKey || !bucketName) return;

    const client = new S3Client({
        region: 'eu-west-1',
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        },
    });

    const upload = new Upload({
        client: client,
        params: {
            Bucket: bucketName,
            Key: fileName,
            Body: file
        },
        leavePartsOnError: false,
    });

    const result = await upload.done();
}
