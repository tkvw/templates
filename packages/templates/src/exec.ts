import * as execa from 'execa';

export interface CmdOptions {
  cwd: string;
}
export type Exec = (cmd: string, options?: Partial<CmdOptions>) => Promise<any>;

export const defaultExec: Exec = (cmd, options) => execa.command(cmd, options);
