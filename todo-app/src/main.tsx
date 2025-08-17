import React from 'react'
import ReactDOM from 'react-dom/client'
import TodoApp from './components/TodoApp.tsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TodoApp />
  </React.StrictMode>,
)