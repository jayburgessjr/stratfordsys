declare module 'robinhood';
declare module 'etrade-ts';
declare module '@datadog/browser-rum';
declare module 'dd-trace';
declare module 'newrelic';

interface Window {
    NREUM: any;
}

namespace NodeJS {
    interface ProcessEnv {
        NEXT_PUBLIC_ROBINHOOD_USERNAME?: string;
        NEXT_PUBLIC_ROBINHOOD_PASSWORD?: string;
        ROBINHOOD_USERNAME?: string;
        ROBINHOOD_PASSWORD?: string;
    }
}
