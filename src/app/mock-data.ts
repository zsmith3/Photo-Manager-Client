import { FileModel } from './files/shared/file.model';
import { Album } from './albums/shared/album.model';

export const FILES: FileModel[] = [
  { id: 11, name: 'Mr. Nice' },
  { id: 12, name: 'Narco' },
  { id: 13, name: 'Bombasto' },
  { id: 14, name: 'Celeritas' },
  { id: 15, name: 'Magneta' },
  { id: 16, name: 'RubberMan' },
  { id: 17, name: 'Dynama' },
  { id: 18, name: 'Dr IQ' },
  { id: 19, name: 'Magma' },
  { id: 20, name: 'Tornado' }
];

export const ALBUMS: Album[] = [
  { id: 1, name: "2012", file_count: 0},
  { id: 2, name: "2013", file_count: 3},
  { id: 3, name: "2014", file_count: 1}
];
