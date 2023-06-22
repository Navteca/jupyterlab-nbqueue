interface IError {
  code: number;
  message: string;
}

export interface IResponse {
  status_code: number;
  data: string;
  error?: IError;
}

export interface IRun {
  id: number;
  pid: number;
  name: string;
  status: string;
  message?: string;
}

export interface IRunsProps extends Array<IRun> {}

export interface IObjectToRunArgs {
  bucket: string;
  prefix: string;
  source: string;
  downloadPath: string;
}

export interface IDeleteRun {
  id?: number;
  pid?: number;
  deleteAll?: boolean;
}
