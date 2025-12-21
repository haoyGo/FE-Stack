# Tabs 标签页组件

> 设计一个灵活的 Tabs 组件，支持多种样式、动画效果和交互方式

## 一、需求分析

### 1.1 功能需求

**基础功能**
- ✅ 多个标签页切换
- ✅ 受控/非受控模式
- ✅ 默认选中项
- ✅ 禁用某个标签
- ✅ 键盘导航（← →）
- ✅ 可编程切换

**进阶功能**
- ✅ 动画过渡效果
- ✅ 懒加载内容
- ✅ 可添加/删除标签
- ✅ 拖拽排序
- ✅ 滚动标签栏
- ✅ 图标支持
- ✅ 徽章提示
- ✅ 嵌套标签页

### 1.2 样式变体

- **位置**: 顶部、底部、左侧、右侧
- **风格**: 默认、卡片、胶囊、下划线
- **尺寸**: 小、中、大
- **对齐**: 左对齐、居中、右对齐、均分

### 1.3 API 设计

```typescript
interface TabItem {
  key: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
  closable?: boolean;
}

interface TabsProps {
  items: TabItem[];
  activeKey?: string; // 受控模式
  defaultActiveKey?: string; // 非受控模式
  onChange?: (key: string) => void;
  
  // 样式
  type?: 'default' | 'card' | 'pill' | 'underline';
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
  centered?: boolean;
  fullWidth?: boolean;
  
  // 功能
  animated?: boolean;
  lazyLoad?: boolean;
  addable?: boolean;
  onAdd?: () => void;
  onRemove?: (key: string) => void;
  draggable?: boolean;
  onDragEnd?: (items: TabItem[]) => void;
  
  // 滚动
  scrollable?: boolean;
  
  // 样式自定义
  className?: string;
  style?: React.CSSProperties;
}
```

---

## 二、基础实现

### 2.1 React + TypeScript 实现

```tsx
import React, { useState, useRef, useEffect } from 'react';
import './Tabs.css';

interface TabItem {
  key: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  activeKey?: string;
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  type?: 'default' | 'card' | 'pill' | 'underline';
  animated?: boolean;
}

function Tabs({
  items,
  activeKey: controlledActiveKey,
  defaultActiveKey,
  onChange,
  type = 'default',
  animated = true,
}: TabsProps) {
  // 受控/非受控状态管理
  const [internalActiveKey, setInternalActiveKey] = useState(
    defaultActiveKey || items[0]?.key
  );

  const activeKey = controlledActiveKey ?? internalActiveKey;

  const handleTabClick = (key: string, disabled?: boolean) => {
    if (disabled) return;

    if (controlledActiveKey === undefined) {
      setInternalActiveKey(key);
    }

    onChange?.(key);
  };

  // 查找当前激活的标签
  const activeItem = items.find((item) => item.key === activeKey);

  return (
    <div className={`tabs tabs--${type}`}>
      {/* 标签头 */}
      <div className="tabs__header" role="tablist">
        {items.map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={item.key === activeKey}
            aria-disabled={item.disabled}
            className={`tabs__tab ${
              item.key === activeKey ? 'tabs__tab--active' : ''
            } ${item.disabled ? 'tabs__tab--disabled' : ''}`}
            onClick={() => handleTabClick(item.key, item.disabled)}
            disabled={item.disabled}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 内容面板 */}
      <div className="tabs__content">
        {items.map((item) => (
          <div
            key={item.key}
            role="tabpanel"
            hidden={item.key !== activeKey}
            className={`tabs__panel ${
              item.key === activeKey ? 'tabs__panel--active' : ''
            } ${animated ? 'tabs__panel--animated' : ''}`}
          >
            {item.key === activeKey && item.content}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tabs;
```

### 2.2 基础样式

