# 下拉菜单组件

## 核心实现

### 基础结构
```jsx
function Dropdown({ trigger, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="dropdown">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div className="dropdown-menu">
          {children}
        </div>
      )}
    </div>
  );
}

// 使用示例
function App() {
  return (
    <Dropdown trigger={<button>选项 ▼</button>}>
      <div className="dropdown-item" onClick={() => console.log('选项1')}>
        选项 1
      </div>
      <div className="dropdown-item" onClick={() => console.log('选项2')}>
        选项 2
      </div>
      <div className="dropdown-item" onClick={() => console.log('选项3')}>
        选项 3
      </div>
    </Dropdown>
  );
}
```

### 样式
```css
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 160px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  margin-top: 4px;
  z-index: 1000;
}

.dropdown-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f5f5f5;
}
```

## 关键要点

### 1. 键盘导航
```jsx
function Dropdown({ trigger, items }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const itemRefs = useRef([]);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : items.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0) {
          items[focusedIndex].onClick();
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex].focus();
    }
  }, [focusedIndex]);

  return (
    <div className="dropdown" onKeyDown={handleKeyDown}>
      <button onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        {trigger}
      </button>
      {isOpen && (
        <div className="dropdown-menu" role="menu">
          {items.map((item, index) => (
            <div
              key={index}
              ref={el => itemRefs.current[index] = el}
              className="dropdown-item"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
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

### 2. 定位策略
```jsx
import { usePopper } from 'react-popper';

function Dropdown({ trigger, children, placement = 'bottom-start' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    modifiers: [
      {
        name: 'offset',
        options: { offset: [0, 8] }
      },
      {
        name: 'flip',
        options: { fallbackPlacements: ['top-start', 'right-start'] }
      }
    ]
  });

  return (
    <>
      <div ref={setReferenceElement} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          className="dropdown-menu"
        >
          {children}
        </div>
      )}
    </>
  );
}
```

### 3. 多级菜单
```jsx
function NestedDropdown({ items }) {
  const [openMenus, setOpenMenus] = useState(new Set());

  const handleMouseEnter = (id) => {
    setOpenMenus(prev => new Set(prev).add(id));
  };

  const handleMouseLeave = (id) => {
    setOpenMenus(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const renderItem = (item) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openMenus.has(item.id);

    return (
      <div
        key={item.id}
        className="dropdown-item"
        onMouseEnter={() => hasChildren && handleMouseEnter(item.id)}
        onMouseLeave={() => hasChildren && handleMouseLeave(item.id)}
      >
        <div className="dropdown-item-content">
          {item.label}
          {hasChildren && <span className="arrow">▶</span>}
        </div>
        {hasChildren && isOpen && (
          <div className="dropdown-submenu">
            {item.children.map(renderItem)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dropdown-menu">
      {items.map(renderItem)}
    </div>
  );
}
```

## 高级功能

### 1. 搜索过滤
```jsx
function SearchableDropdown({ items, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dropdown">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="搜索..."
      />
      {isOpen && (
        <div className="dropdown-menu">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div
                key={index}
                className="dropdown-item"
                onClick={() => {
                  onSelect(item);
                  setSearchTerm(item.label);
                  setIsOpen(false);
                }}
              >
                {item.label}
              </div>
            ))
          ) : (
            <div className="dropdown-item disabled">无匹配结果</div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 2. 虚拟滚动
```jsx
import { useVirtual } from 'react-virtual';

function VirtualDropdown({ items, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const parentRef = useRef();

  const rowVirtualizer = useVirtual({
    size: items.length,
    parentRef,
    estimateSize: useCallback(() => 40, []),
    overscan: 5
  });

  return (
    <div className="dropdown">
      <button onClick={() => setIsOpen(!isOpen)}>
        选择项 ({items.length} 项)
      </button>
      {isOpen && (
        <div
          ref={parentRef}
          className="dropdown-menu"
          style={{ height: '300px', overflow: 'auto' }}
        >
          <div
            style={{
              height: `${rowVirtualizer.totalSize}px`,
              position: 'relative'
            }}
          >
            {rowVirtualizer.virtualItems.map(virtualRow => (
              <div
                key={virtualRow.index}
                className="dropdown-item"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
                onClick={() => {
                  onSelect(items[virtualRow.index]);
                  setIsOpen(false);
                }}
              >
                {items[virtualRow.index].label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3. 分组菜单
```jsx
function GroupedDropdown({ groups }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="dropdown">
      <button onClick={() => setIsOpen(!isOpen)}>选择</button>
      {isOpen && (
        <div className="dropdown-menu">
          {groups.map((group, groupIndex) => (
            <div key={groupIndex} className="dropdown-group">
              {group.title && (
                <div className="dropdown-group-title">{group.title}</div>
              )}
              {group.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="dropdown-item"
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                >
                  {item.label}
                </div>
              ))}
              {groupIndex < groups.length - 1 && (
                <div className="dropdown-divider" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 面试要点

**Q: 如何实现点击外部关闭？**
- 使用事件委托在 document 上监听点击事件
- 检查点击目标是否在下拉菜单内
- 注意在组件卸载时移除事件监听器
- 考虑使用 mousedown 而不是 click（更早触发）

**Q: 如何处理边界溢出？**
- 使用 Popper.js 等库自动计算位置
- 检测可视区域边界
- 自动调整下拉方向（上/下/左/右）
- 在小屏幕上考虑全屏显示

**Q: 如何优化大列表性能？**
- 使用虚拟滚动（react-virtual）
- 懒加载选项
- 搜索过滤减少渲染数量
- 使用 React.memo 避免不必要的重渲染

**Q: 如何实现多选下拉？**
```jsx
function MultiSelect({ items, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const handleToggle = (value) => {
    const newSelected = new Set(selected);
    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      newSelected.add(value);
    }
    setSelected(newSelected);
    onChange(Array.from(newSelected));
  };

  return (
    <div className="dropdown">
      <button onClick={() => setIsOpen(!isOpen)}>
        已选 {selected.size} 项
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {items.map(item => (
            <label key={item.value} className="dropdown-item">
              <input
                type="checkbox"
                checked={selected.has(item.value)}
                onChange={() => handleToggle(item.value)}
              />
              {item.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
```
