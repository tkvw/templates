const fs = require('fs');
const path = require('path');

module.exports = {
  prompt: async (prompt, options) => {
    const choices = (await fs.promises.readdir(options.cwd, {
      withFileTypes: true,
    })).filter(de => de.isFile() && de.name.match(/^.+(?<!(\.spec|\.test)).tsx?$/));

    return await prompt({
      type: 'autocomplete',
      choices,
      name: 'files',
      message: 'Please select files to create a unit test for',
      multiple: true,
    });
  },
  run: async (processor, options) => {
    options.skipIfExists = file => {
      return false;
    };
    switch (options.templateFile) {
      case 'test.ejs': {
        let files = options.params.files;
        if (typeof files === 'string') {
          files = files.split(',');
        }
        let processedInstruction;
        if (Array.isArray(files) && files.length > 0) {
          for (const file of files) {
            const extension = options.params.extension || '.spec';

            const { name, ext } = path.parse(file);
            options = await processor({
              ...options,
              params: {
                ...options.params,
                name: name,
              },
              source: path.resolve(options.templateFolder, options.templateFile),
              destination: path.resolve(options.destinationFolder, `${name}${extension}${ext}`),
            });
          }
        }
        return options;
      }
      default: {
        return processor(options);
      }
    }
  },
};
