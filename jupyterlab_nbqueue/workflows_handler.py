import json
import logging
import sys
from logging import Logger

import boto3
import requests
import tornado
import tornado.web
from jupyter_server.base.handlers import APIHandler

from .common.variables import (
    ARGO_WORKFLOWS_NAMESPACE,
    GET_WORKFLOWS_LIST,
    ARGO_TOKEN,
    AWS_CREDENTIALS_PROFILE,
)
from .common.requests_utils import (
    get_request_attr_value,
)

logger: Logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


# Refresh API Key handler
class WorkflowsHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        logger.error("Getting all workflows from endpoint")
        try:
            bucket = get_request_attr_value(self, "bucket")
            logger.error(f"bucket => {type(bucket)} {bucket}")

            if not bucket:
                raise Exception("The request to the extension backend is not valid")

            headers = {
                "Content-Type": "application/json",
                "Authorization": ARGO_TOKEN,
            }

            logger.error(GET_WORKFLOWS_LIST.format(ARGO_WORKFLOWS_NAMESPACE))
            response = requests.get(
                GET_WORKFLOWS_LIST.format(ARGO_WORKFLOWS_NAMESPACE),
                headers=headers,
                verify=False,
            )

            session = boto3.Session(profile_name=AWS_CREDENTIALS_PROFILE)
            s3_client = session.client(
                service_name="s3",
            )

            aws_response = s3_client.list_objects_v2(Bucket=bucket, Prefix="luisleon/apiBakerTest03/workflows/")

            workflows: list[any]
            if "Contents" in aws_response:
                workflows_raw = aws_response["Contents"]
            else:
                print("Folder is empty.")

            workflows = (
                list(
                    map(
                        lambda workflow: {
                            "name": workflow["Key"],
                            "status": 'Succeeded',
                        },
                        workflows_raw,
                    )
                )
                if workflows_raw
                else []
            )

            # response_dict = response.json()
            # workflows_raw = response_dict["items"]
            # workflows = (
            #     list(
            #         map(
            #             lambda workflow: {
            #                 "name": workflow["metadata"]["name"],
            #                 "creationTimestamp": workflow["metadata"][
            #                     "creationTimestamp"
            #                 ],
            #                 "status": workflow["status"]["phase"],
            #                 "startedAt": workflow["status"]["startedAt"],
            #                 "finishedAt": workflow["status"]["finishedAt"],
            #             },
            #             workflows_raw,
            #         )
            #     )
            #     if workflows_raw
            #     else []
            # )

        except Exception as exc:
            logger.error(
                f"Generic exception from {sys._getframe(  ).f_code.co_name} with error: {exc}"
            )
        else:
            self.status_code = 200
            self.finish(json.dumps(workflows) if workflows else [])
