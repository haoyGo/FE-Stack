# Modal Dialog 模态对话框

> 功能完整的模态对话框：遮罩层、动画、键盘操作、焦点管理、多层嵌套

## 一、基础实现

```tsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function Dialog({ open, onClose, title, children, footer }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="dialog-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true">
        {title && (
          <div className="dialog-header">
            <h2>{title}</h2>
            <button onClick={onClose}>✕</button>
          </div>
        )}
        <div className="dialog-content">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
```

**样式**

```css
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.dialog-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eee;
}
```

---

## 二、动画效果

```tsx
function AnimatedDialog({ open, onClose, ...props }: DialogProps) {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => setActive(true));
    } else {
      setActive(false);
      setTimeout(() => setVisible(false), 300);
    }
  }, [open]);

  if (!visible) return null;

  return ReactDOM.createPortal(
    <div className={`dialog-overlay ${active ? 'active' : ''}`}>
      <div className="dialog">{/* ... */}</div>
    </div>,
    document.body
  );
}
```

```css
/* 动画样式 */
.dialog-overlay, .dialog { transition: all 0.3s ease; }
.dialog-overlay { opacity: 0; }
.dialog-overlay.active { opacity: 1; }
.dialog { transform: scale(0.9); opacity: 0; }
.dialog-overlay.active .dialog { transform: scale(1); opacity: 1; }

/* 滑入效果 */
.slide .dialog { transform: translateY(-50px); }
.slide.active .dialog { transform: translateY(0); }
```

---

## 三、焦点管理

```tsx
function useFocusTrap(open: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || !ref.current) return;
    
    prevFocus.current = document.activeElement as HTMLElement;
    const focusable = ref.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    first?.focus();
    
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    
    ref.current.addEventListener('keydown', handleTab);
    return () => {
      ref.current?.removeEventListener('keydown', handleTab);
      prevFocus.current?.focus();
    };
  }, [open]);

  return ref;
}
```

---

## 四、可拖拽

```tsx
function DraggableDialog({ open, onClose, ...props }: DialogProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => setPos({ x: e.clientX - start.x, y: e.clientY - start.y });
    const up = () => setDragging(false);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
  }, [dragging, start]);

  return (
    <div 
      className="dialog" 
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    >
      <div 
        onMouseDown={(e) => {
          setDragging(true);
          setStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
        }}
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      >
        {/* header */}
      </div>
    </div>
  );
}
```

---

## 五、多层对话框

```tsx
const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogs, setDialogs] = useState<Array<{ id: string; component: React.ReactNode; zIndex: number }>>([]);
  const baseZIndex = 1000;

  const openDialog = (id: string, component: React.ReactNode) => {
    setDialogs((prev) => [...prev, { id, component, zIndex: baseZIndex + prev.length }]);
  };

  const closeDialog = (id: string) => {
    setDialogs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      {dialogs.map((d) => (
        <div key={d.id} style={{ zIndex: d.zIndex }}>
          {d.component}
        </div>
      ))}
    </DialogContext.Provider>
  );
}
```

---

