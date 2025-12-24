# React Query (TanStack Query)

## 核心概念

React Query 是一个强大的**数据同步和状态管理**库，专注于服务端状态管理，解决了传统状态管理库（Redux、MobX）处理异步数据的痛点。

### 为什么需要 React Query？

**传统方案的问题**：
```javascript
// 传统Redux方案 - 代码冗长
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetch('/api/users')
    .then(res => res.json())
    .then(data => {
      setData(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err);
      setLoading(false);
    });
}, []);

// 需要手动处理：
// ❌ 缓存
// ❌ 重复请求去重
// ❌ 后台自动刷新
// ❌ 数据过期
// ❌ 分页、无限滚动
```

**React Query 方案 - 简洁优雅**：
```javascript
import { useQuery } from '@tanstack/react-query';

function Users() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(res => res.json())
  });

  // ✅ 自动缓存
  // ✅ 自动去重
  // ✅ 后台自动刷新
  // ✅ 自动重试
  // ✅ 窗口聚焦时自动重新获取
}
```

## 基础使用

### 1. 安装和配置

```bash
npm install @tanstack/react-query
# 开发工具（可选）
npm install @tanstack/react-query-devtools
```

```javascript
// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分钟
      cacheTime: 1000 * 60 * 10, // 10分钟
      retry: 3, // 失败重试3次
      refetchOnWindowFocus: true // 窗口聚焦时重新获取
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 2. useQuery - 查询数据

```javascript
import { useQuery } from '@tanstack/react-query';

