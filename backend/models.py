from sqlalchemy import Column, Integer, String, Text
from database import Base

class Interaction(Base):
    __tablename__ = "interaction"

    id = Column(Integer, primary_key=True, index=True)
    hcp_name = Column(String(100))
    interaction_type = Column(String(50))
    date = Column(String(20))
    sentiment = Column(String(20))
    topics_discussed = Column(Text)