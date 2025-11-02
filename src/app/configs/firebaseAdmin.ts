// import admin from "firebase-admin";
// import path from "path";
// import fs from "fs";

// // If using CommonJS (tsc default module), __dirname exists
// const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");

// const serviceAccount = JSON.parse(
//   fs.readFileSync(serviceAccountPath, "utf8")
// ) as admin.ServiceAccount;

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// export const messaging = admin.messaging();
// export const db = admin.firestore();
// export default admin;




import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  });
}

export const messaging = admin.messaging();
export const db = admin.firestore();
export default admin;
