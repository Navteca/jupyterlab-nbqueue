import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { requestAPI } from './handler';

/**
 * Initialization data for the jupyterlab-nbqueue extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-nbqueue:plugin',
  description: 'A JupyterLab extension for queuing notebooks executions.',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab-nbqueue is activated!');

    requestAPI<any>('get-example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The jupyterlab_nbqueue server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default plugin;
