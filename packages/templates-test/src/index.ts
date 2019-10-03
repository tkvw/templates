import * as path from 'path';
import * as fse from 'fs-extra';
import { runner } from '@tkvw/templates';

export const testTemplates = async (
  templates: any,
  {
    cwd,
    paths = [],
    ...options
  }: {
    cwd: string;
    paths?: string[];
  },
) => {
  if (Array.isArray(templates)) {
    for (const test of templates) {
      if (Array.isArray(test)) {
        const [description, ...args] = test;
        it(description, async () => {
          const testDir = path.resolve(cwd, '../generated', paths.join('-'));
          await fse.ensureDir(testDir);
          const generatedDir = path.resolve(testDir, description);
          await fse.emptyDir(generatedDir);
          const processedInstructions = await runner([...paths, ...args], {
            destination: generatedDir,
            quiet: true,
          });
          const renderedTemplateInstructions = processedInstructions.filter(pi => pi.actions.find(a => a.template));
          for (const renderedTemplateInstruction of renderedTemplateInstructions) {
            if (typeof renderedTemplateInstruction.destination === 'string') {
              const renderedTemplate = await fse.readFile(renderedTemplateInstruction.destination, {
                encoding: 'utf8',
              });
              expect(renderedTemplate).toMatchSnapshot(description);
            }
          }
          expect(true).toBeTruthy();
        });
      }
    }
  } else if (typeof templates === 'object') {
    const keys = Object.keys(templates);
    for (const key of keys) {
      const value = templates[key];

      describe(key, () => {
        testTemplates(value, {
          ...options,
          cwd,
          paths: [...paths, key],
        });
      });
    }
  }
};
