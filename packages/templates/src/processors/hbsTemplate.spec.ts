import tmp from 'tmp-promise';
import { hbsProcessor } from './hbsTemplate';
import fs from 'fs';

describe('hbsTemplateProcessor', () => {
  const fn = jest.fn();
  const processor = hbsProcessor()(fn);
  it('renders hbs templates', async () => {
    const template = await tmp.file({});
    await fs.promises.writeFile(template.path, '{{name}}', {
      encoding: 'utf8',
    });
    const destination = await tmp.file({});
    const result = await processor({
      actions: [],
      cwd: process.cwd(),
      templateFile: 'src/hbs.index.js',
      source: template.path,
      destination: destination.path,
      templateFolder: '',
      destinationFolder: '',
      params: {
        name: 'tkvw',
      },
    });

    expect(result.destinationFile).toEqual('src/index.js');
    const renderedContent = await fs.promises.readFile(result.source as string, {
      encoding: 'utf8',
    });
    expect(renderedContent).toEqual('tkvw');
  });
});
