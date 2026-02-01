const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH);
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials);
    } catch (err) {
        return null;
    }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to proceed with contains API calls.
 *
 */
async function authorize() {
    let client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }

    if (!require('fs').existsSync(CREDENTIALS_PATH)) {
        console.error('ERROR: No se encontró el archivo credentials.json');
        console.log('Instrucciones para obtenerlo:');
        console.log('1. Ve a https://console.cloud.google.com/apis/credentials');
        console.log('2. Haz clic en "Crear credenciales" -> "ID de cliente de OAuth"');
        console.log('3. Selecciona "Aplicación de escritorio"');
        console.log('4. Descarga el JSON y cámbiale el nombre a credentials.json en esta carpeta.');
        process.exit(1);
    }

    client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
        await saveCredentials(client);
    }
    return client;
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles(auth) {
    const drive = google.drive({ version: 'v3', auth });
    let query = undefined;
    if (process.argv[2]) {
        if (process.argv[2].length > 20 && !process.argv[2].includes(' ')) {
            // Likely a folder ID
            query = `'${process.argv[2]}' in parents`;
        } else {
            query = `name contains '${process.argv[2]}'`;
        }
    }
    const res = await drive.files.list({
        q: query,
        pageSize: 50,
        fields: 'nextPageToken, files(id, name, mimeType, webViewLink)',
    });
    const files = res.data.files;
    if (files.length === 0) {
        console.log('No se encontraron archivos.');
        return;
    }

    console.log('Archivos encontrados en tu Drive:');
    files.forEach((file) => {
        console.log(`NAME: ${file.name} | ID: ${file.id} | TYPE: ${file.mimeType}`);
    });
}

authorize().then(listFiles).catch(console.error);
