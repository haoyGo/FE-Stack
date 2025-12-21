# Accordion 手风琴组件实现

> 实现一个可展开/折叠的手风琴组件，支持单选和多选模式

## 一、效果预览

```
┌─────────────────────────────┐
│ ▼ Section 1                 │
├─────────────────────────────┤
│   Content of section 1      │
│   More details here...      │
├─────────────────────────────┤
│ ▶ Section 2                 │
├─────────────────────────────┤
│ ▶ Section 3                 │
└─────────────────────────────┘
```

## 二、基础实现（React）

### 2.1 单选模式

```jsx
import React, { useState } from 'react';
import './Accordion.css';

function Accordion({ sections }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleSection = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="accordion">
      {sections.map((section, index) => (
        <div key={index} className="accordion-item">
          <button
            className={`accordion-header ${activeIndex === index ? 'active' : ''}`}
            onClick={() => toggleSection(index)}
          >
            <span>{section.title}</span>
            <span className="accordion-icon">
              {activeIndex === index ? '▼' : '▶'}
            </span>
          </button>
          
          {activeIndex === index && (
            <div className="accordion-content">
              {section.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Accordion;
```

### 2.2 多选模式

```jsx
import React, { useState } from 'react';
import './Accordion.css';

function AccordionMultiple({ sections }) {
  const [activeIndexes, setActiveIndexes] = useState([]);

  const toggleSection = (index) => {
    if (activeIndexes.includes(index)) {
      setActiveIndexes(activeIndexes.filter(i => i !== index));
    } else {
      setActiveIndexes([...activeIndexes, index]);
    }
  };

  return (
    <div className="accordion">
      {sections.map((section, index) => (
        <div key={index} className="accordion-item">
          <button
            className={`accordion-header ${activeIndexes.includes(index) ? 'active' : ''}`}
            onClick={() => toggleSection(index)}
          >
            <span>{section.title}</span>
            <span className="accordion-icon">
              {activeIndexes.includes(index) ? '▼' : '▶'}
            </span>
          </button>
          
          {activeIndexes.includes(index) && (
            <div className="accordion-content">
              {section.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default AccordionMultiple;
```

### 2.3 CSS 样式

```css
/* Accordion.css */
.accordion {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.accordion-item {
  border-bottom: 1px solid #ddd;
}

.accordion-item:last-child {
  border-bottom: none;
}

.accordion-header {
  width: 100%;
  padding: 16px;
  background: #f5f5f5;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  text-align: left;
  transition: background-color 0.2s;
}

.accordion-header:hover {
  background: #e0e0e0;
}

.accordion-header.active {
  background: #e8f4f8;
  font-weight: 600;
}

.accordion-icon {
  color: #666;
  font-size: 12px;
  transition: transform 0.3s;
}

.accordion-content {
  padding: 16px;
  background: #fff;
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
```

## 三、进阶实现（支持动画）

### 3.1 带过渡动画的版本

```jsx
import React, { useState, useRef, useEffect } from 'react';
import './Accordion.css';

function AccordionAnimated({ sections, allowMultiple = false }) {
  const [activeIndexes, setActiveIndexes] = useState([]);
  const contentRefs = useRef([]);

  const toggleSection = (index) => {
    if (allowMultiple) {
      if (activeIndexes.includes(index)) {
        setActiveIndexes(activeIndexes.filter(i => i !== index));
      } else {
        setActiveIndexes([...activeIndexes, index]);
      }
    } else {
      setActiveIndexes(activeIndexes.includes(index) ? [] : [index]);
    }
  };

  const isActive = (index) => activeIndexes.includes(index);

  return (
    <div className="accordion">
      {sections.map((section, index) => (
        <div key={index} className="accordion-item">
          <button
            className={`accordion-header ${isActive(index) ? 'active' : ''}`}
            onClick={() => toggleSection(index)}
            aria-expanded={isActive(index)}
          >
            <span>{section.title}</span>
            <span className={`accordion-icon ${isActive(index) ? 'rotate' : ''}`}>
              ▶
            </span>
          </button>
          
          <div
            ref={el => contentRefs.current[index] = el}
            className="accordion-content-wrapper"
            style={{
              maxHeight: isActive(index) 
                ? `${contentRefs.current[index]?.scrollHeight}px` 
                : '0px'
            }}
          >
            <div className="accordion-content">
              {section.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AccordionAnimated;
```

### 3.2 动画 CSS

```css
.accordion-content-wrapper {
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.accordion-icon {
  display: inline-block;
  transition: transform 0.3s ease;
}

.accordion-icon.rotate {
  transform: rotate(90deg);
}
```

## 四、完整功能版本

