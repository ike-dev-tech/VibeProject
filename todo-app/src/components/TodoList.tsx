import React from 'react';
import { Todo } from '../types/todo';
import TodoItem from './TodoItem';
import styles from '../styles/TodoList.module.css';

interface TodoListProps {
  todos: Todo[];
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onEditTodo: (id: string, text: string) => void;
}

const TodoList: React.FC<TodoListProps> = ({ 
  todos, 
  onToggleTodo, 
  onDeleteTodo, 
  onEditTodo 
}) => {
  if (todos.length === 0) {
    return (
      <div className={styles.empty}>
        No todos yet. Add one above!
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={() => onToggleTodo(todo.id)}
          onDelete={() => onDeleteTodo(todo.id)}
          onEdit={(text) => onEditTodo(todo.id, text)}
        />
      ))}
    </ul>
  );
};

export default TodoList;