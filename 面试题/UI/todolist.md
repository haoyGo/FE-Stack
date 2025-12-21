# Todo List 待办事项实现

> 实现一个完整的待办事项列表，包含增删改查、状态管理、数据持久化等功能

## 一、效果预览

```
┌─────────────────────────────────────────┐
│  📝 Todo List                           │
├─────────────────────────────────────────┤
│  [输入框: What needs to be done?]  [Add]│
├─────────────────────────────────────────┤
│  [All(3)] [Active(2)] [Completed(1)]   │
├─────────────────────────────────────────┤
│  ☑ Buy groceries            [Edit][Del] │
│  ☐ Finish homework          [Edit][Del] │
│  ☐ Call mom                 [Edit][Del] │
└─────────────────────────────────────────┘
```

## 二、基础实现（React）

### 2.1 简单版本

```jsx
import React, { useState } from 'react';
import './TodoList.css';

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  // 添加待办事项
  const handleAdd = () => {
    if (inputValue.trim() === '') return;

    const newTodo = {
      id: Date.now(),
      text: inputValue.trim(),
      completed: false,
    };

    setTodos([...todos, newTodo]);
    setInputValue('');
  };

  // 切换完成状态
  const handleToggle = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  // 删除待办事项
  const handleDelete = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  // 按 Enter 键添加
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="todo-list">
      <h1>📝 Todo List</h1>
      
      {/* 输入区域 */}
      <div className="input-section">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="What needs to be done?"
        />
        <button onClick={handleAdd}>Add</button>
      </div>

      {/* 任务列表 */}
      <ul className="todo-items">
        {todos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggle(todo.id)}
            />
            <span>{todo.text}</span>
            <button onClick={() => handleDelete(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>

      {/* 统计信息 */}
      {todos.length > 0 && (
        <div className="stats">
          <span>Total: {todos.length}</span>
          <span>Completed: {todos.filter(t => t.completed).length}</span>
          <span>Active: {todos.filter(t => !t.completed).length}</span>
        </div>
      )}
    </div>
  );
}

export default TodoList;
```

### 2.2 基础 CSS

```css
/* TodoList.css */
.todo-list {
  max-width: 600px;
  margin: 40px auto;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.todo-list h1 {
  text-align: center;
  color: #333;
  margin: 0 0 24px 0;
  font-size: 32px;
}

/* 输入区域 */
.input-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.input-section input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.2s;
}

.input-section input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.input-section button {
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s;
}

.input-section button:hover {
  background: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.input-section button:active {
  transform: translateY(0);
}

/* 任务列表 */
.todo-items {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
}

.todo-items li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.todo-items li:hover {
  background: #f0f0f0;
  border-color: #e0e0e0;
  transform: translateX(4px);
}

.todo-items li.completed {
  opacity: 0.6;
}

.todo-items li.completed span {
  text-decoration: line-through;
  color: #999;
}

.todo-items input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #4CAF50;
}

.todo-items span {
  flex: 1;
  font-size: 15px;
  color: #333;
  word-break: break-word;
}

.todo-items button {
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.todo-items button:hover {
  background: #da190b;
  transform: scale(1.05);
}

/* 统计信息 */
.stats {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-style: italic;
}

/* 响应式 */
@media (max-width: 768px) {
  .todo-list {
    margin: 20px;
    padding: 20px;
  }

  .todo-list h1 {
    font-size: 24px;
  }
}
```

## 三、完整功能版本

### 3.1 带编辑、过滤、持久化