// 基础用法
function TodoList() {
  const { 
    data,           // 查询结果
    isLoading,      // 首次加载
    isFetching,     // 任何时候的加载状态
    error,          // 错误信息
    refetch         // 手动重新获取
  } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### 3. useMutation - 修改数据

```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function AddTodo() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newTodo) => {
      return fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(newTodo),
        headers: { 'Content-Type': 'application/json' }
      }).then(res => res.json());
    },
    onSuccess: () => {
      // 使缓存失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });

  return (
    <button
      onClick={() => {
        mutation.mutate({ title: 'New Todo' });
      }}
      disabled={mutation.isLoading}
    >
      {mutation.isLoading ? 'Adding...' : 'Add Todo'}
    </button>
  );
}
```

## 核心 API 详解

### queryKey - 查询键

```javascript
// 1. 简单字符串
useQuery({ queryKey: ['todos'], queryFn: fetchTodos });

// 2. 数组形式（推荐）
useQuery({ 
  queryKey: ['todos', { status: 'done' }], 
  queryFn: () => fetchTodos({ status: 'done' })
});

// 3. 带参数的查询键
function Todo({ id }) {
  const { data } = useQuery({
    queryKey: ['todo', id], // 不同的id会创建不同的缓存
    queryFn: () => fetchTodo(id)
  });
}

// 4. 复杂查询键
useQuery({
  queryKey: ['todos', { 
    status: 'active', 
    page: 1, 
    sort: 'createdAt' 
  }],
  queryFn: fetchTodos
});
```

**queryKey 的重要性**：
- 唯一标识查询
- 作为缓存的键
- 用于依赖追踪
- 支持失效和更新

### staleTime vs cacheTime

```javascript
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 1000 * 60 * 5,  // 5分钟内认为数据是新鲜的
  cacheTime: 1000 * 60 * 10   // 10分钟后清除缓存
});
```

**区别**：
- **staleTime**: 数据被认为是"新鲜"的时间，在此期间不会重新获取
- **cacheTime**: 数据在内存中保留的时间（即使组件卸载）

```
请求 → 获取数据 → fresh (staleTime内)
                ↓ 
              stale (超过staleTime)
                ↓
              后台重新获取
                ↓
              inactive (组件卸载)
                ↓
              垃圾回收 (超过cacheTime)
```

### enabled - 条件查询

```javascript
// 依赖另一个查询
function UserPosts({ userId }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  });

  const { data: posts } = useQuery({
    queryKey: ['posts', userId],
    queryFn: () => fetchPosts(userId),
    enabled: !!user // 只有当user存在时才执行
  });

  return <div>{posts?.map(post => <Post key={post.id} {...post} />)}</div>;
}

// 根据状态控制
function Search() {
  const [query, setQuery] = useState('');

  const { data } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchAPI(query),
    enabled: query.length > 2 // 至少3个字符才搜索
  });
}
```

### select - 数据转换

```javascript
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (data) => {
    // 只返回未完成的todo
    return data.filter(todo => !todo.completed);
  }
});

// 更复杂的转换
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  select: (data) => {
    return data
      .filter(user => user.active)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(user => ({
        ...user,
        displayName: `${user.firstName} ${user.lastName}`
      }));
  }
});
```

## 高级特性

### 1. 乐观更新（Optimistic Updates）

```javascript
function TodoItem({ todo }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (updates) => updateTodo(todo.id, updates),
    
    // 乐观更新
    onMutate: async (newTodo) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      // 保存之前的值（用于回滚）
      const previousTodos = queryClient.getQueryData(['todos']);

      // 乐观地更新缓存
      queryClient.setQueryData(['todos'], (old) => 
        old.map(t => t.id === todo.id ? { ...t, ...newTodo } : t)
      );

      return { previousTodos };
    },

    // 失败时回滚
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['todos'], context.previousTodos);
    },

    // 成功或失败后都重新获取
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });

  return (
    <div>
      <input
        checked={todo.completed}
        onChange={(e) => {
          mutation.mutate({ completed: e.target.checked });
        }}
      />
      {todo.title}
    </div>
  );
}
```

### 2. 无限查询（Infinite Queries）

```javascript
import { useInfiniteQuery } from '@tanstack/react-query';

function Posts() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam = 1 }) => 
      fetch(`/api/posts?page=${pageParam}`).then(res => res.json()),
    getNextPageParam: (lastPage, allPages) => {
      // 返回下一页的参数
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1
  });

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map(post => (
            <Post key={post.id} {...post} />
          ))}
        </div>
      ))}
      
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading...'
          : hasNextPage
          ? 'Load More'
          : 'No more data'}
      </button>
    </div>
  );
}
```

### 3. 分页查询（Pagination）

```javascript
function Posts() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => fetchPosts(page),
    placeholderData: (previousData) => previousData, // 保持旧数据显示
    staleTime: 1000 * 60 * 5 // 5分钟
  });

  // 预取下一页
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!isPlaceholderData && data?.hasMore) {
      queryClient.prefetchQuery({
        queryKey: ['posts', page + 1],
        queryFn: () => fetchPosts(page + 1)
      });
    }
  }, [data, isPlaceholderData, page, queryClient]);

  return (
    <div>
      {data?.posts.map(post => <Post key={post.id} {...post} />)}
      
      <button 
        onClick={() => setPage(old => Math.max(old - 1, 1))}
        disabled={page === 1}
      >
        Previous
      </button>
      
      <button
        onClick={() => setPage(old => old + 1)}
        disabled={isPlaceholderData || !data?.hasMore}
      >
        Next
      </button>
    </div>
  );
}
```

### 4. 并行查询（Parallel Queries）

```javascript
function Dashboard() {
  // 方法1: 多个useQuery
  const users = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const posts = useQuery({ queryKey: ['posts'], queryFn: fetchPosts });
  const comments = useQuery({ queryKey: ['comments'], queryFn: fetchComments });

  // 方法2: useQueries（动态查询）
  const results = useQueries({
    queries: [
      { queryKey: ['users'], queryFn: fetchUsers },
      { queryKey: ['posts'], queryFn: fetchPosts },
      { queryKey: ['comments'], queryFn: fetchComments }
    ]
  });

  // 方法3: 动态数量的查询
  const userIds = [1, 2, 3, 4];
  const userQueries = useQueries({
    queries: userIds.map(id => ({
      queryKey: ['user', id],
      queryFn: () => fetchUser(id)
    }))
  });

  const allLoading = userQueries.some(q => q.isLoading);
  const allData = userQueries.map(q => q.data);
}
```

### 5. 依赖查询（Dependent Queries）

```javascript
function UserPosts({ userId }) {
  // 第一步：获取用户信息
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  });

  // 第二步：基于用户信息获取帖子
  const { data: posts } = useQuery({
    queryKey: ['posts', user?.id],
    queryFn: () => fetchPosts(user.id),
    enabled: !!user // 只有user存在时才执行
  });

  // 第三步：基于帖子获取评论
  const { data: comments } = useQuery({
    queryKey: ['comments', posts?.[0]?.id],
    queryFn: () => fetchComments(posts[0].id),
    enabled: !!posts?.[0] // 只有posts存在时才执行
  });

  return <div>...</div>;
}
```

### 6. 预取数据（Prefetching）

```javascript
import { useQueryClient } from '@tanstack/react-query';

function PostList() {
  const queryClient = useQueryClient();

  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts
  });

  return (
    <div>
      {posts.map(post => (
        <Link
          key={post.id}
          to={`/posts/${post.id}`}
          onMouseEnter={() => {
            // 鼠标悬停时预取数据
            queryClient.prefetchQuery({
              queryKey: ['post', post.id],
              queryFn: () => fetchPost(post.id)
            });
          }}
        >
          {post.title}
        </Link>
      ))}
    </div>
  );
}

// 路由级预取
function App() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // 预取用户可能访问的页面数据
    queryClient.prefetchQuery({
      queryKey: ['dashboard'],
      queryFn: fetchDashboardData
    });
  }, []);
}
```

### 7. 初始数据和占位数据

```javascript
// 使用初始数据（来自其他查询）
function Post({ id }) {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    initialData: () => {
      // 从posts列表缓存中获取初始数据
      const posts = queryClient.getQueryData(['posts']);
      return posts?.find(post => post.id === id);
    }
  });
}

// 使用占位数据
function Post({ id }) {
  const { data, isPlaceholderData } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    placeholderData: {
      id,
      title: 'Loading...',
      content: 'Loading...'
    }
  });

  return (
    <div className={isPlaceholderData ? 'opacity-50' : ''}>
      <h1>{data.title}</h1>
      <p>{data.content}</p>
    </div>
  );
}
```

## 性能优化

### 1. 结构化共享（Structural Sharing）

```javascript
// React Query 自动使用结构化共享
// 如果新数据和旧数据深度相等，返回旧引用
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  // 默认开启，避免不必要的重渲染
  structuralSharing: true
});

// 自定义比较函数
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  structuralSharing: (oldData, newData) => {
    // 自定义比较逻辑
    if (oldData?.version === newData?.version) {
      return oldData; // 返回旧数据，避免重渲染
    }
    return newData;
  }
});
```

### 2. 选择性订阅

```javascript
// 只订阅需要的字段，避免不必要的重渲染
function TodoCount() {
  const { data: count } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    select: (data) => data.length // 只返回数量
  });

  return <div>Total: {count}</div>;
}

function TodoList() {
  const { data: todos } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    select: (data) => data.filter(t => !t.completed) // 只返回未完成的
  });

  return <div>{todos.map(t => <Todo key={t.id} {...t} />)}</div>;
}
```

### 3. 窗口聚焦重新获取

```javascript
// 全局配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,  // 窗口聚焦时重新获取
      refetchOnMount: true,        // 组件挂载时重新获取
      refetchOnReconnect: true     // 网络重连时重新获取
    }
  }
});

// 单个查询配置
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  refetchOnWindowFocus: false // 禁用此查询的窗口聚焦刷新
});
```

### 4. 缓存持久化

```javascript
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24 // 24小时
    }
  }
});

const persister = createSyncStoragePersister({
  storage: window.localStorage
});

function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <YourApp />
    </PersistQueryClientProvider>
  );
}
```

## 错误处理

### 1. 全局错误处理

```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        console.error('Query error:', error);
        toast.error(`Error: ${error.message}`);
      },
      retry: (failureCount, error) => {
        // 404错误不重试
        if (error.status === 404) return false;
        // 最多重试3次
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        // 指数退避
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      }
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
        toast.error(`Failed to save: ${error.message}`);
      }
    }
  }
});
```

### 2. 单个查询错误处理

```javascript
function TodoList() {
  const { data, error, isError } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    onError: (error) => {
      // 特定错误处理
      if (error.status === 401) {
        redirectToLogin();
      }
    }
  });

  if (isError) {
    return <ErrorComponent error={error} />;
  }

  return <div>...</div>;
}
```

### 3. Error Boundary 集成

```javascript
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div>
              <p>Error: {error.message}</p>
              <button onClick={resetErrorBoundary}>Retry</button>
            </div>
          )}
        >
          <YourApp />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

## 与其他库集成

### 1. 与 TypeScript

```typescript
interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

// 类型安全的查询
function useTodos() {
  return useQuery<Todo[], Error>({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Failed to fetch todos');
      return res.json();
    }
  });
}

