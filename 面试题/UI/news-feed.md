# News Feed 新闻动态流系统设计

> Facebook/Twitter/Instagram 风格的新闻动态流系统设计与实现

## 一、系统概述

### 1.1 功能需求

**核心功能**：
- ✅ 展示好友/关注者的动态内容
- ✅ 无限滚动加载
- ✅ 实时更新通知
- ✅ 点赞、评论、分享
- ✅ 内容过滤和排序

**非功能需求**：
- ⚡ 首屏加载时间 < 2s
- ⚡ 滚动流畅（60fps）
- 📦 支持千万级用户
- 🔄 实时性（WebSocket/轮询）
- 📱 响应式设计

---

## 二、架构设计

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                         │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  React   │  │  Redux   │  │ WebSocket│         │
│  │Component │  │  Store   │  │  Client  │         │
│  └──────────┘  └──────────┘  └──────────┘         │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼────┐ ┌───▼────┐ ┌───▼────┐
    │   API   │ │  CDN   │ │WebSocket│
    │ Gateway │ │        │ │ Server │
    └────┬────┘ └────────┘ └───┬────┘
         │                      │
    ┌────▼──────────────────────▼────┐
    │      Application Servers       │
    ├────────────────────────────────┤
    │  - Feed Service                │
    │  - User Service                │
    │  - Post Service                │
    │  - Notification Service        │
    └────┬──────────┬──────────┬─────┘
         │          │          │
    ┌────▼────┐┌───▼────┐┌───▼────┐
    │PostgreSQL││  Redis ││Elasticsearch│
    │(关系数据)││ (缓存) ││  (搜索)  │
    └─────────┘└────────┘└─────────┘
```

### 2.2 数据模型

```typescript
// 用户模型
interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  followers: string[];
  following: string[];
}

// 帖子模型
interface Post {
  id: string;
  authorId: string;
  content: string;
  media: Media[];
  createdAt: string;
  updatedAt: string;
  likes: string[];      // 点赞用户ID列表
  comments: Comment[];
  shares: number;
  visibility: 'public' | 'friends' | 'private';
}

// 媒体模型
interface Media {
  id: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  thumbnail?: string;
  width: number;
  height: number;
}

// 评论模型
interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  likes: string[];
  replies: Comment[];
}

// Feed 项模型
interface FeedItem {
  id: string;
  post: Post;
  author: User;
  engagementScore: number;  // 参与度评分
  timestamp: string;
}
```

---

## 三、前端实现

### 3.1 核心组件实现

```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteScroll } from './hooks/useInfiniteScroll';
import { useFeedWebSocket } from './hooks/useFeedWebSocket';
import './NewsFeed.css';

interface NewsFeedProps {
  userId: string;
}

