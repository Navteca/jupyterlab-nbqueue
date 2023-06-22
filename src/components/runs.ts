import { IRunsProps, IRun, IDeleteRun } from './CustomProps';

export type RunContextType = {
  runs: IRunsProps;
  getRunsList: () => Promise<void>;
  runObject: (obj: IRun) => Promise<void>;
  deleteRunFromList: (obj: IDeleteRun) => Promise<void>;
};
