from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Make sure this matches your MySQL username and password!
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:12345678@localhost:3306/crm_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()