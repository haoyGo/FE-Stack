# Modal Dialog 模态对话框组件

> 实现一个功能完整的模态对话框组件，支持遮罩层、动画、键盘操作、焦点管理等功能

## 一、效果预览

```
┌─────────────────────────────────────────┐
│         Page Content (Blur)            │
│    ┌─────────────────────────────┐     │
│    │  ✕  Dialog Title            │     │
│    ├─────────────────────────────┤     │
│    │                             │     │
│    │   Dialog Content...         │     │
│    │                             │     │
│    ├─────────────────────────────┤     │
│    │         [Cancel] [Confirm]  │     │
│    └─────────────────────────────┘     │
│           ◼◼◼ Overlay ◼◼◼             │
└─────────────────────────────────────────┘
```

## 二、基础实现（React）

### 2.1 简单版本

```tsx
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './Dialog.css';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
}

function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC 键关闭
  useEffect(() => {
    if (!open || !closeOnEsc) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, closeOnEsc, onClose]);

  // 点击遮罩层关闭
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // 阻止滚动穿透
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="dialog-overlay" onClick={handleOverlayClick}>
      <div 
        className="dialog" 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
      >
        {/* 头部 */}
        {(title || showCloseButton) && (
          <div className="dialog-header">
            {title && (
              <h2 id="dialog-title" className="dialog-title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                className="dialog-close"
                onClick={onClose}
                aria-label="Close dialog"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* 内容 */}
        <div className="dialog-content">
          {children}
        </div>

        {/* 底部 */}
        {footer && (
          <div className="dialog-footer">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default Dialog;
```

### 2.2 基础 CSS

```css
/* Dialog.css */

/* 遮罩层 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

/* 对话框主体 */
.dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 头部 */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.dialog-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 20px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.dialog-close:hover {
  background: #f3f4f6;
  color: #111827;
}

/* 内容 */
.dialog-content {
  padding: 24px;
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

/* 响应式 */
@media (max-width: 640px) {
  .dialog {
    max-width: 100%;
    margin: auto 16px;
  }

  .dialog-header {
    padding: 16px;
  }

  .dialog-content {
    padding: 16px;
  }

  .dialog-footer {
    padding: 12px 16px;
  }
}
```

### 2.3 使用示例

```tsx
import React, { useState } from 'react';
import Dialog from './Dialog';

function App() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setOpen(true)}>
        Open Dialog
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete Confirmation"
        footer={
          <>
            <button onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button 
              onClick={() => {
                console.log('Confirmed');
                setOpen(false);
              }}
              className="btn-primary"
            >
              Confirm
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete this item?</p>
        <p>This action cannot be undone.</p>
      </Dialog>
    </div>
  );
}

export default App;
```

---

## 三、进阶功能

### 3.1 添加动画效果

```tsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './DialogAnimated.css';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  animationType?: 'fade' | 'slide' | 'zoom' | 'slideUp';
}

function DialogAnimated({
  open,
  onClose,
  title,
  children,
  animationType = 'fade',
}: DialogProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      // 延迟触发动画，确保 DOM 已渲染
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      // 等待动画结束后移除 DOM
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); // 与 CSS 动画时长一致

      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  return ReactDOM.createPortal(
    <div 
      className={`dialog-overlay ${isAnimating ? 'active' : ''} animation-${animationType}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true">
        <div className="dialog-header">
          {title && <h2 className="dialog-title">{title}</h2>}
          <button className="dialog-close" onClick={handleClose}>
            ✕
          </button>
        </div>
        <div className="dialog-content">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default DialogAnimated;
```

### 3.2 动画 CSS

```css
/* DialogAnimated.css */

/* 基础样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  transition: opacity 0.3s ease;
}

.dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ========== 淡入淡出 ========== */
.animation-fade .dialog-overlay {
  opacity: 0;
}

.animation-fade.active .dialog-overlay {
  opacity: 1;
}

.animation-fade .dialog {
  opacity: 0;
}

.animation-fade.active .dialog {
  opacity: 1;
}

/* ========== 缩放 ========== */
.animation-zoom .dialog {
  opacity: 0;
  transform: scale(0.8);
}

.animation-zoom.active .dialog {
  opacity: 1;
  transform: scale(1);
}

/* ========== 从上滑入 ========== */
.animation-slide .dialog {
  opacity: 0;
  transform: translateY(-50px);
}

