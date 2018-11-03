import { FileModel, FileType } from './files/shared/file.model';
import { Album } from './albums/shared/album.model';

export const FILES: FileModel[] = [
  { id: 1, name: 'Test Folder', type: FileType.FOLDER },
  { id: 2, name: 'Another Folder', type: FileType.FOLDER },
  { id: 3, name: 'Test Image', type: FileType.IMAGE },
  { id: 4, name: 'Another Image', type: FileType.IMAGE },
  { id: 5, name: 'Test Video', type: FileType.VIDEO },
];

export const ALBUMS: Album[] = [
  { id: 1, name: "2012", file_count: 0},
  { id: 2, name: "2013", file_count: 3},
  { id: 3, name: "2014", file_count: 1}
];
