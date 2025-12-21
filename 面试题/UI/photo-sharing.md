# Photo Sharing System 照片分享系统设计（Instagram）

> 设计一个类似 Instagram 的照片分享平台，包含前端架构、后端服务、存储方案和优化策略

## 一、需求分析

### 1.1 功能需求

**核心功能**
- ✅ 照片上传和发布
- ✅ Feed 流展示（关注用户的照片）
- ✅ 点赞、评论、分享
- ✅ 用户关注/取消关注
- ✅ 个人主页
- ✅ 照片详情页
- ✅ 搜索功能

**进阶功能**
- ✅ Stories（24小时后消失）
- ✅ Direct Messages（私信）
- ✅ 滤镜和编辑
- ✅ 视频支持
- ✅ Reels（短视频）
- ✅ Live 直播
- ✅ 推荐算法

### 1.2 非功能需求

- 📊 **规模**: 10亿+ 用户，每天上传 5亿+ 照片
- ⚡ **性能**: Feed 加载 < 1s，图片加载 < 2s
- 🔒 **安全**: 内容审核、隐私保护
- 📱 **可用性**: 99.9% 可用性
- 🌍 **全球化**: CDN 分发，多区域部署
- 💾 **存储**: PB 级别图片存储

### 1.3 技术挑战

1. **海量图片存储** - 如何高效存储和检索
2. **高并发读写** - Feed 生成和刷新
3. **实时更新** - 点赞、评论实时同步
4. **推荐算法** - 个性化内容推荐
5. **图片处理** - 压缩、裁剪、滤镜
6. **CDN 分发** - 全球快速访问

---

## 二、系统架构

### 2.1 整体架构图

```
┌──────────────────────────────────────────────────────────────┐
│                         Client Layer                          │
├──────────────────────────────────────────────────────────────┤
│  Mobile App (iOS/Android)  │  Web App (React/Next.js)        │
│  Progressive Web App (PWA)  │  Desktop App (Electron)        │
└─────────────────────────┬────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                      API Gateway                              │
├──────────────────────────────────────────────────────────────┤
│  Rate Limiting │ Auth │ Load Balancer │ API Versioning      │
└─────────────────────────┬────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼───────┐  ┌──────▼──────┐  ┌──────▼──────┐
│  User Service │  │Feed Service │  │Media Service│
├───────────────┤  ├─────────────┤  ├─────────────┤
│ - Profile     │  │ - Timeline  │  │ - Upload    │
│ - Follow      │  │ - Discovery │  │ - Process   │
│ - Auth        │  │ - Ranking   │  │ - Transform │
└───────┬───────┘  └──────┬──────┘  └──────┬──────┘
        │                 │                 │
┌───────▼───────┐  ┌──────▼──────┐  ┌──────▼──────┐
│Social Service │  │Search Service│ │Storage Layer│
├───────────────┤  ├─────────────┤  ├─────────────┤
│ - Like        │  │ - User      │  │ - S3/OSS    │
│ - Comment     │  │ - Photo     │  │ - CDN       │
│ - Share       │  │ - Tag       │  │ - Blob      │
└───────┬───────┘  └──────┬──────┘  └──────┬──────┘
        │                 │                 │
┌───────▼──────────────────▼─────────────────▼──────┐
│                   Data Layer                       │
├────────────────────────────────────────────────────┤
│ MySQL/PostgreSQL │ MongoDB │ Redis │ Elasticsearch│
│ Cassandra │ Kafka │ RabbitMQ │ Neo4j (Graph DB)   │
└────────────────────────────────────────────────────┘
```

### 2.2 数据库设计

#### 2.2.1 用户表（users）

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(500),
  phone VARCHAR(20),
  verified BOOLEAN DEFAULT FALSE,
  private_account BOOLEAN DEFAULT FALSE,
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  posts_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2.2.2 照片表（photos）

