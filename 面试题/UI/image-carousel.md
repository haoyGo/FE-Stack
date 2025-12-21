# Image Carousel 图片轮播组件实现

> 实现一个功能完整的图片轮播组件，支持自动播放、手势滑动、缩略图等功能

## 一、效果预览

```
┌─────────────────────────────────────────┐
│          ← [Image 2 of 5] →            │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │        [  IMAGE  ]              │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│          ● ○ ○ ○ ○                     │
│  [Thumb1] [Thumb2] [Thumb3] ...        │
└─────────────────────────────────────────┘
```

## 二、基础实现（React）

### 2.1 简单版本

```jsx
import React, { useState } from 'react';
import './ImageCarousel.css';

interface Image {
  id: string;
  url: string;
  alt: string;
  caption?: string;
}

interface ImageCarouselProps {
  images: Image[];
  autoPlay?: boolean;
  interval?: number;
}

function ImageCarousel({ 
  images, 
  autoPlay = false, 
  interval = 3000 
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 下一张
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  // 上一张
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // 跳转到指定图片
  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  // 自动播放
  React.useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      handleNext();
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, currentIndex]);

  if (images.length === 0) {
    return <div className="carousel-empty">No images to display</div>;
  }

  const currentImage = images[currentIndex];

  return (
    <div className="carousel">
      {/* 主图区域 */}
      <div className="carousel-main">
        {/* 前后按钮 */}
        {images.length > 1 && (
          <>
            <button 
              className="carousel-btn carousel-btn-prev"
              onClick={handlePrev}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button 
              className="carousel-btn carousel-btn-next"
              onClick={handleNext}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}

        {/* 图片 */}
        <img
          src={currentImage.url}
          alt={currentImage.alt}
          className="carousel-image"
        />

        {/* 标题 */}
        {currentImage.caption && (
          <div className="carousel-caption">
            {currentImage.caption}
          </div>
        )}

        {/* 计数器 */}
        <div className="carousel-counter">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* 指示点 */}
      {images.length > 1 && (
        <div className="carousel-dots">
          {images.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => handleDotClick(index)}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageCarousel;
```

### 2.2 基础 CSS

```css
/* ImageCarousel.css */
.carousel {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

/* 主图区域 */
.carousel-main {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #1a1a1a;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
}

/* 前后按钮 */
.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 32px;
  font-weight: 300;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  z-index: 10;
}

.carousel-btn:hover {
  background: white;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.carousel-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.carousel-btn-prev {
  left: 16px;
}

.carousel-btn-next {
  right: 16px;
}

/* 标题 */
.carousel-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  font-size: 16px;
  text-align: center;
}

/* 计数器 */
.carousel-counter {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

/* 指示点 */
.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: #000;
}

.carousel-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s;
  padding: 0;
}

.carousel-dot:hover {
  transform: scale(1.2);
  background: rgba(255, 255, 255, 0.5);
}

.carousel-dot.active {
  background: white;
  transform: scale(1.3);
}

/* 空状态 */
.carousel-empty {
  padding: 60px 20px;
  text-align: center;
  color: #999;
  font-size: 16px;
}

/* 响应式 */
@media (max-width: 768px) {
  .carousel-btn {
    width: 40px;
    height: 40px;
    font-size: 24px;
  }

  .carousel-btn-prev {
    left: 8px;
  }

  .carousel-btn-next {
    right: 8px;
  }
}
```

---

## 三、进阶功能实现

### 3.1 支持滑动手势

```jsx
import React, { useState, useRef, useEffect } from 'react';
import './ImageCarousel.css';

function ImageCarousel({ images, autoPlay = false, interval = 3000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // 切换图片
  const goToSlide = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleNext = () => {
    goToSlide((currentIndex + 1) % images.length);
  };

  const handlePrev = () => {
    goToSlide((currentIndex - 1 + images.length) % images.length);
  };

  // 触摸事件
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const current = e.touches[0].clientX;
    setTouchEnd(current);
    setOffset(current - touchStart);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const minSwipeDistance = 50;
    const distance = touchStart - touchEnd;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    setOffset(0);
    setTouchStart(0);
    setTouchEnd(0);
  };

  // 鼠标拖拽（桌面端）
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStart(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const current = e.clientX;
    setTouchEnd(current);
    setOffset(current - touchStart);
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  // 自动播放
  useEffect(() => {
    if (!autoPlay || isDragging) return;

    const timer = setInterval(handleNext, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, currentIndex, isDragging]);

  const containerWidth = containerRef.current?.offsetWidth || 0;
  const translateX = -currentIndex * containerWidth + offset;

  return (
    <div className="carousel" ref={containerRef}>
      <div className="carousel-main">
        {/* 前后按钮 */}
        <button 
          className="carousel-btn carousel-btn-prev"
          onClick={handlePrev}
          aria-label="Previous image"
        >
          ‹
        </button>
        <button 
          className="carousel-btn carousel-btn-next"
          onClick={handleNext}
          aria-label="Next image"
        >
          ›
        </button>

        {/* 图片轨道 */}
        <div
          className="carousel-track"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {images.map((image, index) => (
            <div key={image.id} className="carousel-slide">
              <img
                src={image.url}
                alt={image.alt}
                className="carousel-image"
                draggable={false}
              />
              {image.caption && (
                <div className="carousel-caption">{image.caption}</div>
              )}
            </div>
          ))}
        </div>

        {/* 计数器 */}
        <div className="carousel-counter">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* 指示点 */}
      <div className="carousel-dots">
        {images.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default ImageCarousel;
```

