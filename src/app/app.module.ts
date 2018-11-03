import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { RouterModule, Routes } from '@angular/router';

// Angular Material imports
import {
	MatIconModule,
	MatButtonModule,
	MatInputModule,
	MatCheckboxModule,
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
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';


const appRoutes: Routes = [
	{ path: 'folder/:path', component: FileListComponent },
	{ path: 'album/:path', component: FileListComponent },
	{
		path: 'folders',
		component: FileListComponent,
		data: { title: 'Root Folders' }
	},
	{ path: '',
		redirectTo: '/folders',
		pathMatch: 'full'
	},
	{ path: '**', component: PageNotFoundComponent }
];


@NgModule({
	declarations: [
		AppComponent,
		FileComponent,
		FileListComponent,
		AlbumListComponent,
		AddressBarComponent,
		PageNotFoundComponent
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		RouterModule.forRoot(
			appRoutes,
			{ enableTracing: true } // for debugging only
		),

		// Angular Material imports
		MatIconModule,
		MatButtonModule,
		MatInputModule,
		MatCheckboxModule,
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