function NewsFeed({ userId }: NewsFeedProps) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [newPostsCount, setNewPostsCount] = useState(0);

  // WebSocket 连接实时更新
  const { newPosts } = useFeedWebSocket(userId);

  // 加载 Feed 数据
  const loadFeed = useCallback(async (pageNum: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/feed?userId=${userId}&page=${pageNum}&limit=10`
      );
      const data = await response.json();

      if (data.items.length === 0) {
        setHasMore(false);
      } else {
        setFeed(prev => pageNum === 1 ? data.items : [...prev, ...data.items]);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 初始加载
  useEffect(() => {
    loadFeed(1);
  }, [loadFeed]);

  // 监听新帖子
  useEffect(() => {
    if (newPosts.length > 0) {
      setNewPostsCount(prev => prev + newPosts.length);
    }
  }, [newPosts]);

  // 无限滚动
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadFeed(page + 1);
    }
  }, [isLoading, hasMore, page, loadFeed]);

  const { sentinelRef } = useInfiniteScroll({
    onIntersect: loadMore,
    enabled: hasMore && !isLoading,
  });

  // 显示新帖子
  const handleShowNewPosts = () => {
    setFeed(prev => [...newPosts, ...prev]);
    setNewPostsCount(0);
  };

  // 点赞
  const handleLike = async (postId: string) => {
    try {
      await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      // 乐观更新
      setFeed(prev => prev.map(item =>
        item.post.id === postId
          ? {
              ...item,
              post: {
                ...item.post,
                likes: item.post.likes.includes(userId)
                  ? item.post.likes.filter(id => id !== userId)
                  : [...item.post.likes, userId],
              },
            }
          : item
      ));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  return (
    <div className="news-feed">
      {/* 新帖子提醒 */}
      {newPostsCount > 0 && (
        <button className="new-posts-banner" onClick={handleShowNewPosts}>
          {newPostsCount} new post{newPostsCount > 1 ? 's' : ''}
        </button>
      )}

      {/* Feed 列表 */}
      <div className="feed-list">
        {feed.map(item => (
          <FeedCard
            key={item.id}
            item={item}
            onLike={handleLike}
            currentUserId={userId}
          />
        ))}
      </div>

      {/* 加载指示器 */}
      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner" />
        </div>
      )}

      {/* 无限滚动哨兵 */}
      {hasMore && <div ref={sentinelRef} className="sentinel" />}

      {/* 到底提示 */}
      {!hasMore && feed.length > 0 && (
        <div className="end-message">You've reached the end</div>
      )}

      {/* 空状态 */}
      {!isLoading && feed.length === 0 && (
        <div className="empty-state">
          <h3>No posts yet</h3>
          <p>Follow more people to see their posts here</p>
        </div>
      )}
    </div>
  );
}

export default NewsFeed;
```

### 3.2 FeedCard 组件

```tsx
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface FeedCardProps {
  item: FeedItem;
  onLike: (postId: string) => void;
  currentUserId: string;
}

function FeedCard({ item, onLike, currentUserId }: FeedCardProps) {
  const { post, author } = item;
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const isLiked = post.likes.includes(currentUserId);

  const handleComment = async () => {
    if (!commentText.trim()) return;

    try {
      await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: currentUserId,
          content: commentText,
        }),
      });

      setCommentText('');
      // 重新获取评论或更新本地状态
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  return (
    <article className="feed-card">
      {/* 作者信息 */}
      <div className="feed-card-header">
        <img
          src={author.avatar}
          alt={author.displayName}
          className="avatar"
        />
        <div className="author-info">
          <h3>{author.displayName}</h3>
          <span className="timestamp">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </span>
        </div>
        <button className="options-btn">⋯</button>
      </div>

      {/* 内容 */}
      <div className="feed-card-content">
        <p>{post.content}</p>
        
        {/* 媒体内容 */}
        {post.media.length > 0 && (
          <div className={`media-grid media-count-${post.media.length}`}>
            {post.media.map(media => (
              <div key={media.id} className="media-item">
                {media.type === 'image' ? (
                  <img src={media.url} alt="" loading="lazy" />
                ) : (
                  <video src={media.url} controls />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="feed-card-stats">
        <span>{post.likes.length} likes</span>
        <span>{post.comments.length} comments</span>
        <span>{post.shares} shares</span>
      </div>

      {/* 操作按钮 */}
      <div className="feed-card-actions">
        <button
          className={`action-btn ${isLiked ? 'liked' : ''}`}
          onClick={() => onLike(post.id)}
        >
          {isLiked ? '❤️' : '🤍'} Like
        </button>
        <button
          className="action-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 Comment
        </button>
        <button className="action-btn">
          🔗 Share
        </button>
      </div>

      {/* 评论区 */}
      {showComments && (
        <div className="comments-section">
          {/* 评论列表 */}
          {post.comments.map(comment => (
            <div key={comment.id} className="comment">
              <img src={comment.author?.avatar} alt="" className="avatar-sm" />
              <div className="comment-content">
                <strong>{comment.author?.displayName}</strong>
                <p>{comment.content}</p>
                <span className="comment-time">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          ))}

          {/* 评论输入 */}
          <div className="comment-input">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              placeholder="Write a comment..."
            />
            <button onClick={handleComment}>Post</button>
          </div>
        </div>
      )}
    </article>
  );
}

export default FeedCard;
```

### 3.3 自定义 Hooks

```tsx
// hooks/useInfiniteScroll.ts
import { useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
  onIntersect: () => void;
  enabled?: boolean;
  threshold?: number;
}

export function useInfiniteScroll({
  onIntersect,
  enabled = true,
  threshold = 0.5,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          onIntersect();
        }
      },
      { threshold }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [onIntersect, enabled, threshold]);

  return { sentinelRef };
}

// hooks/useFeedWebSocket.ts
import { useEffect, useState } from 'react';

export function useFeedWebSocket(userId: string) {
  const [newPosts, setNewPosts] = useState<FeedItem[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const websocket = new WebSocket(`ws://localhost:8080/feed?userId=${userId}`);

    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_post') {
        setNewPosts(prev => [data.post, ...prev]);
      } else if (data.type === 'post_updated') {
        // 处理帖子更新
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      // 重连逻辑
      setTimeout(() => {
        setWs(new WebSocket(`ws://localhost:8080/feed?userId=${userId}`));
      }, 3000);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [userId]);

  return { newPosts, ws };
}
```

### 3.4 CSS 样式

```css
/* NewsFeed.css */
.news-feed {
  max-width: 680px;
  margin: 0 auto;
  padding: 20px;
}