```sql
CREATE TABLE photos (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  caption TEXT,
  image_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  width INT,
  height INT,
  file_size INT,
  format VARCHAR(10),
  filter VARCHAR(50),
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2.2.3 关注关系表（follows）

```sql
CREATE TABLE follows (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  follower_id BIGINT NOT NULL,
  followee_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (followee_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (follower_id, followee_id),
  INDEX idx_follower (follower_id),
  INDEX idx_followee (followee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2.2.4 点赞表（likes）

```sql
CREATE TABLE likes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  photo_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (user_id, photo_id),
  INDEX idx_user_id (user_id),
  INDEX idx_photo_id (photo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2.2.5 评论表（comments）

```sql
CREATE TABLE comments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  photo_id BIGINT NOT NULL,
  parent_id BIGINT DEFAULT NULL,
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_photo_id (photo_id),
  INDEX idx_user_id (user_id),
  INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 三、前端实现

### 3.1 Feed 流组件

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { PhotoCard } from './PhotoCard';
import { Skeleton } from './Skeleton';
import './Feed.css';

interface Photo {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  imageUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
}

interface FeedProps {
  userId?: string;
}

function Feed({ userId }: FeedProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // 无限滚动
  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  // 加载照片
  const loadPhotos = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/feed?page=${page}&limit=10${userId ? `&userId=${userId}` : ''}`
      );
      const data = await response.json();

      if (data.photos.length === 0) {
        setHasMore(false);
      } else {
        setPhotos(prev => [...prev, ...data.photos]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, userId]);

  // 首次加载
  useEffect(() => {
    loadPhotos();
  }, []);

  // 滚动到底部时加载更多
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadPhotos();
    }
  }, [inView, hasMore, loading, loadPhotos]);

  // 点赞
  const handleLike = useCallback(async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        setPhotos(prev =>
          prev.map(photo =>
            photo.id === photoId
              ? {
                  ...photo,
                  isLiked: !photo.isLiked,
                  likesCount: photo.isLiked
                    ? photo.likesCount - 1
                    : photo.likesCount + 1,
                }
              : photo
          )
        );
      }
    } catch (error) {
      console.error('Failed to like photo:', error);
    }
  }, []);

  // 保存
  const handleSave = useCallback(async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}/save`, {
        method: 'POST',
      });

      if (response.ok) {
        setPhotos(prev =>
          prev.map(photo =>
            photo.id === photoId
              ? { ...photo, isSaved: !photo.isSaved }
              : photo
          )
        );
      }
    } catch (error) {
      console.error('Failed to save photo:', error);
    }
  }, []);

  return (
    <div className="feed">
      <div className="feed-container">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onLike={handleLike}
            onSave={handleSave}
          />
        ))}

        {/* 加载指示器 */}
        {loading && (
          <div className="feed-loading">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        )}

        {/* 无限滚动触发器 */}
        {hasMore && <div ref={ref} style={{ height: 20 }} />}

        {/* 没有更多内容 */}
        {!hasMore && photos.length > 0 && (
          <div className="feed-end">
            <p>You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Feed;
```

### 3.2 照片卡片组件

```tsx
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import './PhotoCard.css';

interface PhotoCardProps {
  photo: Photo;
  onLike: (photoId: string) => void;
  onSave: (photoId: string) => void;
}

function PhotoCard({ photo, onLike, onSave }: PhotoCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleDoubleClick = () => {
    if (!photo.isLiked) {
      onLike(photo.id);
    }
  };

  return (
    <article className="photo-card">
      {/* 头部 - 用户信息 */}
      <header className="photo-card-header">
        <div className="user-info">
          <img
            src={photo.userAvatar}
            alt={photo.username}
            className="user-avatar"
          />
          <a href={`/${photo.username}`} className="username">
            {photo.username}
          </a>
        </div>
        <button className="more-btn" aria-label="More options">
          •••
        </button>
      </header>

      {/* 图片 */}
      <div className="photo-card-image-wrapper">
        {!imageLoaded && (
          <div className="photo-card-skeleton" />
        )}
        <img
          src={photo.imageUrl}
          alt={photo.caption || 'Photo'}
          className="photo-card-image"
          onLoad={() => setImageLoaded(true)}
          onDoubleClick={handleDoubleClick}
        />
      </div>

      {/* 操作栏 */}
      <div className="photo-card-actions">
        <div className="actions-left">
          <button
            className={`action-btn ${photo.isLiked ? 'liked' : ''}`}
            onClick={() => onLike(photo.id)}
            aria-label={photo.isLiked ? 'Unlike' : 'Like'}
          >
            {photo.isLiked ? '❤️' : '🤍'}
          </button>
          <button
            className="action-btn"
            onClick={() => setShowComments(!showComments)}
            aria-label="Comment"
          >
            💬
          </button>
          <button className="action-btn" aria-label="Share">
            ✈️
          </button>
        </div>
        <button
          className={`action-btn ${photo.isSaved ? 'saved' : ''}`}
          onClick={() => onSave(photo.id)}
          aria-label={photo.isSaved ? 'Unsave' : 'Save'}
        >
          {photo.isSaved ? '🔖' : '📑'}
        </button>
      </div>

      {/* 点赞数 */}
      <div className="photo-card-likes">
        <strong>{photo.likesCount.toLocaleString()} likes</strong>
      </div>

      {/* 标题和评论 */}
      <div className="photo-card-caption">
        <a href={`/${photo.username}`} className="username">
          {photo.username}
        </a>{' '}
        <span className="caption-text">{photo.caption}</span>
      </div>

      {/* 查看评论 */}
      {photo.commentsCount > 0 && (
        <button
          className="view-comments-btn"
          onClick={() => setShowComments(!showComments)}
        >
          View all {photo.commentsCount} comments
        </button>
      )}

      {/* 时间 */}
      <time className="photo-card-time">
        {formatDistanceToNow(new Date(photo.createdAt), { addSuffix: true })}
      </time>

      {/* 评论区 */}
      {showComments && (
        <div className="photo-card-comments">
          {/* 评论列表组件 */}
        </div>
      )}
    </article>
  );
}

export default PhotoCard;
```

### 3.3 照片上传组件

```tsx
import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import './PhotoUpload.css';

interface PhotoUploadProps {
  onUpload: (file: File) => void;
}

function PhotoUpload({ onUpload }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
  });

  const handleUpload = async () => {
    if (!preview) return;

    setUploading(true);

    try {
      // 将 base64 转为 Blob
      const response = await fetch(preview);
      const blob = await response.blob();
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

      // 创建 FormData
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('caption', caption);

      // 上传照片
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          onUpload(data.photo);
          setPreview(null);
          setCaption('');
          setProgress(0);
        }
      });

      xhr.open('POST', '/api/photos');
      xhr.send(formData);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="photo-upload">
      {!preview ? (
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          <div className="dropzone-content">
            <svg className="upload-icon" viewBox="0 0 24 24">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
            <p className="dropzone-text">
              {isDragActive ? 'Drop the photo here' : 'Drag and drop a photo, or click to select'}
            </p>
            <p className="dropzone-hint">
              Maximum file size: 10MB
            </p>
          </div>
        </div>
      ) : (
        <div className="photo-preview">
          <img src={preview} alt="Preview" className="preview-image" />

          <div className="photo-details">
            <textarea
              className="caption-input"
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={2200}
            />

            {uploading && (
              <div className="upload-progress">
                <div
                  className="progress-bar"
                  style={{ width: `${progress}%` }}
                />
                <span className="progress-text">{Math.round(progress)}%</span>
              </div>
            )}

            <div className="upload-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setPreview(null)}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoUpload;
```

---

## 四、后端实现

### 4.1 Feed 生成服务（Node.js）

```typescript
import express from 'express';
import Redis from 'ioredis';
import { generateFeed, getFeedFromCache } from './feedService';

const app = express();
const redis = new Redis();

// Feed API
app.get('/api/feed', async (req, res) => {
  const { userId, page = 1, limit = 10 } = req.query;
  const startTime = Date.now();

  try {
    // 1. 检查缓存
    const cacheKey = `feed:${userId}:${page}:${limit}`;
    const cached = await getFeedFromCache(cacheKey);

    if (cached) {
      return res.json({
        photos: cached,
        page: Number(page),
        hasMore: cached.length === Number(limit),
        metadata: {
          took: Date.now() - startTime,
          cached: true,
        },
      });
    }

    // 2. 生成 Feed
    const photos = await generateFeed(userId as string, {
      page: Number(page),
      limit: Number(limit),
    });

    // 3. 缓存结果（5分钟）
    await redis.setex(cacheKey, 300, JSON.stringify(photos));

    res.json({
      photos,
      page: Number(page),
      hasMore: photos.length === Number(limit),
      metadata: {
        took: Date.now() - startTime,
        cached: false,
      },
    });
  } catch (error) {
    console.error('Feed generation error:', error);
    res.status(500).json({ error: 'Failed to generate feed' });
  }
});

// Feed 生成逻辑
async function generateFeed(
  userId: string,
  options: { page: number; limit: number }
) {
  const { page, limit } = options;
  const offset = (page - 1) * limit;

  // 1. 获取用户关注列表
  const following = await db.query(
    'SELECT followee_id FROM follows WHERE follower_id = ?',
    [userId]
  );
  const followingIds = following.map((f: any) => f.followee_id);

  if (followingIds.length === 0) {
    // 新用户，返回推荐内容
    return getRecommendedPhotos(userId, limit);
  }

  // 2. 获取关注用户的照片（按时间倒序）
  const photos = await db.query(
    `
    SELECT 
      p.*,
      u.username,
      u.avatar_url,
      EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND photo_id = p.id) as is_liked,
      EXISTS(SELECT 1 FROM saves WHERE user_id = ? AND photo_id = p.id) as is_saved
    FROM photos p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id IN (?)
      AND p.is_deleted = FALSE
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `,
    [userId, userId, followingIds, limit, offset]
  );

  // 3. 混入推荐内容（个性化算法）
  const recommended = await getRecommendedPhotos(userId, 3);
  const mixed = mixFeedWithRecommendations(photos, recommended);

  return mixed;
}

// 推荐照片
async function getRecommendedPhotos(userId: string, limit: number) {
  // 基于用户兴趣、热门内容、协同过滤等
  const photos = await db.query(
    `
    SELECT 
      p.*,
      u.username,
      u.avatar_url,
      (p.likes_count * 0.4 + p.comments_count * 0.3 + p.shares_count * 0.3) as score
    FROM photos p
    JOIN users u ON p.user_id = u.id
    WHERE p.is_deleted = FALSE
      AND p.user_id != ?
    ORDER BY score DESC, p.created_at DESC
    LIMIT ?
  `,
    [userId, limit]
  );

  return photos;
}

app.listen(3000, () => {
  console.log('Feed service running on port 3000');
});
```

---

### 4.2 照片上传服务

```typescript
import multer from 'multer';
import sharp from 'sharp';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
});

