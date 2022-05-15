import * as Sentry from '@sentry/node';

import * as Tracing from '@sentry/tracing';


export function init() {
    Sentry.init({
        dsn: "https://9ab08f77140a43f88c450313ff315cfb@o1247746.ingest.sentry.io/6407743",

        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: 0.2,
    });
}