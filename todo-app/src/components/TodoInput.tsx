import React, { useState } from 'react';
import { TodoInputProps } from '../types/todo';
import styles from '../styles/TodoInput.module.css';

const TodoInput: React.FC<TodoInputProps> = ({ onAddTodo }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (trimmedInput) {
      onAddTodo(trimmedInput);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What needs to be done?"
        className={styles.input}
        maxLength={500}
        autoFocus
      />
      <button 
        type="submit" 
        className={styles.button}
        disabled={!input.trim()}
      >
        Add
      </button>
    </form>
  );
};

export default TodoInput;