```css
/* Tabs.css */

.tabs {
  display: flex;
  flex-direction: column;
}

/* 标签头 */
.tabs__header {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid #e5e7eb;
  position: relative;
}

.tabs__tab {
  padding: 12px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s ease;
  position: relative;
  outline: none;
}

.tabs__tab:hover:not(.tabs__tab--disabled) {
  color: #3b82f6;
}

.tabs__tab--active {
  color: #3b82f6;
}

.tabs__tab--active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #3b82f6;
  transition: all 0.3s ease;
}

.tabs__tab--disabled {
  color: #d1d5db;
  cursor: not-allowed;
}

/* 内容面板 */
.tabs__content {
  padding: 20px 0;
}

.tabs__panel {
  display: none;
}

.tabs__panel--active {
  display: block;
}

.tabs__panel--animated {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============ 卡片样式 ============ */
.tabs--card .tabs__header {
  border-bottom: none;
  gap: 4px;
}

.tabs--card .tabs__tab {
  border: 1px solid #e5e7eb;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  background: #f9fafb;
}

.tabs--card .tabs__tab--active {
  background: white;
  border-bottom: 1px solid white;
  margin-bottom: -1px;
}

.tabs--card .tabs__content {
  border: 1px solid #e5e7eb;
  border-radius: 0 8px 8px 8px;
  padding: 20px;
}

/* ============ 胶囊样式 ============ */
.tabs--pill .tabs__header {
  border-bottom: none;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 8px;
  display: inline-flex;
  width: fit-content;
}

.tabs--pill .tabs__tab {
  border-radius: 6px;
  padding: 8px 16px;
}

.tabs--pill .tabs__tab--active {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tabs--pill .tabs__tab--active::after {
  display: none;
}

/* ============ 下划线样式 ============ */
.tabs--underline .tabs__header {
  gap: 24px;
}

.tabs--underline .tabs__tab {
  padding: 12px 0;
}
```

### 2.3 使用示例

```tsx
import React from 'react';
import Tabs from './Tabs';

function App() {
  const items = [
    {
      key: '1',
      label: 'Tab 1',
      content: <div>Content of Tab 1</div>,
    },
    {
      key: '2',
      label: 'Tab 2',
      content: <div>Content of Tab 2</div>,
    },
    {
      key: '3',
      label: 'Tab 3',
      content: <div>Content of Tab 3</div>,
      disabled: true,
    },
  ];

  return (
    <div>
      <h2>Default Tabs</h2>
      <Tabs items={items} defaultActiveKey="1" />

      <h2>Card Tabs</h2>
      <Tabs items={items} type="card" />

      <h2>Pill Tabs</h2>
      <Tabs items={items} type="pill" />

      <h2>Controlled Tabs</h2>
      <ControlledTabsExample />
    </div>
  );
}

function ControlledTabsExample() {
  const [activeKey, setActiveKey] = useState('1');

  const items = [
    { key: '1', label: 'Home', content: 'Home Content' },
    { key: '2', label: 'Profile', content: 'Profile Content' },
    { key: '3', label: 'Settings', content: 'Settings Content' },
  ];

  return (
    <div>
      <Tabs
        items={items}
        activeKey={activeKey}
        onChange={setActiveKey}
      />
      <button onClick={() => setActiveKey('2')}>
        Switch to Profile
      </button>
    </div>
  );
}

export default App;
```

---

## 三、进阶功能

### 3.1 键盘导航

