import { ReactWidget } from "@jupyterlab/apputils";
import React from 'react';
import NBQueueSideBarComponent from "../components/NBQueueSideBarComponent";

export class NBQueueSideBarWidget extends ReactWidget {
  constructor() {
    super()
  }

  render(): JSX.Element {
    return (<NBQueueSideBarComponent />)
  }
}