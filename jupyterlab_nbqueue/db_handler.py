from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, Integer, String

import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


Base = declarative_base()


class Serializer(object):
    def serialize(self):
        return {c: getattr(self, c) for c in inspect(self).attrs.keys()}

    @staticmethod
    def serialize_list(l):
        return [m.serialize() for m in l]


class Runs(Base, Serializer):
    __tablename__ = 'runs'

    id = Column(Integer, primary_key=True)
    pid = Column(Integer, nullable=False, unique=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False)
    message = Column(String, nullable=False)

    def __init__(self, pid, name, status, message):
        self.pid = pid
        self.name = name
        self.status = status
        self.message = message

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def __repr__(self):
        return f"Runs(id={self.id!r}, pid={self.pid!r}, name={self.name!r}, status={self.status!r}, message={self.message!r})"

class Subscriptions(Base, Serializer):
    __tablename__ = 'subscriptions'

    id = Column(Integer, primary_key=True)
    pid = Column(Integer, nullable=False, unique=True)
    info = Column(String, nullable=False)

    def __init__(self, pid, info):
        self.pid = pid
        self.info = info

    def serialize(self):
        d = Serializer.serialize(self)
        return d

    def __repr__(self):
        return f"Subscription(id={self.id!r}, pid={self.pid!r}, info={self.info!r})"

class DBHandler():
    def __init__(self):
        self.engine = create_engine('sqlite:///.jupyterlab-nbqueue.db')
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()
        insp = inspect(self.engine)
        if not Path('.jupyterlab-nbqueue.db').exists() or not insp.has_table("runs", schema=Runs.metadata.schema):
            Runs.__table__.create(bind=self.engine, checkfirst=True)
            Subscriptions.__table__.create(bind=self.engine, checkfirst=True)


    def get_session(self):
        insp = inspect(self.engine)
        if not Path('.jupyterlab-nbqueue.db').exists() or not insp.has_table("runs", schema=Runs.metadata.schema):
            Runs.__table__.create(bind=self.engine, checkfirst=True)
            Subscriptions.__table__.create(bind=self.engine, checkfirst=True)
        
        return self.session
        