```jsx
import React, { useState, useEffect } from 'react';
import './TodoList.css';

function TodoList() {
  // 从 localStorage 加载
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // 保存到 localStorage
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // 添加待办事项
  const handleAdd = () => {
    const trimmed = inputValue.trim();
    
    if (trimmed === '') {
      alert('任务不能为空');
      return;
    }

    if (trimmed.length > 100) {
      alert('任务内容过长（最多100字符）');
      return;
    }

    const newTodo = {
      id: Date.now(),
      text: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTodos([newTodo, ...todos]); // 新任务放在最前面
    setInputValue('');
  };

  // 切换完成状态
  const handleToggle = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  // 删除待办事项
  const handleDelete = (id) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      setTodos(todos.filter(todo => todo.id !== id));
    }
  };

  // 开始编辑
  const handleStartEdit = (todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  // 保存编辑
  const handleSaveEdit = () => {
    const trimmed = editingText.trim();
    
    if (trimmed === '') {
      handleDelete(editingId);
    } else {
      setTodos(todos.map(todo =>
        todo.id === editingId ? { ...todo, text: trimmed } : todo
      ));
    }
    
    setEditingId(null);
    setEditingText('');
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  // 全部标记为完成
  const handleCompleteAll = () => {
    const allCompleted = todos.every(todo => todo.completed);
    setTodos(todos.map(todo => ({ ...todo, completed: !allCompleted })));
  };

  // 清除已完成
  const handleClearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed));
  };

  // 过滤待办事项
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  // 统计
  const stats = {
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
  };

  return (
    <div className="todo-list">
      <h1>📝 Todo List</h1>
      
      {/* 输入区域 */}
      <div className="input-section">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="What needs to be done?"
          maxLength={100}
          autoFocus
        />
        <button onClick={handleAdd}>Add</button>
      </div>

      {/* 操作按钮 */}
      {todos.length > 0 && (
        <div className="actions">
          <button onClick={handleCompleteAll} className="action-btn">
            {todos.every(t => t.completed) ? '☑ Uncheck All' : '☐ Check All'}
          </button>
          {stats.completed > 0 && (
            <button onClick={handleClearCompleted} className="action-btn danger">
              🗑 Clear Completed ({stats.completed})
            </button>
          )}
        </div>
      )}

      {/* 过滤器 */}
      {todos.length > 0 && (
        <div className="filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({stats.total})
          </button>
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({stats.active})
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({stats.completed})
          </button>
        </div>
      )}

      {/* 任务列表 */}
      <ul className="todo-items">
        {filteredTodos.length === 0 ? (
          <li className="empty">
            {filter === 'all' && todos.length === 0 && '暂无任务，添加一个吧！'}
            {filter === 'all' && todos.length > 0 && '暂无任务'}
            {filter === 'active' && '没有未完成的任务 🎉'}
            {filter === 'completed' && '没有已完成的任务'}
          </li>
        ) : (
          filteredTodos.map(todo => (
            <li key={todo.id} className={todo.completed ? 'completed' : ''}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(todo.id)}
              />
              
              {editingId === todo.id ? (
                // 编辑模式
                <>
                  <input
                    type="text"
                    className="edit-input"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    autoFocus
                  />
                  <button onClick={handleSaveEdit} className="save-btn">
                    Save
                  </button>
                  <button onClick={handleCancelEdit} className="cancel-btn">
                    Cancel
                  </button>
                </>
              ) : (
                // 查看模式
                <>
                  <span onDoubleClick={() => handleStartEdit(todo)}>
                    {todo.text}
                  </span>
                  <button 
                    onClick={() => handleStartEdit(todo)} 
                    className="edit-btn"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(todo.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default TodoList;
```

### 3.2 完整 CSS

