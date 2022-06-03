import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import prisma from '@carla/database';

const accessKeyId = process.env.AWS_KEY_ID as string;
const secretAccessKey = process.env.AWS_SECRET_KEY as string;
const bucketName = process.env.AWS_BUCKET_NAME as string;

export async function uploadToS3(file: any, fileName: string) {
    if (!accessKeyId || !secretAccessKey || !bucketName) return;

    const client = new S3Client({
        region: 'eu-west-1',
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
        },
    });

    let fileType: string;
    switch (fileName.split('.').pop()) {
        case 'jpg':
        case 'jpeg':
            fileType = 'image/jpeg';
            break;
        case 'png':
            fileType = 'image/png';
            break;
        case 'gif':
            fileType = 'image/gif';
            break;
        case 'mp4':
            fileType = 'video/mp4';
            break;
        default:
            fileType = 'application/octet-stream';
            console.log('Unknown file type for file ' + fileName);
            break;
    }

    const upload = new Upload({
        client: client,
        params: {
            Bucket: bucketName,
            Key: fileName,
            Body: file,
            ContentType: fileType,
            StorageClass: 'INTELLIGENT_TIERING',
        },
        leavePartsOnError: false,
    });

    await upload.done();
}

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
