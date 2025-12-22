# 照片分享应用

## 核心实现

### 基础结构
```jsx
function PhotoSharingApp() {
  const [photos, setPhotos] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    const newPhoto = await response.json();
    setPhotos([newPhoto, ...photos]);
  };

  return (
    <div className="app">
      <PhotoUploader onUpload={handleUpload} />
      <PhotoGrid photos={photos} onSelect={setSelectedPhoto} />
      {selectedPhoto && (
        <PhotoModal 
          photo={selectedPhoto} 
          onClose={() => setSelectedPhoto(null)} 
        />
      )}
    </div>
  );
}

// 上传组件
function PhotoUploader({ onUpload }) {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 验证文件类型和大小
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    // 预览
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await onUpload(file);
      setPreview(null);
      fileInputRef.current.value = '';
    } catch (error) {
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button onClick={() => fileInputRef.current.click()}>
        选择照片
      </button>
      {preview && (
        <div className="preview">
          <img src={preview} alt="预览" />
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? '上传中...' : '上传'}
          </button>
        </div>
      )}
    </div>
  );
}

// 照片网格
function PhotoGrid({ photos, onSelect }) {
  return (
    <div className="photo-grid">
      {photos.map(photo => (
        <div 
          key={photo.id} 
          className="photo-item"
          onClick={() => onSelect(photo)}
        >
          <img src={photo.thumbnail} alt={photo.title} />
          <div className="photo-info">
            <span>{photo.likes} ❤️</span>
            <span>{photo.comments} 💬</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// 照片详情弹窗
function PhotoModal({ photo, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    await fetch(`/api/photos/${photo.id}/like`, { method: 'POST' });
    setLiked(!liked);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const response = await fetch(`/api/photos/${photo.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newComment })
    });

    const comment = await response.json();
    setComments([...comments, comment]);
    setNewComment('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose}>×</button>
        <div className="photo-container">
          <img src={photo.url} alt={photo.title} />
        </div>
        <div className="photo-sidebar">
          <div className="photo-header">
            <img src={photo.author.avatar} alt={photo.author.name} />
            <span>{photo.author.name}</span>
          </div>
          <div className="photo-actions">
            <button onClick={handleLike}>
              {liked ? '❤️' : '🤍'} {photo.likes + (liked ? 1 : 0)}
            </button>
          </div>
          <div className="comments">
            {comments.map(comment => (
              <div key={comment.id} className="comment">
                <strong>{comment.author}</strong>
                <p>{comment.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleComment}>
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="添加评论..."
            />
            <button type="submit">发送</button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

### 样式
```css
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  padding: 16px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;
  border-radius: 8px;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.photo-item:hover img {
  transform: scale(1.05);
}

.photo-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  padding: 8px;
  display: flex;
  justify-content: space-between;
  color: white;
}

.modal-content {
  display: flex;
  max-width: 1200px;
  max-height: 90vh;
  background: white;
  border-radius: 8px;
}

.photo-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.photo-container img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
}

.photo-sidebar {
  width: 350px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #ddd;
}

.comments {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
```

## 关键要点

### 1. 图片优化
```jsx
// 压缩图片
async function compressImage(file, maxWidth = 1920, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// 使用
const handleUpload = async (file) => {
  const compressed = await compressImage(file);
  const formData = new FormData();
  formData.append('photo', compressed);
  // 上传...
};
```

### 2. 懒加载
```jsx
function LazyImage({ src, alt, placeholder }) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className="lazy-image">
      {!loaded && <div className="placeholder">{placeholder}</div>}
      {inView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0 }}
        />
      )}
    </div>
  );
}
```

### 3. 无限滚动
```jsx
function InfinitePhotoGrid() {
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/photos?page=${page}`);
      const data = await response.json();
      
      setPhotos(prev => [...prev, ...data.photos]);
      setPage(prev => prev + 1);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('加载失败', error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <PhotoGrid photos={photos} />
      <div ref={loaderRef}>
        {loading && <div>加载中...</div>}
      </div>
    </>
  );
}
```

## 高级功能

### 1. 图片裁剪
```jsx
import Cropper from 'react-easy-crop';

function ImageCropper({ image, onCropComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedArea(croppedAreaPixels);
  };

  const handleSave = async () => {
    const croppedImage = await getCroppedImg(image, croppedArea);
    onCropComplete(croppedImage);
  };

  return (
    <div className="cropper-container">
      <Cropper
        image={image}
        crop={crop}
        zoom={zoom}
        aspect={1}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={handleCropComplete}
      />
      <div className="controls">
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(e.target.value)}
        />
        <button onClick={handleSave}>保存</button>
      </div>
    </div>
  );
}

async function getCroppedImg(imageSrc, crop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg');
  });
}
```

### 2. 滤镜效果
```jsx
function PhotoFilters({ image, onApplyFilter }) {
  const canvasRef = useRef(null);

  const applyFilter = (filterType) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      switch (filterType) {
        case 'grayscale':
          for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = data[i + 1] = data[i + 2] = avg;
          }
          break;
        case 'sepia':
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
            data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
            data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
          }
          break;
        case 'brightness':
          const brightness = 50;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] + brightness);
            data[i + 1] = Math.min(255, data[i + 1] + brightness);
            data[i + 2] = Math.min(255, data[i + 2] + brightness);
          }
          break;
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob(onApplyFilter);
    };
    
    img.src = image;
  };

  return (
    <div className="filters">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button onClick={() => applyFilter('grayscale')}>黑白</button>
      <button onClick={() => applyFilter('sepia')}>复古</button>
      <button onClick={() => applyFilter('brightness')}>增亮</button>
    </div>
  );
}
```

### 3. 拖拽上传
```jsx
function DragDropUploader({ onUpload }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    imageFiles.forEach(onUpload);
  };

  return (
    <div
      className={`drop-zone ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      拖拽图片到这里上传
    </div>
  );
}
```

## 面试要点

**Q: 如何优化图片加载性能？**
- 使用缩略图和渐进式加载
- 实现懒加载（Intersection Observer）
- 图片压缩和格式优化（WebP）
- CDN 加速和缓存策略

**Q: 如何处理大量图片上传？**
- 批量上传和进度显示
- 使用 Web Worker 处理图片
- 分片上传大文件
- 断点续传功能

**Q: 如何实现图片预览和编辑？**
- Canvas API 实现滤镜和裁剪
- 第三方库（Cropper.js, fabric.js）
- 前端压缩减少传输量
- 实时预览效果

**Q: 如何保证图片安全？**
- 验证文件类型和大小
- 服务端再次验证
- 防止 XSS 攻击（CSP）
- 水印和版权保护
