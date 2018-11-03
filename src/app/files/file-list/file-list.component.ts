import { Component, OnInit, ElementRef } from '@angular/core';

import { MatGridList } from '@angular/material';

import { FileModel } from '../shared/file.model'
import { FileService } from '../shared/file.service'

@Component({
	selector: 'app-file-list',
	templateUrl: './file-list.component.html',
	styleUrls: ['./file-list.component.css']
})
export class FileListComponent implements OnInit {
	
	fileCardWidth = 150

	cols: number

	updateCols() {
		let gridList = this._element.nativeElement.querySelector("mat-grid-list");
		if (!gridList) return; // TODO raise error
		this.cols = Math.floor(gridList.offsetWidth / (this.fileCardWidth + 40));
	}

	files: FileModel[];
 
	constructor(private fileService: FileService, private _element: ElementRef) { }
 
	ngOnInit() {
		this.getFiles();
		this.updateCols();
	}
 
	getFiles(): void {
		this.fileService.getFiles().subscribe(files => this.files = files);
	}
}