// 类型安全的变更
function useAddTodo() {
  return useMutation<Todo, Error, { title: string }>({
    mutationFn: async (newTodo) => {
      const res = await fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(newTodo)
      });
      return res.json();
    }
  });
}

// 使用
function TodoList() {
  const { data } = useTodos();
  const addTodo = useAddTodo();
  
  // data 的类型是 Todo[] | undefined
  // addTodo.mutate 需要 { title: string } 参数
}
```

### 2. 与 Axios

```javascript
import axios from 'axios';

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 处理未授权
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

// 使用 React Query
function useTodos() {
  return useQuery({
    queryKey: ['todos'],
    queryFn: () => api.get('/todos')
  });
}

function useAddTodo() {
  return useMutation({
    mutationFn: (todo) => api.post('/todos', todo)
  });
}
```

### 3. 与 React Router

```javascript
import { useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router-dom';

// 使用路由参数
function PostDetail() {
  const { id } = useParams();
  
  const { data: post } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id)
  });

  return <div>{post?.title}</div>;
}

// 使用查询参数
function PostList() {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const filter = searchParams.get('filter') || 'all';

  const { data } = useQuery({
    queryKey: ['posts', { page, filter }],
    queryFn: () => fetchPosts({ page, filter })
  });

  return <div>...</div>;
}
```

## 实战案例

### 1. 完整的 CRUD 操作

```javascript
// hooks/useTodos.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const TODO_KEY = ['todos'];

