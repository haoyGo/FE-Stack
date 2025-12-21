# Rich Text Editor 富文本编辑器系统设计

> 设计一个功能完整的富文本编辑器，类似 Google Docs、Notion，支持协同编辑和多种格式

## 一、需求分析

### 1.1 功能需求

**基础功能**
- ✅ 文本格式化（粗体、斜体、下划线、删除线）
- ✅ 标题（H1-H6）
- ✅ 列表（有序、无序）
- ✅ 链接
- ✅ 图片插入
- ✅ 代码块
- ✅ 引用
- ✅ 撤销/重做
- ✅ 复制/粘贴

**进阶功能**
- ✅ 表格
- ✅ 协同编辑（多人实时编辑）
- ✅ @提及用户
- ✅ 嵌入视频/音频
- ✅ 数学公式（LaTeX）
- ✅ 代码高亮
- ✅ 拖拽排序
- ✅ 评论功能
- ✅ 版本历史

### 1.2 非功能需求

- ⚡ **性能**: 大文档（>10000字）流畅编辑
- 🔄 **实时性**: 协同编辑延迟 < 100ms
- 💾 **可靠性**: 自动保存、防丢失
- 📱 **兼容性**: 跨浏览器、移动端适配
- ♿ **无障碍**: 键盘操作、屏幕阅读器

### 1.3 技术挑战

1. **光标和选区管理** - 复杂的 DOM 操作
2. **协同编辑冲突** - OT/CRDT 算法
3. **性能优化** - 大文档渲染
4. **粘贴处理** - 富文本清理
5. **跨浏览器兼容** - contentEditable 差异

---

## 二、技术选型

### 2.1 编辑器架构对比

| 方案 | 代表 | 优点 | 缺点 |
|------|------|------|------|
| **contentEditable** | Medium Editor | 简单、原生支持 | 浏览器兼容差、难控制 |
| **自定义渲染** | Slate、ProseMirror | 完全可控、性能好 | 复杂度高 |
| **虚拟DOM** | Draft.js | React 集成好 | 体积大、社区不活跃 |

### 2.2 协同编辑算法

| 算法 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **OT (Operational Transformation)** | 成熟、Google Docs 使用 | 复杂、需要中心服务器 | 集中式架构 |
| **CRDT (Conflict-free Replicated Data Types)** | 去中心化、最终一致性 | 元数据开销大 | P2P、离线优先 |

**推荐方案：**
- 小型应用：Draft.js + Socket.io
- 中大型：Slate + Yjs (CRDT)
- 企业级：ProseMirror + Collab 插件

---

## 三、基础实现

### 3.1 使用 Draft.js（React）

```tsx
import React, { useState } from 'react';
import {
  Editor,
  EditorState,
  RichUtils,
  getDefaultKeyBinding,
  KeyBindingUtil,
} from 'draft-js';
import 'draft-js/dist/Draft.css';
import './RichTextEditor.css';

const { hasCommandModifier } = KeyBindingUtil;

function RichTextEditor() {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );

  // 处理键盘命令
  const handleKeyCommand = (command: string, editorState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);

    if (newState) {
      setEditorState(newState);
      return 'handled';
    }

    return 'not-handled';
  };

  // 自定义键盘绑定
  const keyBindingFn = (e: React.KeyboardEvent) => {
    if (e.keyCode === 83 /* `S` key */ && hasCommandModifier(e)) {
      return 'save';
    }

    return getDefaultKeyBinding(e);
  };

  // 工具栏按钮处理
  const toggleInlineStyle = (style: string) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };

  const toggleBlockType = (blockType: string) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  // 获取当前样式
  const currentStyle = editorState.getCurrentInlineStyle();
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  return (
    <div className="rich-text-editor">
      {/* 工具栏 */}
      <Toolbar
        currentStyle={currentStyle}
        blockType={blockType}
        onToggleInlineStyle={toggleInlineStyle}
        onToggleBlockType={toggleBlockType}
      />

      {/* 编辑器 */}
      <div className="editor-container">
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          handleKeyCommand={handleKeyCommand}
          keyBindingFn={keyBindingFn}
          placeholder="Start writing..."
        />
      </div>
    </div>
  );
}

export default RichTextEditor;
```

### 3.2 工具栏组件

