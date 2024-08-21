import json
import logging
import sys
import os
from logging import Logger

import boto3
import tornado
import tornado.web
from jupyter_server.base.handlers import APIHandler

from .common.variables import (
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

            user = os.environ["USER"]
            session = boto3.Session(profile_name=AWS_CREDENTIALS_PROFILE)
            s3_client = session.client(
                service_name="s3",
            )

            response = s3_client.list_objects_v2(Bucket=bucket, Prefix=user)
            if "Contents" in response:
                workflows_raw = response["Contents"]
            else:
                print("Folder is empty.")

            workflows = (
                list(
                    map(
                        lambda workflow: {
                            "name": workflow["Key"],
                            "status": "Succeeded",
                        },
                        (
                            filter(
                                lambda workflow: workflow["Key"].endswith("log"),
                                workflows_raw,
                            )
                        ),
                    )
                )
                if workflows_raw
                else []
            )

        except Exception as exc:
            logger.error(
                f"Generic exception from {sys._getframe(  ).f_code.co_name} with error: {exc}"
            )
        else:
            self.status_code = 200
            self.finish(json.dumps(workflows) if workflows else [])