// 获取列表
export function useTodos(filter = 'all') {
  return useQuery({
    queryKey: [...TODO_KEY, filter],
    queryFn: () => api.get('/todos', { params: { filter } }),
    select: (data) => {
      if (filter === 'completed') {
        return data.filter(t => t.completed);
      }
      if (filter === 'active') {
        return data.filter(t => !t.completed);
      }
      return data;
    }
  });
}

// 获取单个
export function useTodo(id) {
  return useQuery({
    queryKey: [...TODO_KEY, id],
    queryFn: () => api.get(`/todos/${id}`),
    enabled: !!id
  });
}

// 添加
export function useAddTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (todo) => api.post('/todos', todo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODO_KEY });
    }
  });
}

// 更新
export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }) => api.patch(`/todos/${id}`, updates),
    onMutate: async ({ id, ...updates }) => {
      // 乐观更新
      await queryClient.cancelQueries({ queryKey: [...TODO_KEY, id] });
      
      const previous = queryClient.getQueryData([...TODO_KEY, id]);
      
      queryClient.setQueryData([...TODO_KEY, id], (old) => ({
        ...old,
        ...updates
      }));

      return { previous };
    },
    onError: (err, variables, context) => {
      // 回滚
      queryClient.setQueryData(
        [...TODO_KEY, variables.id],
        context.previous
      );
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: [...TODO_KEY, variables.id] });
      queryClient.invalidateQueries({ queryKey: TODO_KEY });
    }
  });
}

// 删除
export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/todos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODO_KEY });
    }
  });
}

