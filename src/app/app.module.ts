import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Angular Material imports
import {
  MatIconModule,
  MatButtonModule,
  MatInputModule,
  MatSidenavModule,
  MatListModule,
  MatToolbarModule,
  MatGridListModule,
  MatCardModule
} from '@angular/material';

// App component imports
import { FileComponent } from './files/file/file.component';
import { FileListComponent } from './files/file-list/file-list.component';
import { AlbumListComponent } from './albums/album-list/album-list.component';
import { AddressBarComponent } from './address-bar/address-bar.component';


@NgModule({
  declarations: [
    AppComponent,
    FileComponent,
    FileListComponent,
    AlbumListComponent,
    AddressBarComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,

    // Angular Material imports
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatGridListModule,
    MatCardModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
