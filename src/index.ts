import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { runIcon } from '@jupyterlab/ui-components';
import { NBQueueWidget } from "./widgets/NBQueueWidget";
import { Widget } from '@lumino/widgets';
import { IDisposable, DisposableDelegate } from '@lumino/disposable';
import { ICommandPalette, MainAreaWidget, Notification, ToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
  NotebookPanel,
  INotebookModel,
} from '@jupyterlab/notebook';
import { NBQueueSideBarWidget } from './widgets/NBQueueSideBarWidget';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { loadSetting } from './utils';
import _ from 'lodash'

const PLUGIN_ID = 'jupyterlab-nbqueue:plugin'

const activate = async (app: JupyterFrontEnd, factory: IFileBrowserFactory, palette: ICommandPalette, mainMenu: IMainMenu, settings: ISettingRegistry) => {
  console.log('JupyterLab extension jupyterlab-nbqueue is activated!');
  const user = app.serviceManager.user;
  user.ready.then(() => {
     console.debug("Identity:", user.identity);
     console.debug("Permissions:", user.permissions);
  });  
  
  let s3BucketId = ''
  await Promise.all([settings.load(PLUGIN_ID)])
    .then(([setting]) => {
      s3BucketId = loadSetting(setting);
    }).catch((reason) => {
      console.error(
        `Something went wrong when getting the current atlas id.\n${reason}`
      );
    });

  if (_.isEqual(s3BucketId, "")) {
    Notification.warning('S3 Bucket is not configured')
    return;
  }

  const sideBarContent = new NBQueueSideBarWidget(s3BucketId);
  const sideBarWidget = new MainAreaWidget<NBQueueSideBarWidget>({
    content: sideBarContent
  });
  sideBarWidget.toolbar.hide();
  sideBarWidget.title.icon = runIcon;
  sideBarWidget.title.caption = 'NBQueue job list';
  app.shell.add(sideBarWidget, 'right', { rank: 501 });

  app.commands.addCommand('jupyterlab-nbqueue:open', {
    label: 'NBQueue: Send to queue',
    caption: "Example context menu button for file browser's items.",
    icon: runIcon,
    execute: async () => {
      await Promise.all([settings.load(PLUGIN_ID)])
        .then(([setting]) => {
          s3BucketId = loadSetting(setting);
        }).catch((reason) => {
          console.error(
            `Something went wrong when getting the current atlas id.\n${reason}`
          );
        });

      if (_.isEqual(s3BucketId, "")) {
        Notification.warning('S3 Bucket is not configured')
        return;
      }

      const file = factory.tracker.currentWidget
        ?.selectedItems()
        .next().value;

      if (file) {
        const widget = new NBQueueWidget(file, s3BucketId);
        widget.title.label = "NBQueue metadata";
        Widget.attach(widget, document.body);
      }
    }
  });

  app.contextMenu.addItem({
    command: 'jupyterlab-nbqueue:open',
    selector: ".jp-DirListing-item[data-file-type=\"notebook\"]",
    rank: 0
  });

  app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension(settings));
}

/**
 * Initialization data for the jupyterlab-nbqueue extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-nbqueue:plugin',
  description: 'A JupyterLab extension for queuing notebooks executions.',
  autoStart: true,
  requires: [IFileBrowserFactory, ICommandPalette, IMainMenu, ISettingRegistry],
  activate
};

export class ButtonExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {

  settings: ISettingRegistry
  constructor(settings: ISettingRegistry) {
    this.settings = settings;
  }

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    const sendToQueue = async () => {
      let s3BucketId = ''
      await Promise.all([this.settings.load(PLUGIN_ID)])
        .then(([setting]) => {
          s3BucketId = loadSetting(setting);
          console.log(s3BucketId);
        }).catch((reason) => {
          console.error(
            `Something went wrong when getting the current atlas id.\n${reason}`
          );
        });

      if (_.isEqual(s3BucketId, "")) {
        Notification.warning('S3 Bucket is not configured')
        return;
      }

      const widget = new NBQueueWidget(context.contentsModel, s3BucketId);
      widget.title.label = "NBQueue metadata";
      Widget.attach(widget, document.body);
    };
    const button = new ToolbarButton({
      className: 'nbqueue-submit',
      label: 'NBQueue: Send to queue',
      onClick: sendToQueue,
      tooltip: 'Send notebook to execution queue',
    });

    panel.toolbar.insertItem(10, 'clearOutputs', button);
    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}

export default plugin;
