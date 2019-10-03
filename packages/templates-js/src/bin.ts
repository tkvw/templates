#!/usr/bin/env node
import { runner } from '@tkvw/templates';
import path from 'path';

export default runner(process.argv.slice(2), {
  templateFolderOptions: [path.resolve(__dirname, '../_templates')],
});
