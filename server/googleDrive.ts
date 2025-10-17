import { google } from 'googleapis';
import { PassThrough } from 'stream';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGoogleDriveClient() {
  const accessToken = await getAccessToken();
  
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  
  return google.drive({ version: 'v3', auth });
}

export async function uploadFileToDrive(
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer,
  folderId?: string
): Promise<{ fileId: string; webViewLink: string }> {
  try {
    const drive = await getUncachableGoogleDriveClient();
    
    const fileMetadata: any = {
      name: fileName,
    };
    
    if (folderId) {
      fileMetadata.parents = [folderId];
    }
    
    // Convert Buffer to PassThrough Stream for Google Drive API
    const stream = new PassThrough();
    stream.end(fileBuffer);
    
    const media = {
      mimeType,
      body: stream,
    };
    
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink',
    });
    
    return {
      fileId: response.data.id!,
      webViewLink: response.data.webViewLink!,
    };
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
}

export async function getOrCreateFolder(folderName: string): Promise<string> {
  try {
    const drive = await getUncachableGoogleDriveClient();
    
    // Search for existing folder
    const response = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    
    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }
    
    // Create folder if it doesn't exist
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    
    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
    });
    
    return folder.data.id!;
  } catch (error) {
    console.error('Error creating/getting folder:', error);
    throw error;
  }
}

export async function getOrCreateSubfolder(parentFolderId: string, subfolderName: string): Promise<string> {
  try {
    const drive = await getUncachableGoogleDriveClient();
    
    // Search for existing subfolder within parent
    const response = await drive.files.list({
      q: `name='${subfolderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    
    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }
    
    // Create subfolder if it doesn't exist
    const folderMetadata = {
      name: subfolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    };
    
    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
    });
    
    return folder.data.id!;
  } catch (error) {
    console.error('Error creating/getting subfolder:', error);
    throw error;
  }
}

export async function downloadFileFromDrive(fileId: string): Promise<Buffer> {
  try {
    const drive = await getUncachableGoogleDriveClient();
    
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    
    return Buffer.from(response.data as ArrayBuffer);
  } catch (error) {
    console.error('Error downloading from Google Drive:', error);
    throw error;
  }
}
