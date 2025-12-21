# Progress Bar 进度条实现

> 实现一个可定制的进度条组件，支持多种样式、动画效果和并发控制

## 一、效果预览

```
基础进度条：
┌────────────────────────────────────┐
│ ████████████░░░░░░░░░░░░░░░░░░░░░ │ 40%
└────────────────────────────────────┘

分段进度条：
┌────────────────────────────────────┐
│ ████████│████████│░░░░░░░░░░░░░░░ │
│  Step 1 │ Step 2 │    Step 3      │
└────────────────────────────────────┘

多个并发进度条：
┌────────────────────────────────────┐
│ Task 1: ████████████████░░░░░░░░  │ 70%
│ Task 2: ████████░░░░░░░░░░░░░░░░  │ 35%
│ Task 3: ████████████████████████  │ 100%
└────────────────────────────────────┘
```

## 二、基础实现（React）

### 2.1 简单进度条

```jsx
import React from 'react';
import './ProgressBar.css';

function ProgressBar({ value = 0, max = 100, showLabel = true, className = '' }) {
  // 确保值在有效范围内
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`progress-bar-container ${className}`}>
      <div className="progress-bar">
        <div 
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          {showLabel && (
            <span className="progress-bar-label">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
```

### 2.2 基础 CSS

```css
/* ProgressBar.css */
.progress-bar-container {
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50 0%, #45a049 100%);
  border-radius: 12px;
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.progress-bar-label {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  position: absolute;
  right: 8px;
}

/* 小进度时标签在外面 */
.progress-bar-fill[style*="width: 0%"] .progress-bar-label,
.progress-bar-fill[style*="width: 1%"] .progress-bar-label,
.progress-bar-fill[style*="width: 2%"] .progress-bar-label {
  color: #666;
  left: calc(100% + 8px);
  right: auto;
  text-shadow: none;
}
```

### 2.3 使用示例

```jsx
import React, { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar';

function App() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="app">
      <h2>Loading...</h2>
      <ProgressBar value={progress} max={100} />
    </div>
  );
}

export default App;
```

## 三、进阶功能实现

### 3.1 带动画和主题的进度条

```jsx
import React from 'react';
import PropTypes from 'prop-types';
import './ProgressBar.css';

function ProgressBar({
  value = 0,
  max = 100,
  showLabel = true,
  showPercentage = true,
  label = '',
  variant = 'default', // default, success, warning, danger, info
  size = 'medium', // small, medium, large
  animated = false,
  striped = false,
  className = ''
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const getVariantClass = () => {
    const variants = {
      default: 'progress-variant-default',
      success: 'progress-variant-success',
      warning: 'progress-variant-warning',
      danger: 'progress-variant-danger',
      info: 'progress-variant-info'
    };
    return variants[variant] || variants.default;
  };

  const getSizeClass = () => {
    const sizes = {
      small: 'progress-size-small',
      medium: 'progress-size-medium',
      large: 'progress-size-large'
    };
    return sizes[size] || sizes.medium;
  };

  return (
    <div className={`progress-bar-container ${className}`}>
      {label && (
        <div className="progress-label-top">
          <span>{label}</span>
          {showPercentage && (
            <span className="progress-percentage">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      
      <div 
        className={`
          progress-bar 
          ${getSizeClass()} 
          ${striped ? 'progress-striped' : ''} 
          ${animated ? 'progress-animated' : ''}
        `}
      >
        <div 
          className={`progress-bar-fill ${getVariantClass()}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `Progress: ${Math.round(percentage)}%`}
        >
          {showLabel && !label && (
            <span className="progress-bar-label">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

ProgressBar.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
  showLabel: PropTypes.bool,
  showPercentage: PropTypes.bool,
  label: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'success', 'warning', 'danger', 'info']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  animated: PropTypes.bool,
  striped: PropTypes.bool,
  className: PropTypes.string
};

export default ProgressBar;
```

### 3.2 完整 CSS（带动画和主题）

```css
/* ProgressBar.css - Complete */
.progress-bar-container {
  width: 100%;
  margin: 16px 0;
}

.progress-label-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.progress-percentage {
  font-weight: 600;
  color: #666;
}

