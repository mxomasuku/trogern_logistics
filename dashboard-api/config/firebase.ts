import admin from 'firebase-admin';
import path from 'path';
import serviceAccount  from '../trogern-logistics-firebase-adminsdk.json';



admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),

})

const db = admin.firestore();
module.exports = {admin, db};