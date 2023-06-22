import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { showDialog, Dialog, MainAreaWidget } from '@jupyterlab/apputils';
// import { runIcon } from '@jupyterlab/ui-components';
import { nbqueueIcon } from './style/IconsStyle';

import { requestAPI } from './handler';

import { RunsPanelWidget } from './widgets/RunsPanelWidget';
/**
 * Initialization data for the jupyterlab-nbqueue extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-nbqueue:plugin',
  description: 'A JupyterLab extension for queuing notebooks executions.',
  autoStart: true,
  requires: [IFileBrowserFactory],
  activate: (app: JupyterFrontEnd, factory: IFileBrowserFactory) => {
    const runsContent = new RunsPanelWidget();
    runsContent.addClass('jp-PropertyInspector-placeholderContent');
    const runsWidget = new MainAreaWidget<RunsPanelWidget>({
      content: runsContent
    });
    runsWidget.toolbar.hide();
    runsWidget.title.icon = nbqueueIcon;
    runsWidget.title.caption = 'NBQueue history';
    app.shell.add(runsWidget, 'right', { rank: 501 });

    app.commands.addCommand('jupyterlab-nbqueue:open', {
      label: 'Run',
      caption: "Example context menu button for file browser's items.",
      icon: nbqueueIcon,
      execute: () => {
        console.log('jupyterlab-nbqueue:open');
        const file = factory.tracker.currentWidget?.selectedItems().next();

        console.log(JSON.parse(JSON.stringify(file)));
        const obj = JSON.parse(JSON.stringify(file));

        if (obj) {
          showDialog({
            title: obj.name,
            body: `Notebook ${obj.name} running in background.`,
            buttons: [Dialog.okButton()]
          }).catch(e => console.log(e));
        }

        requestAPI<any>('run', {
          method: 'POST',
          body: JSON.stringify({ notebook: obj.path })
        })
          .then(data => {
            console.log(data);
          })
          .catch(reason => {
            console.error(
              `The jupyterlab-nbqueue server extension appears to be missing.\n${reason}`
            );
          });
      }
    });

    app.contextMenu.addItem({
      command: 'jupyterlab-nbqueue:open',
      selector: '.jp-DirListing-item[data-isdir="false"]',
      rank: 0
    });
  }
};
export default plugin;
