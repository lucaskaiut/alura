// Shared storage for image files pending upload.
// Maps "nodeId:propName" -> File, used by SettingsPanel (write) and PageFormPage (read on save).

const imageFiles: Map<string, File> = new Map();

export function recordImageFile(nodeId: string, propName: string, file: File) {
  imageFiles.set(`${nodeId}:${propName}`, file);
}

export function getImageFiles(): Map<string, File> {
  return imageFiles;
}

export function clearImageFiles() {
  imageFiles.clear();
}

export function getFileForNodeProp(nodeId: string, propName: string): File | undefined {
  return imageFiles.get(`${nodeId}:${propName}`);
}
