export const AUTH_CONFIG = {
  google: {
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
    clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
  },
  github: {
    clientId: process.env.REACT_APP_GITHUB_CLIENT_ID,
    clientSecret: process.env.REACT_APP_GITHUB_CLIENT_SECRET,
  },
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  }
}; 