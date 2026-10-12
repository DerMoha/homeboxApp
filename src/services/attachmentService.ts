import {
  keepLocalCopy,
  pick,
  types,
  isErrorWithCode,
  errorCodes,
} from '@react-native-documents/picker';
import {viewDocument} from '@react-native-documents/viewer';
import * as FS from 'react-native-fs';
import ServerService from './serverService';
import {HOMEBOX_ENDPOINTS} from './server/homeboxAdapter';
import {ItemAttachment} from '../types';

export interface LocalAttachment {
  id: string;
  uri: string;
  name: string;
  mimeType: string;
  type: 'photo' | 'receipt' | 'manual' | 'attachment';
  primary?: boolean;
  missing?: boolean;
}
export const newAttachmentId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export async function pickDocuments(
  type: 'receipt' | 'manual' | 'attachment',
): Promise<LocalAttachment[]> {
  try {
    const selected = await pick({
      type: [types.pdf, types.images, types.plainText],
      allowMultiSelection: true,
    });
    const result: LocalAttachment[] = [];
    for (const file of selected) {
      const id = newAttachmentId();
      const name = (file.name || 'document.pdf').replace(
        /[^a-zA-Z0-9._ -]/g,
        '_',
      );
      const [copy] = await keepLocalCopy({
        destination: 'cachesDirectory',
        files: [{uri: file.uri, fileName: `${id}-${name}`}],
      });
      if (copy.status !== 'success') {
        throw new Error(
          'A selected file could not be copied. Please select it again.',
        );
      }
      result.push({
        id,
        uri: copy.localUri,
        name,
        mimeType: file.type || 'application/octet-stream',
        type,
      });
    }
    return result;
  } catch (error) {
    if (
      isErrorWithCode(error) &&
      error.code === errorCodes.OPERATION_CANCELED
    ) {
      return [];
    }
    throw error;
  }
}
export async function openAttachment(
  itemId: string,
  attachment: ItemAttachment,
) {
  const service = ServerService.getInstance();
  const server = service.getBrowsingConfig();
  if (!server) {
    throw new Error('Select a server to view attachments.');
  }
  const directory = `${FS.CachesDirectoryPath}/attachments-${encodeURIComponent(server.id)}`;
  await FS.mkdir(directory);
  const extension =
    attachment.title
      ?.split('.')
      .pop()
      ?.replace(/[^a-zA-Z0-9]/g, '') ||
    (attachment.mimeType === 'application/pdf' ? 'pdf' : 'file');
  const path = `${directory}/${encodeURIComponent(itemId)}-${encodeURIComponent(attachment.id)}.${extension}`;
  if (!(await FS.exists(path))) {
    const download = await FS.downloadFile({
      fromUrl:
        service.getBaseUrl() +
        HOMEBOX_ENDPOINTS.entityAttachment(itemId, attachment.id),
      toFile: path,
      headers: service.getAuthHeaders(),
    }).promise;
    if (download.statusCode !== 200) {
      if (await FS.exists(path)) {
        await FS.unlink(path);
      }
      throw new Error('Attachment unavailable. Reconnect to download it.');
    }
  }
  await viewDocument({
    uri: `file://${path}`,
    mimeType: attachment.mimeType,
    headerTitle: attachment.title,
  });
}
