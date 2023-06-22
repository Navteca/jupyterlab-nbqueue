import React, { useEffect, useState } from 'react';
import { RunContextType } from './runs';
import { requestAPI } from '../handler';
import { IRunsProps, IRun, IDeleteRun } from './CustomProps';

type RunProviderProps = {
  children: React.ReactNode;
};

export const RunContext = React.createContext<RunContextType | null>(null);

const RunProvider: React.FC<RunProviderProps> = ({ children }) => {
  const [runs, setRun] = useState<IRunsProps>([]);

  useEffect(() => {
    getRunsList();
  }, []);

  const runObject = async ({
    id,
    pid,
    name,
    status,
    message
  }: IRun): Promise<void> => {
    try {
      await requestAPI<any>('run', {
        method: 'POST',
        body: JSON.stringify({ id, pid, name, status, message })
      });
      getRunsList();
    } catch (e) {
      console.log(
        `There has been an error trying to run an object => ${JSON.stringify(
          e,
          null,
          2
        )}`
      );
    }
  };

  const deleteRunFromList = async ({
    id,
    pid,
    deleteAll = false
  }: IDeleteRun): Promise<void> => {
    try {
      await requestAPI<any>('run', {
        method: 'DELETE',
        body: JSON.stringify({ deleteAll, id, pid })
      });
      getRunsList();
    } catch (e) {
      console.log(
        `There has been an error trying to delete an object from the list of runs => ${e}`
      );
    }
  };

  const getRunsList = async (): Promise<void> => {
    const response = await requestAPI<any>('run');
    setRun(response.reverse());
  };

  return (
    <RunContext.Provider
      value={{
        runs,
        getRunsList,
        runObject,
        deleteRunFromList
      }}
    >
      {children}
    </RunContext.Provider>
  );
};

export default RunProvider;