```jsx
import React, { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import './Accordion.css';

function Accordion({
  sections,
  allowMultiple = false,
  defaultActiveIndexes = [],
  onChange,
  className = ''
}) {
  const [activeIndexes, setActiveIndexes] = useState(defaultActiveIndexes);
  const contentRefs = useRef([]);

  const toggleSection = useCallback((index) => {
    let newActiveIndexes;

    if (allowMultiple) {
      if (activeIndexes.includes(index)) {
        newActiveIndexes = activeIndexes.filter(i => i !== index);
      } else {
        newActiveIndexes = [...activeIndexes, index];
      }
    } else {
      newActiveIndexes = activeIndexes.includes(index) ? [] : [index];
    }

    setActiveIndexes(newActiveIndexes);
    onChange?.(newActiveIndexes);
  }, [activeIndexes, allowMultiple, onChange]);

  const isActive = useCallback((index) => {
    return activeIndexes.includes(index);
  }, [activeIndexes]);

  return (
    <div className={`accordion ${className}`}>
      {sections.map((section, index) => {
        const active = isActive(index);
        
        return (
          <div 
            key={section.id || index} 
            className={`accordion-item ${active ? 'is-active' : ''}`}
          >
            <button
              className={`accordion-header ${active ? 'active' : ''}`}
              onClick={() => toggleSection(index)}
              aria-expanded={active}
              aria-controls={`accordion-content-${index}`}
              disabled={section.disabled}
            >
              <span className="accordion-title">{section.title}</span>
              {section.subtitle && (
                <span className="accordion-subtitle">{section.subtitle}</span>
              )}
              <span className={`accordion-icon ${active ? 'rotate' : ''}`}>
                {section.icon || '▶'}
              </span>
            </button>
            
            <div
              id={`accordion-content-${index}`}
              ref={el => contentRefs.current[index] = el}
              className="accordion-content-wrapper"
              style={{
                maxHeight: active 
                  ? `${contentRefs.current[index]?.scrollHeight}px` 
                  : '0px'
              }}
              role="region"
              aria-labelledby={`accordion-header-${index}`}
            >
              <div className="accordion-content">
                {typeof section.content === 'function' 
                  ? section.content() 
                  : section.content
                }
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

Accordion.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.node.isRequired,
      subtitle: PropTypes.node,
      content: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
      icon: PropTypes.node,
      disabled: PropTypes.bool,
    })
  ).isRequired,
  allowMultiple: PropTypes.bool,
  defaultActiveIndexes: PropTypes.arrayOf(PropTypes.number),
  onChange: PropTypes.func,
  className: PropTypes.string,
};

export default Accordion;
```

## 五、使用示例

```jsx
import React from 'react';
import Accordion from './Accordion';

function App() {
  const sections = [
    {
      id: '1',
      title: 'What is React?',
      content: 'React is a JavaScript library for building user interfaces.',
    },
    {
      id: '2',
      title: 'What is JSX?',
      subtitle: 'JavaScript XML',
      content: 'JSX is a syntax extension for JavaScript.',
    },
    {
      id: '3',
      title: 'What are Hooks?',
      content: () => (
        <div>
          <p>Hooks are functions that let you use state and other React features.</p>
          <ul>
            <li>useState</li>
            <li>useEffect</li>
            <li>useContext</li>
          </ul>
        </div>
      ),
    },
  ];

  const handleChange = (activeIndexes) => {
    console.log('Active sections:', activeIndexes);
  };

  return (
    <div className="app">
      <h1>FAQ</h1>
      
      {/* 单选模式 */}
      <h2>Single Selection</h2>
      <Accordion
        sections={sections}
        defaultActiveIndexes={[0]}
        onChange={handleChange}
      />

      {/* 多选模式 */}
      <h2>Multiple Selection</h2>
      <Accordion
        sections={sections}
        allowMultiple
        defaultActiveIndexes={[0, 1]}
        onChange={handleChange}
      />
    </div>
  );
}

export default App;
```

## 六、原生 JavaScript 实现

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .accordion {
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }

    .accordion-item {
      border-bottom: 1px solid #ddd;
    }

    .accordion-item:last-child {
      border-bottom: none;
    }

    .accordion-header {
      width: 100%;
      padding: 16px;
      background: #f5f5f5;
      border: none;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 16px;
      text-align: left;
      transition: background-color 0.2s;
    }

    .accordion-header:hover {
      background: #e0e0e0;
    }

    .accordion-header.active {
      background: #e8f4f8;
      font-weight: 600;
    }

    .accordion-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
      background: #fff;
    }

    .accordion-content.active {
      max-height: 500px;
    }

    .accordion-content-inner {
      padding: 16px;
    }

    .accordion-icon {
      display: inline-block;
      transition: transform 0.3s;
    }

    .accordion-icon.rotate {
      transform: rotate(90deg);
    }
  </style>
