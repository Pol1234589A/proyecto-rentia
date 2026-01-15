
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // I'll check if this exists or if I can use application default

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function findAndDisableProperty() {
    const snapshot = await db.collection('properties').get();
    snapshot.forEach(async (doc) => {
        const data = doc.data();
        if (data.address && data.address.toLowerCase().includes('pintor velázquez')) {
            console.log(`Found property: ${doc.id} - ${data.address}`);
            await db.collection('properties').doc(doc.id).update({ isPublished: false });
            console.log(`Updated isPublished to false for ${doc.id}`);
        }
    });
}

findAndDisableProperty().catch(console.error);
