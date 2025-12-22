# 待办事项列表

## 核心实现

### 基础结构
```jsx
function TodoList() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    if (!input.trim()) return;
    
    const newTodo = {
      id: Date.now(),
      text: input,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    setTodos([newTodo, ...todos]);
    setInput('');
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const editTodo = (id, newText) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, text: newText } : todo
    ));
  };

  return (
    <div className="todo-app">
      <h1>待办事项</h1>
      
      <div className="todo-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="添加新任务..."
        />
        <button onClick={addTodo}>添加</button>
      </div>

      <div className="todo-list">
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={() => toggleTodo(todo.id)}
            onDelete={() => deleteTodo(todo.id)}
            onEdit={(text) => editTodo(todo.id, text)}
          />
        ))}
      </div>

      <div className="todo-stats">
        <span>{todos.filter(t => !t.completed).length} 项未完成</span>
        <span>共 {todos.length} 项</span>
      </div>
    </div>
  );
}

function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);

  const handleSubmit = () => {
    if (editText.trim()) {
      onEdit(editText);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="todo-item editing">
        <input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          onBlur={handleSubmit}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={onToggle}
      />
      <span onDoubleClick={() => setIsEditing(true)}>
        {todo.text}
      </span>
      <button onClick={onDelete}>删除</button>
    </div>
  );
}
```

### 样式
```css
.todo-app {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.todo-input {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.todo-input input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.todo-input button {
  padding: 10px 20px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.todo-item:hover {
  background: #fafafa;
}

.todo-item.completed span {
  text-decoration: line-through;
  color: #999;
}

.todo-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.todo-item span {
  flex: 1;
  cursor: pointer;
}

.todo-stats {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  color: #666;
  font-size: 14px;
}
```

## 关键要点

### 1. 数据持久化
```jsx
function TodoList() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // ...其他代码
}
```

### 2. 过滤和排序
```jsx
function TodoList() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [sortBy, setSortBy] = useState('date'); // date, name

  const filteredTodos = useMemo(() => {
    let result = [...todos];

    // 过滤
    if (filter === 'active') {
      result = result.filter(todo => !todo.completed);
    } else if (filter === 'completed') {
      result = result.filter(todo => todo.completed);
    }

    // 排序
    if (sortBy === 'date') {
      result.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.text.localeCompare(b.text));
    }

    return result;
  }, [todos, filter, sortBy]);

  return (
    <div className="todo-app">
      <div className="filters">
        <button onClick={() => setFilter('all')}>全部</button>
        <button onClick={() => setFilter('active')}>未完成</button>
        <button onClick={() => setFilter('completed')}>已完成</button>
      </div>

      <div className="sort">
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date">按日期</option>
          <option value="name">按名称</option>
        </select>
      </div>

      <div className="todo-list">
        {filteredTodos.map(todo => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>
    </div>
  );
}
```

### 3. 批量操作
```jsx
function TodoList() {
  const [todos, setTodos] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(todos.map(t => t.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const deleteSelected = () => {
    setTodos(todos.filter(todo => !selectedIds.has(todo.id)));
    setSelectedIds(new Set());
  };

  const completeSelected = () => {
    setTodos(todos.map(todo =>
      selectedIds.has(todo.id) ? { ...todo, completed: true } : todo
    ));
    setSelectedIds(new Set());
  };

  return (
    <div className="todo-app">
      {selectedIds.size > 0 && (
        <div className="batch-actions">
          <span>{selectedIds.size} 项已选</span>
          <button onClick={completeSelected}>完成选中</button>
          <button onClick={deleteSelected}>删除选中</button>
          <button onClick={clearSelection}>取消</button>
        </div>
      )}

      <button onClick={selectAll}>全选</button>

      <div className="todo-list">
        {todos.map(todo => (
          <div key={todo.id} className="todo-item">
            <input
              type="checkbox"
              checked={selectedIds.has(todo.id)}
              onChange={() => toggleSelect(todo.id)}
            />
            <span>{todo.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 高级功能

### 1. 拖拽排序
```jsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableTodoItem({ todo, onToggle, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="todo-item"
      {...attributes}
      {...listeners}
    >
      <span className="drag-handle">☰</span>
      <input type="checkbox" checked={todo.completed} onChange={onToggle} />
      <span>{todo.text}</span>
      <button onClick={onDelete}>删除</button>
    </div>
  );
}