/* 新帖子横幅 */
.new-posts-banner {
  position: sticky;
  top: 60px;
  z-index: 10;
  width: 100%;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 20px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.new-posts-banner:hover {
  background: #45a049;
}

/* Feed 卡片 */
.feed-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.feed-card-header {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.author-info {
  flex: 1;
}

.author-info h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}

.timestamp {
  font-size: 13px;
  color: #999;
}

.options-btn {
  padding: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #666;
}

/* 内容区 */
.feed-card-content {
  padding: 0 16px 16px;
}

.feed-card-content p {
  margin: 0 0 12px 0;
  font-size: 15px;
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 媒体网格 */
.media-grid {
  display: grid;
  gap: 4px;
  margin-top: 12px;
}

.media-count-1 {
  grid-template-columns: 1fr;
}

.media-count-2 {
  grid-template-columns: repeat(2, 1fr);
}

.media-count-3 {
  grid-template-columns: repeat(2, 1fr);
}

.media-count-3 .media-item:first-child {
  grid-column: 1 / -1;
}

.media-count-4 {
  grid-template-columns: repeat(2, 1fr);
}

.media-item {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.media-item img,
.media-item video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 统计信息 */
.feed-card-stats {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  font-size: 13px;
  color: #666;
}

/* 操作按钮 */
.feed-card-actions {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  border-top: 1px solid #e0e0e0;
}

.action-btn {
  flex: 1;
  padding: 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f0f0f0;
}

.action-btn.liked {
  color: #e74c3c;
}

/* 评论区 */
.comments-section {
  padding: 16px;
  background: #f9f9f9;
  border-top: 1px solid #e0e0e0;
}

.comment {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.comment-content {
  flex: 1;
  background: white;
  padding: 12px;
  border-radius: 12px;
}

.comment-content strong {
  display: block;
  font-size: 14px;
  margin-bottom: 4px;
  color: #1a1a1a;
}

.comment-content p {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.comment-time {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}

.comment-input {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.comment-input input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
}

.comment-input button {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
}

/* 加载指示器 */
.loading-indicator {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #666;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* 到底提示 */
.end-message {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 768px) {
  .news-feed {
    padding: 10px;
  }

  .feed-card {
    border-radius: 0;
    margin-bottom: 10px;
  }
}
```

---

## 四、后端 API 设计

### 4.1 RESTful API

```typescript
// GET /api/feed - 获取 Feed
interface GetFeedRequest {
  userId: string;
  page: number;
  limit: number;
  sortBy?: 'recent' | 'popular' | 'relevant';
  cursor?: string; // 游标分页
}

interface GetFeedResponse {
  items: FeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

// POST /api/posts - 创建帖子
interface CreatePostRequest {
  authorId: string;
  content: string;
  media: Media[];
  visibility: 'public' | 'friends' | 'private';
}

interface CreatePostResponse {
  post: Post;
}

// POST /api/posts/:id/like - 点赞
interface LikePostRequest {
  userId: string;
}

interface LikePostResponse {
  success: boolean;
  likesCount: number;
}

// POST /api/posts/:id/comments - 添加评论
interface CreateCommentRequest {
  authorId: string;
  content: string;
  parentId?: string; // 回复评论
}

interface CreateCommentResponse {
  comment: Comment;
}
```

### 4.2 Feed 生成算法

```typescript
// Feed 排序算法
class FeedRankingService {
  // 计算参与度评分
  calculateEngagementScore(post: Post, user: User): number {
    const timeFactor = this.getTimeFactor(post.createdAt);
    const interactionScore = this.getInteractionScore(post);
    const authorRelevance = this.getAuthorRelevance(post.authorId, user);
    const contentRelevance = this.getContentRelevance(post, user);

    return (
      timeFactor * 0.3 +
      interactionScore * 0.3 +
      authorRelevance * 0.2 +
      contentRelevance * 0.2
    );
  }

  // 时间衰减因子
  private getTimeFactor(createdAt: string): number {
    const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    return Math.exp(-hours / 24); // 24小时衰减
  }

  // 互动评分
  private getInteractionScore(post: Post): number {
    const likes = post.likes.length;
    const comments = post.comments.length;
    const shares = post.shares;

    // 归一化处理
    return Math.log(likes + 1) * 0.4 +
           Math.log(comments + 1) * 0.4 +
           Math.log(shares + 1) * 0.2;
  }

  // 作者相关性
  private getAuthorRelevance(authorId: string, user: User): number {
    if (user.following.includes(authorId)) {
      return 1.0;
    }
    // 检查共同好友
    return 0.5;
  }

  // 内容相关性
  private getContentRelevance(post: Post, user: User): number {
    // 基于用户历史互动的内容推荐
    // 可以使用机器学习模型
    return 0.5;
  }

  // 生成 Feed
  async generateFeed(userId: string, limit: number): Promise<FeedItem[]> {
    // 1. 获取关注的用户
    const user = await this.userService.getUser(userId);
    const followingIds = user.following;

    // 2. 获取这些用户的帖子（最近7天）
    const posts = await this.postService.getRecentPosts(
      followingIds,
      { days: 7, limit: 1000 }
    );

    // 3. 计算每个帖子的评分
    const scoredPosts = posts.map(post => ({
      post,
      score: this.calculateEngagementScore(post, user),
    }));

    // 4. 排序并返回 top N
    return scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({
        id: item.post.id,
        post: item.post,
        author: this.userService.getUser(item.post.authorId),
        engagementScore: item.score,
        timestamp: item.post.createdAt,
      }));
  }
}
```

---

## 五、性能优化

### 5.1 缓存策略

```typescript
// Redis 缓存层
class FeedCacheService {
  private redis: RedisClient;

  // 缓存用户 Feed
  async cacheFeed(userId: string, feed: FeedItem[]): Promise<void> {
    const key = `feed:${userId}`;
    await this.redis.setex(
      key,
      300, // 5分钟过期
      JSON.stringify(feed)
    );
  }

  // 获取缓存
  async getCachedFeed(userId: string): Promise<FeedItem[] | null> {
    const key = `feed:${userId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  // 缓存预热
  async preloadFeed(userId: string): Promise<void> {
    // 异步预加载用户可能需要的 Feed
    const feed = await this.feedService.generateFeed(userId, 20);
    await this.cacheFeed(userId, feed);
  }

  // 清除缓存
  async invalidateFeed(userId: string): Promise<void> {
    const key = `feed:${userId}`;
    await this.redis.del(key);
  }
}
```

### 5.2 虚拟滚动优化

```tsx
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

function VirtualizedFeed({ items }: { items: FeedItem[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <FeedCard item={items[index]} />
    </div>
  );

  return (
    <AutoSizer>
      {({ height, width }) => (
        <FixedSizeList
          height={height}
          width={width}
          itemCount={items.length}
          itemSize={400}
          overscanCount={3}
        >
          {Row}
        </FixedSizeList>
      )}
    </AutoSizer>
  );
}
```

### 5.3 图片懒加载和优化

```tsx
import { LazyLoadImage } from 'react-lazy-load-image-component';

function OptimizedImage({ src, alt }: { src: string; alt: string }) {
  // 使用 CDN 提供不同尺寸的图片
  const getSrcSet = (url: string) => {
    return `
      ${url}?w=320 320w,
      ${url}?w=640 640w,
      ${url}?w=1024 1024w
    `;
  };

  return (
    <LazyLoadImage
      src={src}
      srcSet={getSrcSet(src)}
      sizes="(max-width: 640px) 320px, (max-width: 1024px) 640px, 1024px"
      alt={alt}
      effect="blur"
      threshold={100}
    />
  );
}
```

### 5.4 数据预取

```tsx
// 预取下一页数据
function usePrefetchNextPage(currentPage: number, userId: string) {
  useEffect(() => {
    const prefetch = async () => {
      const nextPage = currentPage + 1;
      const response = await fetch(
        `/api/feed?userId=${userId}&page=${nextPage}&limit=10`
      );
      const data = await response.json();
      
      // 缓存到内存或 IndexedDB
      cacheService.set(`feed-page-${nextPage}`, data);
    };

    // 延迟预取
    const timer = setTimeout(prefetch, 500);
    return () => clearTimeout(timer);
  }, [currentPage, userId]);
}
```

---

## 六、实时更新实现

### 6.1 WebSocket 服务端

```typescript
import WebSocket from 'ws';

class FeedWebSocketServer {
  private wss: WebSocket.Server;
  private userConnections: Map<string, Set<WebSocket>>;

  constructor(port: number) {
    this.wss = new WebSocket.Server({ port });
    this.userConnections = new Map();
    this.init();
  }

  private init() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const userId = this.extractUserId(req);
      
      // 保存连接
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(ws);

      ws.on('close', () => {
        this.userConnections.get(userId)?.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  // 推送新帖子给相关用户
  async broadcastNewPost(post: Post) {
    // 获取所有关注该作者的用户
    const followers = await this.userService.getFollowers(post.authorId);

    followers.forEach(followerId => {
      const connections = this.userConnections.get(followerId);
      if (connections) {
        const message = JSON.stringify({
          type: 'new_post',
          post,
        });

        connections.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          }
        });
      }
    });
  }

  // 推送点赞通知
  notifyLike(postId: string, userId: string) {
    // 通知帖子作者
    // ...
  }
}
```

### 6.2 长轮询备用方案

```typescript
// 长轮询作为 WebSocket 的降级方案
async function pollForUpdates(userId: string, lastUpdateTime: string) {
  const response = await fetch(
    `/api/feed/updates?userId=${userId}&since=${lastUpdateTime}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // 长连接超时 30 秒
      signal: AbortSignal.timeout(30000),
    }
  );

  const data = await response.json();

  if (data.updates.length > 0) {
    // 处理更新
    return data;
  }

  // 继续轮询
  return pollForUpdates(userId, data.timestamp);
}
```

---

## 七、扩展性考虑

### 7.1 分片策略

```typescript
// 按用户 ID 进行分片
class ShardingService {
  private readonly SHARD_COUNT = 16;

  getUserShard(userId: string): number {
    // 一致性哈希
    const hash = this.hashCode(userId);
    return Math.abs(hash) % this.SHARD_COUNT;
  }

  getPostShard(postId: string): number {
    const hash = this.hashCode(postId);
    return Math.abs(hash) % this.SHARD_COUNT;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}
```

### 7.2 读写分离

```typescript
// 主从架构
class DatabaseService {
  private master: Database;
  private replicas: Database[];

  // 写操作走主库
  async write(query: string, params: any[]): Promise<any> {
    return this.master.query(query, params);
  }

  // 读操作走从库（负载均衡）
  async read(query: string, params: any[]): Promise<any> {
    const replica = this.getRandomReplica();
    return replica.query(query, params);
  }

  private getRandomReplica(): Database {
    const index = Math.floor(Math.random() * this.replicas.length);
    return this.replicas[index];
  }
}
```

---

## 八、监控和指标

### 8.1 关键指标

```typescript
interface FeedMetrics {
  // 性能指标
  loadTime: number;           // Feed 加载时间
  renderTime: number;         // 渲染时间
  scrollFPS: number;          // 滚动帧率

  // 业务指标
  postsViewed: number;        // 浏览帖子数
  postsLiked: number;         // 点赞数
  postsCommented: number;     // 评论数
  timeSpent: number;          // 停留时间

  // 技术指标
  cacheHitRate: number;       // 缓存命中率
  apiLatency: number;         // API 延迟
  wsConnections: number;      // WebSocket 连接数
  errorRate: number;          // 错误率
}

// 监控服务
class MetricsService {
  track(event: string, properties: Record<string, any>) {
    // 发送到监控系统（如 Datadog, New Relic）
    fetch('/api/metrics', {
      method: 'POST',
      body: JSON.stringify({ event, properties, timestamp: Date.now() }),
    });
  }

  trackPerformance(name: string, duration: number) {
    if (window.performance) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }
    
    this.track('performance', { name, duration });
  }
}
```

---

## 九、安全性考虑

### 9.1 内容过滤

```typescript
// 敏感内容检测
class ContentModerationService {
  async checkContent(content: string): Promise<boolean> {
    // 1. 关键词过滤
    const hasBlockedWords = this.containsBlockedWords(content);
    if (hasBlockedWords) return false;

    // 2. AI 内容审核
    const aiResult = await this.aiModerationAPI.check(content);
    if (aiResult.score > 0.8) return false;

    // 3. 垃圾信息检测
    const isSpam = await this.spamDetector.check(content);
    if (isSpam) return false;

    return true;
  }

  private containsBlockedWords(content: string): boolean {
    // 敏感词检测
    return false;
  }
}
```

### 9.2 访问控制

```typescript
// 权限验证
class PermissionService {
  canViewPost(userId: string, post: Post): boolean {
    // 公开帖子
    if (post.visibility === 'public') return true;

    // 私有帖子只有作者可见
    if (post.visibility === 'private') {
      return post.authorId === userId;
    }

    // 好友可见
    if (post.visibility === 'friends') {
      return this.userService.isFriend(userId, post.authorId);
    }

    return false;
  }
}
```

---

## 十、面试要点总结

### 10.1 系统设计问题

**Q1: 如何处理海量数据？**
- 分片策略（按用户/时间分片）
- 读写分离
- 缓存层（Redis）
- CDN 加速

**Q2: 如何保证实时性？**
- WebSocket 推送
- 长轮询备选
- 服务端推送（SSE）
- 消息队列

**Q3: 如何优化首屏加载？**
- 预渲染关键内容
- 骨架屏
- 资源预加载
- 代码分割

**Q4: 如何排序 Feed？**
- 时间衰减算法
- 参与度评分
- 个性化推荐
- A/B 测试

### 10.2 技术选型

| 需求 | 技术方案 |
|------|---------|
| 前端框架 | React + TypeScript |
| 状态管理 | Redux / Context |
| 实时通信 | WebSocket / Socket.io |
| 虚拟滚动 | react-window |
| 图片优化 | CDN + 懒加载 |
| 缓存 | Redis |
| 数据库 | PostgreSQL (主) + Elasticsearch (搜索) |
| 消息队列 | Kafka / RabbitMQ |

---

## 总结

News Feed 系统是一个复杂的分布式系统，需要考虑：

- ✅ **性能**：首屏加载、无限滚动、虚拟列表
- ✅ **实时性**：WebSocket、长轮询
- ✅ **扩展性**：分片、缓存、CDN
- ✅ **用户体验**：流畅滚动、乐观更新
- ✅ **内容排序**：算法推荐、个性化
- ✅ **安全性**：内容审核、权限控制

这是一个典型的大型互联网产品系统设计题！🎯