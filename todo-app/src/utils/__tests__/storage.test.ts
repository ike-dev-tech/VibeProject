import { loadTodos, saveTodos, generateId } from '../storage';
import { Todo } from '../../types/todo';

describe('storage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadTodos', () => {
    test('returns empty array when no todos in localStorage', () => {
      const todos = loadTodos();
      expect(todos).toEqual([]);
    });

    test('loads todos from localStorage', () => {
      const mockTodos: Todo[] = [
        {
          id: '1',
          text: 'Test todo',
          completed: false,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
      ];

      localStorage.setItem('todos', JSON.stringify(mockTodos));
      const todos = loadTodos();
      
      expect(todos).toHaveLength(1);
      expect(todos[0].text).toBe('Test todo');
      expect(todos[0].createdAt).toBeInstanceOf(Date);
    });

    test('handles corrupted localStorage data', () => {
      localStorage.setItem('todos', 'invalid json');
      const todos = loadTodos();
      expect(todos).toEqual([]);
    });
  });

  describe('saveTodos', () => {
    test('saves todos to localStorage', () => {
      const mockTodos: Todo[] = [
        {
          id: '1',
          text: 'Test todo',
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      saveTodos(mockTodos);
      const stored = localStorage.getItem('todos');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toHaveLength(1);
    });
  });

  describe('generateId', () => {
    test('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
    });
  });
});