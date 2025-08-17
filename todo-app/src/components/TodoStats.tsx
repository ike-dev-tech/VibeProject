import React from 'react';
import { TodoStatsProps } from '../types/todo';
import styles from '../styles/TodoStats.module.css';

const TodoStats: React.FC<TodoStatsProps> = ({ totalCount, completedCount }) => {
  const activeCount = totalCount - completedCount;
  
  return (
    <div className={styles.stats}>
      <div className={styles.statItem}>
        <span className={styles.number}>{totalCount}</span>
        <span className={styles.label}>Total</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.number}>{activeCount}</span>
        <span className={styles.label}>Active</span>
      </div>
      <div className={styles.statItem}>
        <span className={styles.number}>{completedCount}</span>
        <span className={styles.label}>Completed</span>
      </div>
    </div>
  );
};

export default TodoStats;