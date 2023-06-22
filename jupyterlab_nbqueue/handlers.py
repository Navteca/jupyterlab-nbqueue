import json
import tornado
import shlex
import sqlalchemy
import subprocess
import importlib.resources as pkg_resources

from shutil import which
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join

from .db_handler import DBHandler, Runs

class RouteHandler(APIHandler):
    db = DBHandler()


    def getRuns(self):
        runs_list = []
        with self.db.get_session() as session:
            for run in session.query(Runs).all():
                runs_list.append(run.serialize())
        return runs_list
        

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
            notebook = request_data.get('notebook', None)                
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


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    handlers = [
        (url_path_join(base_url, "jupyterlab-nbqueue", "run"), RouteHandler)
    ]
    web_app.add_handlers(host_pattern, handlers)