```css
/* TodoList.css - Complete Version */
.todo-list {
  max-width: 700px;
  margin: 40px auto;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.todo-list h1 {
  text-align: center;
  color: #1a1a1a;
  margin: 0 0 32px 0;
  font-size: 36px;
  font-weight: 700;
}

/* 输入区域 */
.input-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.input-section input {
  flex: 1;
  padding: 14px 18px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.2s;
  font-family: inherit;
}

.input-section input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.1);
}

.input-section button {
  padding: 14px 32px;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.input-section button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
}

.input-section button:active {
  transform: translateY(0);
}

/* 操作按钮 */
.actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.action-btn {
  flex: 1;
  padding: 10px 16px;
  background: #f5f5f5;
  color: #333;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #ececec;
  border-color: #ccc;
}

.action-btn.danger {
  color: #f44336;
  border-color: #ffcdd2;
}

.action-btn.danger:hover {
  background: #ffebee;
  border-color: #ef9a9a;
}

/* 过滤器 */
.filters {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 10px;
}

.filter-btn {
  flex: 1;
  padding: 10px 16px;
  background: transparent;
  color: #666;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.filter-btn.active {
  background: #4CAF50;
  color: white;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

/* 任务列表 */
.todo-items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.todo-items li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 10px;
  margin-bottom: 10px;
  transition: all 0.3s;
  border: 2px solid transparent;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.todo-items li:hover {
  background: #f0f0f0;
  border-color: #e0e0e0;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.todo-items li.completed {
  opacity: 0.65;
  background: #f5f5f5;
}

.todo-items li.completed span {
  text-decoration: line-through;
  color: #999;
}

.todo-items input[type="checkbox"] {
  width: 22px;
  height: 22px;
  cursor: pointer;
  accent-color: #4CAF50;
  border-radius: 4px;
}

.todo-items span {
  flex: 1;
  font-size: 15px;
  color: #333;
  word-break: break-word;
  line-height: 1.5;
}

/* 编辑输入框 */
.edit-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #4CAF50;
  border-radius: 6px;
  font-size: 15px;
  font-family: inherit;
}

.edit-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

/* 按钮样式 */
.todo-items button {
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.edit-btn {
  background: #2196F3;
  color: white;
}

.edit-btn:hover {
  background: #1976D2;
  transform: scale(1.05);
}

.delete-btn {
  background: #f44336;
  color: white;
}

.delete-btn:hover {
  background: #da190b;
  transform: scale(1.05);
}

.save-btn {
  background: #4CAF50;
  color: white;
}

.save-btn:hover {
  background: #45a049;
}

.cancel-btn {
  background: #9E9E9E;
  color: white;
}

.cancel-btn:hover {
  background: #757575;
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 16px;
  font-style: italic;
  list-style: none;
}

/* 响应式 */
@media (max-width: 768px) {
  .todo-list {
    margin: 20px;
    padding: 24px;
  }

  .todo-list h1 {
    font-size: 28px;
  }

  .input-section {
    flex-direction: column;
  }

  .actions {
    flex-direction: column;
  }

  .todo-items li {
    flex-wrap: wrap;
  }

  .todo-items span {
    flex-basis: 100%;
    margin-bottom: 8px;
  }
}
```

## 四、使用 useReducer 优化

### 4.1 Reducer 实现

```jsx
import React, { useReducer, useEffect } from 'react';

// Action Types
const ACTIONS = {
  ADD_TODO: 'add_todo',
  TOGGLE_TODO: 'toggle_todo',
  DELETE_TODO: 'delete_todo',
  EDIT_TODO: 'edit_todo',
  COMPLETE_ALL: 'complete_all',
  CLEAR_COMPLETED: 'clear_completed',
  LOAD_TODOS: 'load_todos',
};

// Reducer 函数
function todoReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_TODO:
      return [
        {
          id: Date.now(),
          text: action.payload.text,
          completed: false,
          createdAt: new Date().toISOString(),
        },
        ...state,
      ];

    case ACTIONS.TOGGLE_TODO:
      return state.map(todo =>
        todo.id === action.payload.id
          ? { ...todo, completed: !todo.completed }
          : todo
      );

    case ACTIONS.DELETE_TODO:
      return state.filter(todo => todo.id !== action.payload.id);

    case ACTIONS.EDIT_TODO:
      return state.map(todo =>
        todo.id === action.payload.id
          ? { ...todo, text: action.payload.text }
          : todo
      );

    case ACTIONS.COMPLETE_ALL:
      const allCompleted = state.every(todo => todo.completed);
      return state.map(todo => ({ ...todo, completed: !allCompleted }));

    case ACTIONS.CLEAR_COMPLETED:
      return state.filter(todo => !todo.completed);

    case ACTIONS.LOAD_TODOS:
      return action.payload;

    default:
      return state;
  }
}

function TodoList() {
  const [todos, dispatch] = useReducer(todoReducer, [], () => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const handleAdd = (text) => {
    dispatch({ type: ACTIONS.ADD_TODO, payload: { text } });
  };

  const handleToggle = (id) => {
    dispatch({ type: ACTIONS.TOGGLE_TODO, payload: { id } });
  };

  const handleDelete = (id) => {
    dispatch({ type: ACTIONS.DELETE_TODO, payload: { id } });
  };

  const handleEdit = (id, text) => {
    dispatch({ type: ACTIONS.EDIT_TODO, payload: { id, text } });
  };

  const handleCompleteAll = () => {
    dispatch({ type: ACTIONS.COMPLETE_ALL });
  };

  const handleClearCompleted = () => {
    dispatch({ type: ACTIONS.CLEAR_COMPLETED });
  };

  // ... JSX 保持不变
}
```