// 组件中使用
function TodoApp() {
  const [filter, setFilter] = useState('all');
  
  const { data: todos, isLoading } = useTodos(filter);
  const addTodo = useAddTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const handleAdd = () => {
    addTodo.mutate({ title: 'New Todo', completed: false });
  };

  const handleToggle = (todo) => {
    updateTodo.mutate({ id: todo.id, completed: !todo.completed });
  };

  const handleDelete = (id) => {
    deleteTodo.mutate(id);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={handleAdd}>Add Todo</button>
      
      <div>
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>

      {todos?.map(todo => (
        <div key={todo.id}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => handleToggle(todo)}
          />
          <span>{todo.title}</span>
          <button onClick={() => handleDelete(todo.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### 2. 实时搜索（防抖）

```javascript
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';

function Search() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 防抖函数
  const debouncedSetQuery = useMemo(
    () => debounce(setDebouncedQuery, 300),
    []
  );

  const { data: results, isFetching } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => api.get('/search', { params: { q: debouncedQuery } }),
    enabled: debouncedQuery.length > 2,
    staleTime: 1000 * 60 * 5 // 5分钟缓存
  });

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSetQuery(value);
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search..."
      />
      
      {isFetching && <span>Searching...</span>}
      
      <div>
        {results?.map(item => (
          <div key={item.id}>{item.title}</div>
        ))}
      </div>
    </div>
  );
}
```

### 3. 虚拟滚动 + 无限查询

```javascript
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['items'],
    queryFn: ({ pageParam = 0 }) =>
      api.get('/items', { params: { offset: pageParam, limit: 50 } }),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length * 50 : undefined;
    },
    initialPageParam: 0
  });

  const allRows = data?.pages.flatMap(page => page.items) ?? [];

  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5
  });

  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();

    if (!lastItem) return;

    if (
      lastItem.index >= allRows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allRows.length,
    isFetchingNextPage,
    virtualizer.getVirtualItems()
  ]);

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => {
          const isLoaderRow = virtualRow.index > allRows.length - 1;
          const item = allRows[virtualRow.index];

          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              {isLoaderRow ? (
                hasNextPage ? 'Loading...' : 'No more data'
              ) : (
                <div>{item.name}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## 面试高频问题

### Q1: React Query 和 Redux 有什么区别？何时使用？

**A**: 

**核心区别**：
- **Redux**: 客户端状态管理（UI状态、表单状态等）
- **React Query**: 服务端状态管理（异步数据、缓存、同步等）

```javascript
// Redux 适合管理的状态
const uiState = {
  theme: 'dark',
  sidebarOpen: true,
  modalVisible: false,
  currentTab: 'profile'
};

// React Query 适合管理的状态
const serverState = {
  user: { id: 1, name: 'John' },      // 来自 /api/user
  posts: [...],                        // 来自 /api/posts
  comments: [...]                      // 来自 /api/comments
};
```

**选择标准**：

| 场景 | 推荐方案 |
|------|---------|
| API 数据获取 | React Query |
| 表单状态 | React Hook Form / Formik |
| UI 状态（主题、侧边栏） | Context API / Zustand |
| 复杂全局状态 | Redux Toolkit |
| 实时数据同步 | React Query + WebSocket |

**最佳实践**：
```javascript
// ✅ 推荐：Redux管理UI，React Query管理服务端数据
function App() {
  // UI状态
  const theme = useSelector(state => state.ui.theme);
  const dispatch = useDispatch();

  // 服务端数据
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser
  });

  return <div className={theme}>...</div>;
}

// ❌ 不推荐：Redux管理服务端数据（代码冗长）
const userSlice = createSlice({
  name: 'user',
  initialState: { data: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});
```

---

### Q2: staleTime 和 cacheTime 有什么区别？

**A**: 

**概念区分**：
- **staleTime**: 数据保持"新鲜"的时间（影响重新获取）
- **cacheTime**: 数据在内存中保留的时间（影响垃圾回收）

**状态转换图**：
```
获取数据 → fresh (staleTime 内)
           ↓
         stale (超过 staleTime，标记为过时)
           ↓ (组件重新挂载/窗口聚焦)
         重新获取
           ↓
         inactive (组件卸载，没有观察者)
           ↓ (cacheTime 后)
         删除 (垃圾回收)
```

**实际例子**：

```javascript
// 场景1：静态数据（几乎不变）
useQuery({
  queryKey: ['countries'],
  queryFn: fetchCountries,
  staleTime: Infinity,        // 永远新鲜，不重新获取
  cacheTime: 1000 * 60 * 60   // 1小时后清除缓存
});

// 场景2：准实时数据
useQuery({
  queryKey: ['stock', symbol],
  queryFn: () => fetchStock(symbol),
  staleTime: 1000 * 10,       // 10秒后过时
  cacheTime: 1000 * 60 * 5,   // 5分钟后清除
  refetchInterval: 1000 * 30  // 30秒轮询
});

// 场景3：实时数据
useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  staleTime: 0,               // 立即过时
  cacheTime: 1000 * 60,       // 1分钟后清除
  refetchOnWindowFocus: true  // 窗口聚焦时刷新
});
```

**常见误区**：
```javascript
// ❌ 错误理解
// 以为 staleTime: 0 会每次都请求
useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  staleTime: 0
});
// 实际：只有在重新挂载、窗口聚焦等触发器时才会重新获取

// ✅ 正确配置
useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  staleTime: 0,
  refetchOnMount: true,
  refetchOnWindowFocus: true
});
```

---

### Q3: 如何实现乐观更新（Optimistic Updates）？

**A**: 

**核心思路**：先更新 UI，后发送请求，失败则回滚。

**完整实现**：

```javascript
function useLikeTweet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tweetId) => api.post(`/tweets/${tweetId}/like`),

    // 1. 发送请求前立即更新UI
    onMutate: async (tweetId) => {
      // 取消正在进行的查询，避免覆盖乐观更新
      await queryClient.cancelQueries({ queryKey: ['tweets'] });

      // 保存当前数据（用于回滚）
      const previousTweets = queryClient.getQueryData(['tweets']);

      // 乐观更新缓存
      queryClient.setQueryData(['tweets'], (old) =>
        old.map(tweet =>
          tweet.id === tweetId
            ? { ...tweet, liked: true, likes: tweet.likes + 1 }
            : tweet
        )
      );

      // 返回回滚数据
      return { previousTweets };
    },

    // 2. 请求失败，回滚UI
    onError: (err, tweetId, context) => {
      queryClient.setQueryData(['tweets'], context.previousTweets);
      toast.error('Failed to like tweet');
    },

    // 3. 请求完成（成功或失败），重新获取确保数据一致
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
    }
  });
}

