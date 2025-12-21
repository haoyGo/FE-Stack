# Dropdown Menu 下拉菜单系统设计

> 实现一个功能完整、可复用的下拉菜单组件，支持多种交互模式和高级功能

## 一、需求分析

### 1.1 功能需求

**基础功能**
- ✅ 点击触发展开/收起
- ✅ 菜单项选择
- ✅ 键盘导航（↑↓ Enter Esc）
- ✅ 点击外部关闭
- ✅ 支持禁用状态

**进阶功能**
- ✅ 多级下拉菜单（嵌套）
- ✅ 多选模式（Checkbox）
- ✅ 搜索过滤
- ✅ 虚拟滚动（大数据量）
- ✅ 自定义触发方式（hover/click/context）
- ✅ 自动定位（防止超出视口）
- ✅ 分组显示
- ✅ 图标和富文本支持

### 1.2 非功能需求

- ⚡ **性能**: 大数据量下流畅渲染（> 10000 项）
- 📱 **响应式**: 移动端适配
- ♿ **无障碍**: ARIA 属性、键盘操作
- 🎨 **可定制**: 主题、样式自定义
- 🔧 **易用性**: API 设计简洁

---

## 二、效果预览

```
┌─────────────────────────┐
│  [Select Option ▼]      │
└─────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│  ✓ Option 1             │
│    Option 2             │
│  ─────────────────────  │
│    📁 Submenu     ▶     │
│  ─────────────────────  │
│    ⚙️  Settings          │
│    ℹ️  About              │
└─────────────────────────┘
```

---

## 三、基础实现（React + TypeScript）

### 3.1 简单版本

```tsx
import React, { useState, useRef, useEffect } from 'react';
import './Dropdown.css';

interface MenuItem {
  id: string;
  label: string;
  value?: any;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
  children?: MenuItem[];
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: MenuItem[];
  onSelect?: (item: MenuItem) => void;
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
}

function Dropdown({ 
  trigger, 
  items, 
  onSelect,
  placement = 'bottom-start' 
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 切换展开状态
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setSelectedIndex(-1);
  };

  // 选择菜单项
  const handleSelect = (item: MenuItem) => {
    if (item.disabled) return;
    
    onSelect?.(item);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const enabledItems = items.filter(item => !item.disabled && !item.divider);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < enabledItems.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : enabledItems.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(enabledItems[selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // 滚动选中项到可见区域
  useEffect(() => {
    if (selectedIndex >= 0 && menuRef.current) {
      const items = menuRef.current.querySelectorAll('.dropdown-item:not(.disabled)');
      const selectedItem = items[selectedIndex] as HTMLElement;
      selectedItem?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  return (
    <div 
      ref={dropdownRef} 
      className="dropdown"
      onKeyDown={handleKeyDown}
    >
      {/* 触发器 */}
      <div 
        className="dropdown-trigger"
        onClick={toggleDropdown}
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        tabIndex={0}
      >
        {trigger}
      </div>

      {/* 下拉菜单 */}
      {isOpen && (
        <div 
          ref={menuRef}
          className={`dropdown-menu ${placement}`}
          role="menu"
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={item.id} className="dropdown-divider" />;
            }

            const enabledIndex = items
              .slice(0, index)
              .filter(i => !i.disabled && !i.divider)
              .length;

            return (
              <div
                key={item.id}
                className={`dropdown-item ${
                  item.disabled ? 'disabled' : ''
                } ${selectedIndex === enabledIndex ? 'selected' : ''}`}
                onClick={() => handleSelect(item)}
                role="menuitem"
                aria-disabled={item.disabled}
              >
                {item.icon && (
                  <span className="dropdown-item-icon">{item.icon}</span>
                )}
                <span className="dropdown-item-label">{item.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
```

### 3.2 基础样式

