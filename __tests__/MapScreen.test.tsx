import fs from 'fs';

describe('MapScreen', () => {
  test('imports the storage helper used by advance booking checks', () => {
    const source = fs.readFileSync(require.resolve('../src/screens/MapScreen.tsx'), 'utf8');

    expect(source).toContain("import { localGet } from '../services/storage';");
  });
});
