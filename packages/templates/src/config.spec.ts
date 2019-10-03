import { createDefaultConfig } from './config';

describe('config.ts', () => {
  it('traverse parent directories to find template folders', async () => {
    const config = await createDefaultConfig({ _: [] });
    expect(config.templateFolderOptions).toHaveLength(0);
  });
});