```css
/* Dropdown.css */

.dropdown {
  position: relative;
  display: inline-block;
}

/* 触发器 */
.dropdown-trigger {
  cursor: pointer;
  user-select: none;
}

.dropdown-trigger:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* 下拉菜单 */
.dropdown-menu {
  position: absolute;
  min-width: 180px;
  max-height: 400px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 6px 0;
  z-index: 1000;
  animation: dropdownFadeIn 0.15s ease-out;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 定位 */
.dropdown-menu.bottom-start {
  top: calc(100% + 4px);
  left: 0;
}

.dropdown-menu.bottom-end {
  top: calc(100% + 4px);
  right: 0;
}

.dropdown-menu.top-start {
  bottom: calc(100% + 4px);
  left: 0;
}

.dropdown-menu.top-end {
  bottom: calc(100% + 4px);
  right: 0;
}

/* 菜单项 */
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
  color: #374151;
  font-size: 14px;
}

.dropdown-item:hover,
.dropdown-item.selected {
  background: #f3f4f6;
}

.dropdown-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.dropdown-item-icon {
  display: flex;
  align-items: center;
  font-size: 16px;
}

.dropdown-item-label {
  flex: 1;
}

/* 分隔线 */
.dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 6px 0;
}

/* 滚动条 */
.dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
```

### 3.3 使用示例

```tsx
import React from 'react';
import Dropdown from './Dropdown';

function App() {
  const items = [
    { 
      id: '1', 
      label: 'Profile', 
      icon: '👤',
      value: 'profile' 
    },
    { 
      id: '2', 
      label: 'Settings', 
      icon: '⚙️',
      value: 'settings' 
    },
    { id: 'divider-1', label: '', divider: true },
    { 
      id: '3', 
      label: 'Logout', 
      icon: '🚪',
      value: 'logout' 
    },
  ];

  const handleSelect = (item: MenuItem) => {
    console.log('Selected:', item);
  };

  return (
    <Dropdown
      trigger={
        <button className="btn">
          Menu ▼
        </button>
      }
      items={items}
      onSelect={handleSelect}
    />
  );
}

export default App;
```

---

## 四、进阶功能实现

### 4.1 多级下拉菜单（嵌套）

```tsx
interface NestedDropdownProps extends DropdownProps {
  level?: number;
}

function NestedDropdown({ 
  items, 
  onSelect, 
  level = 0 
}: NestedDropdownProps) {
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());

  const toggleSubmenu = (itemId: string) => {
    setOpenSubmenus(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const renderItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="dropdown-item-wrapper">
        <div
          className={`dropdown-item ${hasChildren ? 'has-submenu' : ''}`}
          onClick={() => {
            if (hasChildren) {
              toggleSubmenu(item.id);
            } else {
              onSelect?.(item);
            }
          }}
        >
          {item.icon && (
            <span className="dropdown-item-icon">{item.icon}</span>
          )}
          <span className="dropdown-item-label">{item.label}</span>
          {hasChildren && (
            <span className="dropdown-item-arrow">▶</span>
          )}
        </div>

        {/* 子菜单 */}
        {hasChildren && openSubmenus.has(item.id) && (
          <div className="dropdown-submenu" style={{ left: '100%' }}>
            {item.children!.map(child => renderItem(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`dropdown-menu level-${level}`}>
      {items.map(renderItem)}
    </div>
  );
}
```

```css
/* 嵌套菜单样式 */
.dropdown-item-wrapper {
  position: relative;
}

.dropdown-item.has-submenu {
  padding-right: 32px;
}

.dropdown-item-arrow {
  position: absolute;
  right: 12px;
  font-size: 12px;
  opacity: 0.5;
}

.dropdown-submenu {
  position: absolute;
  top: 0;
  left: 100%;
  margin-left: 4px;
  min-width: 180px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 6px 0;
  animation: submenuSlideIn 0.15s ease-out;
}

@keyframes submenuSlideIn {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

### 4.2 多选下拉菜单（Checkbox）

```tsx
interface MultiSelectDropdownProps {
  items: MenuItem[];
  value: string[];
  onChange: (selected: string[]) => void;
}

