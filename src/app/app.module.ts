import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// App component imports
import { FileComponent } from './files/file/file.component';
import { FileListComponent } from './files/file-list/file-list.component';
import { AlbumListComponent } from './albums/album-list/album-list.component';

// Angular Material imports
import {
  MatIconModule,
  MatButtonModule,
  MatSidenavModule,
  MatListModule,
  MatToolbarModule,
  MatGridListModule,
  MatCardModule
} from '@angular/material';


@NgModule({
  declarations: [
    AppComponent,
    FileComponent,
    FileListComponent,
    AlbumListComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,

    // Angular Material imports
    MatIconModule,
    MatButtonModule,
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
