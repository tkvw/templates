import path from 'path';
import enquirer from 'enquirer';
import pm from 'minimist';
import fg from 'fast-glob';
import fse from 'fs-extra';

import { createDefaultConfig, Config, CommandConfig } from './config';
import fs from 'fs';
import { compose } from './utils';
import { Processor } from './processors';
import assert from 'assert';

const PLUGIN_FILENAME = 'tkvw.template.js';

export const runCommand = async (templateFolder: string, { exec, processors, ...config }: Config) => {
  const excludePluginFile = (file: string) => file !== PLUGIN_FILENAME;

  const allFiles = (await fg('**/*', {
    cwd: templateFolder,
    dot: true,
  })).filter(excludePluginFile);

  const templatePluginFile = path.resolve(templateFolder, PLUGIN_FILENAME);
  const hasTemplatePluginFile = fs.existsSync(templatePluginFile);

  if (hasTemplatePluginFile) {
    const templatePlugin = await import(path.resolve(templateFolder, PLUGIN_FILENAME));
    if (templatePlugin.prompt && !config.quiet) {
      const answers = await templatePlugin.prompt(enquirer.prompt, config);
      config.params = {
        ...config.params,
        ...answers,
      };
    }
    if (templatePlugin.run) {
      config.run = templatePlugin.run;
    }
  }

  const processor = compose<Processor>(...processors)(options => Promise.resolve(options));

  const { run, destination, ...restConfig } = config;
  const processedInstructions = [];
  for (const file of allFiles) {
    const processInstructions = await run(processor, {
      ...restConfig,
      actions: [],
      destinationFolder: destination,
      templateFolder: templateFolder,
      templateFile: file,
    });
    processedInstructions.push(processInstructions);
  }

  if (hasTemplatePluginFile) {
    const templatePlugin = await import(path.resolve(templateFolder, PLUGIN_FILENAME));
    if (templatePlugin.exec) {
      let allowExec = config.params.exec;

      if (allowExec === undefined && !config.quiet) {
        allowExec = (await enquirer.prompt<{ allowExec: boolean }>({
          type: 'confirm',
          name: 'allowExec',
          message:
            'This template contains a shell command, only continue if you trust the source of the template,continue?',
        })).allowExec;
      }

      if (allowExec && 'false' !== allowExec) {
        await templatePlugin.exec(exec, enquirer.prompt, restConfig);
      }
    }
  }
  return processedInstructions;
};

const selectTemplateFolderUsingPrompt = async (...templateFolders: string[]): Promise<string> => {
  const isPluginFolder = await fse.pathExists(path.resolve(templateFolders[0], PLUGIN_FILENAME));
  if (isPluginFolder) {
    return templateFolders[0];
  }
  const choices: string[] = [];
  const templateFolderPair: Record<string, string> = {};
  for (const templateFolder of templateFolders) {
    const templates = (await fs.promises.readdir(templateFolder, {
      withFileTypes: true,
    }))
      .filter(d => d.isDirectory())
      .map(d => d.name);
    templates.forEach(template => {
      choices.push(template);
      templateFolderPair[template] = path.resolve(templateFolder, template);
    });
  }

  const answers = await enquirer.prompt<{ folder: string }>({
    type: 'autocomplete',
    name: 'folder',
    choices,
    message: 'Please select a template to continue',
  });
  return selectTemplateFolderUsingPrompt(templateFolderPair[answers.folder]);
};

const findTemplateFolderFromCommands = async (config: { commands: string[]; templateFolderOptions: string[] }) => {
  let commands = config.commands;
  let templateFolder;

  for (let i = config.commands.length - 1; i >= 0; i--) {
    const templateCommands = config.commands.slice(0, i + 1);
    const restCommands = config.commands.slice(i + 1);
    for (const templateFolderOption of config.templateFolderOptions) {
      const testTemplateFolder = path.resolve(templateFolderOption, ...templateCommands);
      const pathExists = await fse.pathExists(testTemplateFolder);
      if (pathExists) {
        templateFolder = testTemplateFolder;
        commands = restCommands;
        break;
      }
    }
    if (templateFolder !== undefined) {
      break;
    }
  }
  templateFolder = await selectTemplateFolderUsingPrompt(
    ...(templateFolder ? [templateFolder] : config.templateFolderOptions),
  );

  return {
    templateFolder,
    commands,
  };
};

export default async (commandArgs: any[], configOverrides?: Partial<CommandConfig>) => {
  const config = await createDefaultConfig(pm(commandArgs), configOverrides);
  assert(config.templateFolderOptions.length > 0, 'No template folders found, please create a template folder first');
  const { templateFolder, commands } = await findTemplateFolderFromCommands(config);
  config.commands = commands;
  return runCommand(templateFolder, config);
};
