
const admin = require('firebase-admin');
try {
    admin.initializeApp({
        projectId: 'crm-rentiaroom'
    });
    const db = admin.firestore();
    db.collection('task_boards').get().then(snap => {
        console.log('BOARDS FOUND:', snap.size);
        snap.forEach(doc => console.log(doc.id, doc.data().title));
        process.exit(0);
    }).catch(err => {
        console.error('ERROR FETCHING:', err.message);
        process.exit(1);
    });
} catch (e) {
    console.error('INIT ERROR:', e.message);
    process.exit(1);
}
