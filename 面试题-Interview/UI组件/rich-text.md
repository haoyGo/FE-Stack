# 富文本编辑器

## 核心实现

### 基础结构（ContentEditable）
```jsx
function RichTextEditor() {
  const editorRef = useRef(null);
  const [content, setContent] = useState('');

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleInput = () => {
    setContent(editorRef.current.innerHTML);
  };

  return (
    <div className="editor-container">
      <div className="toolbar">
        <button onClick={() => execCommand('bold')}>
          <strong>B</strong>
        </button>
        <button onClick={() => execCommand('italic')}>
          <em>I</em>
        </button>
        <button onClick={() => execCommand('underline')}>
          <u>U</u>
        </button>
        <button onClick={() => execCommand('formatBlock', 'h1')}>H1</button>
        <button onClick={() => execCommand('formatBlock', 'h2')}>H2</button>
        <button onClick={() => execCommand('insertUnorderedList')}>
          • 列表
        </button>
        <button onClick={() => execCommand('insertOrderedList')}>
          1. 列表
        </button>
        <button onClick={() => {
          const url = prompt('输入链接地址');
          if (url) execCommand('createLink', url);
        }}>
          链接
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        className="editor"
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  );
}
```

### 样式
```css
.editor-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.toolbar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.toolbar button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar button:hover {
  background: #e5e5e5;
}

.editor {
  padding: 16px;
  min-height: 300px;
  outline: none;
}

.editor:empty:before {
  content: attr(placeholder);
  color: #999;
  pointer-events: none;
}
```

## 关键要点

### 1. 选区管理
```jsx
function useSelection() {
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      return selection.getRangeAt(0);
    }
    return null;
  };

  const restoreSelection = (range) => {
    if (!range) return;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  return { saveSelection, restoreSelection };
}

function RichTextEditor() {
  const { saveSelection, restoreSelection } = useSelection();
  const savedRange = useRef(null);

  const handleBlur = () => {
    savedRange.current = saveSelection();
  };

  const execCommand = (command, value) => {
    restoreSelection(savedRange.current);
    document.execCommand(command, false, value);
  };

  return (
    <div
      contentEditable
      onBlur={handleBlur}
      className="editor"
    />
  );
}
```

### 2. 自定义命令
```jsx
function RichTextEditor() {
  const editorRef = useRef(null);

  // 插入自定义内容
  const insertContent = (html) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const temp = document.createElement('div');
    temp.innerHTML = html;
    const frag = document.createDocumentFragment();
    
    let node;
    while ((node = temp.firstChild)) {
      frag.appendChild(node);
    }
    
    range.insertNode(frag);
    range.collapse(false);
  };

  // 插入图片
  const insertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        insertContent(`<img src="${e.target.result}" alt="image" />`);
      };
      reader.readAsDataURL(file);
    };
    
    input.click();
  };

  // 设置文字颜色
  const setColor = (color) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.color = color;
    
    try {
      range.surroundContents(span);
    } catch (e) {
      // 如果选区包含部分元素，使用 execCommand
      document.execCommand('foreColor', false, color);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <button onClick={insertImage}>插入图片</button>
        <input
          type="color"
          onChange={(e) => setColor(e.target.value)}
        />
      </div>
      <div ref={editorRef} contentEditable className="editor" />
    </div>
  );
}
```

### 3. 数据序列化
```jsx
function RichTextEditor() {
  const editorRef = useRef(null);

  // 获取纯文本
  const getPlainText = () => {
    return editorRef.current?.textContent || '';
  };

  // 获取 HTML
  const getHTML = () => {
    return editorRef.current?.innerHTML || '';
  };

  // 获取 Markdown
  const getMarkdown = () => {
    const html = getHTML();
    // 简单的 HTML 到 Markdown 转换
    return html
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
      .replace(/<li>(.*?)<\/li>/g, '- $1\n')
      .replace(/<[^>]*>/g, '');
  };

  // 清理 HTML
  const sanitizeHTML = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // 移除危险标签和属性
    const dangerousTags = ['script', 'iframe', 'object', 'embed'];
    dangerousTags.forEach(tag => {
      const elements = temp.getElementsByTagName(tag);
      while (elements.length > 0) {
        elements[0].remove();
      }
    });

    // 移除危险属性
    const allElements = temp.getElementsByTagName('*');
    for (let el of allElements) {
      const attrs = el.attributes;
      for (let i = attrs.length - 1; i >= 0; i--) {
        const attr = attrs[i];
        if (attr.name.startsWith('on') || attr.name === 'style') {
          el.removeAttribute(attr.name);
        }
      }
    }

    return temp.innerHTML;
  };

  // 设置内容
  const setContent = (html) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = sanitizeHTML(html);
    }
  };

  return (
    <div>
      <button onClick={() => console.log(getMarkdown())}>
        导出 Markdown
      </button>
      <div ref={editorRef} contentEditable className="editor" />
    </div>
  );
}
```

## 高级功能

