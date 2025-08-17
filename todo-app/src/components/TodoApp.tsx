import React from 'react';
import { useTodos } from '../hooks/useTodos';
import TodoInput from './TodoInput';
import TodoList from './TodoList';
import TodoStats from './TodoStats';
import TodoFilter from './TodoFilter';
import styles from '../styles/TodoApp.module.css';

const TodoApp: React.FC = () => {
  const {
    filteredTodos,
    filter,
    totalCount,
    completedCount,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    setFilter,
  } = useTodos();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Todo App</h1>
      </header>
      
      <main className={styles.main}>
        <TodoInput onAddTodo={addTodo} />
        
        <div className={styles.content}>
          <TodoList
            todos={filteredTodos}
            onToggleTodo={toggleTodo}
            onDeleteTodo={deleteTodo}
            onEditTodo={editTodo}
          />
        </div>
        
        <footer className={styles.footer}>
          <TodoStats
            totalCount={totalCount}
            completedCount={completedCount}
          />
          <TodoFilter
            currentFilter={filter}
            onFilterChange={setFilter}
          />
        </footer>
      </main>
    </div>
  );
};

export default TodoApp;