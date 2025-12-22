# Image Carousel 图片轮播

> 实现一个图片轮播组件，支持自动播放、手势滑动、缩略图导航

## 一、基础实现

```jsx
import React, { useState, useEffect } from 'react';

function Carousel({ images, autoPlay = true, interval = 3000 }) {
  const [current, setCurrent] = useState(0);

  // 自动播放
  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, images.length]);

  const goToSlide = (index) => {
    setCurrent(index);
  };

  const goToPrev = () => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrent((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="carousel">
      {/* 图片区域 */}
      <div className="carousel-inner">
        {images.map((image, index) => (
          <div
            key={index}
            className={`carousel-item ${index === current ? 'active' : ''}`}
          >
            <img src={image.src} alt={image.alt} />
          </div>
        ))}
      </div>

      {/* 左右箭头 */}
      <button className="carousel-prev" onClick={goToPrev}>
        ‹
      </button>
      <button className="carousel-next" onClick={goToNext}>
        ›
      </button>

      {/* 指示器 */}
      <div className="carousel-indicators">
        {images.map((_, index) => (
          <button
            key={index}
            className={index === current ? 'active' : ''}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
}
```

```css
.carousel {
  position: relative;
  width: 100%;
  height: 400px;
  overflow: hidden;
}

.carousel-inner {
  display: flex;
  transition: transform 0.5s ease;
}

.carousel-item {
  min-width: 100%;
  display: none;
}

.carousel-item.active {
  display: block;
}

.carousel-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-prev,
.carousel-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  font-size: 30px;
  padding: 10px 15px;
  cursor: pointer;
}

.carousel-prev {
  left: 10px;
}

.carousel-next {
  right: 10px;
}

.carousel-indicators {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.carousel-indicators button {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}

.carousel-indicators button.active {
  background: white;
}
```

## 二、滑动手势支持

```jsx
function SwipeCarousel({ images }) {
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    const distance = touchStart - touchEnd;
    const threshold = 50; // 最小滑动距离

    if (distance > threshold) {
      // 向左滑
      setCurrent((prev) => (prev + 1) % images.length);
    } else if (distance < -threshold) {
      // 向右滑
      setCurrent((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  return (
    <div
      className="carousel"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="carousel-inner"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((image, index) => (
          <div key={index} className="carousel-item">
            <img src={image.src} alt={image.alt} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 三、懒加载优化

```jsx
function LazyCarousel({ images }) {
  const [current, setCurrent] = useState(0);
  const [loadedImages, setLoadedImages] = useState(new Set([0]));

  useEffect(() => {
    // 预加载当前、前一张、后一张
    const toLoad = [
      current,
      (current - 1 + images.length) % images.length,
      (current + 1) % images.length
    ];

    setLoadedImages(prev => new Set([...prev, ...toLoad]));
  }, [current, images.length]);

  return (
    <div className="carousel">
      {images.map((image, index) => (
        <div key={index} className={`carousel-item ${index === current ? 'active' : ''}`}>
          {loadedImages.has(index) ? (
            <img src={image.src} alt={image.alt} />
          ) : (
            <div className="placeholder" />
          )}
        </div>
      ))}
    </div>
  );
}
```

## 四、缩略图导航

```jsx
function ThumbnailCarousel({ images }) {
  const [current, setCurrent] = useState(0);

  return (
    <div className="carousel-container">
      {/* 主图 */}
      <div className="carousel-main">
        <img src={images[current].src} alt={images[current].alt} />
      </div>

      {/* 缩略图 */}
      <div className="carousel-thumbnails">
        {images.map((image, index) => (
          <div
            key={index}
            className={`thumbnail ${index === current ? 'active' : ''}`}
            onClick={() => setCurrent(index)}
          >
            <img src={image.thumbnail || image.src} alt={image.alt} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 五、无障碍性

```jsx
function AccessibleCarousel({ images }) {
  const [current, setCurrent] = useState(0);

  return (
    <div
      className="carousel"
      role="region"
      aria-label="图片轮播"
    >
      <div
        className="carousel-inner"
        role="group"
        aria-roledescription="slide"
        aria-label={`第 ${current + 1} 张，共 ${images.length} 张`}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className={`carousel-item ${index === current ? 'active' : ''}`}
            aria-hidden={index !== current}
          >
            <img src={image.src} alt={image.alt} />
          </div>
        ))}
      </div>

      <button
        onClick={goToPrev}
        aria-label="上一张"
      >
        ‹
      </button>
      <button
        onClick={goToNext}
        aria-label="下一张"
      >
        ›
      </button>

      {/* 实时通知 */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        正在显示第 {current + 1} 张图片
      </div>
    </div>
  );
}
```

## 六、面试要点

**Q1: 如何实现自动播放？**
```jsx
useEffect(() => {
  const timer = setInterval(() => {
    setCurrent(prev => (prev + 1) % images.length);
  }, interval);
  return () => clearInterval(timer);
}, []);
```

**Q2: 如何实现手势滑动？**
- touchStart: 记录起始位置
- touchMove: 跟踪移动
- touchEnd: 计算滑动距离，判断方向

**Q3: 如何优化性能？**
- 懒加载：只加载当前和相邻图片
- 预加载：提前加载下一张
- 虚拟化：大量图片时使用虚拟列表

**Q4: 循环播放的边界处理？**
```jsx
// 向前：(current - 1 + length) % length
// 向后：(current + 1) % length
```

**Q5: 无障碍性要点？**
- `role="region"` 定义区域
- `aria-label` 描述轮播
- `aria-live` 实时通知变化
- 键盘导航支持

---

**总结：** 核心是索引管理 + 定时器 + 手势识别 + 无障碍