// 使用
function Tweet({ tweet }) {
  const likeTweet = useLikeTweet();

  return (
    <div>
      <p>{tweet.text}</p>
      <button
        onClick={() => likeTweet.mutate(tweet.id)}
        disabled={likeTweet.isLoading}
      >
        ❤️ {tweet.likes}
      </button>
    </div>
  );
}
```

**高级：批量乐观更新**

```javascript
function useBatchUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates) => api.post('/batch-update', updates),

    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['items'] });

      const previousItems = queryClient.getQueryData(['items']);

      // 批量更新
      queryClient.setQueryData(['items'], (old) => {
        const updatesMap = new Map(updates.map(u => [u.id, u]));
        return old.map(item =>
          updatesMap.has(item.id)
            ? { ...item, ...updatesMap.get(item.id) }
            : item
        );
      });

      return { previousItems };
    },

    onError: (err, updates, context) => {
      queryClient.setQueryData(['items'], context.previousItems);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  });
}
```

---

### Q4: 如何处理并发请求和竞态条件？

**A**: 

**问题场景**：

```javascript
// ❌ 竞态条件问题
function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    // 用户快速输入 "react"
    // 发送请求: r -> re -> rea -> reac -> react
    // 但响应顺序可能是: react -> rea -> reac -> re -> r
    // 最终显示的可能是 "r" 的结果！
    fetch(`/search?q=${query}`)
      .then(res => res.json())
      .then(setResults);
  }, [query]);
}
```

**React Query 自动解决**：

```javascript
// ✅ React Query 自动处理竞态
function SearchResults() {
  const [query, setQuery] = useState('');

  const { data: results } = useQuery({
    queryKey: ['search', query],
    queryFn: () => api.get('/search', { params: { q: query } }),
    enabled: query.length > 0
  });

  // React Query 内部机制：
  // 1. 每次 query 变化，创建新的请求
  // 2. 旧请求的结果会被忽略
  // 3. 只有最新请求的结果会更新 data
}
```

**手动处理（AbortController）**：

```javascript
useQuery({
  queryKey: ['search', query],
  queryFn: async ({ signal }) => {
    // signal 会在查询被取消时中止
    const res = await fetch(`/search?q=${query}`, { signal });
    return res.json();
  },
  enabled: query.length > 0
});