### 3.2 添加缩略图导航

```jsx
function ImageCarouselWithThumbs({ images, autoPlay = false, interval = 3000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    
    // 滚动缩略图到可见区域
    if (thumbsRef.current) {
      const thumbElement = thumbsRef.current.children[index] as HTMLElement;
      thumbElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  // ... 其他逻辑

  return (
    <div className="carousel-with-thumbs">
      {/* 主轮播 */}
      <div className="carousel-main">
        {/* ... 主图显示 */}
      </div>

      {/* 缩略图 */}
      <div className="carousel-thumbs" ref={thumbsRef}>
        {images.map((image, index) => (
          <button
            key={image.id}
            className={`carousel-thumb ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          >
            <img src={image.url} alt={image.alt} />
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 3.3 缩略图 CSS

```css
/* 缩略图容器 */
.carousel-thumbs {
  display: flex;
  gap: 8px;
  padding: 12px;
  overflow-x: auto;
  scroll-behavior: smooth;
  background: #1a1a1a;
}

.carousel-thumbs::-webkit-scrollbar {
  height: 6px;
}

.carousel-thumbs::-webkit-scrollbar-track {
  background: #333;
}

.carousel-thumbs::-webkit-scrollbar-thumb {
  background: #666;
  border-radius: 3px;
}

.carousel-thumb {
  flex-shrink: 0;
  width: 80px;
  height: 60px;
  border: 3px solid transparent;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  padding: 0;
  background: none;
}

.carousel-thumb:hover {
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

.carousel-thumb.active {
  border-color: white;
  transform: scale(1.1);
}

.carousel-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

---

## 四、完整功能版本

### 4.1 支持懒加载和预加载

```jsx
import React, { useState, useEffect, useRef } from 'react';