```tsx
import React, { useState, useRef, useEffect } from 'react';

function Tabs({ items, ...props }: TabsProps) {
  const [activeKey, setActiveKey] = useState(props.defaultActiveKey || items[0]?.key);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent, currentKey: string) => {
    const enabledItems = items.filter((item) => !item.disabled);
    const currentIndex = enabledItems.findIndex((item) => item.key === currentKey);

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : enabledItems.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = currentIndex < enabledItems.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = enabledItems.length - 1;
        break;
      default:
        return;
    }

    const nextKey = enabledItems[nextIndex].key;
    setActiveKey(nextKey);
    props.onChange?.(nextKey);

    // 聚焦到下一个标签
    tabRefs.current.get(nextKey)?.focus();
  };

  return (
    <div className="tabs">
      <div className="tabs__header" role="tablist">
        {items.map((item) => (
          <button
            key={item.key}
            ref={(el) => {
              if (el) tabRefs.current.set(item.key, el);
            }}
            role="tab"
            aria-selected={item.key === activeKey}
            tabIndex={item.key === activeKey ? 0 : -1}
            className={`tabs__tab ${
              item.key === activeKey ? 'tabs__tab--active' : ''
            }`}
            onClick={() => {
              setActiveKey(item.key);
              props.onChange?.(item.key);
            }}
            onKeyDown={(e) => handleKeyDown(e, item.key)}
            disabled={item.disabled}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="tabs__content">
        {items.map((item) => (
          <div
            key={item.key}
            role="tabpanel"
            hidden={item.key !== activeKey}
            className={`tabs__panel ${
              item.key === activeKey ? 'tabs__panel--active' : ''
            }`}
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 3.2 懒加载内容

```tsx
import React, { useState } from 'react';

interface TabsProps {
  items: TabItem[];
  lazyLoad?: boolean;
}

