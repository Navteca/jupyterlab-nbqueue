import subprocess
import shlex
import logging

from pathlib import Path
from argparse import ArgumentParser
from db_handler import Runs, DBHandler

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

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
        cmd_split = shlex.split(f'jupyter nbconvert --to notebook --execute ./{notebook}')
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

                # if error.strip() != '':
                #     session.query(Runs).filter_by(pid=process.pid).update({'status': 'Error', 'message': 'ERROR'})

                # if out.strip() != '':
                #     session.query(Runs).filter_by(pid=process.pid).update({'status': 'Finished'})
                session.query(Runs).filter_by(pid=process.pid).update({'status': 'Finished'})

                session.commit()
            else:
                print("It has not been possible to execute the command. It must be related to the OS")

