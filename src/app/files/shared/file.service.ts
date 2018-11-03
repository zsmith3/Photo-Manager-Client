import { Injectable } from '@angular/core';
 
import { Observable, of } from 'rxjs';
 
import { FileModel } from './file.model';
import { FILES } from '../../mock-data';
 
@Injectable({
  providedIn: 'root',
})
export class FileService {
 
  constructor() { }
 
  getFiles(): Observable<FileModel[]> {
    return of(FILES);
  }
}