## 六、Native JavaScript
      overflow-y: auto;
      flex: 1;
    }

    /* 底部 */
    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
    }

    /* 按钮样式 */
    .btn {
      padding: 10px 20px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn:hover {
      background: #f9fafb;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
    }

    .btn-danger:hover {
      background: #dc2626;
    }
  </style>
</head>
<body>
  <button id="openDialog" class="btn btn-primary">Open Dialog</button>

  <script>
    class Dialog {
      constructor(options = {}) {
        this.options = {
          title: options.title || '',
          content: options.content || '',
          footer: options.footer || null,
          closeOnOverlayClick: options.closeOnOverlayClick !== false,
          closeOnEsc: options.closeOnEsc !== false,
          onClose: options.onClose || null,
          onConfirm: options.onConfirm || null,
        };

        this.isOpen = false;
        this.overlay = null;
        this.dialog = null;
        this.previousActiveElement = null;
        this.focusableElements = [];

        this.init();
      }

      init() {
        this.createElements();
        this.attachEvents();
      }

      createElements() {
        // 创建遮罩层
        this.overlay = document.createElement('div');
        this.overlay.className = 'dialog-overlay';

        // 创建对话框
        this.dialog = document.createElement('div');
        this.dialog.className = 'dialog';
        this.dialog.setAttribute('role', 'dialog');
        this.dialog.setAttribute('aria-modal', 'true');

        // 头部
        const header = document.createElement('div');
        header.className = 'dialog-header';

        if (this.options.title) {
          const title = document.createElement('h2');
          title.className = 'dialog-title';
          title.textContent = this.options.title;
          title.id = 'dialog-title';
          this.dialog.setAttribute('aria-labelledby', 'dialog-title');
          header.appendChild(title);
        }

        const closeBtn = document.createElement('button');
        closeBtn.className = 'dialog-close';
        closeBtn.innerHTML = '✕';
        closeBtn.setAttribute('aria-label', 'Close dialog');
        closeBtn.onclick = () => this.close();
        header.appendChild(closeBtn);

        // 内容
        const content = document.createElement('div');
        content.className = 'dialog-content';
        
        if (typeof this.options.content === 'string') {
          content.innerHTML = this.options.content;
        } else if (this.options.content instanceof HTMLElement) {
          content.appendChild(this.options.content);
        }

        // 底部
        let footer = null;
        if (this.options.footer) {
          footer = document.createElement('div');
          footer.className = 'dialog-footer';
          
          if (typeof this.options.footer === 'string') {
            footer.innerHTML = this.options.footer;
          } else if (this.options.footer instanceof HTMLElement) {
            footer.appendChild(this.options.footer);
          }
        }

        // 组装
        this.dialog.appendChild(header);
        this.dialog.appendChild(content);
        if (footer) this.dialog.appendChild(footer);
        this.overlay.appendChild(this.dialog);
      }

      attachEvents() {
        // 点击遮罩关闭
        if (this.options.closeOnOverlayClick) {
          this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
              this.close();
            }
          });
        }

        // ESC 键关闭
        this.handleEsc = (e) => {
          if (this.options.closeOnEsc && e.key === 'Escape') {
            this.close();
          }
        };

        // Tab 键焦点循环
        this.handleTab = (e) => {
          if (e.key !== 'Tab' || this.focusableElements.length === 0) return;

          const firstElement = this.focusableElements[0];
          const lastElement = this.focusableElements[this.focusableElements.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        };
      }

      open() {
        if (this.isOpen) return;

        this.isOpen = true;
        
        // 保存当前焦点
        this.previousActiveElement = document.activeElement;

        // 添加到 DOM
        document.body.appendChild(this.overlay);

        // 阻止页面滚动
        document.body.style.overflow = 'hidden';

        // 触发动画
        requestAnimationFrame(() => {
          this.overlay.classList.add('active');
        });

        // 获取可聚焦元素
        this.focusableElements = Array.from(
          this.dialog.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        );

        // 聚焦到第一个元素
        if (this.focusableElements.length > 0) {
          this.focusableElements[0].focus();
        }

        // 添加键盘事件
        document.addEventListener('keydown', this.handleEsc);
        this.dialog.addEventListener('keydown', this.handleTab);

        return this;
      }

      close() {
        if (!this.isOpen) return;

        this.overlay.classList.remove('active');

        // 等待动画结束
        setTimeout(() => {
          if (this.overlay && this.overlay.parentNode) {
            document.body.removeChild(this.overlay);
          }

          // 恢复页面滚动
          document.body.style.overflow = '';

          // 恢复焦点
          if (this.previousActiveElement) {
            this.previousActiveElement.focus();
          }

          this.isOpen = false;

          // 移除事件监听
          document.removeEventListener('keydown', this.handleEsc);
          if (this.dialog) {
            this.dialog.removeEventListener('keydown', this.handleTab);
          }

          // 回调
          if (this.options.onClose) {
            this.options.onClose();
          }
        }, 300);

        return this;
      }

      destroy() {
        this.close();
        this.overlay = null;
        this.dialog = null;
      }

      // 静态方法：快速创建确认对话框
      static confirm(options) {
        const footer = document.createElement('div');
        footer.style.cssText = 'display: flex; gap: 12px;';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn';
        cancelBtn.textContent = options.cancelText || 'Cancel';
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn btn-danger';
        confirmBtn.textContent = options.confirmText || 'Confirm';

        footer.appendChild(cancelBtn);
        footer.appendChild(confirmBtn);

        const dialog = new Dialog({
          title: options.title,
          content: options.content,
          footer: footer,
          closeOnOverlayClick: false,
        });

        cancelBtn.onclick = () => {
          dialog.close();
          if (options.onCancel) options.onCancel();
        };

        confirmBtn.onclick = () => {
          dialog.close();
          if (options.onConfirm) options.onConfirm();
        };

        dialog.open();
        return dialog;
      }

      // 静态方法：快速创建提示对话框
      static alert(options) {
        const footer = document.createElement('div');
        const okBtn = document.createElement('button');
        okBtn.className = 'btn btn-primary';
        okBtn.textContent = options.okText || 'OK';
        footer.appendChild(okBtn);

        const dialog = new Dialog({
          title: options.title || 'Alert',
          content: options.content,
          footer: footer,
        });

        okBtn.onclick = () => {
          dialog.close();
          if (options.onOk) options.onOk();
        };

        dialog.open();
        return dialog;
      }
    }

    // 使用示例
    document.getElementById('openDialog').addEventListener('click', () => {
      Dialog.confirm({
        title: 'Delete Confirmation',
        content: '<p>Are you sure you want to delete this item?</p><p>This action cannot be undone.</p>',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: () => {
          console.log('Confirmed');
          Dialog.alert({
            title: 'Success',
            content: 'Item has been deleted successfully!',
          });
        },
        onCancel: () => {
          console.log('Cancelled');
        },
      });
    });
  </script>
