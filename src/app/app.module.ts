import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FileComponent } from './file/file.component';

// Angular Material imports
import {
  MatIconModule,
  MatButtonModule,
  MatSidenavModule,
  MatToolbarModule,
  MatGridListModule,
  MatCardModule
} from '@angular/material';
import { FilesComponent } from './files/files.component';


@NgModule({
  declarations: [
    AppComponent,
    FileComponent,
    FilesComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule

    // Angular Material imports
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatGridListModule,
    MatCardModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