## 五、性能优化

### 5.1 使用 React.memo 和 useCallback

```jsx
import React, { useState, useCallback, useMemo } from 'react';

// 优化的 TodoItem 组件
const TodoItem = React.memo(({ 
  todo, 
  onToggle, 
  onDelete, 
  onEdit 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleSave = () => {
    if (editText.trim()) {
      onEdit(todo.id, editText.trim());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <li className={todo.completed ? 'completed' : ''}>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
        <input
          type="text"
          className="edit-input"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          autoFocus
        />
        <button onClick={handleSave} className="save-btn">Save</button>
        <button onClick={() => setIsEditing(false)} className="cancel-btn">
          Cancel
        </button>
      </li>
    );
  }

  return (
    <li className={todo.completed ? 'completed' : ''}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span onDoubleClick={() => setIsEditing(true)}>
        {todo.text}
      </span>
      <button onClick={() => setIsEditing(true)} className="edit-btn">
        Edit
      </button>
      <button onClick={() => onDelete(todo.id)} className="delete-btn">
        Delete
      </button>
    </li>
  );
});

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');

  // 使用 useCallback 稳定函数引用
  const handleToggle = useCallback((id) => {
    setTodos(prevTodos => prevTodos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }, []);

  const handleDelete = useCallback((id) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  }, []);

  const handleEdit = useCallback((id, text) => {
    setTodos(prevTodos => prevTodos.map(todo =>
      todo.id === id ? { ...todo, text } : todo
    ));
  }, []);

  // 使用 useMemo 缓存过滤结果
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    });
  }, [todos, filter]);

  const stats = useMemo(() => ({
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
  }), [todos]);

  return (
    <div className="todo-list">
      {/* ... */}
      <ul className="todo-items">
        {filteredTodos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
      </ul>
    </div>
  );
}
```

