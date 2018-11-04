import { Component, OnInit, ElementRef, ViewChildren, QueryList } from '@angular/core';

import { FileModel } from '../shared/file.model'
import { FileService } from '../shared/file.service'
import { FileComponent } from '../file/file.component'

@Component({
	selector: 'app-file-list',
	templateUrl: './file-list.component.html',
	styleUrls: ['./file-list.component.css']
})
export class FileListComponent implements OnInit {

	@ViewChildren("fileBox") fileBoxes: QueryList<FileComponent>

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

	selectAll (value: boolean) {
		this.fileBoxes.forEach((fileBox) => fileBox.select(false));
	}
}