// React Query 在新查询开始时会自动取消旧查询
```

**并发多个独立请求**：

```javascript
function Dashboard() {
  // 并发执行，互不影响
  const users = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const posts = useQuery({ queryKey: ['posts'], queryFn: fetchPosts });
  const stats = useQuery({ queryKey: ['stats'], queryFn: fetchStats });

  // 等待所有请求完成
  if (users.isLoading || posts.isLoading || stats.isLoading) {
    return <Loading />;
  }

  return <DashboardContent data={{ users, posts, stats }} />;
}

// 使用 Promise.all 风格
function Dashboard() {
  const results = useQueries({
    queries: [
      { queryKey: ['users'], queryFn: fetchUsers },
      { queryKey: ['posts'], queryFn: fetchPosts },
      { queryKey: ['stats'], queryFn: fetchStats }
    ]
  });

  const isLoading = results.some(r => r.isLoading);
  const allData = results.map(r => r.data);
}
```

---

### Q5: React Query 的缓存策略是怎样的？

**A**: 

**多层缓存机制**：

```javascript
// 1. 查询缓存（Query Cache）
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 缓存配置
      staleTime: 1000 * 60 * 5,   // 5分钟内数据新鲜
      cacheTime: 1000 * 60 * 10,  // 10分钟后垃圾回收
      
      // 重新获取策略
      refetchOnMount: true,        // 组件挂载时
      refetchOnWindowFocus: true,  // 窗口聚焦时
      refetchOnReconnect: true,    // 网络重连时
      
      // 重试策略
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});

// 2. 结构化共享（避免不必要的重渲染）
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (data) => data.filter(t => !t.completed)
});

// 3. 预取缓存
queryClient.prefetchQuery({
  queryKey: ['post', id],
  queryFn: () => fetchPost(id)
});

// 4. 持久化缓存（localStorage/IndexedDB）
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const persister = createSyncStoragePersister({
  storage: window.localStorage
});

persistQueryClient({
  queryClient,
  persister
});
```

**缓存失效策略**：

```javascript
// 1. 时间失效
useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  staleTime: 1000 * 60 * 5 // 5分钟后自动失效
});

// 2. 手动失效
const queryClient = useQueryClient();

// 失效特定查询
queryClient.invalidateQueries({ queryKey: ['todos'] });

// 失效所有查询
queryClient.invalidateQueries();

// 失效匹配的查询
queryClient.invalidateQueries({ 
  queryKey: ['todos'],
  exact: false // 匹配所有以 'todos' 开头的查询
});

// 3. 变更后自动失效
useMutation({
  mutationFn: addTodo,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  }
});

// 4. 条件失效
queryClient.invalidateQueries({
  predicate: (query) => {
    return query.queryKey[0] === 'todos' && 
           query.state.data?.length > 100;
  }
});
```

**缓存更新策略**：

```javascript
// 1. 直接更新缓存（乐观更新）
queryClient.setQueryData(['todo', id], (old) => ({
  ...old,
  completed: true
}));

// 2. 部分更新
queryClient.setQueryData(['todos'], (old) =>
  old.map(todo => 
    todo.id === id ? { ...todo, completed: true } : todo
  )
);

// 3. 从其他缓存初始化
useQuery({
  queryKey: ['todo', id],
  queryFn: () => fetchTodo(id),
  initialData: () => {
    const todos = queryClient.getQueryData(['todos']);
    return todos?.find(t => t.id === id);
  }
});
```

---

### Q6: 如何优化 React Query 的性能？

**A**: 

**1. 合理设置 staleTime**

```javascript
// ❌ 默认配置（频繁请求）
useQuery({
  queryKey: ['static-data'],
  queryFn: fetchStaticData
  // staleTime: 0 - 每次都认为数据过时
});

// ✅ 优化后（减少请求）
useQuery({
  queryKey: ['static-data'],
  queryFn: fetchStaticData,
  staleTime: Infinity // 静态数据永不过时
});

