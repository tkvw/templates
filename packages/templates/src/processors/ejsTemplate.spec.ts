import tmp from 'tmp-promise';
import { ejsProcessor } from './ejsTemplate';
import fs from 'fs';

describe('ejsTemplateProcessor', () => {
  const fn = jest.fn();
  const processor = ejsProcessor()(fn);
  it('renders ejs templates', async () => {
    const template = await tmp.file({});
    await fs.promises.writeFile(template.path, '<%= name %>', {
      encoding: 'utf8',
    });
    const destination = await tmp.file({});
    const result = await processor({
      actions: [],
      cwd: process.cwd(),
      templateFile: 'src/ejs.index.js',
      templateFolder: '',
      source: template.path,
      destination: destination.path,
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
