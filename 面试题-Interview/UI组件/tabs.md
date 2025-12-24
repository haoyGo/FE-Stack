# 标签页组件

## 核心实现

### 基础结构
```jsx
function Tabs({ children, defaultActiveKey }) {
  const [activeKey, setActiveKey] = useState(defaultActiveKey);

  // 从 children 中提取 TabPane
  const panes = React.Children.toArray(children).filter(
    child => child.type === TabPane
  );

  return (
    <div className="tabs">
      <div className="tabs-nav" role="tablist">
        {panes.map(pane => (
          <button
            key={pane.props.tabKey}
            className={`tab ${activeKey === pane.props.tabKey ? 'active' : ''}`}
            onClick={() => setActiveKey(pane.props.tabKey)}
            role="tab"
            aria-selected={activeKey === pane.props.tabKey}
            aria-controls={`panel-${pane.props.tabKey}`}
          >
            {pane.props.tab}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {panes.map(pane => (
          <div
            key={pane.props.tabKey}
            id={`panel-${pane.props.tabKey}`}
            role="tabpanel"
            hidden={activeKey !== pane.props.tabKey}
          >
            {pane.props.children}
          </div>
        ))}
      </div>
    </div>
  );
}

function TabPane({ children }) {
  return <>{children}</>;
}

// 使用示例
function App() {
  return (
    <Tabs defaultActiveKey="1">
      <TabPane tabKey="1" tab="标签 1">
        <p>标签 1 的内容</p>
      </TabPane>
      <TabPane tabKey="2" tab="标签 2">
        <p>标签 2 的内容</p>
      </TabPane>
      <TabPane tabKey="3" tab="标签 3">
        <p>标签 3 的内容</p>
      </TabPane>
    </Tabs>
  );
}
```

### 样式
```css
.tabs {
  border: 1px solid #ddd;
  border-radius: 4px;
}

.tabs-nav {
  display: flex;
  border-bottom: 1px solid #ddd;
  background: #f5f5f5;
}

.tab {
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
}

.tab:hover {
  color: #1890ff;
}

.tab.active {
  color: #1890ff;
  background: white;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #1890ff;
}

.tabs-content {
  padding: 16px;
}
```

## 关键要点

