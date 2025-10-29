import { Client } from '@microsoft/microsoft-graph-client';
import { storage } from './storage';
import type { CloudStorageConfig } from '@shared/schema';

// Helper function to get access token from refresh token
async function getAccessTokenFromRefreshToken(config: CloudStorageConfig): Promise<string> {
  const { clientId, clientSecret, refreshToken, tenantId } = config.credentials as {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    tenantId?: string;
  };

  const tenant = tenantId || 'common';
  const tokenEndpoint = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: 'https://graph.microsoft.com/.default offline_access',
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh OneDrive token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Get OneDrive client for a specific user
export async function getOneDriveClient(userId: string): Promise<Client> {
  const config = await storage.getCloudStorageConfig(userId, 'onedrive');
  
  if (!config) {
    throw new Error('OneDrive not configured for this user');
  }

  const accessToken = await getAccessTokenFromRefreshToken(config);

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

// Upload file to OneDrive
export async function uploadFileToOneDrive(
  userId: string,
  fileName: string,
  fileBuffer: Buffer,
  folderPath?: string
): Promise<{ fileId: string; webUrl: string }> {
  try {
    const client = await getOneDriveClient(userId);

    // Construct upload path
    const uploadPath = folderPath 
      ? `/me/drive/root:/${folderPath}/${fileName}:/content`
      : `/me/drive/root:/${fileName}:/content`;

    const response = await client
      .api(uploadPath)
      .put(fileBuffer);

    return {
      fileId: response.id,
      webUrl: response.webUrl,
    };
  } catch (error) {
    console.error('Error uploading to OneDrive:', error);
    throw error;
  }
}

// Get or create folder in OneDrive
export async function getOrCreateOneDriveFolder(
  userId: string,
  folderName: string,
  parentPath?: string
): Promise<string> {
  try {
    const client = await getOneDriveClient(userId);

    // Construct folder path
    const folderPath = parentPath 
      ? `${parentPath}/${folderName}`
      : folderName;

    // Try to get the folder first
    try {
      const folder = await client
        .api(`/me/drive/root:/${folderPath}`)
        .get();
      return folder.id;
    } catch (error: any) {
      // If folder doesn't exist (404), create it
      if (error.statusCode === 404) {
        const parentFolderPath = parentPath 
          ? `/me/drive/root:/${parentPath}:/children`
          : '/me/drive/root/children';

        const newFolder = await client
          .api(parentFolderPath)
          .post({
            name: folderName,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'rename',
          });

        return newFolder.id;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating/getting OneDrive folder:', error);
    throw error;
  }
}

// Download file from OneDrive
export async function downloadFileFromOneDrive(
  userId: string,
  fileId: string
): Promise<Buffer> {
  try {
    const client = await getOneDriveClient(userId);

    const response = await client
      .api(`/me/drive/items/${fileId}/content`)
      .getStream();

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error downloading from OneDrive:', error);
    throw error;
  }
}
