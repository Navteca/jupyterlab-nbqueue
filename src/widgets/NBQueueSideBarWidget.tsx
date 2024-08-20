import { ReactWidget } from "@jupyterlab/apputils";
import React from 'react';
import NBQueueSideBarComponent from "../components/NBQueueSideBarComponent";

export class NBQueueSideBarWidget extends ReactWidget {
  bucket
  constructor(bucket: string) {
    super()
    this.bucket = bucket
  }

  render(): JSX.Element {
    return (<NBQueueSideBarComponent bucket={this.bucket}/>)
  }
}