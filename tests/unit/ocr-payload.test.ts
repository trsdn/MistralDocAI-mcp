import { readFileSync } from 'fs';
import { join } from 'path';

describe('OCR payload handling', () => {
  it('does not request unused base64 images for document conversions', () => {
    const projectRoot = join(__dirname, '..', '..');
    const runtimeFiles = [
      join(projectRoot, 'docmistral.py'),
      join(projectRoot, 'python', 'docmistral.py'),
    ];

    for (const filePath of runtimeFiles) {
      const source = readFileSync(filePath, 'utf8');
      expect(source).toContain('include_image_base64=False');
      expect(source).not.toContain('include_image_base64=True');
    }
  });
});