function Tabs({ items, lazyLoad = false, ...props }: TabsProps) {
  const [activeKey, setActiveKey] = useState(props.defaultActiveKey || items[0]?.key);
  const [loadedKeys, setLoadedKeys] = useState<Set<string>>(
    new Set([props.defaultActiveKey || items[0]?.key])
  );

  const handleTabClick = (key: string) => {
    setActiveKey(key);
    
    // 懒加载：首次访问时加载内容
    if (lazyLoad && !loadedKeys.has(key)) {
      setLoadedKeys((prev) => new Set([...prev, key]));
    }

    props.onChange?.(key);
  };

  return (
    <div className="tabs">
      <div className="tabs__header">
        {items.map((item) => (
          <button
            key={item.key}
            className={`tabs__tab ${
              item.key === activeKey ? 'tabs__tab--active' : ''
            }`}
            onClick={() => handleTabClick(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="tabs__content">
        {items.map((item) => {
          // 懒加载模式：只渲染已加载的标签内容
          const shouldRender = !lazyLoad || loadedKeys.has(item.key);

          return (
            <div
              key={item.key}
              role="tabpanel"
              hidden={item.key !== activeKey}
              className={`tabs__panel ${
                item.key === activeKey ? 'tabs__panel--active' : ''
              }`}
            >
              {shouldRender && item.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### 3.3 可添加/删除标签

```tsx
import React, { useState } from 'react';

interface EditableTabsProps {
  initialItems: TabItem[];
  addable?: boolean;
  onAdd?: () => void;
  onRemove?: (key: string) => void;
}

function EditableTabs({
  initialItems,
  addable = false,
  onAdd,
  onRemove,
}: EditableTabsProps) {
  const [items, setItems] = useState(initialItems);
  const [activeKey, setActiveKey] = useState(items[0]?.key);

  const handleAdd = () => {
    const newKey = `tab-${Date.now()}`;
    const newItem: TabItem = {
      key: newKey,
      label: `New Tab ${items.length + 1}`,
      content: `Content of New Tab ${items.length + 1}`,
      closable: true,
    };

    setItems([...items, newItem]);
    setActiveKey(newKey);
    onAdd?.();
  };

  const handleRemove = (key: string) => {
    const index = items.findIndex((item) => item.key === key);
    const newItems = items.filter((item) => item.key !== key);

    setItems(newItems);

    // 如果删除的是当前激活的标签，切换到相邻标签
    if (key === activeKey) {
      if (newItems.length > 0) {
        const newActiveKey =
          index > 0 ? newItems[index - 1].key : newItems[0].key;
        setActiveKey(newActiveKey);
      }
    }

    onRemove?.(key);
  };

  return (
    <div className="tabs tabs--editable">
      <div className="tabs__header">
        {items.map((item) => (
          <div key={item.key} className="tabs__tab-wrapper">
            <button
              className={`tabs__tab ${
                item.key === activeKey ? 'tabs__tab--active' : ''
              }`}
              onClick={() => setActiveKey(item.key)}
            >
              {item.label}
            </button>
            {item.closable && (
              <button
                className="tabs__close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(item.key);
                }}
                aria-label="Close tab"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {addable && (
          <button className="tabs__add-btn" onClick={handleAdd}>
            +
          </button>
        )}
      </div>

      <div className="tabs__content">
        {items.map((item) => (
          <div
            key={item.key}
            hidden={item.key !== activeKey}
            className="tabs__panel"
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}

export default EditableTabs;
```

**样式：**

```css
.tabs--editable .tabs__header {
  display: flex;
  gap: 0;
}

.tabs__tab-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  background: #f9fafb;
  overflow: hidden;
}

.tabs__tab-wrapper .tabs__tab {
  flex: 1;
  border: none;
  border-radius: 0;
}

.tabs__close-btn {
  padding: 0 8px;
  background: none;
  border: none;
  border-left: 1px solid #e5e7eb;
  cursor: pointer;
  color: #9ca3af;
  font-size: 14px;
  transition: all 0.2s;
}

.tabs__close-btn:hover {
  background: #f3f4f6;
  color: #ef4444;
}

.tabs__add-btn {
  padding: 8px 16px;
  background: none;
  border: 1px solid #e5e7eb;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  color: #6b7280;
  font-size: 18px;
  transition: all 0.2s;
}

.tabs__add-btn:hover {
  background: #f3f4f6;
  color: #3b82f6;
}
```

---

### 3.4 拖拽排序

```tsx
import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 可排序的标签项
function SortableTab({ item, isActive, onClick }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.key,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <button
        className={`tabs__tab ${isActive ? 'tabs__tab--active' : ''}`}
        onClick={onClick}
      >
        {item.label}
      </button>
    </div>
  );
}

// 可拖拽的标签组
function DraggableTabs({ initialItems }: { initialItems: TabItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [activeKey, setActiveKey] = useState(items[0]?.key);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.key === active.id);
        const newIndex = items.findIndex((item) => item.key === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="tabs">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.key)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="tabs__header">
            {items.map((item) => (
              <SortableTab
                key={item.key}
                item={item}
                isActive={item.key === activeKey}
                onClick={() => setActiveKey(item.key)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="tabs__content">
        {items.map((item) => (
          <div
            key={item.key}
            hidden={item.key !== activeKey}
            className="tabs__panel"
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 3.5 滚动标签栏

```tsx
import React, { useState, useRef, useEffect } from 'react';

function ScrollableTabs({ items }: TabsProps) {
  const [activeKey, setActiveKey] = useState(items[0]?.key);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // 检查是否需要显示箭头
  const checkScroll = () => {
    const header = headerRef.current;
    if (!header) return;

    const { scrollLeft, scrollWidth, clientWidth } = header;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    const header = headerRef.current;
    if (!header) return;

    const scrollAmount = 200;
    const newScrollLeft =
      direction === 'left'
        ? header.scrollLeft - scrollAmount
        : header.scrollLeft + scrollAmount;

    header.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });

    setTimeout(checkScroll, 300);
  };

  return (
    <div className="tabs tabs--scrollable">
      {showLeftArrow && (
        <button
          className="tabs__scroll-btn tabs__scroll-btn--left"
          onClick={() => scroll('left')}
        >
          ‹
        </button>
      )}

      <div
        ref={headerRef}
        className="tabs__header tabs__header--scrollable"
        onScroll={checkScroll}
      >
        {items.map((item) => (
          <button
            key={item.key}
            className={`tabs__tab ${
              item.key === activeKey ? 'tabs__tab--active' : ''
            }`}
            onClick={() => setActiveKey(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {showRightArrow && (
        <button
          className="tabs__scroll-btn tabs__scroll-btn--right"
          onClick={() => scroll('right')}
        >
          ›
        </button>
      )}

      <div className="tabs__content">
        {items.map((item) => (
          <div
            key={item.key}
            hidden={item.key !== activeKey}
            className="tabs__panel"
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**样式：**

```css
.tabs--scrollable {
  position: relative;
}

.tabs__header--scrollable {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  white-space: nowrap;
}

.tabs__header--scrollable::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.tabs__scroll-btn {
  position: absolute;
  top: 0;
  height: 100%;
  width: 40px;
  background: linear-gradient(to right, white, transparent);
  border: none;
  cursor: pointer;
  font-size: 24px;
  color: #6b7280;
  z-index: 1;
  transition: all 0.2s;
}

.tabs__scroll-btn--left {
  left: 0;
}

.tabs__scroll-btn--right {
  right: 0;
  background: linear-gradient(to left, white, transparent);
}

.tabs__scroll-btn:hover {
  color: #3b82f6;
}
```

---

### 3.6 图标和徽章

```tsx
import React from 'react';

interface TabItem {
  key: string;
  label: React.ReactNode;
  content: React.ReactNode;
  icon?: React.ReactNode;
  badge?: number | string;
  dot?: boolean; // 红点提示
}

function IconTabs({ items }: TabsProps) {
  const [activeKey, setActiveKey] = useState(items[0]?.key);

  return (
    <div className="tabs">
      <div className="tabs__header">
        {items.map((item) => (
          <button
            key={item.key}
            className={`tabs__tab tabs__tab--with-icon ${
              item.key === activeKey ? 'tabs__tab--active' : ''
            }`}
            onClick={() => setActiveKey(item.key)}
          >
            {item.icon && <span className="tabs__icon">{item.icon}</span>}
            <span className="tabs__label">{item.label}</span>
            
            {/* 徽章 */}
            {item.badge && (
              <span className="tabs__badge">{item.badge}</span>
            )}
            
            {/* 红点 */}
            {item.dot && <span className="tabs__dot" />}
          </button>
        ))}
      </div>

      <div className="tabs__content">
        {items.map((item) => (
          <div
            key={item.key}
            hidden={item.key !== activeKey}
            className="tabs__panel"
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}

// 使用示例
function App() {
  const items = [
    {
      key: '1',
      label: 'Home',
      icon: '🏠',
      content: 'Home content',
    },
    {
      key: '2',
      label: 'Messages',
      icon: '💬',
      badge: 5,
      content: 'Messages content',
    },
    {
      key: '3',
      label: 'Notifications',
      icon: '🔔',
      dot: true,
      content: 'Notifications content',
    },
  ];

  return <IconTabs items={items} />;
}
```

**样式：**

```css
.tabs__tab--with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.tabs__icon {
  font-size: 18px;
}

.tabs__label {
  flex: 1;
}

.tabs__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #ef4444;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 10px;
}

.tabs__dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid white;
}
```

---

## 四、Native JavaScript 实现

```javascript
class Tabs {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      activeKey: options.activeKey || null,
      onChange: options.onChange || (() => {}),
      type: options.type || 'default',
      animated: options.animated !== false,
      ...options,
    };

    this.items = options.items || [];
    this.activeKey = this.options.activeKey || this.items[0]?.key;

    this.init();
  }

  init() {
    this.render();
    this.attachEvents();
  }

  render() {
    this.container.className = `tabs tabs--${this.options.type}`;

    // 渲染标签头
    const header = document.createElement('div');
    header.className = 'tabs__header';
    header.setAttribute('role', 'tablist');

    this.items.forEach((item) => {
      const tab = document.createElement('button');
      tab.className = 'tabs__tab';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('data-key', item.key);
      tab.textContent = item.label;
      tab.disabled = item.disabled || false;

      if (item.key === this.activeKey) {
        tab.classList.add('tabs__tab--active');
        tab.setAttribute('aria-selected', 'true');
      }

      if (item.disabled) {
        tab.classList.add('tabs__tab--disabled');
      }

      header.appendChild(tab);
    });

    // 渲染内容
    const content = document.createElement('div');
    content.className = 'tabs__content';

    this.items.forEach((item) => {
      const panel = document.createElement('div');
      panel.className = 'tabs__panel';
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('data-key', item.key);

      if (item.key === this.activeKey) {
        panel.classList.add('tabs__panel--active');
      } else {
        panel.hidden = true;
      }

      if (this.options.animated) {
        panel.classList.add('tabs__panel--animated');
      }

      if (typeof item.content === 'string') {
        panel.innerHTML = item.content;
      } else {
        panel.appendChild(item.content);
      }

      content.appendChild(panel);
    });

    this.container.innerHTML = '';
    this.container.appendChild(header);
    this.container.appendChild(content);
  }

  attachEvents() {
    const tabs = this.container.querySelectorAll('.tabs__tab');

    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const key = e.target.getAttribute('data-key');
        if (!e.target.disabled) {
          this.setActiveKey(key);
        }
      });

      // 键盘导航
      tab.addEventListener('keydown', (e) => {
        this.handleKeyDown(e);
      });
    });
  }

  handleKeyDown(e) {
    const enabledTabs = Array.from(
      this.container.querySelectorAll('.tabs__tab:not(:disabled)')
    );
    const currentIndex = enabledTabs.indexOf(e.target);

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : enabledTabs.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = currentIndex < enabledTabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = enabledTabs.length - 1;
        break;
      default:
        return;
    }

    const nextTab = enabledTabs[nextIndex];
    const key = nextTab.getAttribute('data-key');
    this.setActiveKey(key);
    nextTab.focus();
  }

  setActiveKey(key) {
    if (this.activeKey === key) return;

    this.activeKey = key;

    // 更新标签状态
    const tabs = this.container.querySelectorAll('.tabs__tab');
    tabs.forEach((tab) => {
      const tabKey = tab.getAttribute('data-key');
      if (tabKey === key) {
        tab.classList.add('tabs__tab--active');
        tab.setAttribute('aria-selected', 'true');
        tab.setAttribute('tabindex', '0');
      } else {
        tab.classList.remove('tabs__tab--active');
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
      }
    });

    // 更新内容面板
    const panels = this.container.querySelectorAll('.tabs__panel');
    panels.forEach((panel) => {
      const panelKey = panel.getAttribute('data-key');
      if (panelKey === key) {
        panel.classList.add('tabs__panel--active');
        panel.hidden = false;
      } else {
        panel.classList.remove('tabs__panel--active');
        panel.hidden = true;
      }
    });

    // 触发回调
    this.options.onChange(key);
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

// 使用示例
const container = document.getElementById('tabs-container');

const tabs = new Tabs(container, {
  items: [
    { key: '1', label: 'Tab 1', content: '<p>Content 1</p>' },
    { key: '2', label: 'Tab 2', content: '<p>Content 2</p>' },
    { key: '3', label: 'Tab 3', content: '<p>Content 3</p>', disabled: true },
  ],
  type: 'default',
  onChange: (key) => {
    console.log('Active tab:', key);
  },
});
```

---

## 五、垂直标签页

```tsx
import React from 'react';

function VerticalTabs({ items, position = 'left' }: TabsProps) {
  const [activeKey, setActiveKey] = useState(items[0]?.key);

  return (
    <div className={`tabs tabs--vertical tabs--${position}`}>
      <div className="tabs__header tabs__header--vertical">
        {items.map((item) => (
          <button
            key={item.key}
            className={`tabs__tab ${
              item.key === activeKey ? 'tabs__tab--active' : ''
            }`}
            onClick={() => setActiveKey(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="tabs__content tabs__content--vertical">
        {items.map((item) => (
          <div
            key={item.key}
            hidden={item.key !== activeKey}
            className="tabs__panel"
          >
            {item.content}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**样式：**

```css
.tabs--vertical {
  flex-direction: row;
}

.tabs__header--vertical {
  flex-direction: column;
  border-bottom: none;
  border-right: 2px solid #e5e7eb;
  min-width: 200px;
}

.tabs--vertical .tabs__tab {
  text-align: left;
  justify-content: flex-start;
}

.tabs--vertical .tabs__tab--active::after {
  display: none;
}

.tabs--vertical .tabs__tab--active {
  border-right: 2px solid #3b82f6;
  margin-right: -2px;
  background: #eff6ff;
}

.tabs__content--vertical {
  flex: 1;
  padding: 0 20px;
}

/* 右侧标签 */
.tabs--right .tabs__header--vertical {
  border-right: none;
  border-left: 2px solid #e5e7eb;
  order: 2;
}

.tabs--right .tabs__tab--active {
  border-right: none;
  border-left: 2px solid #3b82f6;
  margin-right: 0;
  margin-left: -2px;
}
```

---

## 六、性能优化

### 6.1 虚拟化渲染（大量标签）

```tsx
import { FixedSizeList } from 'react-window';

function VirtualizedTabs({ items }: { items: TabItem[] }) {
  const [activeKey, setActiveKey] = useState(items[0]?.key);

  const TabRow = ({ index, style }: any) => {
    const item = items[index];
    return (
      <div style={style}>
        <button
          className={`tabs__tab ${
            item.key === activeKey ? 'tabs__tab--active' : ''
          }`}
          onClick={() => setActiveKey(item.key)}
        >
          {item.label}
        </button>
      </div>
    );
  };

  return (
    <div className="tabs">
      <FixedSizeList
        height={50}
        itemCount={items.length}
        itemSize={100}
        layout="horizontal"
        width="100%"
      >
        {TabRow}
      </FixedSizeList>

      <div className="tabs__content">
        {items.find((item) => item.key === activeKey)?.content}
      </div>
    </div>
  );
}
```

### 6.2 内容懒加载与缓存

```tsx
import React, { useState, useMemo } from 'react';

function CachedTabs({ items }: TabsProps) {
  const [activeKey, setActiveKey] = useState(items[0]?.key);
  const [cache, setCache] = useState<Map<string, React.ReactNode>>(new Map());

  const activeContent = useMemo(() => {
    const item = items.find((i) => i.key === activeKey);
    if (!item) return null;

    // 如果已缓存，直接返回
    if (cache.has(activeKey)) {
      return cache.get(activeKey);
    }

    // 首次渲染，缓存内容
    const content = item.content;
    setCache((prev) => new Map(prev).set(activeKey, content));
    return content;
  }, [activeKey, items, cache]);

  return (
    <div className="tabs">
      <div className="tabs__header">
        {items.map((item) => (
          <button
            key={item.key}
            className={`tabs__tab ${
              item.key === activeKey ? 'tabs__tab--active' : ''
            }`}
            onClick={() => setActiveKey(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="tabs__content">
        {/* 保持所有已访问的标签内容在 DOM 中，但隐藏 */}
        {Array.from(cache.entries()).map(([key, content]) => (
          <div
            key={key}
            hidden={key !== activeKey}
            className="tabs__panel"
          >
            {content}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 七、面试要点

### Q1: 受控 vs 非受控组件？

**非受控模式:**
```tsx
<Tabs defaultActiveKey="1" />
```
- 组件自己管理状态
- 适合简单场景

**受控模式:**
```tsx
const [activeKey, setActiveKey] = useState('1');
<Tabs activeKey={activeKey} onChange={setActiveKey} />
```
- 父组件控制状态
- 适合需要外部同步的场景

**实现技巧:**
```tsx
const activeKey = controlledActiveKey ?? internalActiveKey;
```

### Q2: 如何实现键盘导航？

**关键点:**
1. **tabindex 管理** - 激活标签 `0`，其他 `-1`
2. **监听键盘事件** - `ArrowLeft/Right`, `Home/End`
3. **焦点管理** - `ref.focus()`
4. **跳过禁用项** - 过滤 `disabled` 标签

```tsx
const enabledTabs = items.filter(item => !item.disabled);
// 循环导航
nextIndex = (currentIndex + 1) % enabledTabs.length;
```

### Q3: 如何优化大量标签的性能？

**策略:**
1. **虚拟滚动** - 只渲染可见标签
2. **懒加载** - 首次点击才渲染内容
3. **缓存内容** - 已访问的标签保留在 DOM
4. **防抖搜索** - 可搜索标签时防抖

```tsx
const [loadedKeys, setLoadedKeys] = useState(new Set([defaultKey]));

// 首次访问时加载
if (!loadedKeys.has(key)) {
  setLoadedKeys(prev => new Set([...prev, key]));
}
```

### Q4: 如何实现动画过渡？

**CSS 动画:**
```css
.tabs__panel--animated {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**React Transition Group:**
```tsx
<CSSTransition
  key={activeKey}
  timeout={300}
  classNames="panel"
>
  <div className="tabs__panel">
    {activeContent}
  </div>
</CSSTransition>
```

### Q5: 可访问性（a11y）如何实现？

**ARIA 属性:**
```tsx
// 标签头
<div role="tablist">
  <button
    role="tab"
    aria-selected={isActive}
    aria-controls="panel-1"
    aria-disabled={disabled}
    tabIndex={isActive ? 0 : -1}
  >
    Tab 1
  </button>
</div>

// 内容面板
<div
  role="tabpanel"
  id="panel-1"
  aria-labelledby="tab-1"
  hidden={!isActive}
>
  Content
</div>
```

**键盘支持:**
- `Tab` - 进入/离开标签组
- `←/→` - 切换标签
- `Home/End` - 首个/最后一个标签
- `Space/Enter` - 激活标签

---

## 八、最佳实践

### 8.1 性能优化清单

- ✅ 使用 `React.memo` 避免标签重渲染
- ✅ 懒加载标签内容
- ✅ 虚拟滚动处理大量标签
- ✅ 缓存已访问的标签内容
- ✅ 防抖搜索和滚动事件

### 8.2 无障碍性清单

- ✅ 使用语义化 HTML (`role="tablist"`, `role="tab"`)
- ✅ 正确设置 ARIA 属性
- ✅ 键盘导航支持
- ✅ 焦点管理
- ✅ 屏幕阅读器友好

### 8.3 常见陷阱

❌ **错误做法:**
```tsx
// 标签内容始终渲染
{items.map(item => (
  <div hidden={item.key !== activeKey}>
    {item.content} {/* 即使隐藏也会渲染 */}
  </div>
))}
```

✅ **正确做法:**
```tsx
// 条件渲染
{items.map(item => (
  <div hidden={item.key !== activeKey}>
    {item.key === activeKey && item.content}
  </div>
))}
```

---

## 总结

### 核心实现
- ✅ 受控/非受控模式
- ✅ 键盘导航
- ✅ 多种样式变体
- ✅ 动画过渡

### 进阶功能
- ✅ 懒加载内容
- ✅ 可添加/删除标签
- ✅ 拖拽排序
- ✅ 滚动标签栏
- ✅ 图标和徽章

### 性能优化
- ✅ 虚拟滚动
- ✅ 内容缓存
- ✅ 懒加载

### 无障碍性
- ✅ ARIA 属性
- ✅ 键盘支持
- ✅ 焦点管理

Tabs 是一个看似简单但细节繁多的组件，考察状态管理、无障碍性和性能优化能力！🎯