```tsx
import React from 'react';

interface ToolbarProps {
  currentStyle: any;
  blockType: string;
  onToggleInlineStyle: (style: string) => void;
  onToggleBlockType: (type: string) => void;
}

const INLINE_STYLES = [
  { label: 'B', style: 'BOLD', title: 'Bold (Ctrl+B)' },
  { label: 'I', style: 'ITALIC', title: 'Italic (Ctrl+I)' },
  { label: 'U', style: 'UNDERLINE', title: 'Underline (Ctrl+U)' },
  { label: 'S', style: 'STRIKETHROUGH', title: 'Strikethrough' },
  { label: '</>', style: 'CODE', title: 'Code' },
];

const BLOCK_TYPES = [
  { label: 'H1', style: 'header-one', title: 'Heading 1' },
  { label: 'H2', style: 'header-two', title: 'Heading 2' },
  { label: 'H3', style: 'header-three', title: 'Heading 3' },
  { label: 'UL', style: 'unordered-list-item', title: 'Bullet List' },
  { label: 'OL', style: 'ordered-list-item', title: 'Numbered List' },
  { label: '❝', style: 'blockquote', title: 'Quote' },
  { label: '{ }', style: 'code-block', title: 'Code Block' },
];

function Toolbar({
  currentStyle,
  blockType,
  onToggleInlineStyle,
  onToggleBlockType,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      {/* 内联样式 */}
      <div className="toolbar-group">
        {INLINE_STYLES.map((type) => (
          <button
            key={type.style}
            className={`toolbar-btn ${
              currentStyle.has(type.style) ? 'active' : ''
            }`}
            onClick={() => onToggleInlineStyle(type.style)}
            title={type.title}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="toolbar-divider" />

      {/* 块级样式 */}
      <div className="toolbar-group">
        {BLOCK_TYPES.map((type) => (
          <button
            key={type.style}
            className={`toolbar-btn ${
              blockType === type.style ? 'active' : ''
            }`}
            onClick={() => onToggleBlockType(type.style)}
            title={type.title}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="toolbar-divider" />

      {/* 其他操作 */}
      <div className="toolbar-group">
        <button className="toolbar-btn" title="Insert Link">
          🔗
        </button>
        <button className="toolbar-btn" title="Insert Image">
          🖼️
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
```

### 3.3 样式文件

```css
/* RichTextEditor.css */

.rich-text-editor {
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  gap: 2px;
}

.toolbar-btn {
  padding: 6px 10px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  transition: all 0.15s;
}

.toolbar-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.toolbar-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #e5e7eb;
  margin: 0 4px;
}

/* 编辑器容器 */
.editor-container {
  padding: 20px;
  min-height: 400px;
  cursor: text;
}

.DraftEditor-root {
  font-size: 16px;
  line-height: 1.6;
  color: #111827;
}

/* 标题样式 */
.public-DraftStyleDefault-block {
  margin: 1em 0;
}

.public-DraftStyleDefault-h1 {
  font-size: 2em;
  font-weight: 700;
  margin: 0.67em 0;
}

.public-DraftStyleDefault-h2 {
  font-size: 1.5em;
  font-weight: 700;
  margin: 0.75em 0;
}

.public-DraftStyleDefault-h3 {
  font-size: 1.17em;
  font-weight: 700;
  margin: 0.83em 0;
}

/* 列表样式 */
.public-DraftStyleDefault-ul,
.public-DraftStyleDefault-ol {
  margin: 1em 0;
  padding-left: 2em;
}

/* 引用样式 */
.public-DraftStyleDefault-blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 16px;
  margin-left: 0;
  font-style: italic;
  color: #6b7280;
}

/* 代码块样式 */
.public-DraftStyleDefault-code-block {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 12px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  overflow-x: auto;
}

/* 内联代码样式 */
.public-DraftStyleDefault-code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}
```

---

## 四、进阶功能实现

### 4.1 使用 Slate.js（更灵活）