// 上传照片
app.post('/api/photos', upload.single('photo'), async (req, res) => {
  const { userId, caption } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const photoId = uuidv4();

    // 1. 图片处理
    const processed = await processImage(file.buffer);

    // 2. 上传到 S3
    const uploadPromises = [
      uploadToS3(processed.original, `photos/${photoId}/original.jpg`),
      uploadToS3(processed.large, `photos/${photoId}/large.jpg`),
      uploadToS3(processed.medium, `photos/${photoId}/medium.jpg`),
      uploadToS3(processed.thumbnail, `photos/${photoId}/thumbnail.jpg`),
    ];

    const [originalUrl, largeUrl, mediumUrl, thumbnailUrl] =
      await Promise.all(uploadPromises);

    // 3. 保存到数据库
    const photo = await db.query(
      `
      INSERT INTO photos (
        id, user_id, caption, image_url, thumbnail_url,
        width, height, file_size, format
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        photoId,
        userId,
        caption,
        largeUrl,
        thumbnailUrl,
        processed.metadata.width,
        processed.metadata.height,
        file.size,
        processed.metadata.format,
      ]
    );

    // 4. 更新用户照片计数
    await db.query(
      'UPDATE users SET posts_count = posts_count + 1 WHERE id = ?',
      [userId]
    );

    // 5. 推送到粉丝的 Feed（异步）
    await publishPhotoToFollowers(userId, photoId);

    res.json({
      photo: {
        id: photoId,
        imageUrl: largeUrl,
        thumbnailUrl,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// 图片处理
async function processImage(buffer: Buffer) {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  // 生成不同尺寸
  const [original, large, medium, thumbnail] = await Promise.all([
    // 原图（最大 4096px）
    image
      .resize(4096, 4096, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer(),

    // 大图（1080px）
    image
      .resize(1080, 1080, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer(),

    // 中图（640px）
    image
      .resize(640, 640, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer(),

    // 缩略图（320px）
    image
      .resize(320, 320, { fit: 'cover' })
      .jpeg({ quality: 75 })
      .toBuffer(),
  ]);

  return {
    original,
    large,
    medium,
    thumbnail,
    metadata,
  };
}

// 上传到 S3
async function uploadToS3(buffer: Buffer, key: string): Promise<string> {
  const params = {
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: 'image/jpeg',
    ACL: 'public-read',
  };

  const result = await s3.upload(params).promise();
  return result.Location;
}

// 推送到粉丝 Feed
async function publishPhotoToFollowers(userId: string, photoId: string) {
  // 获取粉丝列表
  const followers = await db.query(
    'SELECT follower_id FROM follows WHERE followee_id = ?',
    [userId]
  );

  // 使用 Fan-out 模式推送到每个粉丝的 Feed
  const fanoutPromises = followers.map(async (follower: any) => {
    const feedKey = `feed:${follower.follower_id}`;
    
    // 添加到 Redis Sorted Set（按时间戳排序）
    await redis.zadd(feedKey, Date.now(), photoId);
    
    // 保留最新 500 条
    await redis.zremrangebyrank(feedKey, 0, -501);
    
    // 设置过期时间（7天）
    await redis.expire(feedKey, 7 * 24 * 60 * 60);
  });

  await Promise.all(fanoutPromises);
}
```

---

### 4.3 实时更新（WebSocket）

```typescript
import { WebSocketServer } from 'ws';
import Redis from 'ioredis';

const wss = new WebSocketServer({ port: 8080 });
const redis = new Redis();
const redisSub = new Redis();

// 用户连接映射
const connections = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws, req) => {
  const userId = new URLSearchParams(req.url?.split('?')[1]).get('userId');

  if (!userId) {
    ws.close(1008, 'User ID required');
    return;
  }

  // 添加连接
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(ws);

  console.log(`User ${userId} connected. Total: ${connections.get(userId)!.size}`);

  ws.on('close', () => {
    connections.get(userId)?.delete(ws);
    if (connections.get(userId)?.size === 0) {
      connections.delete(userId);
    }
  });

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      await handleMessage(userId, data);
    } catch (error) {
      console.error('Message error:', error);
    }
  });
});

// 订阅 Redis 频道
redisSub.subscribe('photo:like', 'photo:comment', 'photo:new');

redisSub.on('message', (channel, message) => {
  const data = JSON.parse(message);

  switch (channel) {
    case 'photo:like':
      broadcastToFollowers(data.userId, {
        type: 'like',
        photoId: data.photoId,
        userId: data.likedBy,
        username: data.username,
      });
      break;

    case 'photo:comment':
      broadcastToFollowers(data.userId, {
        type: 'comment',
        photoId: data.photoId,
        comment: data.comment,
      });
      break;

    case 'photo:new':
      broadcastToFollowers(data.userId, {
        type: 'new_photo',
        photo: data.photo,
      });
      break;
  }
});

// 广播给粉丝
async function broadcastToFollowers(userId: string, message: any) {
  const followers = await db.query(
    'SELECT follower_id FROM follows WHERE followee_id = ?',
    [userId]
  );

  followers.forEach((follower: any) => {
    const userConnections = connections.get(follower.follower_id);
    if (userConnections) {
      userConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
    }
  });
}

console.log('WebSocket server running on port 8080');
```

---

## 五、性能优化

### 5.1 CDN 和图片优化

```typescript
// 1. 响应式图片
function getResponsiveImageUrl(photoId: string, width: number): string {
  const cdnBase = 'https://cdn.instagram.com';
  
  if (width <= 320) {
    return `${cdnBase}/photos/${photoId}/thumbnail.jpg`;
  } else if (width <= 640) {
    return `${cdnBase}/photos/${photoId}/medium.jpg`;
  } else if (width <= 1080) {
    return `${cdnBase}/photos/${photoId}/large.jpg`;
  } else {
    return `${cdnBase}/photos/${photoId}/original.jpg`;
  }
}

// 2. 图片懒加载
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <img
      ref={imgRef}
      src={imageSrc || 'data:image/svg+xml;base64,...'} // placeholder
      alt={alt}
      loading="lazy"
    />
  );
}

// 3. 图片预加载
function preloadImages(urls: string[]) {
  urls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}

// 4. WebP 格式支持
function getOptimizedImageUrl(photoId: string): string {
  const supportsWebP = document
    .createElement('canvas')
    .toDataURL('image/webp')
    .indexOf('data:image/webp') === 0;

  const format = supportsWebP ? 'webp' : 'jpg';
  return `https://cdn.instagram.com/photos/${photoId}/large.${format}`;
}
```

---

### 5.2 Feed 缓存策略

```typescript
// 多级缓存架构
class FeedCache {
  private l1: Map<string, any>; // 内存缓存
  private l2: Redis;             // Redis 缓存
  private l3: Database;          // 数据库

  constructor(redis: Redis, db: Database) {
    this.l1 = new Map();
    this.l2 = redis;
    this.l3 = db;
  }

  async get(userId: string, page: number): Promise<Photo[]> {
    const key = `feed:${userId}:${page}`;

    // L1: 内存缓存（最快，TTL 1分钟）
    if (this.l1.has(key)) {
      const cached = this.l1.get(key);
      if (Date.now() - cached.timestamp < 60000) {
        return cached.data;
      }
    }

    // L2: Redis 缓存（快，TTL 5分钟）
    const redisData = await this.l2.get(key);
    if (redisData) {
      const data = JSON.parse(redisData);
      this.l1.set(key, { data, timestamp: Date.now() });
      return data;
    }

    // L3: 数据库（慢）
    const dbData = await this.generateFeed(userId, page);
    
    // 回填缓存
    this.l1.set(key, { data: dbData, timestamp: Date.now() });
    await this.l2.setex(key, 300, JSON.stringify(dbData));

    return dbData;
  }

  async invalidate(userId: string) {
    // 清除所有分页缓存
    for (let page = 1; page <= 10; page++) {
      const key = `feed:${userId}:${page}`;
      this.l1.delete(key);
      await this.l2.del(key);
    }
  }

  private async generateFeed(userId: string, page: number): Promise<Photo[]> {
    // Feed 生成逻辑
    return [];
  }
}
```

---

### 5.3 数据库优化

```sql
-- 1. 分库分表（按用户 ID）
CREATE TABLE photos_0 LIKE photos;
CREATE TABLE photos_1 LIKE photos;
-- ... 创建 256 个表

-- 2. 读写分离
-- Master: 写操作
-- Slave: 读操作

-- 3. 索引优化
CREATE INDEX idx_user_created ON photos(user_id, created_at DESC);
CREATE INDEX idx_likes_photo ON likes(photo_id, created_at DESC);
CREATE INDEX idx_comments_photo ON comments(photo_id, created_at DESC);

-- 4. 分区表（按时间）
ALTER TABLE photos PARTITION BY RANGE (YEAR(created_at)) (
  PARTITION p2023 VALUES LESS THAN (2024),
  PARTITION p2024 VALUES LESS THAN (2025),
  PARTITION p2025 VALUES LESS THAN (2026)
);

-- 5. 物化视图（热门照片）
CREATE MATERIALIZED VIEW hot_photos AS
SELECT 
  p.*,
  (p.likes_count * 0.4 + p.comments_count * 0.3 + p.shares_count * 0.3) as score
FROM photos p
WHERE p.created_at > NOW() - INTERVAL 7 DAY
ORDER BY score DESC
LIMIT 1000;

-- 定时刷新
REFRESH MATERIALIZED VIEW hot_photos;
```

---

## 六、推荐算法

### 6.1 个性化推荐

```typescript
interface UserProfile {
  userId: string;
  interests: string[];          // 兴趣标签
  viewedPhotos: string[];        // 浏览历史
  likedPhotos: string[];         // 点赞历史
  followingTopics: string[];     // 关注话题
}

class RecommendationEngine {
  // 计算照片推荐分数
  async calculateScore(userId: string, photo: Photo): Promise<number> {
    const profile = await this.getUserProfile(userId);

    let score = 0;

    // 1. 内容质量分（40%）
    score += this.getQualityScore(photo) * 0.4;

    // 2. 用户兴趣匹配度（30%）
    score += this.getInterestScore(profile, photo) * 0.3;

    // 3. 社交关系分（20%）
    score += await this.getSocialScore(userId, photo) * 0.2;

    // 4. 时效性分（10%）
    score += this.getRecencyScore(photo) * 0.1;

    return score;
  }

  // 内容质量分
  private getQualityScore(photo: Photo): number {
    const engagementRate =
      (photo.likesCount + photo.commentsCount * 2 + photo.sharesCount * 3) /
      (photo.viewsCount || 1);

    return Math.min(engagementRate * 100, 100);
  }

  // 兴趣匹配度
  private getInterestScore(profile: UserProfile, photo: Photo): number {
    const photoTags = photo.tags || [];
    const matchedInterests = photoTags.filter((tag) =>
      profile.interests.includes(tag)
    );

    return (matchedInterests.length / photoTags.length) * 100;
  }

  // 社交关系分
  private async getSocialScore(userId: string, photo: Photo): Promise<number> {
    // 1. 是否有共同关注
    const mutualFollows = await this.getMutualFollows(userId, photo.userId);

    // 2. 朋友是否点赞/评论
    const friendEngagement = await this.getFriendEngagement(userId, photo.id);

    return (mutualFollows * 50 + friendEngagement * 50) / 100;
  }

  // 时效性分
  private getRecencyScore(photo: Photo): number {
    const ageInHours =
      (Date.now() - new Date(photo.createdAt).getTime()) / (1000 * 60 * 60);

    // 24小时内最高分，之后线性衰减
    if (ageInHours <= 24) {
      return 100;
    } else if (ageInHours <= 168) {
      // 7天
      return 100 - ((ageInHours - 24) / 144) * 80;
    } else {
      return 20;
    }
  }

  // 生成推荐列表
  async getRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<Photo[]> {
    // 1. 候选集生成（协同过滤 + 内容推荐）
    const candidates = await this.getCandidates(userId, limit * 10);

    // 2. 排序
    const scored = await Promise.all(
      candidates.map(async (photo) => ({
        photo,
        score: await this.calculateScore(userId, photo),
      }))
    );

    scored.sort((a, b) => b.score - a.score);

    // 3. 去重和过滤
    const filtered = this.deduplicateAndFilter(scored, userId);

    // 4. 多样性保证（避免单一类型）
    const diversified = this.ensureDiversity(filtered);

    return diversified.slice(0, limit).map((item) => item.photo);
  }

  // 候选集生成
  private async getCandidates(
    userId: string,
    limit: number
  ): Promise<Photo[]> {
    const profile = await this.getUserProfile(userId);

    // 1. 协同过滤：相似用户喜欢的内容
    const similarUsers = await this.findSimilarUsers(userId);
    const collaborative = await this.getPhotosLikedBySimilarUsers(
      similarUsers,
      limit / 2
    );

    // 2. 基于内容：用户感兴趣的标签
    const contentBased = await this.getPhotosByInterests(
      profile.interests,
      limit / 2
    );

    return [...collaborative, ...contentBased];
  }

  // 保证多样性
  private ensureDiversity(
    items: Array<{ photo: Photo; score: number }>
  ): Array<{ photo: Photo; score: number }> {
    const result: Array<{ photo: Photo; score: number }> = [];
    const usedAuthors = new Set<string>();
    const usedCategories = new Set<string>();

    for (const item of items) {
      // 限制同一作者的照片数量
      if (usedAuthors.has(item.photo.userId)) {
        const authorCount = result.filter(
          (r) => r.photo.userId === item.photo.userId
        ).length;
        if (authorCount >= 2) continue;
      }

      // 限制同一类别的照片数量
      const category = item.photo.category;
      if (usedCategories.has(category)) {
        const categoryCount = result.filter(
          (r) => r.photo.category === category
        ).length;
        if (categoryCount >= 5) continue;
      }

      result.push(item);
      usedAuthors.add(item.photo.userId);
      usedCategories.add(category);
    }

    return result;
  }
}
```

---

## 七、安全和隐私

### 7.1 内容审核

```typescript
import AWS from 'aws-sdk';

const rekognition = new AWS.Rekognition();

// 图片审核
async function moderateImage(imageUrl: string): Promise<{
  approved: boolean;
  reasons: string[];
}> {
  try {
    // 1. AWS Rekognition 检测不当内容
    const response = await rekognition
      .detectModerationLabels({
        Image: { S3Object: { Bucket: 'photos', Name: imageUrl } },
        MinConfidence: 60,
      })
      .promise();

    const labels = response.ModerationLabels || [];
    const reasons: string[] = [];

    // 2. 检查违规标签
    const violationLabels = [
      'Explicit Nudity',
      'Violence',
      'Visually Disturbing',
      'Hate Symbols',
    ];

    labels.forEach((label) => {
      if (
        label.Name &&
        violationLabels.includes(label.Name) &&
        (label.Confidence || 0) > 80
      ) {
        reasons.push(label.Name);
      }
    });

    // 3. 文本检测（OCR）
    const textResponse = await rekognition
      .detectText({
        Image: { S3Object: { Bucket: 'photos', Name: imageUrl } },
      })
      .promise();

    const texts = textResponse.TextDetections || [];
    const extractedText = texts
      .map((t) => t.DetectedText)
      .join(' ')
      .toLowerCase();

    // 4. 敏感词检测
    const sensitiveWords = ['spam', 'fake', 'scam'];
    const hasSensitiveWords = sensitiveWords.some((word) =>
      extractedText.includes(word)
    );

    if (hasSensitiveWords) {
      reasons.push('Sensitive words detected');
    }

    return {
      approved: reasons.length === 0,
      reasons,
    };
  } catch (error) {
    console.error('Moderation error:', error);
    // 审核失败时，人工复审
    return { approved: false, reasons: ['Requires manual review'] };
  }
}

// 自动处理审核结果
async function handleModerationResult(photoId: string, result: any) {
  if (!result.approved) {
    // 1. 标记照片
    await db.query(
      'UPDATE photos SET is_moderated = TRUE, moderation_status = ? WHERE id = ?',
      ['rejected', photoId]
    );

    // 2. 通知用户
    await notifyUser(photoId, 'Your photo was removed due to: ' + result.reasons.join(', '));

    // 3. 记录日志
    await db.query(
      'INSERT INTO moderation_logs (photo_id, reasons, created_at) VALUES (?, ?, NOW())',
      [photoId, JSON.stringify(result.reasons)]
    );

    // 4. 严重违规：封禁用户
    const violations = await db.query(
      'SELECT COUNT(*) as count FROM moderation_logs WHERE photo_id IN (SELECT id FROM photos WHERE user_id = (SELECT user_id FROM photos WHERE id = ?)) AND created_at > NOW() - INTERVAL 30 DAY',
      [photoId]
    );

    if (violations[0].count >= 3) {
      await banUser(photoId);
    }
  }
}
```

---

## 八、监控和分析

### 8.1 性能监控

```typescript
import prometheus from 'prom-client';

// 创建指标
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
});

