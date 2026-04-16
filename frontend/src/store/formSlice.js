import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  hcp_name: '',
  interaction_type: 'Meeting',
  date: '',
  time: '',
  attendees: '',
  topics_discussed: '',
  materials_shared: '',
  sentiment: 'Neutral',
  outcomes: '',
  follow_up_actions: ''
};

export const formSlice = createSlice({
  name: 'form',
  initialState, // <--- This ensures formData is never undefined
  reducers: {
    updateField: (state, action) => {
      state[action.payload.name] = action.payload.value;
    },
    setFullForm: (state, action) => {
      return { ...state, ...action.payload };
    }
  }
});

export const { updateField, setFullForm } = formSlice.actions;
export default formSlice.reducer;