import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import logging
from logging import Logger
import tornado
import subprocess
import shlex
import importlib.resources as pkg_resources
from shutil import which

logger: Logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class NBQueueHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def post(self):
        try:
            json_body = self.get_json_body()
            if json_body is None:
                raise Exception("Request body is missing.")
            if json_body["file"] is None:
                raise Exception("Notebook's metadata is missing.")
            if json_body["file"]["name"] is None:
                raise Exception("Notebook's name is missing.")
            if json_body["file"]["path"] is None:
                raise Exception("Notebook's path is missing.")

            with pkg_resources.path("jupyterlab_nbqueue", "timer.py") as p:
                cmd_split = shlex.split(f"{which('python')} {p} {"5"}")
                process = subprocess.Popen(
                    cmd_split, stdout=subprocess.PIPE, stderr=subprocess.PIPE
                )
        except Exception as exc:
            logger.error(exc)
        else:
            self.finish(
                json.dumps(
                    {
                        "data": {
                            "name": json_body["file"]["name"],
                            "path": json_body["file"]["path"],
                        },
                    }
                )
            )
        finally:
            if process:
                out, error = process.communicate()

                if out:
                  logger.error(out)

                if error:
                  logger.error(error)