// ✅ 根据数据特性设置
const queries = {
  userProfile: { staleTime: 1000 * 60 * 5 },      // 5分钟
  notifications: { staleTime: 1000 * 30 },         // 30秒
  staticConfig: { staleTime: Infinity },           // 永不过期
  livePrice: { staleTime: 0, refetchInterval: 1000 } // 1秒轮询
};
```

**2. 使用 select 优化重渲染**

```javascript
// ❌ 整个列表变化都会重渲染
function TodoCount() {
  const { data: todos } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos
  });
  
  return <div>Count: {todos?.length}</div>;
}

// ✅ 只在数量变化时重渲染
function TodoCount() {
  const { data: count } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    select: (data) => data.length // 只返回数量
  });
  
  return <div>Count: {count}</div>;
}

// ✅ 复杂过滤
function ActiveTodos() {
  const { data: activeTodos } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    select: (data) => data.filter(t => !t.completed)
  });
}
```

**3. 预取数据（Prefetching）**

```javascript
function PostList() {
  const queryClient = useQueryClient();

  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts
  });

  return posts.map(post => (
    <Link
      key={post.id}
      to={`/posts/${post.id}`}
      // 鼠标悬停时预取
      onMouseEnter={() => {
        queryClient.prefetchQuery({
          queryKey: ['post', post.id],
          queryFn: () => fetchPost(post.id),
          staleTime: 1000 * 60 * 5
        });
      }}
    >
      {post.title}
    </Link>
  ));
}
```

**4. 使用 initialData 和 placeholderData**

```javascript
// initialData - 从列表缓存中获取详情
function PostDetail({ id }) {
  const queryClient = useQueryClient();

  const { data: post } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    initialData: () => {
      // 从列表缓存中找到对应项
      const posts = queryClient.getQueryData(['posts']);
      return posts?.find(p => p.id === id);
    },
    // 设置初始数据的过期时间
    initialDataUpdatedAt: () => 
      queryClient.getQueryState(['posts'])?.dataUpdatedAt
  });
}

// placeholderData - 占位数据
function PostDetail({ id }) {
  const { data: post, isPlaceholderData } = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    placeholderData: {
      title: 'Loading...',
      content: 'Loading content...'
    }
  });

  return (
    <div className={isPlaceholderData ? 'opacity-50' : ''}>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </div>
  );
}
```

**5. 批量查询优化**

```javascript
// ❌ 多次请求
function UserList({ userIds }) {
  return userIds.map(id => <User key={id} id={id} />);
}

function User({ id }) {
  const { data } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id) // N个请求
  });
}

// ✅ 批量请求
import DataLoader from 'dataloader';

const userLoader = new DataLoader(async (ids) => {
  const users = await fetchUsersByIds(ids); // 1个请求
  return ids.map(id => users.find(u => u.id === id));
});

function User({ id }) {
  const { data } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userLoader.load(id)
  });
}
```

**6. 禁用不必要的重新获取**

```javascript
// 静态数据不需要重新获取
useQuery({
  queryKey: ['config'],
  queryFn: fetchConfig,
  staleTime: Infinity,
  cacheTime: Infinity,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false
});

// 后台标签页不需要轮询
useQuery({
  queryKey: ['live-data'],
  queryFn: fetchLiveData,
  refetchInterval: document.visibilityState === 'visible' ? 1000 : false
});
```

---

## 总结

React Query 是现代 React 应用中处理服务端状态的最佳方案之一。

**核心优势**：
- ⚡️ 自动缓存管理
- 🔄 后台自动更新
- 🎯 请求去重
- ⏱️ 并发控制
- 📊 DevTools 支持
- 🔌 开箱即用的分页、无限滚动

**适用场景**：
- ✅ API 数据获取和同步
- ✅ 实时数据展示
- ✅ 列表分页、无限滚动
- ✅ 表单提交和验证
- ✅ 乐观更新

**最佳实践**：
- 合理设置 staleTime 和 cacheTime
- 使用 select 优化组件渲染
- 利用乐观更新提升用户体验
- 配合 TypeScript 确保类型安全
- 使用 React Query DevTools 调试

**技术演进**：
- TanStack Query v5（最新版本）
- 支持更多框架（Vue、Svelte、Solid）
- 更好的 TypeScript 支持
- 更灵活的缓存策略
