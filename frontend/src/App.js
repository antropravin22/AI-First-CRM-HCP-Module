import React, { useState } from 'react';
import axios from 'axios';
import { Bot, Mic, Search, Plus } from 'lucide-react';
// --- REDUX IMPORTS ---
import { useSelector, useDispatch } from 'react-redux';
import { updateField, setFullForm } from './store/formSlice';

function App() {
  // --- REDUX STATE MANAGEMENT ---
  const formData = useSelector((state) => state.form) || {};
  const dispatch = useDispatch();
  
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { 
      type: 'bot', 
      text: 'Log interaction details here (e.g., "Met Dr. Smith, discussed Prodo-X efficacy, positive sentiment, shared brochure") or ask for help.' 
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const message = chatInput; // Store text
    setChatInput(''); // Clear input box

    // 1. Show the user's message instantly
    setChatHistory(prev => [
      ...prev,
      { type: 'user', text: message }
    ]);

    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/chat', {
        text: message,
        form: formData 
      });

      // Update the left-side form fields
      dispatch(setFullForm(response.data.form_data)); 

      // 2. ONLY add the success message here
      setChatHistory(prev => [
        ...prev,
        { type: 'success', text: response.data.tool_output || '✅ Interaction logged successfully! Form auto-filled.' }
      ]);

    } catch (error) {
      console.error(error);
      setChatHistory(prev => [
        ...prev,
        { type: 'bot', text: '❌ Error connecting to backend.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    // Dispatch individual field updates to Redux
    dispatch(updateField({ name: e.target.name, value: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 flex justify-center font-sans text-gray-800">
      <div className="max-w-[1400px] w-full flex gap-4 h-[calc(100vh-32px)]">
        
        {/* LEFT COLUMN: SCROLLABLE FORM */}
        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-y-auto p-8 pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          <h1 className="text-2xl font-bold text-gray-700 mb-8">Log HCP Interaction</h1>
          
          <div className="pr-4 pb-12">
            <h2 className="text-sm font-bold text-gray-600 mb-4">Interaction Details</h2>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">HCP Name</label>
                <input name="hcp_name" value={formData.hcp_name || ''} onChange={handleInputChange} placeholder="Search or select HCP..." className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:border-[#0088cc] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Interaction Type</label>
                <select name="interaction_type" value={formData.interaction_type || 'Meeting'} onChange={handleInputChange} className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:border-[#0088cc] outline-none bg-white">
                  <option>Meeting</option><option>Call</option><option>Email</option>
                </select>
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                <input type="date" name="date" value={formData.date || ''} onChange={handleInputChange} className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:border-[#0088cc] outline-none appearance-none" />
              </div>
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Time</label>
                <input type="time" name="time" value={formData.time || ''} onChange={handleInputChange} className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:border-[#0088cc] outline-none appearance-none" />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Attendees</label>
                <input name="attendees" value={formData.attendees || ''} onChange={handleInputChange} placeholder="Enter names or search..." className="w-full border border-gray-200 rounded-md p-2.5 text-sm focus:border-[#0088cc] outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Topics Discussed</label>
                <textarea name="topics_discussed" value={formData.topics_discussed || ''} onChange={handleInputChange} placeholder="Enter key discussion points..." className="w-full border border-gray-200 rounded-md p-2.5 text-sm h-24 resize-none focus:border-[#0088cc] outline-none" />
                <button className="flex items-center gap-1 text-[#0088cc] text-xs font-semibold mt-2 hover:underline">
                  <Mic size={14} /> Summarize from Voice Note (Requires Consent)
                </button>
              </div>
            </div>

            <h2 className="text-sm font-bold text-gray-600 mb-4">Materials Shared / Samples Distributed</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Materials Shared</label>
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <input name="materials_shared" value={formData.materials_shared || ''} onChange={handleInputChange} placeholder="e.g. Brochures" className="flex-1 text-sm text-gray-600 bg-transparent outline-none" />
                <button className="flex items-center gap-1 text-xs text-[#0088cc] font-semibold border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50"><Search size={14} /> Search/Add</button>
              </div>
            </div>

            <div className="mb-8 border-b border-gray-100 pb-6">
               <label className="block text-sm font-semibold text-gray-700 mb-2">Samples Distributed</label>
               <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>No samples added.</span>
                  <button className="flex items-center gap-1 text-[#0088cc] font-semibold text-xs border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50"><Plus size={14}/> Add Sample</button>
               </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Observed/Inferred HCP Sentiment</label>
              <div className="flex gap-6">
                {['Positive', 'Neutral', 'Negative'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="sentiment" value={opt} checked={formData.sentiment === opt} onChange={handleInputChange} className="accent-purple-600 w-4 h-4" />
                    <span className="text-sm flex items-center gap-1 text-gray-600">
                      {opt === 'Positive' ? '😃' : opt === 'Neutral' ? '😐' : '☹️'} {opt}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Outcomes</label>
              <textarea name="outcomes" value={formData.outcomes || ''} onChange={handleInputChange} placeholder="Key outcomes or agreements..." className="w-full border border-gray-200 rounded-md p-2.5 text-sm h-24 resize-none focus:border-[#0088cc] outline-none" />
            </div>
             <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Follow-up Actions</label>
              <textarea name="follow_up_actions" value={formData.follow_up_actions || ''} onChange={handleInputChange} placeholder="Specific follow-up steps..." className="w-full border border-gray-200 rounded-md p-2.5 text-sm h-24 resize-none focus:border-[#0088cc] outline-none" />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI ASSISTANT */}
        <div className="w-[400px] bg-white rounded-lg shadow-sm flex flex-col border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="text-[#0088cc]" size={20} />
              <h2 className="font-bold text-[#0088cc]">AI Assistant</h2>
            </div>
            <p className="text-xs text-gray-400 font-medium">Log Interaction details here via chat</p>
          </div>

          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-white">
            {chatHistory.map((msg, idx) => {
              if (msg.type === 'bot') {
                return <div key={idx} className="bg-[#eaf5fa] text-[#2c5263] p-4 rounded-xl text-sm w-[90%] shadow-sm self-start">{msg.text}</div>;
              } else if (msg.type === 'user') {
                return <div key={idx} className="bg-[#f4f4f5] text-gray-700 p-4 rounded-xl text-sm w-[90%] shadow-sm self-start border-l-4 border-l-[#0088cc]">{msg.text}</div>;
              } else if (msg.type === 'success') {
                const parts = msg.text.split('**');
                return <div key={idx} className="bg-[#ebf8f0] text-[#216e39] border border-[#c3e6cb] p-4 rounded-xl text-sm w-full shadow-sm self-start leading-relaxed">{parts[0]}<span className="font-bold">{parts[1] || ''}</span>{parts[2] || ''}</div>;
              }
              return null;
            })}
            {loading && <div className="text-xs text-gray-400 italic ml-2">AI is thinking...</div>}
          </div>

          <div className="p-4 bg-white border-t border-gray-100 flex items-end gap-2">
            <textarea 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmit(); } }}
              placeholder="Describe Interaction..." 
              className="flex-1 border border-gray-300 rounded-xl p-3 text-sm h-[52px] resize-none focus:outline-none focus:border-[#0088cc]"
            />
            <button onClick={handleChatSubmit} disabled={loading} className="bg-[#007aff] hover:bg-blue-600 text-white font-bold rounded-xl w-[52px] h-[52px] flex flex-col items-center justify-center transition-colors">
               <span className="text-[10px] leading-tight">A</span><span className="text-[11px] leading-tight font-black">Log</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;