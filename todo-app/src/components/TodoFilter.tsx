import React from 'react';
import { TodoFilterProps, FilterType } from '../types/todo';
import styles from '../styles/TodoFilter.module.css';

const TodoFilter: React.FC<TodoFilterProps> = ({ currentFilter, onFilterChange }) => {
  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className={styles.filters}>
      {filters.map(filter => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`${styles.filter} ${
            currentFilter === filter.key ? styles.active : ''
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default TodoFilter;