.animation-slide.active .dialog {
  opacity: 1;
  transform: translateY(0);
}

/* ========== 从下滑入 ========== */
.animation-slideUp .dialog {
  opacity: 0;
  transform: translateY(50px);
}

.animation-slideUp.active .dialog {
  opacity: 1;
  transform: translateY(0);
}
```

---

### 3.3 焦点管理（Focus Trap）

```tsx
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

function useFocusTrap(open: boolean) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // 保存当前焦点元素
    previousActiveElement.current = document.activeElement as HTMLElement;

    const dialog = dialogRef.current;
    if (!dialog) return;

    // 获取所有可聚焦元素
    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // 初始聚焦到第一个元素
    firstElement?.focus();

    // Tab 键焦点循环
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    dialog.addEventListener('keydown', handleTab);

    return () => {
      dialog.removeEventListener('keydown', handleTab);
      // 恢复之前的焦点
      previousActiveElement.current?.focus();
    };
  }, [open]);

  return dialogRef;
}

function FocusTrapDialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useFocusTrap(open);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="dialog-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div 
        ref={dialogRef}
        className="dialog" 
        role="dialog" 
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="dialog-header">
          <h2 id="dialog-title" className="dialog-title">{title}</h2>
          <button className="dialog-close" onClick={onClose}>✕</button>
        </div>
        <div className="dialog-content">{children}</div>
      </div>
    </div>,
    document.body
  );
}
```

---

### 3.4 可拖拽对话框

```tsx
import React, { useState, useRef, useEffect } from 'react';

function DraggableDialog({ open, onClose, title, children }: DialogProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dialogRef.current) return;

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="dialog-overlay">
      <div 
        ref={dialogRef}
        className="dialog draggable" 
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        role="dialog" 
        aria-modal="true"
      >
        <div 
          className="dialog-header draggable-handle"
          onMouseDown={handleMouseDown}
          style={{ cursor: 'grab' }}
        >
          <h2 className="dialog-title">{title}</h2>
          <button className="dialog-close" onClick={onClose}>✕</button>
        </div>
        <div className="dialog-content">{children}</div>
      </div>
    </div>,
    document.body
  );
}
```

---

### 3.5 多层对话框管理

```tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

interface DialogState {
  id: string;
  component: React.ReactNode;
  zIndex: number;
}

interface DialogContextValue {
  dialogs: DialogState[];
  openDialog: (id: string, component: React.ReactNode) => void;
  closeDialog: (id: string) => void;
  closeAllDialogs: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogs, setDialogs] = useState<DialogState[]>([]);
  const baseZIndex = 1000;

  const openDialog = useCallback((id: string, component: React.ReactNode) => {
    setDialogs((prev) => [
      ...prev,
      {
        id,
        component,
        zIndex: baseZIndex + prev.length,
      },
    ]);
  }, []);

  const closeDialog = useCallback((id: string) => {
    setDialogs((prev) => prev.filter((dialog) => dialog.id !== id));
  }, []);

  const closeAllDialogs = useCallback(() => {
    setDialogs([]);
  }, []);

  return (
    <DialogContext.Provider
      value={{ dialogs, openDialog, closeDialog, closeAllDialogs }}
    >
      {children}
      {dialogs.map((dialog) => (
        <div key={dialog.id} style={{ zIndex: dialog.zIndex }}>
          {dialog.component}
        </div>
      ))}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return context;
}

// 使用示例
function App() {
  const { openDialog, closeDialog } = useDialog();

  const handleOpenDialog = () => {
    const dialogId = `dialog-${Date.now()}`;
    openDialog(
      dialogId,
      <Dialog
        open={true}
        onClose={() => closeDialog(dialogId)}
        title="Dialog"
      >
        <p>Content</p>
      </Dialog>
    );
  };

  return <button onClick={handleOpenDialog}>Open Dialog</button>;
}
```

---

## 四、原生 JavaScript 实现

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modal Dialog</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 40px;
    }

    /* 遮罩层 */
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    .dialog-overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    /* 对话框 */
    .dialog {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      transform: scale(0.9);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .dialog-overlay.active .dialog {
      transform: scale(1);
      opacity: 1;
    }

    /* 头部 */
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .dialog-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #111827;
    }

    .dialog-close {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 20px;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .dialog-close:hover {
      background: #f3f4f6;
      color: #111827;
    }

    /* 内容 */
    .dialog-content {
      padding: 24px;
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