export enum FileType {
	FOLDER = 'folder',
	IMAGE = 'image',
	VIDEO = 'video',
	FILE = 'file'
}

export class FileModel {
	id: number;
	name: string;
	type: FileType;
}
