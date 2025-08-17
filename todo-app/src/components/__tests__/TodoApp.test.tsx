import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoApp from '../TodoApp';

describe('TodoApp', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders todo app with title', () => {
    render(<TodoApp />);
    expect(screen.getByText('Todo App')).toBeInTheDocument();
  });

  test('renders input field and add button', () => {
    render(<TodoApp />);
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  test('displays empty state message when no todos', () => {
    render(<TodoApp />);
    expect(screen.getByText('No todos yet. Add one above!')).toBeInTheDocument();
  });

  test('adds a new todo when form is submitted', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText('What needs to be done?');
    const addButton = screen.getByRole('button', { name: 'Add' });

    await user.type(input, 'Test todo');
    await user.click(addButton);

    expect(screen.getByText('Test todo')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  test('toggles todo completion', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText('What needs to be done?');
    await user.type(input, 'Test todo');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  test('deletes a todo', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText('What needs to be done?');
    await user.type(input, 'Test todo');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Test todo')).toBeInTheDocument();

    const deleteButton = screen.getByRole('button', { name: 'Delete todo' });
    await user.click(deleteButton);

    expect(screen.queryByText('Test todo')).not.toBeInTheDocument();
  });

  test('filters todos correctly', async () => {
    const user = userEvent.setup();
    render(<TodoApp />);

    const input = screen.getByPlaceholderText('What needs to be done?');
    
    await user.type(input, 'Active todo');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    
    await user.type(input, 'Completed todo');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);

    await user.click(screen.getByRole('button', { name: 'Active' }));
    expect(screen.getByText('Active todo')).toBeInTheDocument();
    expect(screen.queryByText('Completed todo')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Completed' }));
    expect(screen.queryByText('Active todo')).not.toBeInTheDocument();
    expect(screen.getByText('Completed todo')).toBeInTheDocument();
  });
});