export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type FilterType = 'all' | 'active' | 'completed';

export interface UseTodosReturn {
  todos: Todo[];
  filter: FilterType;
  filteredTodos: Todo[];
  totalCount: number;
  completedCount: number;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  editTodo: (id: string, text: string) => void;
  setFilter: (filter: FilterType) => void;
}

export interface TodoInputProps {
  onAddTodo: (text: string) => void;
}

export interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (text: string) => void;
}

export interface TodoFilterProps {
  currentFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export interface TodoStatsProps {
  totalCount: number;
  completedCount: number;
}