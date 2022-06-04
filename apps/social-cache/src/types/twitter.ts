export type TwitterResponse = {
    data: [ {
        attachments?: {
            media_keys: string[]
        },
        id: string,
        author_id: string,
        created_at: string,
        public_metrics: {
            retweet_count: number,
            reply_count: number,
            like_count: number
            quote_count: number
        },
        text: string
    } ],
    includes?: {
        media: [
                {
                    height: number,
                    width: number,
                    preview_image_url: string,
                    media_key: string,
                    type: 'animated_gif',
                    variants: [
                        {
                            bit_rate: number,
                            url: string
                            content_type: string
                        }
                    ]
                } |
                {
                    height: number,
                    width: number,
                    url: string,
                    media_key: string
                    type: 'photo'
                } |
                {
                    height: number,
                    width: number,
                    media_key: string,
                    type: 'video'
                    variants: [
                        {
                            bit_rate?: number,
                            content_type: string,
                            url: string
                        }
                    ],
                    public_metrics: {
                        view_count: number
                    },
                    preview_image_url: string
                }
        ],
        users: [
            {
                id: string,
                username: string,
                name: string,
            }
        ]
    }
}

export type tweetData = {
    id: string,
    text: string,
    author: {
        id: string,
        username: string,
        name: string
    },
    media: {
        media_key: string,
        url: string,
        type: string,
        awsKey: string,
        width: number,
        height: number,
    }[]
}