.progress-bar {
  width: 100%;
  background: #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.4s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 8px;
  position: relative;
}

.progress-bar-label {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

/* 尺寸变体 */
.progress-size-small {
  height: 16px;
}

.progress-size-small .progress-bar-label {
  font-size: 10px;
}

.progress-size-medium {
  height: 24px;
}

.progress-size-large {
  height: 32px;
}

.progress-size-large .progress-bar-label {
  font-size: 14px;
}

/* 颜色变体 */
.progress-variant-default {
  background: linear-gradient(90deg, #4CAF50 0%, #45a049 100%);
}

.progress-variant-success {
  background: linear-gradient(90deg, #28a745 0%, #218838 100%);
}

.progress-variant-warning {
  background: linear-gradient(90deg, #ffc107 0%, #e0a800 100%);
}

.progress-variant-warning .progress-bar-label {
  color: #333;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.3);
}

.progress-variant-danger {
  background: linear-gradient(90deg, #dc3545 0%, #c82333 100%);
}

.progress-variant-info {
  background: linear-gradient(90deg, #17a2b8 0%, #138496 100%);
}

/* 条纹效果 */
.progress-striped .progress-bar-fill {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 20px 20px;
}

/* 动画效果 */
.progress-animated .progress-bar-fill {
  animation: progressAnimation 1s linear infinite;
}

@keyframes progressAnimation {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 20px 20px;
  }
}

/* 脉冲效果 */
.progress-bar-fill::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .progress-label-top {
    font-size: 12px;
  }
}
```

## 四、并发进度条（多个任务）

### 4.1 多进度条管理

```jsx
import React, { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar';
import './ProgressBars.css';

function ProgressBars() {
  const [tasks, setTasks] = useState([
    { id: 1, name: 'Downloading files', progress: 0, status: 'running' },
    { id: 2, name: 'Processing data', progress: 0, status: 'pending' },
    { id: 3, name: 'Uploading results', progress: 0, status: 'pending' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prevTasks => {
        return prevTasks.map(task => {
          if (task.status === 'running' && task.progress < 100) {
            // 随机增长速度
            const increment = Math.random() * 5 + 1;
            const newProgress = Math.min(task.progress + increment, 100);
            
            return {
              ...task,
              progress: newProgress,
              status: newProgress >= 100 ? 'completed' : 'running'
            };
          }
          
          // 如果上一个任务完成，启动下一个
          if (task.status === 'pending') {
            const prevTaskIndex = prevTasks.findIndex(t => t.id === task.id) - 1;
            if (prevTaskIndex >= 0 && prevTasks[prevTaskIndex].status === 'completed') {
              return { ...task, status: 'running' };
            }
          }
          
          return task;
        });
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const getVariant = (task) => {
    if (task.status === 'completed') return 'success';
    if (task.status === 'running') return 'info';
    return 'default';
  };

  const allCompleted = tasks.every(task => task.status === 'completed');

  return (
    <div className="progress-bars-container">
      <h2>Task Progress</h2>
      
      {allCompleted && (
        <div className="alert-success">
          ✓ All tasks completed successfully!
        </div>
      )}

      <div className="progress-list">
        {tasks.map(task => (
          <div key={task.id} className="progress-item">
            <div className="progress-item-header">
              <span className="task-name">
                {task.status === 'completed' && '✓ '}
                {task.status === 'running' && '⟳ '}
                {task.name}
              </span>
              <span className="task-status">
                {task.status === 'pending' && 'Waiting...'}
                {task.status === 'running' && 'In Progress'}
                {task.status === 'completed' && 'Done'}
              </span>
            </div>
            <ProgressBar
              value={task.progress}
              max={100}
              variant={getVariant(task)}
              size="medium"
              animated={task.status === 'running'}
              striped={task.status === 'running'}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProgressBars;
```

### 4.2 并发进度条样式

```css
/* ProgressBars.css */
.progress-bars-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress-bars-container h2 {
  margin: 0 0 24px 0;
  font-size: 24px;
  color: #333;
}

.alert-success {
  padding: 12px 16px;
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.progress-item {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.progress-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.task-status {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}
```

## 五、高级功能实现

### 5.1 分段进度条（Step Progress）

```jsx
import React from 'react';
import './StepProgress.css';

function StepProgress({ steps, currentStep }) {
  return (
    <div className="step-progress">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const percentage = ((index + 1) / steps.length) * 100;

        return (
          <div
            key={index}
            className={`step-progress-item ${
              isCompleted ? 'completed' : ''
            } ${isCurrent ? 'current' : ''}`}
            style={{ width: `${100 / steps.length}%` }}
          >
            <div className="step-indicator">
              <div className="step-number">
                {isCompleted ? '✓' : index + 1}
              </div>
            </div>
            <div className="step-label">{step.label}</div>
            {index < steps.length - 1 && (
              <div
                className={`step-connector ${
                  isCompleted ? 'completed' : ''
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StepProgress;
```

### 5.2 分段进度条样式

```css
/* StepProgress.css */
.step-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px 0;
  position: relative;
}

.step-progress-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
}

.step-indicator {
  position: relative;
  margin-bottom: 8px;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
  border: 3px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.step-progress-item.current .step-number {
  background: #2196F3;
  color: #fff;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
}

.step-progress-item.completed .step-number {
  background: #4CAF50;
  color: #fff;
}

.step-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
  text-align: center;
  max-width: 100px;
}

.step-progress-item.current .step-label {
  color: #2196F3;
  font-weight: 600;
}

.step-progress-item.completed .step-label {
  color: #4CAF50;
  font-weight: 600;
}

.step-connector {
  position: absolute;
  top: 20px;
  left: calc(50% + 20px);
  right: calc(-100% + 50% + 20px);
  height: 3px;
  background: #e0e0e0;
  transition: background 0.3s ease;
}

.step-connector.completed {
  background: #4CAF50;
}

/* 最后一个步骤不显示连接线 */
.step-progress-item:last-child .step-connector {
  display: none;
}
```

### 5.3 使用分段进度条

```jsx
import React, { useState } from 'react';
import StepProgress from './StepProgress';

function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Personal Info' },
    { label: 'Address' },
    { label: 'Payment' },
    { label: 'Confirmation' }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="multi-step-form">
      <StepProgress steps={steps} currentStep={currentStep} />

      <div className="step-content">
        <h3>{steps[currentStep].label}</h3>
        {/* 表单内容 */}
      </div>

      <div className="step-actions">
        <button onClick={prevStep} disabled={currentStep === 0}>
          Previous
        </button>
        <button onClick={nextStep} disabled={currentStep === steps.length - 1}>
          Next
        </button>
      </div>
    </div>
  );
}

export default MultiStepForm;
```

## 六、循环/加载进度条

### 6.1 圆形进度条

```jsx
import React from 'react';
import './CircularProgress.css';

function CircularProgress({ value = 0, max = 100, size = 120, strokeWidth = 8 }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="circular-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* 背景圆 */}
        <circle
          className="circular-progress-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* 进度圆 */}
        <circle
          className="circular-progress-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="circular-progress-text">
        <span className="circular-progress-value">{Math.round(percentage)}</span>
        <span className="circular-progress-unit">%</span>
      </div>
    </div>
  );
}

export default CircularProgress;
```

### 6.2 圆形进度条样式

```css
/* CircularProgress.css */
.circular-progress {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.circular-progress svg {
  transform: rotate(0deg);
}

.circular-progress-bg {
  fill: none;
  stroke: #e0e0e0;
}

.circular-progress-fill {
  fill: none;
  stroke: #4CAF50;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.circular-progress-text {
  position: absolute;
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.circular-progress-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.circular-progress-unit {
  font-size: 16px;
  font-weight: 600;
  color: #666;
  margin-left: 2px;
}
```

## 七、原生 JavaScript 实现

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Progress Bar</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 40px 20px;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #fff;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    h2 {
      margin-bottom: 24px;
      color: #333;
    }

    .progress-wrapper {
      margin-bottom: 32px;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .progress-bar {
      width: 100%;
      height: 24px;
      background: #e0e0e0;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4CAF50 0%, #45a049 100%);
      border-radius: 12px;
      transition: width 0.3s ease;
      position: relative;
    }

    .controls {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    button {
      flex: 1;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      background: #2196F3;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    button:hover {
      background: #1976D2;
      transform: translateY(-1px);
    }

    button:active {
      transform: translateY(0);
    }

    button.reset {
      background: #f44336;
    }

    button.reset:hover {
      background: #d32f2f;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Progress Bar Demo</h2>

    <div class="progress-wrapper">
      <div class="progress-label">
        <span id="label">Loading...</span>
        <span id="percentage">0%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill" style="width: 0%"></div>
      </div>
    </div>

    <div class="controls">
      <button id="startBtn">Start</button>
      <button id="pauseBtn">Pause</button>
      <button class="reset" id="resetBtn">Reset</button>
    </div>
  </div>

  <script>
    class ProgressBar {
      constructor(options = {}) {
        this.fillElement = document.getElementById(options.fillId || 'progressFill');
        this.percentageElement = document.getElementById(options.percentageId || 'percentage');
        this.labelElement = document.getElementById(options.labelId || 'label');
        
        this.value = 0;
        this.max = options.max || 100;
        this.intervalId = null;
        this.isPaused = false;
        this.speed = options.speed || 50; // ms
        this.increment = options.increment || 1;

        this.onComplete = options.onComplete || null;
        this.onChange = options.onChange || null;
      }

      start() {
        if (this.intervalId) return; // 已经在运行

        this.isPaused = false;
        this.intervalId = setInterval(() => {
          if (!this.isPaused) {
            this.setValue(this.value + this.increment);
          }
        }, this.speed);
      }

      pause() {
        this.isPaused = !this.isPaused;
      }

      reset() {
        this.stop();
        this.setValue(0);
        this.labelElement.textContent = 'Loading...';
      }

      stop() {
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
        this.isPaused = false;
      }

      setValue(value) {
        this.value = Math.min(Math.max(value, 0), this.max);
        const percentage = (this.value / this.max) * 100;
        
        this.fillElement.style.width = `${percentage}%`;
        this.percentageElement.textContent = `${Math.round(percentage)}%`;

        // 触发回调
        if (this.onChange) {
          this.onChange(this.value, percentage);
        }

        // 检查是否完成
        if (this.value >= this.max) {
          this.stop();
          this.labelElement.textContent = 'Completed!';
          
          if (this.onComplete) {
            this.onComplete();
          }
        }
      }

      getValue() {
        return this.value;
      }

      getPercentage() {
        return (this.value / this.max) * 100;
      }
    }

    // 初始化进度条
    const progressBar = new ProgressBar({
      fillId: 'progressFill',
      percentageId: 'percentage',
      labelId: 'label',
      max: 100,
      speed: 50,
      increment: 1,
      onComplete: () => {
        console.log('Progress completed!');
      },
      onChange: (value, percentage) => {
        console.log(`Progress: ${Math.round(percentage)}%`);
      }
    });

    // 绑定按钮事件
    document.getElementById('startBtn').addEventListener('click', () => {
      progressBar.start();
    });

    document.getElementById('pauseBtn').addEventListener('click', () => {
      progressBar.pause();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      progressBar.reset();
    });
  </script>
</body>
</html>
```

## 八、关键知识点

### 8.1 进度条计算

```javascript
// 基础百分比计算
const percentage = (value / max) * 100;

// 确保值在有效范围内
const safePercentage = Math.min(Math.max(percentage, 0), 100);

// 圆形进度条（SVG）
const radius = (size - strokeWidth) / 2;
const circumference = 2 * Math.PI * radius;
const offset = circumference - (percentage / 100) * circumference;
```

### 8.2 平滑动画

```css
/* CSS 过渡 */
.progress-fill {
  transition: width 0.3s ease;
}

/* 使用 transform 优化性能 */
.progress-fill {
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

/* JavaScript 动画 */
function animateProgress(from, to, duration) {
  const start = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    
    const currentValue = from + (to - from) * progress;
    setProgress(currentValue);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}
```

### 8.3 无障碍性

```jsx
<div
  role="progressbar"
  aria-valuenow={value}
  aria-valuemin={0}
  aria-valuemax={max}
  aria-label="Loading progress"
  aria-describedby="progress-description"
>
  <div className="progress-fill" style={{ width: `${percentage}%` }} />
</div>
<div id="progress-description" className="sr-only">
  {Math.round(percentage)}% complete
</div>
```

## 九、面试要点

### 9.1 常见问题

**Q1: 如何实现并发进度条控制？**

```jsx
// 使用 Promise.all 控制多个任务
function useProgressBars(tasks) {
  const [progresses, setProgresses] = useState(
    tasks.map(() => 0)
  );

  const startTasks = async () => {
    const promises = tasks.map((task, index) => {
      return task.execute((progress) => {
        setProgresses(prev => {
          const newProgresses = [...prev];
          newProgresses[index] = progress;
          return newProgresses;
        });
      });
    });

    await Promise.all(promises);
  };

  return { progresses, startTasks };
}

// 使用
const tasks = [
  {
    execute: (onProgress) => {
      return new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          onProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            resolve();
          }
        }, 500);
      });
    }
  }
];
```

**Q2: 如何实现不确定进度条（Indeterminate）？**

```jsx
function IndeterminateProgress() {
  return (
    <div className="progress-indeterminate">
      <div className="progress-indeterminate-fill" />
    </div>
  );
}
```

```css
.progress-indeterminate {
  width: 100%;
  height: 4px;
  background: #e0e0e0;
  overflow: hidden;
  position: relative;
}

.progress-indeterminate-fill {
  position: absolute;
  height: 100%;
  width: 30%;
  background: #4CAF50;
  animation: indeterminate 1.5s ease-in-out infinite;
}

@keyframes indeterminate {
  0% {
    left: -30%;
  }
  100% {
    left: 100%;
  }
}
```

**Q3: 如何优化大量进度条的性能？**

```jsx
// 1. 使用 throttle 限制更新频率
import { throttle } from 'lodash';

const updateProgress = throttle((value) => {
  setProgress(value);
}, 100);

// 2. 使用 CSS transform 代替 width
const progressStyle = {
  transform: `scaleX(${percentage / 100})`,
  transformOrigin: 'left'
};

// 3. 虚拟化长列表
import { FixedSizeList } from 'react-window';

function ProgressList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={80}
    >
      {({ index, style }) => (
        <div style={style}>
          <ProgressBar value={items[index].progress} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

**Q4: 如何实现文件上传进度条？**

```jsx
function FileUploadProgress() {
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        setProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      console.log('Upload complete');
      setProgress(100);
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  };

  // 使用 fetch 的替代方案（需要 ReadableStream）
  const handleUploadWithFetch = async (file) => {
    const reader = file.stream().getReader();
    const contentLength = file.size;
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      receivedLength += value.length;
      const progress = (receivedLength / contentLength) * 100;
      setProgress(progress);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      <ProgressBar value={progress} />
    </div>
  );
}
```

## 十、实际应用场景

### 10.1 页面加载进度

```jsx
function PageLoadProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 模拟资源加载
    const resources = [
      { name: 'HTML', weight: 10 },
      { name: 'CSS', weight: 20 },
      { name: 'JavaScript', weight: 30 },
      { name: 'Images', weight: 40 }
    ];

    let loaded = 0;
    const total = resources.reduce((sum, r) => sum + r.weight, 0);

    resources.forEach((resource, index) => {
      setTimeout(() => {
        loaded += resource.weight;
        setProgress((loaded / total) * 100);
      }, (index + 1) * 1000);
    });
  }, []);

  return (
    <div className="page-load-progress">
      {progress < 100 ? (
        <ProgressBar value={progress} label="Loading page..." />
      ) : (
        <div>Content loaded!</div>
      )}
    </div>
  );
}
```

### 10.2 视频播放进度

```jsx
function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    }
  };

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration);
  };

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    videoRef.current.currentTime = percentage * duration;
  };

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      <div className="video-progress" onClick={handleProgressClick}>
        <ProgressBar value={progress} showLabel={false} />
      </div>
    </div>
  );
}
```

---

**总结**：
- ✅ 基础线性进度条（带动画和主题）
- ✅ 并发进度条管理
- ✅ 分段进度条（步骤指示器）
- ✅ 圆形进度条
- ✅ 不确定进度条
- ✅ 文件上传进度
- ✅ 性能优化（throttle、transform）
- ✅ 无障碍性支持（ARIA）
- ✅ 实际应用场景（页面加载、视频播放）