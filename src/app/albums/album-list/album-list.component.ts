import { Component, OnInit } from '@angular/core';

import { Album } from '../shared/album.model';
import { AlbumService } from '../shared/album.service';

@Component({
  selector: 'app-album-list',
  templateUrl: './album-list.component.html',
  styleUrls: ['./album-list.component.css']
})
export class AlbumListComponent implements OnInit {

  albums: Album[];
 
	constructor(private albumService: AlbumService) { }
 
	ngOnInit() {
		this.getAlbums();
	}
 
	getAlbums(): void {
		this.albumService.getAlbums().subscribe(albums => this.albums = albums);
	}
}
