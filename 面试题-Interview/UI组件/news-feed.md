# News Feed 新闻动态流

> 实现类似 Facebook/Twitter 的新闻动态流系统

## 一、核心实现

```jsx
import React, { useState, useEffect, useRef } from 'react';

function NewsFeed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef();

  // 加载数据
  const loadPosts = async (pageNum) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/feed?page=${pageNum}`);
      const newPosts = await response.json();
      
      setPosts(prev => [...prev, ...newPosts]);
      setHasMore(newPosts.length > 0);
    } finally {
      setLoading(false);
    }
  };

  // 无限滚动
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  useEffect(() => {
    loadPosts(page);
  }, [page]);

  return (
    <div className="feed">
      {posts.map(post => (
        <Post key={post.id} data={post} />
      ))}
      
      {loading && <div>Loading...</div>}
      <div ref={observerRef} />
    </div>
  );
}

function Post({ data }) {
  const [liked, setLiked] = useState(data.liked);
  const [likeCount, setLikeCount] = useState(data.likeCount);

  const handleLike = async () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    
    await fetch(`/api/posts/${data.id}/like`, {
      method: 'POST',
      body: JSON.stringify({ liked: !liked })
    });
  };

  return (
    <div className="post">
      <div className="post-header">
        <img src={data.avatar} alt={data.author} />
        <div>
          <h4>{data.author}</h4>
          <span>{data.timestamp}</span>
        </div>
      </div>
      
      <div className="post-content">{data.content}</div>
      
      {data.image && <img src={data.image} alt="" />}
      
      <div className="post-actions">
        <button onClick={handleLike}>
          {liked ? '❤️' : '🤍'} {likeCount}
        </button>
        <button>💬 {data.commentCount}</button>
        <button>🔄 Share</button>
      </div>
    </div>
  );
}
```

## 二、性能优化

### 2.1 虚拟滚动

```jsx
import { FixedSizeList } from 'react-window';

function VirtualFeed({ posts }) {
  return (
    <FixedSizeList
      height={800}
      itemCount={posts.length}
      itemSize={200}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <Post data={posts[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

### 2.2 图片懒加载

```jsx
function LazyImage({ src, alt }) {
  const [imageSrc, setImageSrc] = useState(null);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <img 
      ref={imgRef}
      src={imageSrc || '/placeholder.png'}
      alt={alt}
    />
  );
}
```

### 2.3 防抖优化

```jsx
import { debounce } from 'lodash';

const debouncedFetch = debounce((query) => {
  fetch(`/api/search?q=${query}`);
}, 300);
```

## 三、实时更新

### 3.1 WebSocket

```jsx
function useRealTimeUpdates() {
  const [newPostsCount, setNewPostsCount] = useState(0);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_post') {
        setNewPostsCount(prev => prev + 1);
      }
    };

    return () => ws.close();
  }, []);

  const loadNewPosts = () => {
    // 加载新内容
    setNewPostsCount(0);
  };

  return { newPostsCount, loadNewPosts };
}
```

### 3.2 轮询

```jsx
function usePolling(interval = 30000) {
  useEffect(() => {
    const timer = setInterval(() => {
      checkForUpdates();
    }, interval);

    return () => clearInterval(timer);
  }, []);
}
```

## 四、关键知识点

### 4.1 无限滚动

**Intersection Observer API:**
```jsx
const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      loadMore();
    }
  },
  { threshold: 1.0 }
);
```

### 4.2 乐观更新

```jsx
const handleLike = async () => {
  // 1. 立即更新 UI
  setLiked(true);
  setLikeCount(prev => prev + 1);

  try {
    // 2. 发送请求
    await api.likePost(postId);
  } catch (error) {
    // 3. 失败时回滚
    setLiked(false);
    setLikeCount(prev => prev - 1);
  }
};
```

### 4.3 缓存策略

```jsx
const cache = new Map();

async function fetchPost(id) {
  if (cache.has(id)) {
    return cache.get(id);
  }

  const data = await fetch(`/api/posts/${id}`);
  cache.set(id, data);
  return data;
}
```

## 五、面试要点

**Q1: 如何实现无限滚动？**
- Intersection Observer 监听底部元素
- 触发时增加页码，加载新数据
- 追加到现有列表

**Q2: 如何优化性能？**
- 虚拟滚动（react-window）
- 图片懒加载
- 防抖/节流
- 分页加载

**Q3: 如何实现实时更新？**
- WebSocket 推送
- 轮询（polling）
- Server-Sent Events (SSE)

**Q4: 乐观更新是什么？**
- 先更新 UI
- 再发送请求
- 失败时回滚

**Q5: 千万级用户如何设计？**
- 数据库：分库分表，读写分离
- 缓存：Redis 多级缓存
- CDN：静态资源加速
- 消息队列：异步处理

---

**总结：** 核心是无限滚动 + 性能优化 + 实时更新 + 缓存策略