## 六、原生 JavaScript 实现

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todo List</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      min-height: 100vh;
    }

    .todo-list {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    h1 {
      text-align: center;
      margin-bottom: 32px;
      color: #333;
      font-size: 36px;
    }

    .input-section {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }

    .input-section input {
      flex: 1;
      padding: 14px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 15px;
    }

    .input-section button {
      padding: 14px 28px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    .filters {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      background: #f5f5f5;
      padding: 8px;
      border-radius: 8px;
    }

    .filter-btn {
      flex: 1;
      padding: 10px;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      color: #666;
    }

    .filter-btn.active {
      background: #4CAF50;
      color: white;
    }

    .todo-items {
      list-style: none;
      margin-bottom: 20px;
    }

    .todo-items li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f9f9f9;
      border-radius: 8px;
      margin-bottom: 8px;
      transition: all 0.2s;
    }

    .todo-items li:hover {
      background: #f0f0f0;
      transform: translateX(4px);
    }

    .todo-items li.completed span {
      text-decoration: line-through;
      opacity: 0.6;
    }

    .todo-items input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .todo-items span {
      flex: 1;
      font-size: 15px;
    }

    .todo-items button {
      padding: 8px 14px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }

    .delete-btn {
      background: #f44336;
      color: white;
    }

    .stats {
      display: flex;
      justify-content: space-around;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      font-size: 14px;
      color: #666;
    }

    .empty {
      text-align: center;
      padding: 40px;
      color: #999;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div id="app"></div>

  <script>
    class TodoList {
      constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.todos = this.loadFromStorage();
        this.filter = 'all';
        this.init();
      }

      init() {
        this.render();
        this.attachEvents();
      }

      loadFromStorage() {
        const saved = localStorage.getItem('todos');
        return saved ? JSON.parse(saved) : [];
      }

      saveToStorage() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
      }

      addTodo(text) {
        const trimmed = text.trim();
        if (trimmed === '') return;

        this.todos.unshift({
          id: Date.now(),
          text: trimmed,
          completed: false,
          createdAt: new Date().toISOString(),
        });

        this.saveToStorage();
        this.render();
      }

      toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
          todo.completed = !todo.completed;
          this.saveToStorage();
          this.render();
        }
      }

      deleteTodo(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.saveToStorage();
        this.render();
      }

      setFilter(filter) {
        this.filter = filter;
        this.render();
      }

      getFilteredTodos() {
        switch (this.filter) {
          case 'active':
            return this.todos.filter(t => !t.completed);
          case 'completed':
            return this.todos.filter(t => t.completed);
          default:
            return this.todos;
        }
      }

      getStats() {
        return {
          total: this.todos.length,
          active: this.todos.filter(t => !t.completed).length,
          completed: this.todos.filter(t => t.completed).length,
        };
      }

      render() {
        const filteredTodos = this.getFilteredTodos();
        const stats = this.getStats();

        this.container.innerHTML = `
          <div class="todo-list">
            <h1>📝 Todo List</h1>
            
            <div class="input-section">
              <input 
                type="text" 
                id="todoInput" 
                placeholder="What needs to be done?"
              />
              <button id="addBtn">Add</button>
            </div>

            ${this.todos.length > 0 ? `
              <div class="filters">
                <button 
                  class="filter-btn ${this.filter === 'all' ? 'active' : ''}" 
                  data-filter="all"
                >
                  All (${stats.total})
                </button>
                <button 
                  class="filter-btn ${this.filter === 'active' ? 'active' : ''}" 
                  data-filter="active"
                >
                  Active (${stats.active})
                </button>
                <button 
                  class="filter-btn ${this.filter === 'completed' ? 'active' : ''}" 
                  data-filter="completed"
                >
                  Completed (${stats.completed})
                </button>
              </div>
            ` : ''}

            <ul class="todo-items">
              ${filteredTodos.length === 0 
                ? '<li class="empty">暂无任务</li>'
                : filteredTodos.map(todo => `
                    <li class="${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                      <input 
                        type="checkbox" 
                        ${todo.completed ? 'checked' : ''}
                        class="toggle-checkbox"
                      />
                      <span>${this.escapeHtml(todo.text)}</span>
                      <button class="delete-btn">Delete</button>
                    </li>
                  `).join('')
              }
            </ul>

            ${this.todos.length > 0 ? `
              <div class="stats">
                <span>Total: ${stats.total}</span>
                <span>Active: ${stats.active}</span>
                <span>Completed: ${stats.completed}</span>
              </div>
            ` : ''}
          </div>
        `;
      }

      escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      attachEvents() {
        // 事件委托
        this.container.addEventListener('click', (e) => {
          if (e.target.id === 'addBtn') {
            const input = document.getElementById('todoInput');
            this.addTodo(input.value);
            input.value = '';
          }

          if (e.target.classList.contains('delete-btn')) {
            const li = e.target.closest('li');
            const id = parseInt(li.dataset.id);
            this.deleteTodo(id);
          }

          if (e.target.classList.contains('toggle-checkbox')) {
            const li = e.target.closest('li');
            const id = parseInt(li.dataset.id);
            this.toggleTodo(id);
          }

          if (e.target.classList.contains('filter-btn')) {
            this.setFilter(e.target.dataset.filter);
          }
        });

        this.container.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && e.target.id === 'todoInput') {
            const input = document.getElementById('todoInput');
            this.addTodo(input.value);
            input.value = '';
          }
        });
      }
    }

    // 初始化应用
    new TodoList('app');
  </script>
</body>
</html>
```

## 七、关键知识点

### 7.1 数据持久化

```jsx
// ✅ localStorage 存储
useEffect(() => {
  localStorage.setItem('todos', JSON.stringify(todos));
}, [todos]);

// ✅ 初始化时加载
const [todos, setTodos] = useState(() => {
  const saved = localStorage.getItem('todos');
  return saved ? JSON.parse(saved) : [];
});