```tsx
import React, { useMemo, useState, useCallback } from 'react';
import { createEditor, Descendant, Editor, Transforms, Element } from 'slate';
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: 'Start writing...' }],
  },
];

function SlateEditor() {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [value, setValue] = useState<Descendant[]>(initialValue);

  // 渲染元素
  const renderElement = useCallback((props: RenderElementProps) => {
    switch (props.element.type) {
      case 'heading-one':
        return <h1 {...props.attributes}>{props.children}</h1>;
      case 'heading-two':
        return <h2 {...props.attributes}>{props.children}</h2>;
      case 'block-quote':
        return <blockquote {...props.attributes}>{props.children}</blockquote>;
      case 'bulleted-list':
        return <ul {...props.attributes}>{props.children}</ul>;
      case 'numbered-list':
        return <ol {...props.attributes}>{props.children}</ol>;
      case 'list-item':
        return <li {...props.attributes}>{props.children}</li>;
      case 'code-block':
        return <pre {...props.attributes}><code>{props.children}</code></pre>;
      default:
        return <p {...props.attributes}>{props.children}</p>;
    }
  }, []);

  // 渲染叶子节点
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    let { children } = props;

    if (props.leaf.bold) {
      children = <strong>{children}</strong>;
    }

    if (props.leaf.italic) {
      children = <em>{children}</em>;
    }

    if (props.leaf.underline) {
      children = <u>{children}</u>;
    }

    if (props.leaf.code) {
      children = <code>{children}</code>;
    }

    return <span {...props.attributes}>{children}</span>;
  }, []);

  // 键盘快捷键
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!event.ctrlKey && !event.metaKey) return;

    switch (event.key) {
      case 'b': {
        event.preventDefault();
        toggleMark(editor, 'bold');
        break;
      }
      case 'i': {
        event.preventDefault();
        toggleMark(editor, 'italic');
        break;
      }
      case 'u': {
        event.preventDefault();
        toggleMark(editor, 'underline');
        break;
      }
      case '`': {
        event.preventDefault();
        toggleMark(editor, 'code');
        break;
      }
    }
  };

  return (
    <Slate editor={editor} value={value} onChange={setValue}>
      <SlateToolbar />
      <Editable
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onKeyDown={handleKeyDown}
        placeholder="Enter some text..."
        style={{
          padding: '20px',
          minHeight: '400px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
        }}
      />
    </Slate>
  );
}

// 工具栏
function SlateToolbar() {
  const editor = useReactSlate();

  return (
    <div className="toolbar">
      <MarkButton format="bold" icon="B" />
      <MarkButton format="italic" icon="I" />
      <MarkButton format="underline" icon="U" />
      <MarkButton format="code" icon="</>" />
      
      <div className="toolbar-divider" />
      
      <BlockButton format="heading-one" icon="H1" />
      <BlockButton format="heading-two" icon="H2" />
      <BlockButton format="block-quote" icon="❝" />
      <BlockButton format="numbered-list" icon="OL" />
      <BlockButton format="bulleted-list" icon="UL" />
    </div>
  );
}

// 标记按钮
function MarkButton({ format, icon }: { format: string; icon: string }) {
  const editor = useSlate();
  const isActive = isMarkActive(editor, format);

  return (
    <button
      className={`toolbar-btn ${isActive ? 'active' : ''}`}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleMark(editor, format);
      }}
    >
      {icon}
    </button>
  );
}

// 块级按钮
function BlockButton({ format, icon }: { format: string; icon: string }) {
  const editor = useSlate();
  const isActive = isBlockActive(editor, format);

  return (
    <button
      className={`toolbar-btn ${isActive ? 'active' : ''}`}
      onMouseDown={(event) => {
        event.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      {icon}
    </button>
  );
}

// 辅助函数
const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const isBlockActive = (editor: Editor, format: string) => {
  const [match] = Editor.nodes(editor, {
    match: (n) => Element.isElement(n) && n.type === format,
  });
  return !!match;
};

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = ['numbered-list', 'bulleted-list'].includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      Element.isElement(n) &&
      ['numbered-list', 'bulleted-list'].includes(n.type),
    split: true,
  });

  Transforms.setNodes(editor, {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  });

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

export default SlateEditor;
```

---

### 4.2 图片插入功能

```tsx
import React, { useState } from 'react';
import { Transforms } from 'slate';
import { useSlate } from 'slate-react';

function ImageButton() {
  const editor = useSlate();
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // 上传图片
      const url = await uploadImage(file);

      // 插入图片节点
      insertImage(editor, url);
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <label className="toolbar-btn">
      {uploading ? '⏳' : '🖼️'}
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </label>
  );
}

// 插入图片
const insertImage = (editor: Editor, url: string) => {
  const text = { text: '' };
  const image = {
    type: 'image',
    url,
    children: [text],
  };

  Transforms.insertNodes(editor, image);
};

