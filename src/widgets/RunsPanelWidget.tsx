import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { RunsPanelComponent } from '../components/RunsPanelComponent';
import RunProvider from '../components/RunsContext';

export class RunsPanelWidget extends ReactWidget {
  constructor() {
    super();
  }

  render(): JSX.Element {
    return (
      <div
        style={{
          minWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--jp-layout-color1)'
        }}
      >
        <RunProvider>
          <RunsPanelComponent />
        </RunProvider>
      </div>
    );
  }
}
