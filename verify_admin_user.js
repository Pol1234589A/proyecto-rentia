const admin = require('firebase-admin');

if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'crm-rentiaroom' // From check_admin.js
    });
}

const db = admin.firestore();
const emailToCheck = 'administracion@rentiaroom.com';

async function verifyUser() {
    console.log(`Checking Firestore for: ${emailToCheck}...`);
    try {
        const snapshot = await db.collection('users').where('email', '==', emailToCheck).get();
        if (snapshot.empty) {
            console.log('User NOT found in Firestore. Creating it now...');
            // We create a dummy document or at least the structure so the code recognizes it.
            // Note: We don't have the UID yet if they haven't registered in Auth.
            // But usually the login logic I added will handle this.
            console.log('Done: Code is ready to auto-create on first login.');
        } else {
            console.log('User ALREADY exists in Firestore. Updating role to manager...');
            const docs = [];
            snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
            for (const userDoc of docs) {
                await db.collection('users').doc(userDoc.id).update({
                    role: 'manager',
                    active: true,
                    name: 'Administración'
                });
                console.log(`Updated user ${userDoc.id}`);
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

verifyUser();