// 上传图片
async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return data.url;
}

// 渲染图片
function ImageElement({ attributes, children, element }: RenderElementProps) {
  const selected = useSelected();
  const focused = useFocused();

  return (
    <div {...attributes}>
      <div contentEditable={false} style={{ position: 'relative' }}>
        <img
          src={element.url}
          alt=""
          style={{
            display: 'block',
            maxWidth: '100%',
            boxShadow: selected && focused ? '0 0 0 3px #3b82f6' : 'none',
          }}
        />
      </div>
      {children}
    </div>
  );
}
```

---

### 4.3 链接插入功能

```tsx
import React, { useState } from 'react';
import { Editor, Transforms, Range } from 'slate';
import { useSlate } from 'slate-react';

function LinkButton() {
  const editor = useSlate();
  const [showInput, setShowInput] = useState(false);
  const [url, setUrl] = useState('');

  const isLinkActive = () => {
    const [link] = Editor.nodes(editor, {
      match: (n) => n.type === 'link',
    });
    return !!link;
  };

  const handleInsertLink = () => {
    if (isLinkActive()) {
      unwrapLink(editor);
    } else {
      setShowInput(true);
    }
  };

  const handleSubmit = () => {
    if (url && !isLinkActive()) {
      wrapLink(editor, url);
    }
    setShowInput(false);
    setUrl('');
  };

  return (
    <>
      <button
        className={`toolbar-btn ${isLinkActive() ? 'active' : ''}`}
        onClick={handleInsertLink}
      >
        🔗
      </button>

      {showInput && (
        <div className="link-input-popup">
          <input
            type="url"
            placeholder="Enter URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
              if (e.key === 'Escape') setShowInput(false);
            }}
            autoFocus
          />
          <button onClick={handleSubmit}>Insert</button>
          <button onClick={() => setShowInput(false)}>Cancel</button>
        </div>
      )}
    </>
  );
}

// 包裹链接
const wrapLink = (editor: Editor, url: string) => {
  if (isLinkActive(editor)) {
    unwrapLink(editor);
  }

  const { selection } = editor;
  const isCollapsed = selection && Range.isCollapsed(selection);

  const link = {
    type: 'link',
    url,
    children: isCollapsed ? [{ text: url }] : [],
  };

  if (isCollapsed) {
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true });
    Transforms.collapse(editor, { edge: 'end' });
  }
};

// 移除链接
const unwrapLink = (editor: Editor) => {
  Transforms.unwrapNodes(editor, {
    match: (n) => Element.isElement(n) && n.type === 'link',
  });
};

// 渲染链接
function LinkElement({ attributes, children, element }: RenderElementProps) {
  return (
    <a
      {...attributes}
      href={element.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: '#3b82f6', textDecoration: 'underline' }}
    >
      {children}
    </a>
  );
}
```

---

## 五、协同编辑实现

### 5.1 使用 Yjs + WebSocket

```typescript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { withYjs, YjsEditor } from '@slate-yjs/core';

function CollaborativeEditor() {
  const [editor] = useState(() => {
    // 创建 Yjs 文档
    const ydoc = new Y.Doc();

    // WebSocket 连接
    const provider = new WebsocketProvider(
      'ws://localhost:1234',
      'my-document',
      ydoc
    );

    // 创建编辑器
    const editor = withYjs(withReact(withHistory(createEditor())), ydoc);

    return editor;
  });

  return (
    <Slate editor={editor} value={initialValue}>
      {/* 显示在线用户 */}
      <OnlineUsers />
      
      {/* 编辑器 */}
      <Editable />
    </Slate>
  );
}

// 在线用户组件
function OnlineUsers() {
  const editor = useSlate() as YjsEditor;
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const provider = editor.provider;
    
    const updateUsers = () => {
      const awareness = provider.awareness;
      const states = Array.from(awareness.getStates().values());
      setUsers(states);
    };

    provider.awareness.on('change', updateUsers);
    updateUsers();

    return () => {
      provider.awareness.off('change', updateUsers);
    };
  }, [editor]);

  return (
    <div className="online-users">
      {users.map((user, index) => (
        <div
          key={index}
          className="user-avatar"
          style={{ backgroundColor: user.color }}
          title={user.name}
        >
          {user.name?.[0] || '?'}
        </div>
      ))}
    </div>
  );
}
```

---

### 5.2 WebSocket 服务器（Node.js）

```typescript
import WebSocket from 'ws';
import * as Y from 'yjs';
import { setupWSConnection } from 'y-websocket/bin/utils';

