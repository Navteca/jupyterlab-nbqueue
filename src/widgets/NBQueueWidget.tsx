import { ReactWidget } from "@jupyterlab/apputils";
import React from 'react';
import NBQueueComponent from "../components/NBQueueComponent";

export class NBQueueWidget extends ReactWidget {
  file
  bucket
  constructor(file: any, bucket: string) {
    super()
    this.file = file
    this.bucket = bucket
  }

  render(): JSX.Element {
    return (
      <div
        style={{
          width: '400px',
          minWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--jp-layout-color1)'
        }}
      >
        <NBQueueComponent file={this.file} bucket={this.bucket} />
      </div>
    )
  }
}