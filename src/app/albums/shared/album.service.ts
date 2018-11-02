import { Injectable } from '@angular/core';
 
import { Observable, of } from 'rxjs';
 
import { Album } from './album.model';
import { ALBUMS } from '../../mock-data';
 
@Injectable({
  providedIn: 'root',
})
export class AlbumService {
 
  constructor() { }
 
  getAlbums(): Observable<Album[]> {
    return of(ALBUMS);
  }
}
