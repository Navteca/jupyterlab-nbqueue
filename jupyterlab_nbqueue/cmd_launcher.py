import subprocess
import logging
import boto3
import functools
from urllib import parse
from shutil import which
from pathlib import Path
from botocore import exceptions
from argparse import ArgumentParser

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


# from .common.variables import AWS_CREDENTIALS_PROFILE
@functools.lru_cache()
def _get_signed_s3_client():
    session = boto3.Session(profile_name="navteca")
    s3 = session.client(
        service_name="s3",
    )
    return s3


@functools.lru_cache()
def _get_unsigned_s3_client():
    session = boto3.Session(profile_name="navteca")
    s3 = session.client(
        service_name="s3",
    )
    return s3


class Error(Exception):
    pass


class NotEnoughSpaceOnDevice(Error):
    def __init__(self):
        super().__init__()

    def __str__(self):
        return f"There is not enough space left on the device."


class LargeFileWarning(Error):
    def __init__(self):
        super().__init__()

    def __str__(self):
        return f"The file you are trying to download is large and this might affect JupyterLab functioning."


class ApplicationNotFound(Error):
    def __init__(self):
        super().__init__()

    def __str__(self):
        return f"The specified application has not been found."


def get_size(bucket: str, path: str, client):
    my_bucket = client.Bucket(bucket)
    total_size = 0

    for obj in my_bucket.objects.filter(Prefix=path):
        total_size = total_size + obj.size

    return total_size


if __name__ == "__main__":
    logger.error(f"cmd_launcher...")
    parser = ArgumentParser()
    parser.add_argument("bucket", type=str)
    parser.add_argument("client_type", type=str)
    parser.add_argument("file_path", type=str)
    parser.add_argument("file_name", type=str)
    parser.add_argument("cpu", type=str)
    parser.add_argument("ram", type=str)
    parser.add_argument("conda", type=str)
    parser.add_argument("container", type=str)
    args = parser.parse_args()
    process = None
    bucket = None
    key = None
    success = None
    total_object_size = 0
    message = ""
    dest = Path(".")

    s3_client = (
        _get_unsigned_s3_client()
        if args.client_type.lower().strip() == "unsigned"
        else _get_signed_s3_client()
    )
    try:
        if which("aws") is None:
            raise ApplicationNotFound()

        bucket = Path(args.bucket).parts[0]
        key = args.bucket.replace(bucket + "/", "")
        filename = args.file_name
        filepath = args.file_path
        cpu = args.cpu
        ram = args.ram
        conda = args.conda
        container = args.container

        logger.error(f"LOCAL_FILE={filepath}")
        tags = {"CPU": cpu, "RAM": ram, "CONDA": conda, "CONTAINER": container}
        response = s3_client.upload_file(
            filepath,
            bucket,
            filename,
            ExtraArgs={"Tagging": parse.urlencode(tags)},
        )
        print(response)
    except exceptions.ClientError as error:
        if error.response.get("Error", {}).get("Code", None) == "NoSuchKey":
            print(f"The specified Bucket: {key} has not been found")
            message = f"The specified Bucket: {key} has not been found"
        elif error.response.get("Error", {}).get("Code", None) == "NoSuchBucket":
            print(f"The specified Bucket: {bucket} has not been found")
            message = f"The specified Bucket: {bucket} has not been found"
        else:
            print(f"There has been an error with the S3 client => {error}")
            message = f"There has been an error with the S3 client => {error}"
    except subprocess.CalledProcessError as exc:
        print(f"Program failed {exc.returncode} - {exc}")
        message = f"Program failed {exc.returncode} - {exc}"
    except subprocess.TimeoutExpired as exc:
        print(f"Program timed out {exc}")
        message = f"Program timed out {exc}"
    except NotEnoughSpaceOnDevice as exc:
        print(f"{exc}")
        message = f"{exc}"
    except ApplicationNotFound as exc:
        print(f"{exc}")
        message = f"{exc}"
    except Exception as exc:
        print(f"Exception {exc}")
        message = f"Exception {exc}"
    else:
        success = True
