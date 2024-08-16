import { Widget } from '@lumino/widgets';
import _ from "lodash";

export class EditSettingsWidget extends Widget {
    constructor(s3BucketId: string) {
        super({ node: EditSettingsWidget.createSettingsWidget(s3BucketId) });
    }

    private static createSettingsWidget(s3BucketId: string): HTMLElement {
        const body = document.createElement("div");
        const existingLabel = document.createElement("label");
        existingLabel.textContent = "S3 Bucket ID:";

        const input = document.createElement("input");
        input.classList.add('input')
        input.value = _.isEqual(s3BucketId, "") ? "" : s3BucketId;
        input.placeholder = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";

        body.appendChild(existingLabel);
        body.appendChild(input);
        return body;
    }

    get inputNode() {
        return this.node.getElementsByTagName("input")[0];
    }

    getValue() {
        return this.inputNode.value;
    }
}

export default EditSettingsWidget;