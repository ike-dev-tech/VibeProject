import React, { useState, useRef, useEffect, memo } from 'react';
import { TodoItemProps } from '../types/todo';
import styles from '../styles/TodoItem.module.css';

const TodoItem: React.FC<TodoItemProps> = memo(({ todo, onToggle, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditText(todo.text);
  };

  const handleEditSubmit = () => {
    const trimmedText = editText.trim();
    if (trimmedText && trimmedText !== todo.text) {
      onEdit(trimmedText);
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditText(todo.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleBlur = () => {
    handleEditSubmit();
  };

  if (isEditing) {
    return (
      <li className={styles.item}>
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={styles.editInput}
          maxLength={500}
        />
      </li>
    );
  }

  return (
    <li className={`${styles.item} ${todo.completed ? styles.completed : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={onToggle}
        className={styles.checkbox}
      />
      <span
        onDoubleClick={handleDoubleClick}
        className={styles.text}
      >
        {todo.text}
      </span>
      <button
        onClick={onDelete}
        className={styles.deleteButton}
        aria-label="Delete todo"
      >
        ×
      </button>
    </li>
  );
});

TodoItem.displayName = 'TodoItem';

export default TodoItem;