import path from 'path';
import fs from 'fs';
import os from 'os';
import fse from 'fs-extra';
import { defaultExec } from './exec';
import { copyResource, ejsProcessor, ProcessInstructions, Processor } from './processors';

export interface Args {
  _: string[];
  destination?: string;
  [key: string]: any;
}
export interface Config {
  commands: string[];
  cwd: string;
  destination: string;
  exec: (
    command: string,
    options: {
      cwd: string;
    },
  ) => Promise<void>;
  params: any;
  run: (processor: Processor, options: ProcessInstructions) => Promise<ProcessInstructions>;
  processors: Array<(next: Processor) => Processor>;
  quiet: boolean;
}
export interface CommandConfig extends Config {
  excludeNodeModuleTemplates: boolean;
  excludeUserTemplates: boolean;
  userTemplatePath: string;
  templateFolderOptions: string[];
}
export const resolveTemplateFoldersFromNodeModules = async (folder: string) => {
  const nodeModuleFolders = (await fs.promises.readdir(folder, {
    withFileTypes: true,
  })).filter(dirEnt => dirEnt.isDirectory());
  let templateFolders: string[] = [];
  for (const nodeModuleFolder of nodeModuleFolders) {
    if (nodeModuleFolder.name.startsWith('@')) {
      templateFolders = [
        ...templateFolders,
        ...(await resolveTemplateFoldersFromNodeModules(path.resolve(folder, nodeModuleFolder.name))),
      ];
    } else {
      const nodeModuleFolderHasTemplates = await fse.pathExists(
        path.resolve(folder, nodeModuleFolder.name, '_templates'),
      );
      if (nodeModuleFolderHasTemplates) {
        templateFolders.push(path.resolve(folder, nodeModuleFolder.name, '_templates'));
      }
    }
  }
  return templateFolders;
};

export const resolveTemplatesFolders = async (folder: string, excludeNodeModules: boolean): Promise<string[]> => {
  const templateFolder = path.resolve(folder, '_templates');
  const nodeModules = path.resolve(folder, 'node_modules');
  const parentFolder = path.resolve(folder, '..');

  const hasNodeModulesFolder = await fse.pathExists(nodeModules);
  const isTemplateFolder = await fse.pathExists(templateFolder);
  const isRootFolder = parentFolder === folder;

  let allTemplateFolders = isRootFolder ? [] : await resolveTemplatesFolders(parentFolder, excludeNodeModules);
  if (hasNodeModulesFolder) {
    const nodeModuleTemplateFolders = await resolveTemplateFoldersFromNodeModules(nodeModules);
    if (nodeModuleTemplateFolders.length > 0) {
      allTemplateFolders = [...allTemplateFolders, ...nodeModuleTemplateFolders];
    }
  }

  return isTemplateFolder ? [templateFolder, ...allTemplateFolders] : allTemplateFolders;
};

export const createDefaultConfig = async (
  args: Args,
  {
    cwd = process.cwd(),
    userTemplatePath = path.resolve(os.homedir(), '_templates'),
    excludeUserTemplates = false,
    excludeNodeModuleTemplates = false,
    params = {},
    ...config
  }: Partial<CommandConfig> = {},
) => {
  let templateFolderOptions = await resolveTemplatesFolders(cwd, excludeNodeModuleTemplates);
  if (!excludeUserTemplates) {
    if (fs.existsSync(userTemplatePath) && fs.statSync(userTemplatePath).isDirectory()) {
      templateFolderOptions = [userTemplatePath, ...templateFolderOptions];
    }
  }
  const { _: commands, ...restArgs } = args;

  return {
    commands,
    cwd,
    destination: args.destination || process.cwd(),
    exec: defaultExec,
    quiet: args.queit === undefined ? false : args.queit,
    run: (processor: Processor, options: ProcessInstructions) => processor(options),
    processors: [copyResource, ejsProcessor()],
    templateFolderOptions,
    ...config,
    params: {
      ...params,
      ...restArgs,
    },
  };
};