const feedLoadTime = new prometheus.Histogram({
  name: 'feed_load_time_seconds',
  help: 'Feed load time in seconds',
  labelNames: ['user_id'],
});

const photoUploadSize = new prometheus.Histogram({
  name: 'photo_upload_size_bytes',
  help: 'Size of uploaded photos in bytes',
});

const activeUsers = new prometheus.Gauge({
  name: 'active_users_total',
  help: 'Number of active users',
});

// 中间件：记录请求时长
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration);
  });

  next();
});

// 暴露指标端点
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

---

## 九、面试要点

### Q1: 如何设计 Feed 生成系统？

**两种模式：**

1. **Pull 模式（读扩散）**
   - 用户请求时，实时从关注列表获取内容
   - 优点：存储少，实时性好
   - 缺点：读取慢，关注多时性能差

2. **Push 模式（写扩散）**
   - 发布照片时，推送到所有粉丝的 Feed
   - 优点：读取快
   - 缺点：存储大，粉丝多时写入慢

**Instagram 采用混合模式：**
- 普通用户：Push 模式（< 100万粉丝）
- 大V：Pull 模式（> 100万粉丝）
- 结合 Redis 缓存热门内容

### Q2: 如何处理海量图片存储？

**方案：**
1. **对象存储** - S3/OSS，支持 PB 级别
2. **CDN 加速** - CloudFront/阿里云CDN
3. **分级存储** - 热数据 SSD，冷数据归档
4. **图片压缩** - WebP、AVIF 格式
5. **多尺寸** - 缩略图、中图、大图、原图