</body>
</html>
```

---

## 五、高级功能

### 5.1 嵌套对话框

```tsx
import React, { useState } from 'react';

function NestedDialogsExample() {
  const [dialog1, setDialog1] = useState(false);
  const [dialog2, setDialog2] = useState(false);
  const [dialog3, setDialog3] = useState(false);

  return (
    <>
      <button onClick={() => setDialog1(true)}>Open Dialog 1</button>

      <Dialog
        open={dialog1}
        onClose={() => setDialog1(false)}
        title="Dialog 1"
      >
        <p>This is the first dialog.</p>
        <button onClick={() => setDialog2(true)}>Open Dialog 2</button>
      </Dialog>

      <Dialog
        open={dialog2}
        onClose={() => setDialog2(false)}
        title="Dialog 2"
      >
        <p>This is the second dialog.</p>
        <button onClick={() => setDialog3(true)}>Open Dialog 3</button>
      </Dialog>

      <Dialog
        open={dialog3}
        onClose={() => setDialog3(false)}
        title="Dialog 3"
      >
        <p>This is the third dialog.</p>
      </Dialog>
    </>
  );
}
```

### 5.2 自定义尺寸

```tsx
type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface DialogProps {
  // ... 其他属性
  size?: DialogSize;
}

function Dialog({ size = 'md', ...props }: DialogProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div className="dialog-overlay">
      <div className={`dialog ${sizeClasses[size]}`}>
        {/* ... */}
      </div>
    </div>
  );
}
```

### 5.3 表单对话框

```tsx
import React, { useState } from 'react';

interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

function FormDialog({ open, onClose, onSubmit }: FormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
      onClose();
      setFormData({ name: '', email: '', message: '' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Contact Form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          />
        </div>

        <div className="dialog-footer">
          <button type="button" onClick={onClose} className="btn">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </div>
      </form>
    </Dialog>
  );
}
```

---

## 六、性能优化

### 6.1 懒加载对话框内容

```tsx
import React, { Suspense, lazy } from 'react';

const HeavyContent = lazy(() => import('./HeavyContent'));

function LazyDialog({ open, onClose }: DialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Lazy Loading">
      {open && (
        <Suspense fallback={<div>Loading...</div>}>
          <HeavyContent />
        </Suspense>
      )}
    </Dialog>
  );
}
```

### 6.2 虚拟滚动（大量内容）

```tsx
import { FixedSizeList } from 'react-window';

function VirtualScrollDialog({ open, onClose, items }: DialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Large List">
      <FixedSizeList
        height={400}
        itemCount={items.length}
        itemSize={50}
        width="100%"
      >
        {({ index, style }) => (
          <div style={style}>
            {items[index]}
          </div>
        )}
      </FixedSizeList>
    </Dialog>
  );
}
```

### 6.3 防止滚动穿透（移动端）

```typescript
// 更完善的滚动锁定
function lockScroll() {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = `${scrollbarWidth}px`;
  
  // 移动端额外处理
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
  }
}

function unlockScroll() {
  const scrollY = document.body.style.top;
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
  }
}
```

---

## 七、无障碍性（Accessibility）

### 7.1 完整的 ARIA 属性

```tsx
function AccessibleDialog({ open, onClose, title, description, children }: DialogProps) {
  const titleId = useId();
  const descId = useId();

  return (
    <div
      className="dialog-overlay"
      role="presentation"
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
      >
        <div className="dialog-header">
          <h2 id={titleId} className="dialog-title">
            {title}
          </h2>
          <button
            className="dialog-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {description && (
          <p id={descId} className="sr-only">
            {description}
          </p>
        )}

        <div className="dialog-content">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### 7.2 屏幕阅读器支持