### 1. 键盘导航
```jsx
function Tabs({ children, defaultActiveKey }) {
  const [activeKey, setActiveKey] = useState(defaultActiveKey);
  const tabRefs = useRef([]);

  const panes = React.Children.toArray(children).filter(
    child => child.type === TabPane
  );

  const handleKeyDown = (e, index) => {
    let nextIndex;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = index > 0 ? index - 1 : panes.length - 1;
        break;
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = index < panes.length - 1 ? index + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = panes.length - 1;
        break;
      default:
        return;
    }

    setActiveKey(panes[nextIndex].props.tabKey);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="tabs">
      <div className="tabs-nav" role="tablist">
        {panes.map((pane, index) => (
          <button
            key={pane.props.tabKey}
            ref={el => tabRefs.current[index] = el}
            className={`tab ${activeKey === pane.props.tabKey ? 'active' : ''}`}
            onClick={() => setActiveKey(pane.props.tabKey)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            role="tab"
            tabIndex={activeKey === pane.props.tabKey ? 0 : -1}
          >
            {pane.props.tab}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {panes.map(pane => (
          <div
            key={pane.props.tabKey}
            role="tabpanel"
            hidden={activeKey !== pane.props.tabKey}
          >
            {pane.props.children}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. 懒加载内容
```jsx
function Tabs({ children, defaultActiveKey }) {
  const [activeKey, setActiveKey] = useState(defaultActiveKey);
  const [loadedKeys, setLoadedKeys] = useState(new Set([defaultActiveKey]));

  const handleTabChange = (key) => {
    setActiveKey(key);
    setLoadedKeys(prev => new Set([...prev, key]));
  };

  const panes = React.Children.toArray(children);

  return (
    <div className="tabs">
      <div className="tabs-nav">
        {panes.map(pane => (
          <button
            key={pane.props.tabKey}
            onClick={() => handleTabChange(pane.props.tabKey)}
            className={activeKey === pane.props.tabKey ? 'active' : ''}
          >
            {pane.props.tab}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {panes.map(pane => (
          <div
            key={pane.props.tabKey}
            hidden={activeKey !== pane.props.tabKey}
          >
            {loadedKeys.has(pane.props.tabKey) ? pane.props.children : null}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. 动态标签页
```jsx
function DynamicTabs() {
  const [tabs, setTabs] = useState([
    { key: '1', title: '标签 1', content: '内容 1' }
  ]);
  const [activeKey, setActiveKey] = useState('1');
  const [nextKey, setNextKey] = useState(2);

  const addTab = () => {
    const key = nextKey.toString();
    setTabs([...tabs, {
      key,
      title: `标签 ${nextKey}`,
      content: `内容 ${nextKey}`
    }]);
    setActiveKey(key);
    setNextKey(nextKey + 1);
  };

  const removeTab = (targetKey) => {
    const index = tabs.findIndex(tab => tab.key === targetKey);
    const newTabs = tabs.filter(tab => tab.key !== targetKey);
    
    if (newTabs.length === 0) return;
    
    setTabs(newTabs);
    
    // 如果删除的是当前标签，切换到相邻标签
    if (targetKey === activeKey) {
      const newActiveKey = newTabs[index] 
        ? newTabs[index].key 
        : newTabs[index - 1].key;
      setActiveKey(newActiveKey);
    }
  };

  return (
    <div className="tabs">
      <div className="tabs-nav">
        {tabs.map(tab => (
          <div key={tab.key} className="tab-item">
            <button
              onClick={() => setActiveKey(tab.key)}
              className={activeKey === tab.key ? 'active' : ''}
            >
              {tab.title}
            </button>
            {tabs.length > 1 && (
              <button
                className="close-btn"
                onClick={() => removeTab(tab.key)}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button className="add-btn" onClick={addTab}>+</button>
      </div>
      <div className="tabs-content">
        {tabs.map(tab => (
          <div
            key={tab.key}
            hidden={activeKey !== tab.key}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 高级功能

### 1. 拖拽排序
```jsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableTab({ tab, isActive, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: tab.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      className={`tab ${isActive ? 'active' : ''}`}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {tab.title}
    </button>
  );
}

function DraggableTabs() {
  const [tabs, setTabs] = useState([
    { key: '1', title: '标签 1', content: '内容 1' },
    { key: '2', title: '标签 2', content: '内容 2' },
    { key: '3', title: '标签 3', content: '内容 3' }
  ]);
  const [activeKey, setActiveKey] = useState('1');

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tabs.findIndex(tab => tab.key === active.id);
    const newIndex = tabs.findIndex(tab => tab.key === over.id);

    const newTabs = [...tabs];
    const [removed] = newTabs.splice(oldIndex, 1);
    newTabs.splice(newIndex, 0, removed);

    setTabs(newTabs);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="tabs">
        <div className="tabs-nav">
          <SortableContext
            items={tabs.map(t => t.key)}
            strategy={horizontalListSortingStrategy}
          >
            {tabs.map(tab => (
              <SortableTab
                key={tab.key}
                tab={tab}
                isActive={activeKey === tab.key}
                onClick={() => setActiveKey(tab.key)}
              />
            ))}
          </SortableContext>
        </div>
        <div className="tabs-content">
          {tabs.map(tab => (
            <div key={tab.key} hidden={activeKey !== tab.key}>
              {tab.content}
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  );
}
```

### 2. 垂直标签页
```jsx
function VerticalTabs({ children, defaultActiveKey }) {
  const [activeKey, setActiveKey] = useState(defaultActiveKey);
  const panes = React.Children.toArray(children);

  return (
    <div className="tabs-vertical">
      <div className="tabs-nav-vertical">
        {panes.map(pane => (
          <button
            key={pane.props.tabKey}
            className={`tab ${activeKey === pane.props.tabKey ? 'active' : ''}`}
            onClick={() => setActiveKey(pane.props.tabKey)}
          >
            {pane.props.tab}
          </button>
        ))}
      </div>
      <div className="tabs-content-vertical">
        {panes.map(pane => (
          <div
            key={pane.props.tabKey}
            hidden={activeKey !== pane.props.tabKey}
          >
            {pane.props.children}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. 滚动标签页
```jsx
function ScrollableTabs({ tabs, activeKey, onChange }) {
  const navRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (!navRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [tabs]);

  const scroll = (direction) => {
    if (!navRef.current) return;
    const scrollAmount = 200;
    navRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(checkScroll, 300);
  };

  return (
    <div className="tabs-scrollable">
      {showLeftArrow && (
        <button className="scroll-arrow left" onClick={() => scroll('left')}>
          ‹
        </button>
      )}
      <div 
        ref={navRef}
        className="tabs-nav-scroll"
        onScroll={checkScroll}
      >
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeKey === tab.key ? 'active' : ''}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.title}
          </button>
        ))}
      </div>
      {showRightArrow && (
        <button className="scroll-arrow right" onClick={() => scroll('right')}>
          ›
        </button>
      )}
    </div>
  );
}
```

### CSS 样式
```css
.tabs-scrollable {
  position: relative;
  display: flex;
  align-items: center;
}

.tabs-nav-scroll {
  display: flex;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.tabs-nav-scroll::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.scroll-arrow {
  position: absolute;
  z-index: 1;
  padding: 8px;
  background: white;
  border: 1px solid #ddd;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.scroll-arrow.left {
  left: 0;
}

.scroll-arrow.right {
  right: 0;
}
```

## 面试要点

**Q: 如何实现标签页的懒加载？**
- 记录已加载的标签 key
- 首次激活时才渲染内容
- 使用 hidden 属性而不是条件渲染保持状态
- 可选：卸载长时间未使用的标签内容

**Q: 如何处理大量标签页？**
- 实现滚动功能
- 添加搜索/过滤功能
- 固定常用标签
- 限制最大标签数量
- 虚拟滚动（极端情况）

**Q: 如何优化标签页切换性能？**
```jsx
const TabContent = React.memo(({ children, isActive }) => {
  // 使用 visibility 而不是 display
  return (
    <div style={{ 
      visibility: isActive ? 'visible' : 'hidden',
      height: isActive ? 'auto' : 0,
      overflow: 'hidden'
    }}>
      {children}
    </div>
  );
});
```

**Q: 如何实现标签页的路由同步？**
```jsx
import { useSearchParams } from 'react-router-dom';

function RoutedTabs({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeKey = searchParams.get('tab') || 'default';

  const handleChange = (key) => {
    setSearchParams({ tab: key });
  };

  return (
    <Tabs activeKey={activeKey} onChange={handleChange}>
      {children}
    </Tabs>
  );
}
```

**Q: 标签页的可访问性要点？**
- 使用正确的 ARIA 属性（role、aria-selected）
- 支持键盘导航（方向键、Home、End）
- 使用 tabindex 管理焦点
- 确保标签和内容关联（aria-controls）
- 提供有意义的标签文本