</head>
<body>
  <div id="accordion" class="accordion"></div>

  <script>
    class Accordion {
      constructor(container, options = {}) {
        this.container = container;
        this.sections = options.sections || [];
        this.allowMultiple = options.allowMultiple || false;
        this.activeIndexes = new Set(options.defaultActiveIndexes || []);
        
        this.render();
        this.attachEvents();
      }

      render() {
        this.container.innerHTML = this.sections
          .map((section, index) => `
            <div class="accordion-item" data-index="${index}">
              <button 
                class="accordion-header ${this.activeIndexes.has(index) ? 'active' : ''}"
                aria-expanded="${this.activeIndexes.has(index)}"
              >
                <span>${section.title}</span>
                <span class="accordion-icon ${this.activeIndexes.has(index) ? 'rotate' : ''}">
                  ▶
                </span>
              </button>
              <div class="accordion-content ${this.activeIndexes.has(index) ? 'active' : ''}">
                <div class="accordion-content-inner">
                  ${section.content}
                </div>
              </div>
            </div>
          `)
          .join('');
      }

      attachEvents() {
        this.container.addEventListener('click', (e) => {
          const header = e.target.closest('.accordion-header');
          if (!header) return;

          const item = header.closest('.accordion-item');
          const index = parseInt(item.dataset.index);
          
          this.toggle(index);
        });
      }

      toggle(index) {
        if (this.allowMultiple) {
          if (this.activeIndexes.has(index)) {
            this.activeIndexes.delete(index);
          } else {
            this.activeIndexes.add(index);
          }
        } else {
          if (this.activeIndexes.has(index)) {
            this.activeIndexes.clear();
          } else {
            this.activeIndexes.clear();
            this.activeIndexes.add(index);
          }
        }

        this.updateUI(index);
      }

      updateUI(index) {
        const item = this.container.querySelector(`[data-index="${index}"]`);
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');
        const icon = header.querySelector('.accordion-icon');

        const isActive = this.activeIndexes.has(index);

        header.classList.toggle('active', isActive);
        content.classList.toggle('active', isActive);
        icon.classList.toggle('rotate', isActive);
        header.setAttribute('aria-expanded', isActive);
      }
    }

    // 使用示例
    const sections = [
      { title: 'Section 1', content: 'Content of section 1' },
      { title: 'Section 2', content: 'Content of section 2' },
      { title: 'Section 3', content: 'Content of section 3' },
    ];

    new Accordion(document.getElementById('accordion'), {
      sections,
      allowMultiple: false,
      defaultActiveIndexes: [0]
    });
  </script>
</body>
</html>
```

## 七、关键知识点

### 7.1 无障碍性（Accessibility）

```jsx
<button
  className="accordion-header"
  aria-expanded={isActive}           // 展开状态
  aria-controls="accordion-content"  // 关联内容
  role="button"                      // 明确角色
>
  {title}
</button>

<div
  id="accordion-content"
  role="region"                      // 区域角色
  aria-labelledby="accordion-header" // 标签关联
>
  {content}
</div>
```

### 7.2 性能优化

```jsx
// 1. 使用 useCallback 缓存函数
const toggleSection = useCallback((index) => {
  // ...
}, [activeIndexes, allowMultiple]);

// 2. 使用 React.memo 避免不必要的重渲染
const AccordionItem = React.memo(({ section, isActive, onToggle }) => {
  // ...
});

// 3. 虚拟滚动（大量数据时）
import { FixedSizeList } from 'react-window';
```

### 7.3 动画技巧

```css
/* 使用 max-height 实现平滑动画 */
.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}

.accordion-content.active {
  max-height: 1000px; /* 足够大的值 */
}

/* 或使用 JavaScript 动态计算 */
style={{ maxHeight: isActive ? `${scrollHeight}px` : '0px' }}
```

## 八、面试要点

### 8.1 常见问题

**Q1: 单选和多选模式有什么区别？**

- 单选：同时只能展开一个，使用单个 index 或 Set
- 多选：可以展开多个，使用数组或 Set

**Q2: 如何实现平滑动画？**

- 方案1：CSS `max-height` + `transition`
- 方案2：JavaScript 计算 `scrollHeight` 动态设置
- 方案3：使用 CSS Grid `grid-template-rows`

**Q3: 如何优化大量数据的性能？**

- 虚拟滚动（react-window）
- 懒加载内容
- 使用 `React.memo` 和 `useCallback`

**Q4: 如何支持键盘导航？**

```jsx
const handleKeyDown = (e, index) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggleSection(index);
  }
  // 上下箭头切换焦点
  if (e.key === 'ArrowDown') {
    // 聚焦下一个
  }
  if (e.key === 'ArrowUp') {
    // 聚焦上一个
  }
};
```

## 九、扩展功能

### 9.1 嵌套手风琴

```jsx
function NestedAccordion({ sections }) {
  return (
    <Accordion
      sections={sections.map(section => ({
        ...section,
        content: section.children ? (
          <NestedAccordion sections={section.children} />
        ) : section.content
      }))}
    />
  );
}
```

### 9.2 受控组件

```jsx
function ControlledAccordion({ activeIndexes, onActiveIndexesChange }) {
  return (
    <Accordion
      sections={sections}
      activeIndexes={activeIndexes}
      onActiveIndexesChange={onActiveIndexesChange}
    />
  );
}
```

---

**总结**：
- ✅ 支持单选/多选模式
- ✅ 平滑展开/收起动画
- ✅ 无障碍性支持
- ✅ 性能优化
- ✅ 键盘导航
- ✅ 灵活的 API 设计