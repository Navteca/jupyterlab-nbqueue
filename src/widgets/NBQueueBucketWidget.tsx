import { ReactWidget } from "@jupyterlab/apputils";
import React from 'react';
import NBQueueBucketComponent from "../components/NBQueueBucketComponent";

export class NBQueueBucketWidget extends ReactWidget {
  constructor() {
    super()
  }

  render(): JSX.Element {
    return (<NBQueueBucketComponent />)
  }
}