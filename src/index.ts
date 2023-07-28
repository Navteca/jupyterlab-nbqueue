import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { showDialog, Dialog, MainAreaWidget } from '@jupyterlab/apputils';
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
    function urlB64ToUint8Array(base64String: any) {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }

    function updateSubscriptionOnServer(subscription: any) {
      return requestAPI<any>('subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          subscription_json: JSON.stringify(subscription)
        })
      })
        .then(data => {
          return data;
        })
        .catch(reason => {
          console.error(`${reason}`);
        });
    }

    function subscribeUser(
      swRegistration: any,
      applicationServerPublicKey: any
    ) {
      const applicationServerKey = urlB64ToUint8Array(
        applicationServerPublicKey
      );
      swRegistration.pushManager
        .subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        })
        .then((subscription: any) => {
          console.log('User is subscribed.');
          return updateSubscriptionOnServer(subscription);
        })
        .then((response: any) => {
          if (response.status !== 'success') {
            throw new Error('Bad status code from server.');
          }
          return response;
        })
        .then((responseData: any) => {
          if (responseData.status !== 'success') {
            throw new Error('Bad response from server.');
          }
        })
        .catch((err: any) => {
          console.log('Failed to subscribe the user: ', err);
          console.log(err.stack);
        });
    }

    function registerServiceWorker(
      serviceWorkerUrl: any,
      applicationServerPublicKey: any
    ) {
      let swRegistration = null;
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('Service Worker and Push is supported');

        navigator.serviceWorker
          .register(serviceWorkerUrl)
          .then(swReg => {
            console.log('Service Worker is registered');
            subscribeUser(swReg, applicationServerPublicKey);

            swRegistration = swReg;
          })
          .catch(error => {
            console.error('Service Worker Error', error);
          });
      } else {
        console.warn('Push messaging is not supported');
      }
      return swRegistration;
    }

    function askPermission() {
      if (!('serviceWorker' in navigator)) {
        // Service Worker isn't supported on this browser, disable or hide UI.
        alert(
          "Service Worker isn't supported on this browser, disable or hide UI."
        );
        return;
      }

      if (!('PushManager' in window)) {
        // Push isn't supported on this browser, disable or hide UI.
        alert("Push isn't supported on this browser, disable or hide UI.");
        return;
      }

      return new Promise((resolve, reject) => {
        const permissionResult = Notification.requestPermission(result => {
          resolve(result);
        });

        if (permissionResult) {
          permissionResult.then(resolve, reject);
        }
      }).then((permissionResult: any) => {
        if (permissionResult !== 'granted') {
          throw new Error("We weren't granted permission.");
        }
        if (permissionResult === 'granted') {
          registerServiceWorker(
            'http://localhost:8888/files/serviceworker.js',
            'BNWsr52JpS-tIoJgJvH_DH7O7DKYDVHLEm1-jJAgQxg92ZMoUjqiElZboqkO8eapp4ZTIv6ZnIiVR_XUU6_CFLk'
          );
        }
      });
    }

    askPermission();

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
          .then(data => data)
          .catch(reason => {
            console.error(
              `The jupyterlab-nbqueue server extension appears to be missing.\n${reason}`
            );
          });

        const event = new Event('nbqueueRun');
        window.dispatchEvent(event);
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
