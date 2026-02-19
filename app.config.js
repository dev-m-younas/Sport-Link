// Expo loads .env automatically - GOOGLE_MAPS_API_KEY is used for Android maps
const base = require("./app.json");

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    android: {
      ...base.expo.android,
      config: {
        ...base.expo.android?.config,
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || "",
        },
      },
    },
  },
};
