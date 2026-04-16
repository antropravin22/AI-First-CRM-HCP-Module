import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// 1. Import these two lines
import { Provider } from 'react-redux';
import store from './store/store'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 2. Wrap <App /> inside <Provider store={store}> */}
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
