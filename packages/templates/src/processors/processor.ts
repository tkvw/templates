export interface ProcessInstructions {
  actions: any[];
  cwd: string;
  destination?: string;
  destinationFile?: string;
  destinationFolder: string;
  encoding?: BufferEncoding;
  source?: string;
  templateFile: string;
  templateFolder: string;
  skip?: boolean;
  skipIfExists?: boolean;
  params: {};
}
export type Processor = (instructions: ProcessInstructions) => Promise<ProcessInstructions>;
