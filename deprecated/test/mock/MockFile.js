export class MockFile extends Blob {
	constructor(data, filename, options) {
		super(data, options);
		this.name = filename;
		this.lastModified = options.lastModified || Date.now();
	}
}
