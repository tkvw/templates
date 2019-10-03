import { testTemplates } from '@tkvw/templates-test';

describe('',()=>{
  testTemplates(
    {
      js: {
        gatsby: {
          plugin: [['with name only', '--name', 'dennie']],
        },
        monorepo: [['with name only', '--name', 'dennie']],
        test: {
          jest: {
            unit: [['simple test', '--files', 'simple.ts,another.ts']],
          },
        },
      },
    },
    {
      cwd: __dirname,
    },
  );
});
