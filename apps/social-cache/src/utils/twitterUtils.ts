import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fetch from "node-fetch-native";
import { tweetData, TwitterResponse } from "../types/twitter.js";

const accessKeyId = process.env.AWS_KEY_ID as string;
const secretAccessKey = process.env.AWS_SECRET_KEY as string;
const bucketName = process.env.AWS_BUCKET_NAME as string;
const expiry = (60 * 60 * 24 * 7); // 7d

/**
 * fetches a tweet from the twitter api using its id
 * @param id the id of the tweet
 * @param token the twitter api token
 * @returns the tweet from the twitter api
 */
export async function fetchTweetFromId(id: string, token: string) {
    const url = `https://api.twitter.com/2/tweets?ids=${id}&expansions=author_id,attachments.media_keys&tweet.fields=id,created_at,public_metrics&media.fields=media_key,duration_ms,height,preview_image_url,type,url,width,public_metrics,alt_text,variants`;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch tweet with id ${id}`);
    }

    const rawData: TwitterResponse = await res.json();

    const { includes } = rawData;
    const data = rawData.data[0];
    if (!data.attachments || !includes) {
        return null; //tweet does not contain any media
    }

    const tweet: tweetData = {
        id: data.id,
        text: data.text,
        author: {
            name: includes.users[0].name,
            username: includes.users[0].username,
            id: includes.users[0].id,
        },
        media: [],
    };

    for (const media of includes.media) {
        if (media.type === 'video') { // handle videos
            const onlyWithBitrate = media.variants.filter((variant) => variant.bit_rate!);
            const highestRes = onlyWithBitrate.sort((a, b) => b.bit_rate! - a.bit_rate!)[0];
            const fileExtension = `${highestRes.url.split('.').pop()!.split('?').shift()}`;
            tweet.media.push({
                media_key: media.media_key,
                url: highestRes.url,
                type: media.type,
                awsKey: `${media.media_key}.${fileExtension}`,
                width: media.width,
                height: media.height,
            });
            continue;
        }
        // handle photos
        tweet.media.push({
            media_key: media.media_key,
            url: media.url,
            type: media.type,
            awsKey: `${media.media_key}.${media.url.split('.')[media.url.split('.').length - 1]}`,
            width: media.width,
            height: media.height,
        });
    }

    return tweet;
}

/**
 * upload a file to aws s3
 * @param file the file to upload
 * @param key the aws s3 key of the file
 * @returns 
 */
export async function uploadToS3(file: any, key: string) {
    if (!accessKeyId || !secretAccessKey || !bucketName) return;

    const client = new S3Client({
        region: 'eu-west-1',
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
        },
    });

    let fileType: string;
    switch (key.split('.').pop()) {
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
            console.log('Unknown file type for file ' + key);
            break;
    }

    const upload = new Upload({
        client: client,
        params: {
            Bucket: bucketName,
            Key: key,
            Body: file,
            ContentType: fileType,
            StorageClass: 'INTELLIGENT_TIERING',
        },
        leavePartsOnError: false,
    });

    await upload.done();
}

/**
 * generates a pre signed url to get a file from S3
 * @param key the s3 key of the file
 */
export async function getPreSignedUrl(key: string): Promise<string> {
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

    return await getSignedUrl(client, getCommand, {expiresIn: expiry});
}
