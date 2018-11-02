import { Component, OnInit } from '@angular/core';

import { FileModel } from '../shared/file.model'
import { FileService } from '../shared/file.service'

@Component({
	selector: 'app-file-list',
	templateUrl: './file-list.component.html',
	styleUrls: ['./file-list.component.css']
})
export class FileListComponent implements OnInit {
	
	files: FileModel[];
 
	constructor(private fileService: FileService) { }
 
	ngOnInit() {
		this.getFiles();
	}
 
	getFiles(): void {
		this.fileService.getFiles().subscribe(files => this.files = files);
	}
}
