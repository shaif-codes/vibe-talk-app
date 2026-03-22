export default ({ config }) => {
    return {
        ...config,
        ios: {
            ...config.ios,
            googleServicesFile: process.env.GOOGLE_SERVICES_IOS || "./GoogleService-Info.plist",
        },
        android: {
            ...config.android,
            googleServicesFile: process.env.GOOGLE_SERVICES_ANDROID || "./google-services.json",
        },
    };
};
