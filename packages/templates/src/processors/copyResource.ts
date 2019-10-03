import path from 'path';
import fs from 'fs';
import { ProcessInstructions, Processor } from './processor';

export const copyResource = (next: Processor) => async (options: ProcessInstructions) => {
  const nextOptions =
    (await next({
      ...options,
    })) || options;

  if (!nextOptions.skip) {
    const destination =
      nextOptions.destination || path.resolve(nextOptions.destinationFolder, nextOptions.templateFile);

    const destinationExists = fs.existsSync(destination);
    if (!destinationExists || !nextOptions.skipIfExists) {
      if (!destinationExists) {
        const { dir } = path.parse(destination);
        if (!fs.existsSync(dir)) {
          await fs.promises.mkdir(dir, {
            recursive: true,
          });
        }
      }
      const source = nextOptions.source || path.resolve(nextOptions.templateFolder, nextOptions.templateFile);

      await fs.promises.copyFile(source, destination);

      return {
        ...nextOptions,
        actions: [
          {
            type: 'copy',
          },
          ...nextOptions.actions,
        ],
      };
    }
  }

  return nextOptions;
};
