import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { runIcon } from '@jupyterlab/ui-components';
import { NBQueueWidget } from "./widgets/NBQueueWidget";
import { Widget, Menu } from '@lumino/widgets';
import { IDisposable, DisposableDelegate } from '@lumino/disposable';
import { ICommandPalette, MainAreaWidget, Notification, ToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
  NotebookPanel,
  INotebookModel,
} from '@jupyterlab/notebook';
import { NBQueueSideBarWidget } from './widgets/NBQueueSideBarWidget';
import { NBQueueBucketWidget } from './widgets/NBQueueBucketWidget';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { loadSetting } from './utils';
import _ from 'lodash'

const PLUGIN_ID = 'jupyterlab-nbqueue:plugin'

const activate = async (app: JupyterFrontEnd, factory: IFileBrowserFactory, palette: ICommandPalette, mainMenu: IMainMenu, settings: ISettingRegistry) => {
  console.log('JupyterLab extension jupyterlab-nbqueue is activated!');

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

  const sideBarContent = new NBQueueSideBarWidget();
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

  const command = 'jupyterlab-nbqueue:bucket';
  app.commands.addCommand(command, {
    label: 'NBQueue: Set AWS S3 Bucket Name',
    caption: 'NBQueue: Set AWS S3 Bucket Name',
    execute: () => {
      const widget = new NBQueueBucketWidget();
      widget.title.label = "NBQueue S3 Bucket Name";
      Widget.attach(widget, document.body);
    }
  });

  const category = 'NBQueue';
  palette.addItem({
    command,
    category,
    args: { origin: 'from the palette' }
  });

  const menu = new Menu({ commands: app.commands });
  menu.title.label = "NBQueue";
  menu.addItem({
    command,
    args: { origin: 'from the main menu' }
  });

  mainMenu.addMenu(menu, true, { rank: 80 });

  app.docRegistry.addWidgetExtension('Notebook', new ButtonExtension());

  // const options = ['one', 'two', 'three'];
  // let option = options[0];
  // app.restored
  // // Get the state object
  // .then(() => state.fetch('jupyterlab-nbqueue:plugin'))
  // .then(value => {
  //   // Get the option attribute
  //   if (value) {
  //     option = (value as ReadonlyJSONObject)['option'] as string;
  //     console.log(`Option ${option} read from state.`);
  //   }

  //   // Ask the user to pick a option with `option` as default
  //   return InputDialog.getItem({
  //     title: 'Pick an option to persist by the State Example extension',
  //     items: options,
  //     current: Math.max(0, options.indexOf(option))
  //   });
  // })
  // .then(result => {
  //   // If the user click on the accept button of the dialog
  //   if (result.button.accept) {
  //     // Get the user option
  //     option = result.value || '';
  //     console.log(`Option "${option}" selected.`);
  //     // Save the option in the state database
  //     return state.save('jupyterlab-nbqueue:plugin', { option });
  //   }
  // })
  // .catch(reason => {
  //   console.error(
  //     `Something went wrong when reading the state for ${'jupyterlab-nbqueue:plugin'}.\n${reason}`
  //   );
  // });  
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
  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    const sendToQueue = async () => {
      let s3BucketId = ''
      // await Promise.all([settings.load(PLUGIN_ID)])
      //   .then(([setting]) => {
      //     s3BucketId = loadSetting(setting);
      //   }).catch((reason) => {
      //     console.error(
      //       `Something went wrong when getting the current atlas id.\n${reason}`
      //     );
      //   });
    
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
