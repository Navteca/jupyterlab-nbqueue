import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join

from jupyterlab_nbqueue.nbqueue_handler import NBQueueHandler

import tornado

class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({
            "data": "This is /jupyterlab-nbqueue/get-example endpoint!"
        }))


def setup_handlers(web_app):
    host_pattern = ".*$"
    app_name = "jupyterlab-nbqueue"
    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, app_name, "get-example")
    nbqueue_handler = url_path_join(base_url, app_name, "nbqueue/submit")
    handlers = [
        (route_pattern, RouteHandler),
        (nbqueue_handler, NBQueueHandler),
    ]    
    web_app.add_handlers(host_pattern, handlers)
