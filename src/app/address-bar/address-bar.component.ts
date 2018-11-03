import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-address-bar',
  templateUrl: './address-bar.component.html',
  styleUrls: ['./address-bar.component.css']
})
export class AddressBarComponent implements OnInit {

  address = ["Test folder", "2012", "Panoramas"]

  constructor() { }

  ngOnInit() {
  }

}