function DraggableTodoList() {
  const [todos, setTodos] = useState([]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = todos.findIndex(t => t.id === active.id);
    const newIndex = todos.findIndex(t => t.id === over.id);

    const newTodos = [...todos];
    const [removed] = newTodos.splice(oldIndex, 1);
    newTodos.splice(newIndex, 0, removed);

    setTodos(newTodos);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={todos.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="todo-list">
          {todos.map(todo => (
            <SortableTodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

### 2. 子任务
```jsx
function TodoWithSubtasks() {
  const [todos, setTodos] = useState([]);

  const addSubtask = (parentId, text) => {
    setTodos(todos.map(todo => {
      if (todo.id === parentId) {
        return {
          ...todo,
          subtasks: [
            ...(todo.subtasks || []),
            { id: Date.now(), text, completed: false }
          ]
        };
      }
      return todo;
    }));
  };

  const toggleSubtask = (parentId, subtaskId) => {
    setTodos(todos.map(todo => {
      if (todo.id === parentId) {
        return {
          ...todo,
          subtasks: todo.subtasks.map(sub =>
            sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
          )
        };
      }
      return todo;
    }));
  };

  return (
    <div className="todo-list">
      {todos.map(todo => (
        <div key={todo.id} className="todo-item-with-subtasks">
          <div className="main-task">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span>{todo.text}</span>
          </div>
          
          {todo.subtasks && (
            <div className="subtasks">
              {todo.subtasks.map(subtask => (
                <div key={subtask.id} className="subtask">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => toggleSubtask(todo.id, subtask.id)}
                  />
                  <span>{subtask.text}</span>
                </div>
              ))}
            </div>
          )}
          
          <button onClick={() => {
            const text = prompt('添加子任务');
            if (text) addSubtask(todo.id, text);
          }}>
            + 添加子任务
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 3. 标签和分类
```jsx
function TodoWithTags() {
  const [todos, setTodos] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const allTags = useMemo(() => {
    const tags = new Set();
    todos.forEach(todo => {
      todo.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [todos]);

  const addTag = (todoId, tag) => {
    setTodos(todos.map(todo => {
      if (todo.id === todoId) {
        const tags = new Set([...(todo.tags || []), tag]);
        return { ...todo, tags: Array.from(tags) };
      }
      return todo;
    }));
  };

  const removeTag = (todoId, tag) => {
    setTodos(todos.map(todo => {
      if (todo.id === todoId) {
        return {
          ...todo,
          tags: (todo.tags || []).filter(t => t !== tag)
        };
      }
      return todo;
    }));
  };

  const filteredTodos = selectedTags.length === 0
    ? todos
    : todos.filter(todo =>
        selectedTags.every(tag => todo.tags?.includes(tag))
      );

  return (
    <div className="todo-app">
      <div className="tag-filter">
        {allTags.map(tag => (
          <button
            key={tag}
            className={selectedTags.includes(tag) ? 'active' : ''}
            onClick={() => {
              setSelectedTags(prev =>
                prev.includes(tag)
                  ? prev.filter(t => t !== tag)
                  : [...prev, tag]
              );
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="todo-list">
        {filteredTodos.map(todo => (
          <div key={todo.id} className="todo-item">
            <span>{todo.text}</span>
            <div className="tags">
              {todo.tags?.map(tag => (
                <span key={tag} className="tag">
                  {tag}
                  <button onClick={() => removeTag(todo.id, tag)}>×</button>
                </span>
              ))}
              <button onClick={() => {
                const tag = prompt('添加标签');
                if (tag) addTag(todo.id, tag);
              }}>
                + 标签
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. 优先级和截止日期
```jsx
function TodoWithPriority() {
  const [todos, setTodos] = useState([]);

  const addTodo = (text, priority, dueDate) => {
    const newTodo = {
      id: Date.now(),
      text,
      priority, // high, medium, low
      dueDate,
      completed: false,
      createdAt: new Date().toISOString()
    };
    setTodos([newTodo, ...todos]);
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      // 优先级排序
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // 截止日期排序
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      return 0;
    });
  }, [todos]);

  return (
    <div className="todo-list">
      {sortedTodos.map(todo => (
        <div
          key={todo.id}
          className={`todo-item priority-${todo.priority} ${
            isOverdue(todo.dueDate) ? 'overdue' : ''
          }`}
        >
          <span className={`priority-badge ${todo.priority}`}>
            {todo.priority}
          </span>
          <span>{todo.text}</span>
          {todo.dueDate && (
            <span className="due-date">
              {new Date(todo.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
```

## 面试要点

**Q: 如何优化待办列表性能？**
- 使用虚拟滚动（大量数据）
- React.memo 避免不必要渲染
- 使用 useMemo 缓存过滤结果
- 防抖输入搜索
- 懒加载历史记录

**Q: 如何实现撤销/重做？**
```jsx
function useTodoHistory() {
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const addToHistory = (todos) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(todos);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      return history[currentIndex - 1];
    }
  };

  const redo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
      return history[currentIndex + 1];
    }
  };

  return { addToHistory, undo, redo };
}
```

**Q: 如何同步多端数据？**
- 使用 WebSocket 实时同步
- 乐观更新 + 冲突解决
- 版本号或时间戳
- 离线优先策略（Service Worker）

**Q: 如何设计待办数据结构？**
```typescript
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  dueDate?: string;
  subtasks?: Todo[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}
```
