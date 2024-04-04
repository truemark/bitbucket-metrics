import fs from 'fs';
import path from 'path';

export function readJsonToObject(filename: string) {
  const jsonFilePath = path.resolve(__dirname, filename);
  try {
    const data = fs.readFileSync(jsonFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading file from disk: ${err}`);
  }
}
