import { useState, useEffect, useMemo, useCallback } from 'react';
import { Todo, FilterType, UseTodosReturn } from '../types/todo';
import { loadTodos, saveTodos, generateId } from '../utils/storage';

export const useTodos = (): UseTodosReturn => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    const loadedTodos = loadTodos();
    setTodos(loadedTodos);
  }, []);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const totalCount = todos.length;
  const completedCount = todos.filter(todo => todo.completed).length;

  const addTodo = useCallback((text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || trimmedText.length > 500) return;

    const newTodo: Todo = {
      id: generateId(),
      text: trimmedText,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTodos(prev => [...prev, newTodo]);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev => prev.map(todo =>
      todo.id === id
        ? { ...todo, completed: !todo.completed, updatedAt: new Date() }
        : todo
    ));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, []);

  const editTodo = useCallback((id: string, text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || trimmedText.length > 500) return;

    setTodos(prev => prev.map(todo =>
      todo.id === id
        ? { ...todo, text: trimmedText, updatedAt: new Date() }
        : todo
    ));
  }, []);

  return {
    todos,
    filter,
    filteredTodos,
    totalCount,
    completedCount,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    setFilter,
  };
};