// ✅ 处理存储错误
try {
  localStorage.setItem('todos', JSON.stringify(todos));
} catch (error) {
  console.error('Failed to save todos:', error);
  // 可能是存储空间已满
}
```

### 7.2 输入验证

```jsx
const handleAdd = () => {
  const trimmed = inputValue.trim();
  
  // 非空验证
  if (trimmed === '') {
    alert('任务不能为空');
    return;
  }

  // 长度验证
  if (trimmed.length > 100) {
    alert('任务内容过长');
    return;
  }

  // 重复检查
  if (todos.some(todo => todo.text === trimmed)) {
    if (!confirm('已存在相同任务，是否继续添加？')) {
      return;
    }
  }

  // 添加任务
  addTodo(trimmed);
};
```

### 7.3 键盘交互

```jsx
// Enter 提交
onKeyPress={(e) => {
  if (e.key === 'Enter') {
    handleAdd();
  }
}}

// Escape 取消
onKeyPress={(e) => {
  if (e.key === 'Escape') {
    handleCancel();
  }
}}

// 双击编辑
<span onDoubleClick={() => handleEdit(todo)}>
  {todo.text}
</span>
```

### 7.4 无障碍性

```jsx
<input
  type="checkbox"
  checked={todo.completed}
  onChange={() => handleToggle(todo.id)}
  aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
/>

<ul className="todo-items" role="list">
  {todos.map(todo => (
    <li key={todo.id} role="listitem">
      {/* ... */}
    </li>
  ))}
</ul>
```

## 八、面试要点

### Q1: 如何实现拖拽排序？

```jsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableTodoItem({ todo, onToggle, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <input type="checkbox" onChange={() => onToggle(todo.id)} />
      <span>{todo.text}</span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </li>
  );
}

function TodoList() {
  const [todos, setTodos] = useState([]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTodos((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={todos}>
        {todos.map(todo => (
          <SortableTodoItem key={todo.id} todo={todo} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### Q2: 如何添加撤销/重做功能？

```jsx
function useUndoRedo(initialState) {
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentState = history[currentIndex];

  const setState = (newState) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const redo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    state: currentState,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}

// 使用
function TodoList() {
  const {
    state: todos,
    setState: setTodos,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo([]);

  return (
    <>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
      <button onClick={redo} disabled={!canRedo}>Redo</button>
      {/* ... */}
    </>
  );
}
```

### Q3: 如何实现批量操作？

```jsx
function TodoList() {
  const [todos, setTodos] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const handleSelectAll = () => {
    if (selectedIds.size === todos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(todos.map(t => t.id)));
    }
  };

  const handleBatchDelete = () => {
    setTodos(todos.filter(t => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
  };

  const handleBatchComplete = () => {
    setTodos(todos.map(t => 
      selectedIds.has(t.id) ? { ...t, completed: true } : t
    ));
    setSelectedIds(new Set());
  };

  return (
    <>
      <button onClick={handleSelectAll}>Select All</button>
      <button onClick={handleBatchComplete}>Complete Selected</button>
      <button onClick={handleBatchDelete}>Delete Selected</button>
      
      {todos.map(todo => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={selectedIds.has(todo.id)}
            onChange={() => {
              const newSelected = new Set(selectedIds);
              if (newSelected.has(todo.id)) {
                newSelected.delete(todo.id);
              } else {
                newSelected.add(todo.id);
              }
              setSelectedIds(newSelected);
            }}
          />
          {todo.text}
        </li>
      ))}
    </>
  );
}
```

---

## 总结

### 核心功能
- ✅ 增删改查（CRUD）
- ✅ 状态切换（完成/未完成）
- ✅ 过滤显示（全部/进行中/已完成）
- ✅ 本地存储持久化

### 技术要点
- ✅ 状态管理（useState/useReducer）
- ✅ 副作用处理（useEffect）
- ✅ 性能优化（React.memo、useCallback、useMemo）
- ✅ 事件处理（键盘、鼠标）

### 进阶功能
- ✅ 拖拽排序
- ✅ 撤销/重做
- ✅ 批量操作
- ✅ 优先级管理
- ✅ 标签分类

这是前端面试中最经典的实战题目！🎯