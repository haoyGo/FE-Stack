# Progress Bar 进度条

> 实现可定制的进度条组件，支持多种样式和动画效果

## 一、基础实现

```jsx
function ProgressBar({ value = 0, max = 100, showLabel = true }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="progress-container">
      <div 
        className="progress-bar"
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        {showLabel && <span>{Math.round(percentage)}%</span>}
      </div>
    </div>
  );
}
```

```css
.progress-container {
  width: 100%;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}
```

## 二、进阶功能

### 2.1 分段进度条

```jsx
function SteppedProgress({ steps, current }) {
  return (
    <div className="stepped-progress">
      {steps.map((step, index) => (
        <div key={index} className="step">
          <div className={`step-circle ${index <= current ? 'active' : ''}`}>
            {index < current ? '✓' : index + 1}
          </div>
          <span>{step.label}</span>
          {index < steps.length - 1 && (
            <div className={`step-line ${index < current ? 'active' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}
```

### 2.2 环形进度条

```jsx
function CircularProgress({ value, size = 100, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e0e0e0"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#4CAF50"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        fontSize="20"
      >
        {value}%
      </text>
    </svg>
  );
}
```

### 2.3 缓冲进度条

```jsx
function BufferProgress({ value, buffer }) {
  return (
    <div className="progress-container">
      <div 
        className="buffer-bar"
        style={{ width: `${buffer}%` }}
      />
      <div 
        className="progress-bar"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
```

## 三、文件上传进度

```jsx
function FileUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file) => {
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('/api/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percent);
        }
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => handleUpload(e.target.files[0])}
        disabled={uploading}
      />
      
      {uploading && (
        <ProgressBar value={progress} />
      )}
    </div>
  );
}
```

## 四、多任务进度

```jsx
function MultiProgress() {
  const [tasks, setTasks] = useState([
    { id: 1, name: 'Task 1', progress: 0 },
    { id: 2, name: 'Task 2', progress: 0 },
    { id: 3, name: 'Task 3', progress: 0 }
  ]);

  const updateProgress = (id, value) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, progress: value } : task
    ));
  };

  const startTask = async (task) => {
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      updateProgress(task.id, i);
    }
  };

  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>
          <h4>{task.name}</h4>
          <ProgressBar value={task.progress} />
          <button onClick={() => startTask(task)}>
            Start
          </button>
        </div>
      ))}
    </div>
  );
}
```

## 五、动画效果

### 5.1 平滑动画

```jsx
function AnimatedProgress({ value }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    let end = value;
    let duration = 1000;
    let startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const current = start + (end - start) * progress;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [value]);

  return <ProgressBar value={displayValue} />;
}
```

### 5.2 脉冲效果

```css
.progress-bar.pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
```

### 5.3 条纹动画

```css
.progress-bar.striped {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%,
    transparent
  );
  background-size: 40px 40px;
  animation: stripe 1s linear infinite;
}

@keyframes stripe {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 40px 0;
  }
}
```

## 六、面试要点

**Q1: 如何实现平滑动画？**
```jsx
// 使用 requestAnimationFrame
const animate = () => {
  const progress = (Date.now() - startTime) / duration;
  setCurrent(start + (end - start) * progress);
  if (progress < 1) requestAnimationFrame(animate);
};
```

**Q2: 环形进度条原理？**
- SVG circle + strokeDasharray
- 周长 = 2πr
- offset = 周长 × (1 - 百分比)

**Q3: 多任务并发控制？**
```jsx
const runTasks = async (tasks, limit) => {
  const queue = [...tasks];
  const running = [];

  while (queue.length || running.length) {
    while (running.length < limit && queue.length) {
      const task = queue.shift();
      const promise = task().finally(() => {
        running.splice(running.indexOf(promise), 1);
      });
      running.push(promise);
    }
    await Promise.race(running);
  }
};
```

**Q4: 无障碍性？**
```jsx
<div
  role="progressbar"
  aria-valuenow={value}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Upload progress"
/>
```

---

**总结：** 核心是百分比计算 + CSS 动画 + ARIA 无障碍