function LazyImageCarousel({ images, autoPlay = false, interval = 3000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
  const imageRefs = useRef<Map<number, HTMLImageElement>>(new Map());

  // 预加载相邻图片
  useEffect(() => {
    const preloadIndexes = [
      currentIndex,
      (currentIndex + 1) % images.length,
      (currentIndex - 1 + images.length) % images.length,
    ];

    preloadIndexes.forEach((index) => {
      if (!loadedImages.has(index)) {
        const img = new Image();
        img.src = images[index].url;
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, index]));
        };
      }
    });
  }, [currentIndex, images, loadedImages]);

  // IntersectionObserver 懒加载
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src && !img.src) {
              img.src = src;
              img.onload = () => {
                img.classList.add('loaded');
              };
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    imageRefs.current.forEach((img) => {
      if (img) observer.observe(img);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="carousel">
      {images.map((image, index) => (
        <div
          key={image.id}
          className={`carousel-slide ${index === currentIndex ? 'active' : ''}`}
        >
          <img
            ref={(el) => {
              if (el) imageRefs.current.set(index, el);
            }}
            data-src={image.url}
            src={loadedImages.has(index) ? image.url : undefined}
            alt={image.alt}
            className="carousel-image"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
```

### 4.2 支持缩放和全屏

```jsx
import React, { useState } from 'react';

function ZoomableCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // 全屏切换
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 缩放
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 1));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="carousel" ref={containerRef}>
      <div className="carousel-main">
        <img
          src={images[currentIndex].url}
          alt={images[currentIndex].alt}
          className="carousel-image"
          style={{
            transform: `scale(${scale})`,
            transition: 'transform 0.3s ease',
          }}
        />

        {/* 控制按钮 */}
        <div className="carousel-controls">
          <button onClick={handleZoomIn} title="Zoom in">🔍+</button>
          <button onClick={handleZoomOut} title="Zoom out">🔍-</button>
          <button onClick={handleResetZoom} title="Reset zoom">↺</button>
          <button onClick={toggleFullscreen} title="Fullscreen">
            {isFullscreen ? '⊗' : '⛶'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 4.3 无限循环轮播

```jsx
function InfiniteCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(1); // 从1开始，0是克隆的最后一张
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // 创建无限循环的图片数组（首尾各添加一张）
  const infiniteImages = [
    images[images.length - 1], // 克隆最后一张
    ...images,
    images[0], // 克隆第一张
  ];

  const handleTransitionEnd = () => {
    setIsTransitioning(false);

    // 到达克隆的图片时，瞬间跳回真实位置
    if (currentIndex === 0) {
      setCurrentIndex(images.length);
    } else if (currentIndex === infiniteImages.length - 1) {
      setCurrentIndex(1);
    }
  };

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev + 1);
  };

  const goToPrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev - 1);
  };

  return (
    <div className="carousel">
      <div
        className="carousel-track"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: isTransitioning ? 'transform 0.3s ease' : 'none',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {infiniteImages.map((image, index) => (
          <div key={`${image.id}-${index}`} className="carousel-slide">
            <img src={image.url} alt={image.alt} />
          </div>
        ))}
      </div>

      <button onClick={goToPrev}>‹</button>
      <button onClick={goToNext}>›</button>
    </div>
  );
}
```

---

## 五、原生 JavaScript 实现

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Image Carousel</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      background: #f0f0f0;
      padding: 40px 20px;
    }

    .carousel {
      max-width: 800px;
      margin: 0 auto;
      position: relative;
      background: #000;
      border-radius: 12px;
      overflow: hidden;
    }

    .carousel-main {
      position: relative;
      aspect-ratio: 16 / 9;
      overflow: hidden;
    }

    .carousel-track {
      display: flex;
      transition: transform 0.3s ease-out;
      height: 100%;
    }

    .carousel-slide {
      min-width: 100%;
      height: 100%;
    }

    .carousel-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      user-select: none;
    }

    .carousel-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 32px;
      z-index: 10;
      transition: all 0.3s;
    }

    .carousel-btn:hover {
      background: white;
      transform: translateY(-50%) scale(1.1);
    }

    .carousel-btn-prev {
      left: 16px;
    }

    .carousel-btn-next {
      right: 16px;
    }

    .carousel-dots {
      display: flex;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      background: #000;
    }

    .carousel-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 2px solid white;
      background: transparent;
      cursor: pointer;
      transition: all 0.3s;
    }

    .carousel-dot.active {
      background: white;
      transform: scale(1.3);
    }

    .carousel-counter {
      position: absolute;
      top: 16px;
      right: 16px;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border-radius: 20px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="carousel"></div>

  <script>
    class ImageCarousel {
      constructor(container, options = {}) {
        this.container = container;
        this.images = options.images || [];
        this.autoPlay = options.autoPlay || false;
        this.interval = options.interval || 3000;
        this.currentIndex = 0;
        this.autoPlayTimer = null;

        this.init();
      }

      init() {
        this.render();
        this.attachEvents();
        
        if (this.autoPlay) {
          this.startAutoPlay();
        }
      }

      render() {
        this.container.innerHTML = `
          <div class="carousel">
            <div class="carousel-main">
              <button class="carousel-btn carousel-btn-prev">‹</button>
              <button class="carousel-btn carousel-btn-next">›</button>
              
              <div class="carousel-track">
                ${this.images.map(image => `
                  <div class="carousel-slide">
                    <img src="${image.url}" alt="${image.alt}" class="carousel-image">
                  </div>
                `).join('')}
              </div>

              <div class="carousel-counter">
                <span class="counter-current">1</span> / ${this.images.length}
              </div>
            </div>

            <div class="carousel-dots">
              ${this.images.map((_, index) => `
                <button class="carousel-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></button>
              `).join('')}
            </div>
          </div>
        `;

        this.track = this.container.querySelector('.carousel-track');
        this.prevBtn = this.container.querySelector('.carousel-btn-prev');
        this.nextBtn = this.container.querySelector('.carousel-btn-next');
        this.dots = this.container.querySelectorAll('.carousel-dot');
        this.counter = this.container.querySelector('.counter-current');
      }

      attachEvents() {
        // 前后按钮
        this.prevBtn.addEventListener('click', () => this.prev());
        this.nextBtn.addEventListener('click', () => this.next());

        // 指示点
        this.dots.forEach((dot, index) => {
          dot.addEventListener('click', () => this.goTo(index));
        });

        // 键盘导航
        document.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowLeft') this.prev();
          if (e.key === 'ArrowRight') this.next();
        });

        // 触摸滑动
        let touchStartX = 0;
        let touchEndX = 0;

        this.track.addEventListener('touchstart', (e) => {
          touchStartX = e.touches[0].clientX;
        });

        this.track.addEventListener('touchmove', (e) => {
          touchEndX = e.touches[0].clientX;
        });

        this.track.addEventListener('touchend', () => {
          const diff = touchStartX - touchEndX;
          const minSwipeDistance = 50;

          if (Math.abs(diff) > minSwipeDistance) {
            if (diff > 0) {
              this.next();
            } else {
              this.prev();
            }
          }
        });

        // 鼠标悬停暂停自动播放
        this.container.addEventListener('mouseenter', () => {
          this.stopAutoPlay();
        });

        this.container.addEventListener('mouseleave', () => {
          if (this.autoPlay) {
            this.startAutoPlay();
          }
        });
      }

      goTo(index) {
        this.currentIndex = index;
        this.updateCarousel();
      }

      next() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.updateCarousel();
      }

      prev() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.updateCarousel();
      }

      updateCarousel() {
        // 更新轨道位置
        const translateX = -this.currentIndex * 100;
        this.track.style.transform = `translateX(${translateX}%)`;

        // 更新指示点
        this.dots.forEach((dot, index) => {
          dot.classList.toggle('active', index === this.currentIndex);
        });

        // 更新计数器
        this.counter.textContent = this.currentIndex + 1;
      }

      startAutoPlay() {
        this.stopAutoPlay();
        this.autoPlayTimer = setInterval(() => {
          this.next();
        }, this.interval);
      }

      stopAutoPlay() {
        if (this.autoPlayTimer) {
          clearInterval(this.autoPlayTimer);
          this.autoPlayTimer = null;
        }
      }

      destroy() {
        this.stopAutoPlay();
        this.container.innerHTML = '';
      }
    }

    // 使用示例
    const images = [
      {
        url: 'https://picsum.photos/800/450?random=1',
        alt: 'Image 1',
      },
      {
        url: 'https://picsum.photos/800/450?random=2',
        alt: 'Image 2',
      },
      {
        url: 'https://picsum.photos/800/450?random=3',
        alt: 'Image 3',
      },
      {
        url: 'https://picsum.photos/800/450?random=4',
        alt: 'Image 4',
      },
      {
        url: 'https://picsum.photos/800/450?random=5',
        alt: 'Image 5',
      },
    ];

    const carousel = new ImageCarousel(
      document.getElementById('carousel'),
      {
        images,
        autoPlay: true,
        interval: 3000,
      }
    );
  </script>
