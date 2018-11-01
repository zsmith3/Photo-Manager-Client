import { Component, OnInit, Input } from '@angular/core';
import { FileModel } from '../filemodel'

@Component({
  selector: 'app-file',
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.css']
})
export class FileComponent implements OnInit {

  @Input() file: FileModel

  constructor() { }

  ngOnInit() {
  }

}
