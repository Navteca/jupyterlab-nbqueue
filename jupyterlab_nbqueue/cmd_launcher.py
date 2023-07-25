import json
import logging
import os
import subprocess
import shlex

from argparse import ArgumentParser
from db_handler import Runs, Subscriptions, DBHandler
from pywebpush import webpush

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")
VAPID_CLAIM_EMAIL = os.getenv("VAPID_CLAIM_EMAIL")

class Error(Exception):
    pass

if __name__ == '__main__':
    parser = ArgumentParser()
    db = DBHandler()
    parser.add_argument("notebook", type=str)
    args = parser.parse_args()
    process = None
    success = None
    message = ''
    try:        
        notebook = args.notebook
        splitstrpath = notebook.split('/')
        splitfile = splitstrpath[len(splitstrpath) - 1].split('.')
        name = splitfile[0]
        cmd_split = shlex.split(f'jupyter nbconvert --to notebook --execute ./{notebook}  --output {name}_output.ipynb')
        process = subprocess.Popen(cmd_split, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        success = True
    except subprocess.CalledProcessError as exc:
        print(f"Program failed {exc.returncode} - {exc}")
        message = f"Program failed {exc.returncode} - {exc}"
    except subprocess.TimeoutExpired as exc:
        print(f"Program timed out {exc}")
        message = f"Program timed out {exc}"
    except Exception as exc:
        print(f"Exception {exc}")
        message = f"Exception {exc}"
    else:
        success = True
    finally:
        with db.get_session() as session:
            if process:
                newProcess = Runs(pid=process.pid, name=notebook, status='', message='')
                newProcess.status = 'Running' if success else 'Error'
                newProcess.message = '' if success else message
                session.add(newProcess)
                session.commit()
                              
                out, error = process.communicate()
                if error.strip() != '':
                    # session.query(Runs).filter_by(pid=process.pid).update({'status': 'Error', 'message': error.strip()})
                    session.query(Runs).filter_by(pid=process.pid).update({'status': 'Finished'})

                if out.strip() != '':
                    session.query(Runs).filter_by(pid=process.pid).update({'status': 'Finished'})
                # session.query(Runs).filter_by(pid=process.pid).update({'status': 'Finished'})

                session.commit()
            else:
                logger.info("It has not been possible to execute the command. It must be related to the OS")
                print("It has not been possible to execute the command. It must be related to the OS")

        with db.get_session() as session:
            title = 'jupyterlab-nbqueue'
            body = f'Notebook {notebook} execution finished.'
            subscription = session.query(Subscriptions).filter(Subscriptions.pid == 'S001').first()                
            if subscription:
                response = webpush(
                    subscription_info=json.loads(subscription.__dict__['info']),
                    data=json.dumps({"title": title, "body": body}),
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={
                        "sub": "mailto:{}".format(VAPID_CLAIM_EMAIL)
                    }
                )