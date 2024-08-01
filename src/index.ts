import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { buildIcon } from '@jupyterlab/ui-components';
import { NBQueueWidget } from "./widgets/NBQueueWidget";
import { Widget } from '@lumino/widgets';

const activate = (app: JupyterFrontEnd, factory: IFileBrowserFactory) => {
  console.log('JupyterLab extension jupyterlab-nbqueue is activated!');

  app.commands.addCommand('jupyterlab-nbqueue:open', {
    label: 'NBQueue: Send to queue',
    caption: "Example context menu button for file browser's items.",
    icon: buildIcon,
    execute: () => {
      const file = factory.tracker.currentWidget
        ?.selectedItems()
        .next().value;

      console.log(file)
      if (file) {
        const widget = new NBQueueWidget(file);
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
}

/**
 * Initialization data for the jupyterlab-nbqueue extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-nbqueue:plugin',
  description: 'A JupyterLab extension for queuing notebooks executions.',
  autoStart: true,
  requires: [IFileBrowserFactory],
  activate
};

export default plugin;