</body>
</html>
```

---

## 六、性能优化

### 6.1 虚拟化（大量图片）

```jsx
import { useState, useEffect } from 'react';

function VirtualizedCarousel({ images, visibleRange = 3 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // 只渲染可见范围内的图片
  const getVisibleImages = () => {
    const start = Math.max(0, currentIndex - visibleRange);
    const end = Math.min(images.length, currentIndex + visibleRange + 1);
    
    return images.slice(start, end).map((image, index) => ({
      ...image,
      originalIndex: start + index,
    }));
  };

  return (
    <div className="carousel">
      {getVisibleImages().map((image) => (
        <div
          key={image.id}
          className={`carousel-slide ${
            image.originalIndex === currentIndex ? 'active' : ''
          }`}
        >
          <img src={image.url} alt={image.alt} />
        </div>
      ))}
    </div>
  );
}
```

### 6.2 图片预加载策略

```typescript
class ImagePreloader {
  private cache: Map<string, HTMLImageElement> = new Map();

  async preload(urls: string[]): Promise<void> {
    const promises = urls.map(url => this.loadImage(url));
    await Promise.all(promises);
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (this.cache.has(url)) {
        resolve(this.cache.get(url)!);
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.cache.set(url, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  preloadAdjacent(currentIndex: number, images: string[], range = 2) {
    const toPreload: string[] = [];
    
    for (let i = -range; i <= range; i++) {
      const index = (currentIndex + i + images.length) % images.length;
      toPreload.push(images[index]);
    }

    this.preload(toPreload);
  }
}
```

### 6.3 使用 CSS transform 优化动画

```css
/* ✅ 使用 transform，GPU 加速 */
.carousel-track {
  transform: translateX(var(--translate-x));
  will-change: transform;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ❌ 避免使用 left/margin，会触发重排 */
.carousel-track-slow {
  left: var(--left-position);
  transition: left 0.3s;
}
```

---

## 七、无障碍性

### 7.1 ARIA 属性

```jsx
function AccessibleCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div
      className="carousel"
      role="region"
      aria-label="Image carousel"
      aria-roledescription="carousel"
    >
      <div
        className="carousel-slides"
        role="group"
        aria-label={`Slide ${currentIndex + 1} of ${images.length}`}
        aria-live="polite"
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            className="carousel-slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${images.length}`}
            aria-hidden={index !== currentIndex}
          >
            <img src={image.url} alt={image.alt} />
          </div>
        ))}
      </div>

      <button
        onClick={handlePrev}
        aria-label="Previous slide"
        aria-controls="carousel-slides"
      >
        Previous
      </button>

      <button
        onClick={handleNext}
        aria-label="Next slide"
        aria-controls="carousel-slides"
      >
        Next
      </button>

      <div role="tablist" aria-label="Slide navigation">
        {images.map((_, index) => (
          <button
            key={index}
            role="tab"
            aria-selected={index === currentIndex}
            aria-controls={`slide-${index}`}
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 八、面试要点

### Q1: 如何实现无限循环轮播？

**方案1：克隆首尾图片**
```javascript
// 数组：[last, 1, 2, 3, first]
// 到达克隆位置时瞬间跳回真实位置
```

**方案2：取模运算**
```javascript
const nextIndex = (currentIndex + 1) % images.length;
const prevIndex = (currentIndex - 1 + images.length) % images.length;
```

### Q2: 如何优化大量图片的性能？

- ✅ 懒加载（Intersection Observer）
- ✅ 虚拟化（只渲染可见范围）
- ✅ 预加载相邻图片
- ✅ 响应式图片（srcset）
- ✅ CDN + 图片压缩

### Q3: 如何实现手势滑动？

```javascript
// 1. 监听 touch/mouse 事件
// 2. 计算滑动距离
// 3. 达到阈值时切换图片
// 4. 添加惯性滚动效果

const minSwipeDistance = 50;
const distance = touchStart - touchEnd;

if (Math.abs(distance) > minSwipeDistance) {
  if (distance > 0) next();
  else prev();
}
```

### Q4: 如何实现自动播放？

```javascript
useEffect(() => {
  if (!autoPlay) return;

  const timer = setInterval(() => {
    handleNext();
  }, interval);

  return () => clearInterval(timer);
}, [autoPlay, interval, currentIndex]);

// 悬停时暂停
onMouseEnter={() => stopAutoPlay()}
onMouseLeave={() => startAutoPlay()}
```

### Q5: 如何处理不同尺寸的图片？

```css
/* 方案1：contain - 完整显示 */
.carousel-image {
  object-fit: contain;
}

/* 方案2：cover - 裁剪填充 */
.carousel-image {
  object-fit: cover;
}

/* 方案3：动态计算容器高度 */
const aspectRatio = image.width / image.height;
containerHeight = containerWidth / aspectRatio;
```

---

## 九、扩展功能

### 9.1 3D 轮播效果

```css
.carousel-3d {
  perspective: 1000px;
}

.carousel-slide {
  transform-style: preserve-3d;
  transition: transform 0.5s;
}

.carousel-slide.active {
  transform: translateZ(0) scale(1);
  z-index: 10;
}

.carousel-slide.prev {
  transform: translateX(-60%) translateZ(-200px) rotateY(20deg);
  opacity: 0.7;
}

.carousel-slide.next {
  transform: translateX(60%) translateZ(-200px) rotateY(-20deg);
  opacity: 0.7;
}
```

### 9.2 视频支持

```jsx
function MediaCarousel({ items }) {
  return (
    <div className="carousel">
      {items.map(item => (
        <div key={item.id} className="carousel-slide">
          {item.type === 'image' ? (
            <img src={item.url} alt={item.alt} />
          ) : (
            <video
              src={item.url}
              controls
              autoPlay={item.active}
              muted
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 总结

### 核心功能
- ✅ 前后切换、指示点导航
- ✅ 自动播放（可暂停）
- ✅ 触摸/鼠标滑动
- ✅ 键盘导航（← →）

### 进阶功能
- ✅ 无限循环
- ✅ 缩略图导航
- ✅ 懒加载和预加载
- ✅ 缩放和全屏

### 性能优化
- ✅ GPU 加速（transform）
- ✅ 虚拟化渲染
- ✅ 防抖/节流
- ✅ 响应式图片

### 无障碍性
- ✅ ARIA 属性
- ✅ 键盘导航
- ✅ 屏幕阅读器支持

这是前端面试中常见的组件实现题！🎯