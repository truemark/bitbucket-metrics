import path from 'path';
import fs from 'fs';

export class MetricsUtilities {
  public static createRepositorySlug(repositoryName: string): string {
    // Convert to lowercase
    const slug = repositoryName.toLowerCase();

    // Replace spaces with hyphens
    return slug.replace(/\s+/g, '-');
  }

  public static readJsonToObject(filename: string) {
    const jsonFilePath = path.resolve(__dirname, filename);
    try {
      const data = fs.readFileSync(jsonFilePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error(`Error reading file from disk: ${err}`);
    }
  }
}