```css
/* 仅供屏幕阅读器的内容 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## 八、面试要点

### Q1: 如何实现模态对话框？

**核心要点：**
1. **Portal** - 使用 ReactDOM.createPortal 或原生 appendChild 挂载到 body
2. **遮罩层** - 半透明背景，阻止底层交互
3. **焦点管理** - 打开时聚焦，关闭时恢复
4. **键盘操作** - ESC 关闭，Tab 焦点循环
5. **滚动锁定** - 防止背景滚动

### Q2: 如何防止滚动穿透？

```javascript
// 简单版本
document.body.style.overflow = 'hidden';

// 完善版本（考虑滚动条宽度）
const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
document.body.style.overflow = 'hidden';
document.body.style.paddingRight = `${scrollbarWidth}px`;
```

### Q3: 如何实现焦点陷阱（Focus Trap）？

```javascript
// 1. 获取所有可聚焦元素
const focusable = dialog.querySelectorAll(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);

// 2. 监听 Tab 键
if (e.key === 'Tab') {
  if (e.shiftKey && activeElement === firstElement) {
    e.preventDefault();
    lastElement.focus();
  } else if (!e.shiftKey && activeElement === lastElement) {
    e.preventDefault();
    firstElement.focus();
  }
}
```

### Q4: 如何实现对话框动画？

```css
/* 方案1: CSS 过渡 */
.dialog {
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.3s;
}

.dialog.active {
  opacity: 1;
  transform: scale(1);
}

/* 方案2: CSS 动画 */
@keyframes dialogEnter {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog {
  animation: dialogEnter 0.3s ease-out;
}
```

### Q5: 如何处理嵌套对话框？

```javascript
// 方案1: z-index 管理
const baseZIndex = 1000;
dialogs.forEach((dialog, index) => {
  dialog.style.zIndex = baseZIndex + index;
});

// 方案2: Context + Stack
const DialogContext = createContext();
function DialogProvider() {
  const [stack, setStack] = useState([]);
  // 管理对话框栈
}
```

### Q6: 对话框的无障碍性要点？

- ✅ `role="dialog"` 和 `aria-modal="true"`
- ✅ `aria-labelledby` 关联标题
- ✅ `aria-describedby` 关联描述
- ✅ 焦点管理（打开时聚焦，关闭时恢复）
- ✅ 键盘操作（ESC 关闭，Tab 循环）
- ✅ 屏幕阅读器支持

---

## 九、最佳实践

### 9.1 避免的问题

```tsx
// ❌ 错误：没有 Portal，嵌套在父组件内
function BadDialog() {
  return (
    <div className="parent">
      <div className="dialog">...</div>
    </div>
  );
}

// ✅ 正确：使用 Portal
function GoodDialog() {
  return ReactDOM.createPortal(
    <div className="dialog">...</div>,
    document.body
  );
}

// ❌ 错误：没有清理副作用
useEffect(() => {
  document.body.style.overflow = 'hidden';
}, [open]);

// ✅ 正确：清理副作用
useEffect(() => {
  if (open) {
    document.body.style.overflow = 'hidden';
  }
  return () => {
    document.body.style.overflow = '';
  };
}, [open]);
```

### 9.2 性能优化清单

- ✅ 使用 `React.memo` 避免不必要的重渲染
- ✅ 懒加载对话框内容
- ✅ 使用 CSS `transform` 而非 `left/top`
- ✅ 大量内容使用虚拟滚动
- ✅ 防抖/节流事件处理

---

## 总结

### 核心功能
- ✅ Portal 渲染
- ✅ 遮罩层点击关闭
- ✅ ESC 键关闭
- ✅ 焦点管理
- ✅ 滚动锁定

### 进阶功能
- ✅ 动画效果
- ✅ 可拖拽
- ✅ 嵌套对话框
- ✅ 多种尺寸

### 无障碍性
- ✅ ARIA 属性
- ✅ 键盘导航
- ✅ 焦点陷阱
- ✅ 屏幕阅读器

### 性能优化
- ✅ 懒加载
- ✅ 虚拟滚动
- ✅ GPU 加速动画

这是前端面试中必考的经典组件！🎯