### Q3: 如何优化 Feed 加载性能？

**优化策略：**
1. **多级缓存** - 内存 + Redis + 数据库
2. **预加载** - 提前生成 Feed 缓存
3. **分页加载** - 无限滚动
4. **虚拟滚动** - 只渲染可见区域
5. **图片懒加载** - Intersection Observer
6. **预取** - 预加载下一页数据

### Q4: 如何设计推荐算法？

**核心因素：**
1. **用户兴趣** - 浏览/点赞历史
2. **社交关系** - 关注、共同好友
3. **内容质量** - 互动率、完播率
4. **时效性** - 新鲜度衰减
5. **多样性** - 避免信息茧房

**算法：**
- 协同过滤（User-based、Item-based）
- 内容推荐（标签匹配）
- 深度学习（Wide & Deep、DSSM）

### Q5: 如何处理高并发点赞？

**方案：**
1. **异步处理** - 队列（Kafka/RabbitMQ）
2. **Redis 计数器** - INCR/DECR 原子操作
3. **批量写入** - 定时刷新到数据库
4. **乐观锁** - 版本号控制
5. **防重复** - 用户ID + 照片ID 唯一索引

```typescript
// Redis 原子操作
async function likePhoto(userId: string, photoId: string) {
  const key = `photo:${photoId}:likes`;
  const userLikeKey = `user:${userId}:photo:${photoId}:liked`;

  // 1. 检查是否已点赞
  const isLiked = await redis.exists(userLikeKey);
  if (isLiked) return;

  // 2. Redis 计数器
  await redis.incr(key);
  await redis.set(userLikeKey, '1', 'EX', 86400);

  // 3. 异步写入数据库
  await queue.publish('like', { userId, photoId });
}
```

---

## 总结

### 技术栈
**前端：**
- React / Next.js
- TypeScript
- React Query
- Intersection Observer
- Service Worker (PWA)

**后端：**
- Node.js / Go / Java
- Redis（缓存、计数器）
- MySQL（用户、照片）
- MongoDB（评论、消息）
- Cassandra（时间序列）
- Elasticsearch（搜索）
- Kafka（消息队列）

**存储：**
- S3 / OSS（图片）
- CDN（分发）
- Redis（缓存）

### 核心优化
- ✅ 多级缓存（内存 + Redis + CDN）
- ✅ 异步处理（队列）
- ✅ 读写分离（主从）
- ✅ 分库分表（Sharding）
- ✅ CDN 加速
- ✅ 图片压缩和懒加载

### 扩展性
- ✅ 微服务架构
- ✅ 水平扩展
- ✅ 负载均衡
- ✅ 多区域部署

这是大厂系统设计面试的经典题目！🎯