function MultiSelectDropdown({ 
  items, 
  value, 
  onChange 
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (itemId: string) => {
    const isSelected = value.includes(itemId);
    
    if (isSelected) {
      onChange(value.filter(id => id !== itemId));
    } else {
      onChange([...value, itemId]);
    }
  };

  const handleSelectAll = () => {
    const allIds = items.map(item => item.id);
    onChange(value.length === items.length ? [] : allIds);
  };

  return (
    <div className="dropdown">
      <div 
        className="dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <button className="btn">
          {value.length > 0 
            ? `${value.length} selected` 
            : 'Select items'
          }
        </button>
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          {/* 全选选项 */}
          <div 
            className="dropdown-item"
            onClick={handleSelectAll}
          >
            <input
              type="checkbox"
              checked={value.length === items.length}
              onChange={() => {}}
            />
            <span>Select All</span>
          </div>

          <div className="dropdown-divider" />

          {/* 选项列表 */}
          {items.map(item => (
            <div
              key={item.id}
              className="dropdown-item"
              onClick={() => handleToggle(item.id)}
            >
              <input
                type="checkbox"
                checked={value.includes(item.id)}
                onChange={() => {}}
              />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 4.3 带搜索功能

```tsx
function SearchableDropdown({ items, onSelect }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredItems(items);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = items.filter(item =>
      item.label.toLowerCase().includes(query)
    );
    setFilteredItems(filtered);
  }, [searchQuery, items]);

  return (
    <div className="dropdown">
      <div 
        className="dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <button className="btn">Select ▼</button>
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          {/* 搜索框 */}
          <div className="dropdown-search">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          <div className="dropdown-divider" />

          {/* 结果列表 */}
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <div
                key={item.id}
                className="dropdown-item"
                onClick={() => {
                  onSelect?.(item);
                  setIsOpen(false);
                  setSearchQuery('');
                }}
              >
                {item.label}
              </div>
            ))
          ) : (
            <div className="dropdown-empty">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
```

```css
/* 搜索框样式 */
.dropdown-search {
  padding: 8px 12px;
}

.dropdown-search input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.dropdown-search input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dropdown-empty {
  padding: 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}
```

---

### 4.4 虚拟滚动（大数据量）

```tsx
import { FixedSizeList } from 'react-window';

interface VirtualDropdownProps {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
  itemHeight?: number;
  maxHeight?: number;
}

function VirtualDropdown({
  items,
  onSelect,
  itemHeight = 40,
  maxHeight = 400,
}: VirtualDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];

    return (
      <div
        style={style}
        className="dropdown-item"
        onClick={() => {
          onSelect(item);
          setIsOpen(false);
        }}
      >
        {item.icon && <span className="dropdown-item-icon">{item.icon}</span>}
        <span className="dropdown-item-label">{item.label}</span>
      </div>
    );
  };

  return (
    <div className="dropdown">
      <div 
        className="dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <button className="btn">
          Select from {items.length} items ▼
        </button>
      </div>

      {isOpen && (
        <div className="dropdown-menu" style={{ padding: 0 }}>
          <FixedSizeList
            height={Math.min(maxHeight, items.length * itemHeight)}
            itemCount={items.length}
            itemSize={itemHeight}
            width="100%"
          >
            {Row}
          </FixedSizeList>
        </div>
      )}
    </div>
  );
}
```

---

### 4.5 自动定位（防止超出视口）

```tsx
import { useEffect, useRef, useState } from 'react';

function useAutoPosition(
  triggerRef: React.RefObject<HTMLElement>,
  menuRef: React.RefObject<HTMLElement>,
  isOpen: boolean
) {
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    placement: 'bottom-start' as const,
  });

  useEffect(() => {
    if (!isOpen || !triggerRef.current || !menuRef.current) return;

    const trigger = triggerRef.current;
    const menu = menuRef.current;
    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let top = triggerRect.bottom + 4;
    let left = triggerRect.left;
    let placement: 'bottom-start' | 'top-start' | 'bottom-end' | 'top-end' = 'bottom-start';

    // 检查底部空间
    if (top + menuRect.height > viewport.height) {
      // 切换到顶部
      top = triggerRect.top - menuRect.height - 4;
      placement = 'top-start';
    }

    // 检查右侧空间
    if (left + menuRect.width > viewport.width) {
      left = triggerRect.right - menuRect.width;
      placement = placement.includes('top') ? 'top-end' : 'bottom-end';
    }

    // 检查左侧空间
    if (left < 0) {
      left = 4;
    }

    setPosition({ top, left, placement });
  }, [isOpen, triggerRef, menuRef]);

  return position;
}

function AutoPositionDropdown(props: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const position = useAutoPosition(triggerRef, menuRef, isOpen);

  return (
    <div className="dropdown">
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {props.trigger}
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className={`dropdown-menu ${position.placement}`}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
          }}
        >
          {/* 菜单内容 */}
        </div>
      )}
    </div>
  );
}
```

---

### 4.6 不同触发方式

```tsx
type TriggerType = 'click' | 'hover' | 'contextmenu';

interface FlexibleDropdownProps extends DropdownProps {
  trigger: TriggerType;
  hoverDelay?: number;
}

function FlexibleDropdown({
  trigger: triggerType,
  hoverDelay = 200,
  ...props
}: FlexibleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout>();

  const handleClick = () => {
    if (triggerType === 'click') {
      setIsOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (triggerType === 'hover') {
      hoverTimerRef.current = setTimeout(() => {
        setIsOpen(true);
      }, hoverDelay);
    }
  };

  const handleMouseLeave = () => {
    if (triggerType === 'hover') {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      setIsOpen(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (triggerType === 'contextmenu') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div
      className="dropdown"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
    >
      {props.trigger}
      {isOpen && <div className="dropdown-menu">{/* 内容 */}</div>}
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
  <title>Dropdown Menu</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 40px;
    }

    .dropdown {
      position: relative;
      display: inline-block;
    }

    .dropdown-trigger {
      padding: 10px 20px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }

    .dropdown-trigger:hover {
      background: #2563eb;
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      min-width: 200px;
      max-height: 400px;
      overflow-y: auto;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      padding: 6px 0;
      z-index: 1000;
      display: none;
      animation: fadeIn 0.15s ease-out;
    }

    .dropdown-menu.open {
      display: block;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      cursor: pointer;
      transition: background 0.15s;
      color: #374151;
      font-size: 14px;
    }

    .dropdown-item:hover,
    .dropdown-item.selected {
      background: #f3f4f6;
    }

    .dropdown-item.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    .dropdown-item-icon {
      font-size: 16px;
    }

    .dropdown-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 6px 0;
    }
  </style>
</head>
<body>
  <div id="dropdown-container"></div>

  <script>
    class Dropdown {
      constructor(container, options = {}) {
        this.container = container;
        this.options = {
          trigger: options.trigger || 'Click me',
          items: options.items || [],
          onSelect: options.onSelect || null,
          placement: options.placement || 'bottom-start',
        };

        this.isOpen = false;
        this.selectedIndex = -1;
        this.dropdownEl = null;
        this.triggerEl = null;
        this.menuEl = null;

        this.init();
      }

      init() {
        this.render();
        this.attachEvents();
      }

      render() {
        // 创建下拉容器
        this.dropdownEl = document.createElement('div');
        this.dropdownEl.className = 'dropdown';

        // 创建触发器
        this.triggerEl = document.createElement('button');
        this.triggerEl.className = 'dropdown-trigger';
        this.triggerEl.textContent = this.options.trigger;
        this.triggerEl.setAttribute('aria-haspopup', 'true');
        this.triggerEl.setAttribute('aria-expanded', 'false');

        // 创建菜单
        this.menuEl = document.createElement('div');
        this.menuEl.className = 'dropdown-menu';
        this.menuEl.setAttribute('role', 'menu');

        // 渲染菜单项
        this.options.items.forEach((item, index) => {
          if (item.divider) {
            const divider = document.createElement('div');
            divider.className = 'dropdown-divider';
            this.menuEl.appendChild(divider);
          } else {
            const itemEl = document.createElement('div');
            itemEl.className = 'dropdown-item';
            itemEl.setAttribute('role', 'menuitem');
            itemEl.dataset.index = index;

            if (item.disabled) {
              itemEl.classList.add('disabled');
            }

            if (item.icon) {
              const icon = document.createElement('span');
              icon.className = 'dropdown-item-icon';
              icon.textContent = item.icon;
              itemEl.appendChild(icon);
            }

            const label = document.createElement('span');
            label.textContent = item.label;
            itemEl.appendChild(label);

            this.menuEl.appendChild(itemEl);
          }
        });

        // 组装
        this.dropdownEl.appendChild(this.triggerEl);
        this.dropdownEl.appendChild(this.menuEl);
        this.container.appendChild(this.dropdownEl);
      }

      attachEvents() {
        // 点击触发器
        this.triggerEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggle();
        });

        // 点击菜单项
        this.menuEl.addEventListener('click', (e) => {
          const itemEl = e.target.closest('.dropdown-item');
          if (!itemEl || itemEl.classList.contains('disabled')) return;

          const index = parseInt(itemEl.dataset.index);
          const item = this.options.items[index];
          
          if (this.options.onSelect) {
            this.options.onSelect(item);
          }

          this.close();
        });

        // 点击外部关闭
        document.addEventListener('click', (e) => {
          if (this.isOpen && !this.dropdownEl.contains(e.target)) {
            this.close();
          }
        });

        // 键盘导航
        this.triggerEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.toggle();
          } else if (e.key === 'ArrowDown' && !this.isOpen) {
            e.preventDefault();
            this.open();
          }
        });

        this.dropdownEl.addEventListener('keydown', (e) => {
          if (!this.isOpen) return;

          const enabledItems = this.options.items.filter(
            item => !item.disabled && !item.divider
          );

          switch (e.key) {
            case 'ArrowDown':
              e.preventDefault();
              this.selectedIndex = 
                this.selectedIndex < enabledItems.length - 1 
                  ? this.selectedIndex + 1 
                  : 0;
              this.updateSelection();
              break;

            case 'ArrowUp':
              e.preventDefault();
              this.selectedIndex = 
                this.selectedIndex > 0 
                  ? this.selectedIndex - 1 
                  : enabledItems.length - 1;
              this.updateSelection();
              break;

            case 'Enter':
              e.preventDefault();
              if (this.selectedIndex >= 0) {
                const item = enabledItems[this.selectedIndex];
                if (this.options.onSelect) {
                  this.options.onSelect(item);
                }
                this.close();
              }
              break;

            case 'Escape':
              e.preventDefault();
              this.close();
              break;
          }
        });
      }

      updateSelection() {
        const items = this.menuEl.querySelectorAll('.dropdown-item:not(.disabled)');
        items.forEach((item, index) => {
          item.classList.toggle('selected', index === this.selectedIndex);
        });

        if (this.selectedIndex >= 0) {
          items[this.selectedIndex].scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          });
        }
      }

      toggle() {
        this.isOpen ? this.close() : this.open();
      }

      open() {
        this.isOpen = true;
        this.menuEl.classList.add('open');
        this.triggerEl.setAttribute('aria-expanded', 'true');
        this.selectedIndex = -1;
      }

      close() {
        this.isOpen = false;
        this.menuEl.classList.remove('open');
        this.triggerEl.setAttribute('aria-expanded', 'false');
        this.selectedIndex = -1;
        this.updateSelection();
      }

      destroy() {
        if (this.dropdownEl) {
          this.dropdownEl.remove();
        }
      }
    }

    // 使用示例
    const items = [
      { id: '1', label: 'Profile', icon: '👤', value: 'profile' },
      { id: '2', label: 'Settings', icon: '⚙️', value: 'settings' },
      { id: 'divider-1', divider: true },
      { id: '3', label: 'Help', icon: 'ℹ️', value: 'help' },
      { id: '4', label: 'Logout', icon: '🚪', value: 'logout' },
    ];

    const dropdown = new Dropdown(
      document.getElementById('dropdown-container'),
      {
        trigger: 'Menu ▼',
        items,
        onSelect: (item) => {
          console.log('Selected:', item);
          alert(`You selected: ${item.label}`);
        },
      }
    );
  </script>
</body>
</html>
```

---

## 六、性能优化

### 6.1 防止重复渲染

```tsx
import React, { memo } from 'react';

const DropdownItem = memo(({ 
  item, 
  isSelected, 
  onSelect 
}: {
  item: MenuItem;
  isSelected: boolean;
  onSelect: (item: MenuItem) => void;
}) => {
  return (
    <div
      className={`dropdown-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(item)}
    >
      {item.icon && <span className="dropdown-item-icon">{item.icon}</span>}
      <span className="dropdown-item-label">{item.label}</span>
    </div>
  );
});
```

### 6.2 懒加载菜单项

```tsx
function LazyDropdown({ items, onSelect }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [renderedItems, setRenderedItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    if (isOpen && renderedItems.length === 0) {
      // 首次打开时再渲染菜单项
      setRenderedItems(items);
    }
  }, [isOpen, items, renderedItems.length]);

  return (
    <div className="dropdown">
      <div onClick={() => setIsOpen(!isOpen)}>
        {/* 触发器 */}
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          {renderedItems.map(item => (
            <div key={item.id}>{item.label}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 七、无障碍性（Accessibility）

### 7.1 完整的 ARIA 属性

```tsx
function AccessibleDropdown({ items, onSelect }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDescendant, setActiveDescendant] = useState('');
  const menuId = useId();
  const triggerId = useId();

  return (
    <div className="dropdown">
      <button
        id={triggerId}
        className="dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
      >
        Menu
      </button>

      {isOpen && (
        <div
          id={menuId}
          className="dropdown-menu"
          role="menu"
          aria-labelledby={triggerId}
          aria-activedescendant={activeDescendant}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              id={`${menuId}-item-${index}`}
              className="dropdown-item"
              role="menuitem"
              tabIndex={-1}
              onClick={() => onSelect(item)}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 八、面试要点

### Q1: 如何实现点击外部关闭？

```typescript
useEffect(() => {
  if (!isOpen) return;

  const handleClickOutside = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  // 使用 mousedown 而不是 click，避免与内部点击冲突
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isOpen]);
```

### Q2: 如何防止菜单超出视口？

```typescript
// 1. 检测空间并调整位置
const rect = triggerRef.current.getBoundingClientRect();
const spaceBelow = window.innerHeight - rect.bottom;
const spaceAbove = rect.top;

if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
  // 空间不足，显示在上方
  placement = 'top';
}

// 2. 使用 position: fixed + 动态计算
style={{ position: 'fixed', top, left }}

// 3. 使用 Popper.js 库（推荐）
import { usePopper } from 'react-popper';
```

### Q3: 如何实现键盘导航？

**关键：**
- ↑↓ 键切换选中项
- Enter 确认选择
- Esc 关闭菜单
- Tab 焦点管理

```typescript
switch (e.key) {
  case 'ArrowDown':
    setSelectedIndex(prev => (prev + 1) % items.length);
    break;
  case 'ArrowUp':
    setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
    break;
  case 'Enter':
    handleSelect(items[selectedIndex]);
    break;
  case 'Escape':
    setIsOpen(false);
    break;
}
```

### Q4: 如何优化大数据量渲染？

**方案：**
1. **虚拟滚动** - react-window / react-virtual
2. **分页加载** - 滚动到底部加载更多
3. **搜索过滤** - 减少渲染项数量
4. **懒加载** - 打开时才渲染

### Q5: 下拉菜单的性能瓶颈在哪？

1. **大量 DOM 节点** - 使用虚拟滚动
2. **频繁重渲染** - React.memo / useMemo
3. **复杂嵌套** - 扁平化数据结构
4. **动画卡顿** - 使用 CSS transform 而非 left/top

---

## 九、最佳实践

### 9.1 API 设计

```typescript
// ✅ 好的 API 设计
<Dropdown
  trigger={<button>Menu</button>}
  items={items}
  onSelect={handleSelect}
  placement="bottom-start"
  closeOnSelect={true}
/>

// ❌ 避免过度嵌套
<Dropdown>
  <DropdownTrigger>
    <button>Menu</button>
  </DropdownTrigger>
  <DropdownMenu>
    <DropdownItem>Item 1</DropdownItem>
    <DropdownItem>Item 2</DropdownItem>
  </DropdownMenu>
</Dropdown>
```

### 9.2 常见错误

```typescript
// ❌ 错误：没有阻止事件冒泡
<div onClick={() => setIsOpen(false)}>
  <input onClick={handleInput} /> {/* 点击会关闭下拉 */}
</div>

// ✅ 正确：阻止冒泡
<input onClick={(e) => {
  e.stopPropagation();
  handleInput();
}} />

// ❌ 错误：没有清理事件监听
useEffect(() => {
  document.addEventListener('click', handleClick);
}, []);

// ✅ 正确：清理
useEffect(() => {
  document.addEventListener('click', handleClick);
  return () => document.removeEventListener('click', handleClick);
}, []);
```

---

## 总结

### 核心功能
- ✅ 基础展开/收起
- ✅ 键盘导航
- ✅ 点击外部关闭
- ✅ 禁用状态

### 进阶功能
- ✅ 多级嵌套
- ✅ 多选模式
- ✅ 搜索过滤
- ✅ 虚拟滚动
- ✅ 自动定位

### 性能优化
- ✅ React.memo
- ✅ 虚拟滚动
- ✅ 懒加载
- ✅ 防抖/节流

### 无障碍性
- ✅ ARIA 属性
- ✅ 键盘操作
- ✅ 焦点管理
- ✅ 屏幕阅读器

这是前端组件库中的基础组件，面试高频考点！🎯