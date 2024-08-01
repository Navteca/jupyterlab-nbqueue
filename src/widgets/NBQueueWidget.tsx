import { ReactWidget } from "@jupyterlab/apputils";
import React from 'react';
import NBQueueComponent from "../components/NBQueueComponent";

export class NBQueueWidget extends ReactWidget {
  file
  constructor(file: any) {
    super()
    this.file = file
  }

  render(): JSX.Element {
    return (<NBQueueComponent file={this.file}/>)
  }
}