const wss = new WebSocket.Server({ port: 1234 });

// 文档存储
const docs = new Map<string, Y.Doc>();

wss.on('connection', (ws, req) => {
  const docName = new URLSearchParams(req.url?.split('?')[1]).get('room');

  if (!docName) {
    ws.close();
    return;
  }

  // 获取或创建文档
  if (!docs.has(docName)) {
    const ydoc = new Y.Doc();
    docs.set(docName, ydoc);

    // 持久化（可选）
    ydoc.on('update', (update: Uint8Array) => {
      // 保存到数据库
      saveToDatabase(docName, update);
    });
  }

  const ydoc = docs.get(docName)!;

  // 设置 WebSocket 连接
  setupWSConnection(ws, req, { docName, gc: true });

  console.log(`Client connected to document: ${docName}`);
});

// 保存到数据库
async function saveToDatabase(docName: string, update: Uint8Array) {
  await db.query(
    'INSERT INTO document_updates (doc_name, update_data, created_at) VALUES (?, ?, NOW())',
    [docName, Buffer.from(update)]
  );
}

console.log('WebSocket server running on port 1234');
```

---

## 六、性能优化

### 6.1 虚拟化长文档

```tsx
import { FixedSizeList } from 'react-window';

function VirtualizedEditor({ blocks }: { blocks: any[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const block = blocks[index];
    
    return (
      <div style={style}>
        <EditableBlock block={block} />
      </div>
    );
  };

  return (
    <FixedSizeList
      height={600}
      itemCount={blocks.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 6.2 自动保存

```typescript
import { useEffect, useRef } from 'react';
import { debounce } from 'lodash';

function useAutoSave(content: any, delay: number = 2000) {
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // 防抖保存
    const debouncedSave = debounce(async () => {
      try {
        await fetch('/api/documents/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        console.log('Document saved');
      } catch (error) {
        console.error('Save failed:', error);
      }
    }, delay);

    debouncedSave();

    return () => {
      debouncedSave.cancel();
    };
  }, [content, delay]);
}

// 使用
function Editor() {
  const [content, setContent] = useState(initialContent);
  
  useAutoSave(content);

  return <Slate value={content} onChange={setContent} />;
}
```

---

### 6.3 粘贴处理

```typescript
import { Transforms } from 'slate';

function handlePaste(editor: Editor, event: React.ClipboardEvent) {
  event.preventDefault();

  const html = event.clipboardData.getData('text/html');
  const text = event.clipboardData.getData('text/plain');

  if (html) {
    // 解析 HTML
    const fragment = deserializeHTML(html);
    Transforms.insertFragment(editor, fragment);
  } else {
    // 纯文本
    Transforms.insertText(editor, text);
  }
}

// HTML 反序列化
function deserializeHTML(html: string): Descendant[] {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return deserializeNode(document.body);
}

function deserializeNode(node: Node): Descendant[] {
  if (node.nodeType === Node.TEXT_NODE) {
    return [{ text: node.textContent || '' }];
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return [];
  }

  const element = node as HTMLElement;
  const children = Array.from(element.childNodes).flatMap(deserializeNode);

  switch (element.nodeName) {
    case 'P':
      return [{ type: 'paragraph', children }];
    case 'H1':
      return [{ type: 'heading-one', children }];
    case 'H2':
      return [{ type: 'heading-two', children }];
    case 'STRONG':
    case 'B':
      return children.map((child) => ({ ...child, bold: true }));
    case 'EM':
    case 'I':
      return children.map((child) => ({ ...child, italic: true }));
    case 'U':
      return children.map((child) => ({ ...child, underline: true }));
    case 'CODE':
      return children.map((child) => ({ ...child, code: true }));
    case 'A':
      return [
        {
          type: 'link',
          url: element.getAttribute('href') || '',
          children,
        },
      ];
    default:
      return children;
  }
}
```

---

## 七、高级功能

### 7.1 @提及用户

```tsx
import React, { useState, useCallback } from 'react';
import { Editor, Range, Transforms } from 'slate';

function MentionPlugin() {
  const [target, setTarget] = useState<Range | null>(null);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (target) {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            // 选择下一个用户
            break;
          case 'ArrowUp':
            event.preventDefault();
            // 选择上一个用户
            break;
          case 'Enter':
            event.preventDefault();
            // 插入提及
            insertMention(editor, users[0]);
            setTarget(null);
            break;
          case 'Escape':
            event.preventDefault();
            setTarget(null);
            break;
        }
      }
    },
    [target, users]
  );

  const handleChange = useCallback(() => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [start] = Range.edges(selection);
      const wordBefore = Editor.before(editor, start, { unit: 'word' });
      const before = wordBefore && Editor.before(editor, wordBefore);
      const beforeRange = before && Editor.range(editor, before, start);
      const beforeText = beforeRange && Editor.string(editor, beforeRange);
      const beforeMatch = beforeText && beforeText.match(/^@(\w+)$/);

      if (beforeMatch) {
        setTarget(beforeRange);
        setSearch(beforeMatch[1]);
        // 搜索用户
        searchUsers(beforeMatch[1]).then(setUsers);
        return;
      }
    }

    setTarget(null);
  }, []);

  return { target, users, handleKeyDown, handleChange };
}

// 插入提及
const insertMention = (editor: Editor, user: any) => {
  const mention = {
    type: 'mention',
    userId: user.id,
    username: user.username,
    children: [{ text: '' }],
  };

  Transforms.insertNodes(editor, mention);
  Transforms.move(editor);
};

// 渲染提及
function MentionElement({ attributes, children, element }: RenderElementProps) {
  return (
    <span
      {...attributes}
      contentEditable={false}
      style={{
        padding: '2px 6px',
        margin: '0 2px',
        background: '#e3f2fd',
        color: '#1976d2',
        borderRadius: '4px',
        fontWeight: 600,
      }}
    >
      @{element.username}
      {children}
    </span>
  );
}

// 搜索用户
async function searchUsers(query: string): Promise<any[]> {
  const response = await fetch(`/api/users/search?q=${query}`);
  return response.json();
}
```

---

### 7.2 代码高亮

```tsx
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';

function CodeBlockElement({ attributes, children, element }: RenderElementProps) {
  const [language, setLanguage] = useState(element.language || 'javascript');

  // 获取代码文本
  const code = element.children.map((n) => n.text).join('\n');

  // 高亮代码
  const highlighted = Prism.highlight(
    code,
    Prism.languages[language] || Prism.languages.javascript,
    language
  );

  return (
    <div {...attributes}>
      <div contentEditable={false} style={{ marginBottom: 8 }}>
        <select
          value={language}
          onChange={(e) => {
            const newLanguage = e.target.value;
            setLanguage(newLanguage);
            Transforms.setNodes(
              editor,
              { language: newLanguage },
              { at: ReactEditor.findPath(editor, element) }
            );
          }}
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
        </select>
      </div>
      <pre
        style={{
          background: '#f5f5f5',
          padding: 12,
          borderRadius: 4,
          overflow: 'auto',
        }}
      >
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
      <div style={{ display: 'none' }}>{children}</div>
    </div>
  );
}
```

---

### 7.3 表格支持

```tsx
import { Transforms } from 'slate';

// 插入表格
const insertTable = (editor: Editor, rows: number, cols: number) => {
  const table = {
    type: 'table',
    children: Array.from({ length: rows }, () => ({
      type: 'table-row',
      children: Array.from({ length: cols }, () => ({
        type: 'table-cell',
        children: [{ type: 'paragraph', children: [{ text: '' }] }],
      })),
    })),
  };

  Transforms.insertNodes(editor, table);
};

// 渲染表格
function TableElement({ attributes, children }: RenderElementProps) {
  return (
    <table {...attributes} style={{ borderCollapse: 'collapse', width: '100%' }}>
      <tbody>{children}</tbody>
    </table>
  );
}

function TableRowElement({ attributes, children }: RenderElementProps) {
  return <tr {...attributes}>{children}</tr>;
}

function TableCellElement({ attributes, children }: RenderElementProps) {
  return (
    <td
      {...attributes}
      style={{
        border: '1px solid #e5e7eb',
        padding: '8px',
        minWidth: '100px',
      }}
    >
      {children}
    </td>
  );
}

// 表格工具栏
function TableToolbar() {
  const editor = useSlate();

  return (
    <div className="table-toolbar">
      <button onClick={() => insertTable(editor, 3, 3)}>
        Insert 3x3 Table
      </button>
      <button onClick={() => addTableRow(editor)}>Add Row</button>
      <button onClick={() => addTableColumn(editor)}>Add Column</button>
      <button onClick={() => deleteTableRow(editor)}>Delete Row</button>
      <button onClick={() => deleteTableColumn(editor)}>Delete Column</button>
    </div>
  );
}
```

---

## 八、面试要点

### Q1: contentEditable vs 自定义渲染？

**contentEditable:**
- ✅ 简单、浏览器原生支持
- ❌ 浏览器兼容性差、难以控制

**自定义渲染（Slate/ProseMirror）:**
- ✅ 完全可控、性能好、可扩展
- ❌ 复杂度高、需要处理光标/选区

**推荐：** 复杂编辑器用自定义渲染

### Q2: 协同编辑如何实现？

**OT (Operational Transformation):**
- 转换冲突操作
- Google Docs 使用
- 需要中心服务器

**CRDT (Conflict-free Replicated Data Types):**
- 无冲突的数据结构
- 去中心化、P2P 友好
- Yjs、Automerge 实现

**选择：**
- 中心化系统 → OT
- 去中心化/离线优先 → CRDT

### Q3: 如何处理大文档性能？

**优化策略：**
1. **虚拟滚动** - 只渲染可见区域
2. **懒加载** - 分块加载内容
3. **防抖** - 延迟处理输入
4. **Web Worker** - 后台处理
5. **分页** - 超长文档分页

```typescript
// 防抖输入
const debouncedOnChange = useMemo(
  () => debounce((value) => onChange(value), 300),
  [onChange]
);
```

### Q4: 如何实现撤销/重做？

**方案 1: 命令模式**
```typescript
class Command {
  execute() {}
  undo() {}
}

class History {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  execute(command: Command) {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];
  }

  undo() {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  redo() {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);
    }
  }
}
```

**方案 2: 快照**
- Slate 的 `withHistory` 插件
- 保存编辑器状态快照

### Q5: 如何处理粘贴内容？

**步骤：**
1. **拦截粘贴事件** - `onPaste`
2. **获取内容** - `text/html` 或 `text/plain`
3. **清理 HTML** - 移除样式、脚本
4. **转换格式** - HTML → 编辑器数据结构
5. **插入内容** - `Transforms.insertFragment`

```typescript
const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault();
  
  const html = event.clipboardData.getData('text/html');
  const cleaned = sanitizeHTML(html);
  const fragment = deserialize(cleaned);
  
  Transforms.insertFragment(editor, fragment);
};
```

---

## 九、最佳实践

### 9.1 性能优化清单

- ✅ 使用 `React.memo` 避免重渲染
- ✅ 虚拟滚动大文档
- ✅ 防抖输入处理
- ✅ 懒加载图片
- ✅ Web Worker 处理复杂计算
- ✅ 代码分割（Code Splitting）

### 9.2 无障碍性

```tsx
// ARIA 属性
<div
  role="textbox"
  aria-multiline="true"
  aria-label="Rich text editor"
  contentEditable
>
  {content}
</div>

// 键盘快捷键提示
<div role="toolbar" aria-label="Formatting options">
  <button aria-label="Bold (Ctrl+B)">B</button>
  <button aria-label="Italic (Ctrl+I)">I</button>
</div>
```

### 9.3 错误处理

```typescript
// 边界错误处理
class EditorErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Editor error:', error, errorInfo);
    // 上报错误
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh.</div>;
    }

    return this.props.children;
  }
}
```

---

## 总结

### 技术选型
- **小型应用**: Draft.js
- **中大型**: Slate.js
- **企业级**: ProseMirror
- **协同编辑**: Yjs (CRDT)

### 核心功能
- ✅ 富文本格式化
- ✅ 撤销/重做
- ✅ 图片/链接插入
- ✅ 代码高亮
- ✅ 表格支持

### 进阶功能
- ✅ 协同编辑
- ✅ @提及
- ✅ 版本历史
- ✅ 自动保存
- ✅ 评论功能

### 性能优化
- ✅ 虚拟滚动
- ✅ 防抖/节流
- ✅ 懒加载
- ✅ 分块渲染

这是前端面试中的高难度题目，考察架构设计、算法、性能优化等综合能力！🎯