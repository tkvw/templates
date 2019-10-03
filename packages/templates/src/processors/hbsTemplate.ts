import path from 'path';
import fs from 'fs';
import * as hbs from 'handlebars';
import { ProcessInstructions, Processor } from './processor';
import tmp from 'tmp-promise';

export const hbsProcessor = () => (next: Processor) => {
  const prefix = 'hbs.';
  const suffix = '.hbs';
  return async (options: ProcessInstructions) => {
    const { dir, ext, name } = path.parse(options.templateFile);

    const hasPrefix = name.startsWith(prefix);
    const hasSuffix = ext === suffix;

    if (hasPrefix || hasSuffix) {
      const { encoding = 'utf8' } = options;

      const destinationFile = hasPrefix
        ? path.join(dir, `${name.substring(prefix.length)}${ext}`)
        : path.join(dir, name);

      // Write to a tmp file and set the destination
      const tmpDestination = await tmp.file({});

      const source = options.source || path.resolve(options.templateFolder, options.templateFile);
      const sourceData = await fs.promises.readFile(source, {
        encoding,
      });
      const renderedData = hbs.compile(sourceData)(options.params);
      await fs.promises.writeFile(tmpDestination.path, renderedData, {
        encoding,
      });

      return {
        destination: path.resolve(options.destinationFolder, destinationFile),
        destinationFile,
        ...options,
        actions: [
          {
            type: 'hbs',
            template: true,
          },
          ...options.actions,
        ],
        source: tmpDestination.path,
      };
    } else {
      return next(options);
    }
  };
};
