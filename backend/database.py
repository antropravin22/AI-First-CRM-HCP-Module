from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Switched from MySQL to SQLite to use your local crm.db file
SQLALCHEMY_DATABASE_URL = "sqlite:///./crm.db"

# 2. Added 'check_same_thread' which is required for SQLite
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()