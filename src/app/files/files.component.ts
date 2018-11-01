import { Component, OnInit } from '@angular/core';
import { FILES } from '../mock-data'

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.css']
})
export class FilesComponent implements OnInit {
  
  files = FILES;

  constructor() { }

  ngOnInit() {
  }

}
