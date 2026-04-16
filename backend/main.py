from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import run_agent

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    text: str
    form: dict

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    # This calls the run_agent function in agent.py
    result = run_agent(req.text)
    
    # We return the form_data so Redux can fill the fields
    # and tool_output for the chat box message
    return result