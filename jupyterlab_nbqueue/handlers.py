import base64
import ecdsa 
import json
import tornado
import shlex
import sqlalchemy
import subprocess
import importlib.resources as pkg_resources

from dotenv import load_dotenv
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from shutil import which

from .db_handler import DBHandler, Runs, Subscriptions

load_dotenv()

class CustomError(Exception):
    pass

class RouteHandler(APIHandler):
    db = DBHandler()


    def getRuns(self):
        runs_list = []
        with self.db.get_session() as session:
            for run in session.query(Runs).all():
                runs_list.append(run.serialize())
        return runs_list
        

    def generate_vapid_keys(self):
        pri = ecdsa.SigningKey.generate(curve=ecdsa.NIST256p)
        pub = pri.get_verifying_key()
        keys = {
        "private" : base64.urlsafe_b64encode(pri.to_string()).decode("utf-8").strip("="),
        "public" : base64.urlsafe_b64encode(b"\x04" + pub.to_string()).decode("utf-8").strip("=")
        }
        self.log.info(keys)

    @tornado.web.authenticated  # type: ignore
    def get(self):
        try:
            runs = self.getRuns()
            self.finish(json.dumps(runs))
        except Exception as e:
            self.log.info(f"There has been an exception reading the jupyterlab-nbqueue db => {e}")


    @tornado.web.authenticated
    def post(self):
        try:
            request_data = self.get_json_body()
            notebook = request_data.get('notebook')
            if notebook:
                with pkg_resources.path('jupyterlab_nbqueue', 'cmd_launcher.py') as p:
                    cmd_split = shlex.split(f"{which('python')} {p} {notebook}")
                    subprocess.Popen(cmd_split, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                self.log.error("The required data has not been received. Please send notebook.")
                message = "The required data has not been received. Please send notebook."
        except subprocess.CalledProcessError as exc:
            self.log.error(f"Program failed {exc.returncode} - {exc}")
            message = f"Program failed {exc.returncode} - {exc}"
        except subprocess.TimeoutExpired as exc:
            self.log.error(f"Program timed out {exc}")
            message = f"Program timed out {exc}"
        except Exception as exc:
            self.log.error(f"Exception {exc}")
            message = f"Exception {exc}"
        else:
            message = "Your notebook have been sent to the queue."
            self.finish(json.dumps({
                "data": message
            }))

    @tornado.web.authenticated  # type: ignore
    def delete(self):
        try:
            request_data = self.get_json_body()
            if request_data:
                delete_all = request_data['deleteAll']
                if delete_all:
                    with self.db.get_session() as session:
                        session.query(Runs).delete()
                        session.commit()
                        message = "All Deleted."
                else:
                    id_to_del = request_data['id']
                    pid_to_del = request_data['pid']
                    with self.db.get_session() as session:
                        download_to_delete = session.query(Runs).filter(Runs.id == id_to_del, Runs.pid == pid_to_del).first()
                        if download_to_delete:
                            session.delete(download_to_delete)
                            session.commit()
                            message = "Delete."
                        else:
                            message = "Not Deleted"
            else:
                message = "There has been an error with the data sent to the backend. Please check with your administrator"
        except sqlalchemy.exc.IntegrityError as e:   # type: ignore
            self.log.error(f'Integrity Check failed => {e}')
            self.finish(json.dumps([]))  
        except Exception as e:
            self.log.error(f"There has been an error deleting downloaded => {e}")
        else:
            self.finish(json.dumps(message))

class PushSubscriptionsHandler(APIHandler):
    db = DBHandler()

    @tornado.web.authenticated
    def post(self):
        try:
            request_data = self.get_json_body()
            subscription_json = request_data.get('subscription_json', None)
            if subscription_json:
                with self.db.get_session() as session:
                    new_subscription = Subscriptions(pid='S001', info=subscription_json)
                    subscription = session.query(Subscriptions).filter(Subscriptions.pid == 'S001').first()
                    if subscription:
                        session.delete(subscription)
                        session.commit()
                    session.add(new_subscription)
                    session.commit()
                    message = { "status": "success" }
            else:
                raise CustomError('Missing subscription info.')            
        except sqlalchemy.exc.IntegrityError as e:   # type: ignore
            self.log.error(f'Integrity Check failed => {e}')
        except Exception as e:
            self.log.error(f"There has been an error deleting downloaded => {e}")
        else:
            self.finish(json.dumps(message))

def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    handlers = [
        (url_path_join(base_url, "jupyterlab-nbqueue", "run"), RouteHandler),
        (url_path_join(base_url, "jupyterlab-nbqueue", "subscriptions"), PushSubscriptionsHandler)
    ]
    web_app.add_handlers(host_pattern, handlers)