### 1. 使用 Draft.js
```jsx
import { Editor, EditorState, RichUtils } from 'draft-js';
import 'draft-js/dist/Draft.css';

function DraftEditor() {
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty()
  );

  const handleKeyCommand = (command) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const toggleInlineStyle = (style) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style));
  };

  const toggleBlockType = (blockType) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  return (
    <div className="editor-container">
      <div className="toolbar">
        <button onClick={() => toggleInlineStyle('BOLD')}>B</button>
        <button onClick={() => toggleInlineStyle('ITALIC')}>I</button>
        <button onClick={() => toggleBlockType('header-one')}>H1</button>
        <button onClick={() => toggleBlockType('unordered-list-item')}>
          列表
        </button>
      </div>
      <div className="editor">
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          handleKeyCommand={handleKeyCommand}
        />
      </div>
    </div>
  );
}
```

### 2. 提及（@mention）功能
```jsx
function MentionEditor() {
  const editorRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });

  const users = [
    { id: 1, name: '张三', avatar: '...' },
    { id: 2, name: '李四', avatar: '...' },
    { id: 3, name: '王五', avatar: '...' }
  ];

  const handleInput = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const textBeforeCursor = range.startContainer.textContent.substring(
      0,
      range.startOffset
    );
    
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const search = mentionMatch[1];
      setMentionSearch(search);
      
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase())
      );
      setSuggestions(filtered);
      
      // 计算提及框位置
      const rect = range.getBoundingClientRect();
      setMentionPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
      
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMention = (user) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    const text = textNode.textContent;
    
    // 找到 @ 符号的位置
    const atIndex = text.lastIndexOf('@', range.startOffset);
    
    // 删除 @search
    range.setStart(textNode, atIndex);
    range.setEnd(textNode, range.startOffset);
    range.deleteContents();
    
    // 插入提及标签
    const mention = document.createElement('span');
    mention.className = 'mention';
    mention.contentEditable = 'false';
    mention.dataset.userId = user.id;
    mention.textContent = `@${user.name}`;
    
    range.insertNode(mention);
    
    // 移动光标到提及后面
    range.setStartAfter(mention);
    range.collapse(true);
    
    setShowSuggestions(false);
  };

  return (
    <div className="mention-editor-container">
      <div
        ref={editorRef}
        contentEditable
        className="editor"
        onInput={handleInput}
      />
      {showSuggestions && (
        <div
          className="mention-suggestions"
          style={{
            position: 'absolute',
            top: mentionPosition.top,
            left: mentionPosition.left
          }}
        >
          {suggestions.map(user => (
            <div
              key={user.id}
              className="suggestion-item"
              onClick={() => insertMention(user)}
            >
              <img src={user.avatar} alt={user.name} />
              <span>{user.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. 协同编辑
```jsx
import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { QuillBinding } from 'y-quill';
import Quill from 'quill';

function CollaborativeEditor({ documentId }) {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  useEffect(() => {
    // 创建 Yjs 文档
    const ydoc = new Y.Doc();
    
    // 连接 WebSocket
    const provider = new WebsocketProvider(
      'ws://localhost:1234',
      documentId,
      ydoc
    );

    // 创建 Quill 编辑器
    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          ['link', 'image'],
          [{ header: [1, 2, false] }]
        ]
      }
    });

    // 绑定 Yjs 和 Quill
    const ytext = ydoc.getText('quill');
    const binding = new QuillBinding(ytext, quill, provider.awareness);

    quillRef.current = quill;

    // 显示在线用户
    provider.awareness.on('change', () => {
      const states = Array.from(provider.awareness.getStates().values());
      console.log('在线用户:', states);
    });

    return () => {
      binding.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [documentId]);

  return <div ref={editorRef} />;
}
```

## 面试要点

**Q: ContentEditable 的优缺点？**
- 优点：原生支持、轻量级、易于上手
- 缺点：浏览器兼容性差、行为不一致、难以控制
- 需要处理粘贴、撤销重做、光标位置等问题

**Q: 如何实现撤销重做？**
```jsx
function useHistory(initialState) {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([initialState]);

  const setState = (value) => {
    const newHistory = history.slice(0, index + 1);
    newHistory.push(value);
    setHistory(newHistory);
    setIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (index > 0) setIndex(index - 1);
  };

  const redo = () => {
    if (index < history.length - 1) setIndex(index + 1);
  };

  return {
    state: history[index],
    setState,
    undo,
    redo,
    canUndo: index > 0,
    canRedo: index < history.length - 1
  };
}
```

**Q: 如何处理粘贴内容？**
```jsx
const handlePaste = (e) => {
  e.preventDefault();
  
  const text = e.clipboardData.getData('text/plain');
  const html = e.clipboardData.getData('text/html');
  
  // 优先使用纯文本
  if (text) {
    document.execCommand('insertText', false, text);
  } else if (html) {
    // 清理 HTML
    const clean = sanitizeHTML(html);
    document.execCommand('insertHTML', false, clean);
  }
};
```

**Q: 推荐的富文本编辑器库？**
- **Draft.js**: React 官方推荐，数据驱动
- **Quill**: 轻量、模块化、易扩展
- **Slate**: 高度可定制、React 组件
- **TinyMCE/CKEditor**: 功能完整的传统编辑器
- **ProseMirror**: 强大但学习曲线陡峭
