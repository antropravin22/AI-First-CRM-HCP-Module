import os
import json
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from database import SessionLocal, engine
import models
from typing import TypedDict, Annotated

# --- 1. SECURE ENVIRONMENT SETUP ---
load_dotenv() # This loads the GROQ_API_KEY from your .env file

# --- DATABASE SETUP ---
models.Base.metadata.create_all(bind=engine)

# --- 2. INITIALIZE LLM (Task 1 Requirement) ---

llm = ChatGroq(
    model_name="llama-3.1-8b-instant",  # <--- Switched to an active Groq model
    api_key=os.getenv("GROQ_API_KEY") 
)

# --- TOOLS ---
@tool
def log_interaction(hcp_name: str, interaction_type: str, date: str, sentiment: str, topics: str) -> str:
    """Use this tool to save/log a new interaction with an HCP into the database."""
    print("🔥 TOOL CALLED") 
    db = SessionLocal()
    new_log = models.Interaction(
        hcp_name=hcp_name, interaction_type=interaction_type, 
        date=date, sentiment=sentiment, topics_discussed=topics
    )
    db.add(new_log)
    db.commit()
    db.close()
    return f"Successfully logged {interaction_type} with {hcp_name} on {date}."

@tool
def edit_interaction(log_id: int, new_sentiment: str, new_topics: str) -> str:
    """Use this tool to update or modify an existing logged interaction."""
    db = SessionLocal()
    log = db.query(models.Interaction).filter(models.Interaction.id == log_id).first()
    if log:
        log.sentiment = new_sentiment
        log.topics_discussed = new_topics
        db.commit()
        db.close()
        return f"Successfully updated interaction ID {log_id}."
    db.close()
    return "Error: Interaction not found."

@tool
def search_hcp_history(hcp_name: str) -> str:
    """Use this tool to search the database for past interactions with a specific HCP."""
    db = SessionLocal()
    logs = db.query(models.Interaction).filter(models.Interaction.hcp_name.contains(hcp_name)).all()
    db.close()
    if logs:
        return f"Found {len(logs)} past interactions for {hcp_name}."
    return f"No past interactions found for {hcp_name}."

@tool
def fetch_product_info(product_name: str) -> str:
    """Use this tool to retrieve clinical data for a pharmaceutical product."""
    mock_db = {
        "Prodo-X": "Prodo-X is a highly effective API for cardiovascular treatment.",
        "Product Y": "Product Y is a raw material compound currently in Phase 3 trials."
    }
    return mock_db.get(product_name, "Product information not found.")

@tool
def schedule_follow_up(hcp_name: str, date: str) -> str:
    """Use this tool to schedule a calendar follow-up meeting with an HCP."""
    return f"Confirmed: Follow-up scheduled with {hcp_name} on {date}."

tools = [log_interaction, edit_interaction, search_hcp_history, fetch_product_info, schedule_follow_up]
llm_with_tools = llm.bind_tools(tools)

# --- LANGGRAPH STATE ---
class AgentState(TypedDict):
    input: str
    response: Annotated[any, "llm_response"]
    tool_result: str

# --- NODES ---
def agent_node(state: AgentState):
    try:
        response = llm_with_tools.invoke([
            SystemMessage(content="""
You are a CRM AI assistant.

IMPORTANT:
- If user describes meeting → call log_interaction
- Always use tools when possible
"""),
            HumanMessage(content=state["input"])
        ])
        return {"response": response}
    except Exception as e:
        print("❌ AGENT ERROR:", str(e))
        return {"response": None}

def tool_node(state: AgentState):
    response = state["response"]

    if hasattr(response, "tool_calls") and response.tool_calls:
        tool_call = response.tool_calls[0]

        tool_name = tool_call["name"]
        tool_args = tool_call["args"]

        print(f"🔥 Calling tool: {tool_name}")  # debug

        for t in tools:
            if t.name == tool_name:
                result = t.invoke(tool_args)
                return {"tool_result": str(result)}

    return {"tool_result": "No tool used"}

# --- GRAPH DEFINITION ---
workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)
workflow.set_entry_point("agent")
workflow.add_edge("agent", "tools")
workflow.add_edge("tools", END)
graph = workflow.compile()

# --- EXTRACTION LOGIC ---
def extract_interaction_data(user_input: str):
    system_prompt = SystemMessage(content="""
        Extract data into JSON:
        Keys: hcp_name, interaction_type, date, sentiment, topics_discussed, materials_shared, follow_up_actions.
        Assume today is 2026-04-16. Return raw JSON only.
    """)
    response = llm.invoke([system_prompt, HumanMessage(content=user_input)])
    try:
        clean_json = response.content.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
    except:
        return {
            "hcp_name": "",
            "interaction_type": "Meeting",
            "date": "",
            "sentiment": "Neutral",
            "topics_discussed": "",
            "materials_shared": "",
            "follow_up_actions": ""
        }

# --- FINAL WRAPPER ---
def run_agent(user_input: str):
    result = graph.invoke({"input": user_input})
    form_data = extract_interaction_data(user_input)
    return {
        "form_data": form_data,
        "tool_output": result.get("tool_result", "")
    }

# --- 3. FASTAPI BACKEND SETUP (Task 1 Requirement) ---
app = FastAPI(title="AI-First CRM HCP Module Backend")

# Enable CORS so your React frontend can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows requests from any frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.post("/api/interact")
async def process_interaction(request: ChatRequest):
    """
    Endpoint for React UI.
    Receives chat input, runs LangGraph, returns form data and tool results.
    """
    return run_agent(request.message)