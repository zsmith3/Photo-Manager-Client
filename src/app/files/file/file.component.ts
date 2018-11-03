import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { FileModel } from '../shared/file.model'

@Component({
  selector: 'app-file',
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.css']
})
export class FileComponent implements OnInit {

  @Input() file: FileModel
  @Input() scale: number

  @ViewChild('checkbox') checkbox; 

  constructor() { }

  ngOnInit() {
  }

  select () {
    this.checkbox.checked = true;
  }

}
