# Autocomplete 自动完成系统设计

> 实现一个高性能的自动完成/搜索建议系统，涵盖前端组件和后端架构

## 一、需求分析

### 1.1 功能需求

**基础功能**
- ✅ 实时搜索建议
- ✅ 键盘导航（上下键选择，Enter 确认）
- ✅ 高亮匹配文本
- ✅ 防抖/节流优化
- ✅ 空状态和加载状态

**进阶功能**
- ✅ 分类展示（历史记录、热门搜索、搜索建议）
- ✅ 拼写纠错
- ✅ 富文本建议（带图片、描述）
- ✅ 缓存策略
- ✅ 个性化推荐

### 1.2 非功能需求

- ⚡ **性能**: 搜索响应 < 100ms
- 🎯 **准确性**: 相关性排序
- 📱 **可用性**: 移动端适配
- ♿ **无障碍**: 键盘操作、屏幕阅读器支持
- 🔒 **安全**: 防 XSS、SQL 注入

---

## 二、系统架构

```
┌─────────────────────────────────────────────────────┐
│                   Frontend Layer                     │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐    ┌──────────────┐              │
│  │  Input Box   │───▶│   Debounce   │              │
│  └──────────────┘    └──────┬───────┘              │
│                             │                        │
│  ┌──────────────┐    ┌──────▼───────┐              │
│  │ Suggestions  │◀───│ Local Cache  │              │
│  │   Dropdown   │    └──────┬───────┘              │
│  └──────────────┘           │                       │
│                             │                        │
└─────────────────────────────┼───────────────────────┘
                               │ HTTP/WebSocket
┌──────────────────────────────▼──────────────────────┐
│                   API Gateway                        │
├─────────────────────────────────────────────────────┤
│  Rate Limiting │ Auth │ Load Balancer               │
└──────────────────────────────┬──────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────┐
│                  Backend Services                    │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────┐    ┌──────────────┐              │
│  │ Query Parser │───▶│ Redis Cache  │              │
│  └──────┬───────┘    └──────────────┘              │
│         │                     │                      │
│  ┌──────▼───────┐    ┌───────▼──────┐              │
│  │  Trie / FST  │    │ Elasticsearch│              │
│  │   In-Memory  │    │   Fuzzy Match│              │
│  └──────────────┘    └──────────────┘              │
│                                                       │
│  ┌──────────────┐    ┌──────────────┐              │
│  │  Ranking     │    │  Analytics   │              │
│  │  Algorithm   │    │  Service     │              │
│  └──────────────┘    └──────────────┘              │
│                                                       │
└─────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────┐
│                   Data Layer                         │
├─────────────────────────────────────────────────────┤
│  MySQL/PostgreSQL  │  MongoDB  │  Kafka             │
└─────────────────────────────────────────────────────┘
```

---

## 三、前端实现

### 3.1 基础组件（React + TypeScript）

```tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Autocomplete.css';

interface Suggestion {
  id: string;
  text: string;
  category?: string;
  metadata?: any;
}

interface AutocompleteProps {
  onSearch: (query: string) => Promise<Suggestion[]>;
  onSelect: (suggestion: Suggestion) => void;
  placeholder?: string;
  debounceMs?: number;
  minChars?: number;
  maxSuggestions?: number;
}

function Autocomplete({
  onSearch,
  onSelect,
  placeholder = 'Search...',
  debounceMs = 300,
  minChars = 2,
  maxSuggestions = 10,
}: AutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // 防抖搜索
  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (value.length < minChars) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const results = await onSearch(value);
          setSuggestions(results.slice(0, maxSuggestions));
          setShowDropdown(true);
          setSelectedIndex(-1);
        } catch (error) {
          console.error('Search error:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    },
    [onSearch, debounceMs, minChars, maxSuggestions]
  );

  // 输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;

      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // 选择建议
  const handleSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.text);
    setShowDropdown(false);
    setSelectedIndex(-1);
    onSelect(suggestion);
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 滚动选中项到可见区域
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[
        selectedIndex
      ] as HTMLElement;
      selectedElement?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // 高亮匹配文本
  const highlightMatch = (text: string, query: string) => {
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <strong key={index} className="highlight">
          {part}
        </strong>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  return (
    <div className="autocomplete">
      <div className="autocomplete-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="autocomplete-input"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= minChars && setShowDropdown(true)}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="autocomplete-dropdown"
        />

        {isLoading && (
          <div className="autocomplete-loading">
            <span className="spinner" />
          </div>
        )}
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          id="autocomplete-dropdown"
          className="autocomplete-dropdown"
          role="listbox"
        >
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className={`autocomplete-item ${
                  index === selectedIndex ? 'selected' : ''
                }`}
                onClick={() => handleSelect(suggestion)}
                role="option"
                aria-selected={index === selectedIndex}
              >
                {highlightMatch(suggestion.text, query)}
              </div>
            ))
          ) : (
            <div className="autocomplete-empty">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}

export default Autocomplete;
```

### 3.2 基础样式

```css
/* Autocomplete.css */

.autocomplete {
  position: relative;
  width: 100%;
  max-width: 600px;
}

/* 输入框容器 */
.autocomplete-input-wrapper {
  position: relative;
}

.autocomplete-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  font-size: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  outline: none;
  transition: all 0.2s;
}

.autocomplete-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 加载指示器 */
.autocomplete-loading {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 下拉菜单 */
.autocomplete-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  max-height: 400px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 建议项 */
.autocomplete-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.autocomplete-item:hover,
.autocomplete-item.selected {
  background: #f3f4f6;
}

.autocomplete-item .highlight {
  color: #3b82f6;
  font-weight: 600;
}

/* 空状态 */
.autocomplete-empty {
  padding: 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

/* 滚动条样式 */
.autocomplete-dropdown::-webkit-scrollbar {
  width: 8px;
}

.autocomplete-dropdown::-webkit-scrollbar-track {
  background: #f9fafb;
}

.autocomplete-dropdown::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.autocomplete-dropdown::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
```

---

### 3.3 带缓存的高级版本

```tsx
import React, { useState, useCallback, useRef } from 'react';

// LRU 缓存实现
class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    const value = this.cache.get(key)!;
    // 重新插入以更新顺序
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // 删除最久未使用的项（Map 中第一个）
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

interface AutocompleteWithCacheProps {
  onSearch: (query: string) => Promise<Suggestion[]>;
  onSelect: (suggestion: Suggestion) => void;
  cacheSize?: number;
  cacheTTL?: number; // 毫秒
}

function AutocompleteWithCache({
  onSearch,
  onSelect,
  cacheSize = 100,
  cacheTTL = 5 * 60 * 1000, // 5分钟
}: AutocompleteWithCacheProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const cacheRef = useRef(new LRUCache<string, {
    data: Suggestion[];
    timestamp: number;
  }>(cacheSize));

  const searchWithCache = useCallback(
    async (searchQuery: string) => {
      // 检查缓存
      const cached = cacheRef.current.get(searchQuery);
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        setSuggestions(cached.data);
        return;
      }

      // 发起请求
      setIsLoading(true);
      try {
        const results = await onSearch(searchQuery);
        
        // 存入缓存
        cacheRef.current.set(searchQuery, {
          data: results,
          timestamp: Date.now(),
        });

        setSuggestions(results);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [onSearch, cacheTTL]
  );

  // ... 其他逻辑
}
```

---

### 3.4 分类建议组件

```tsx
interface CategorizedSuggestion {
  category: string;
  items: Suggestion[];
}

function CategorizedAutocomplete() {
  const [categorizedSuggestions, setCategorizedSuggestions] = useState<
    CategorizedSuggestion[]
  >([]);

  const renderCategorizedSuggestions = () => {
    return categorizedSuggestions.map((group) => (
      <div key={group.category} className="suggestion-group">
        <div className="suggestion-category">{group.category}</div>
        {group.items.map((item, index) => (
          <div key={item.id} className="autocomplete-item">
            {item.text}
          </div>
        ))}
      </div>
    ));
  };

  return (
    <div className="autocomplete-dropdown">
      {renderCategorizedSuggestions()}
    </div>
  );
}
```

```css
/* 分类样式 */
.suggestion-group {
  margin-bottom: 8px;
}

.suggestion-category {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.suggestion-group:last-child {
  margin-bottom: 0;
}
```

---

### 3.5 富文本建议（带图标/图片）

```tsx
interface RichSuggestion {
  id: string;
  text: string;
  description?: string;
  icon?: string;
  image?: string;
  metadata?: any;
}

function RichAutocomplete() {
  const renderRichItem = (item: RichSuggestion) => {
    return (
      <div className="rich-suggestion-item">
        {item.image && (
          <img
            src={item.image}
            alt={item.text}
            className="suggestion-image"
          />
        )}
        {item.icon && (
          <span className="suggestion-icon">{item.icon}</span>
        )}
        <div className="suggestion-content">
          <div className="suggestion-title">{item.text}</div>
          {item.description && (
            <div className="suggestion-description">
              {item.description}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ...
}
```

```css
/* 富文本样式 */
.rich-suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.rich-suggestion-item:hover {
  background: #f3f4f6;
}

.suggestion-image {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
}

.suggestion-icon {
  font-size: 24px;
  width: 40px;
  text-align: center;
}

.suggestion-content {
  flex: 1;
  min-width: 0;
}

.suggestion-title {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-description {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

---

## 四、后端实现

### 4.1 API 接口设计

```typescript
// GET /api/autocomplete?q={query}&limit={limit}&category={category}
interface AutocompleteRequest {
  q: string;           // 搜索查询
  limit?: number;      // 结果数量限制，默认 10
  category?: string;   // 分类过滤
  userId?: string;     // 用户 ID（个性化）
}

interface AutocompleteResponse {
  query: string;
  suggestions: Suggestion[];
  categories: {
    [key: string]: Suggestion[];
  };
  metadata: {
    took: number;      // 查询耗时（ms）
    total: number;     // 总结果数
  };
}
```

### 4.2 Node.js + Express 实现

```typescript
import express from 'express';
import Redis from 'ioredis';
import { Trie } from './trie';

const app = express();
const redis = new Redis();
const trie = new Trie();

// 初始化 Trie
async function initializeTrie() {
  const keywords = await loadKeywordsFromDB();
  keywords.forEach((keyword) => {
    trie.insert(keyword.text, keyword);
  });
}

// 自动完成接口
app.get('/api/autocomplete', async (req, res) => {
  const startTime = Date.now();
  const { q, limit = 10, category, userId } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  const cacheKey = `autocomplete:${q}:${limit}:${category || 'all'}`;

  try {
    // 1. 检查 Redis 缓存
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        ...JSON.parse(cached),
        metadata: { took: Date.now() - startTime, cached: true },
      });
    }

    // 2. Trie 前缀搜索
    let suggestions = trie.search(q, Number(limit));

    // 3. 分类过滤
    if (category) {
      suggestions = suggestions.filter((s) => s.category === category);
    }

    // 4. 个性化排序（如果有 userId）
    if (userId) {
      suggestions = await personalizeResults(suggestions, userId as string);
    }

    // 5. 按相关性和热度排序
    suggestions.sort((a, b) => {
      // 优先级：完全匹配 > 前缀匹配 > 包含匹配
      const aMatch = getMatchScore(a.text, q);
      const bMatch = getMatchScore(b.text, q);
      if (aMatch !== bMatch) return bMatch - aMatch;

      // 次要排序：热度
      return (b.popularity || 0) - (a.popularity || 0);
    });

    // 6. 分类归组
    const categories = groupByCategory(suggestions);

    const response = {
      query: q,
      suggestions,
      categories,
      metadata: {
        took: Date.now() - startTime,
        total: suggestions.length,
      },
    };

    // 7. 缓存结果（5分钟）
    await redis.setex(cacheKey, 300, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 匹配评分
function getMatchScore(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerText === lowerQuery) return 100; // 完全匹配
  if (lowerText.startsWith(lowerQuery)) return 80; // 前缀匹配
  if (lowerText.includes(lowerQuery)) return 60; // 包含匹配
  return 0;
}

// 分类归组
function groupByCategory(suggestions: Suggestion[]) {
  return suggestions.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, Suggestion[]>);
}

// 个性化排序
async function personalizeResults(
  suggestions: Suggestion[],
  userId: string
): Promise<Suggestion[]> {
  // 获取用户历史搜索
  const userHistory = await redis.lrange(`user:${userId}:history`, 0, 100);
  const historySet = new Set(userHistory);

  return suggestions.map((suggestion) => ({
    ...suggestion,
    // 用户搜索过的提升权重
    popularity: historySet.has(suggestion.id)
      ? (suggestion.popularity || 0) * 1.5
      : suggestion.popularity || 0,
  }));
}

app.listen(3000, () => {
  console.log('Autocomplete API running on port 3000');
  initializeTrie();
});
```

---

### 4.3 Trie（前缀树）实现

```typescript
class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  data: any;
  frequency: number;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.data = null;
    this.frequency = 0;
  }
}

class Trie {
  private root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  // 插入
  insert(word: string, data?: any): void {
    let node = this.root;
    const lowerWord = word.toLowerCase();

    for (const char of lowerWord) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }

    node.isEndOfWord = true;
    node.data = data || word;
    node.frequency++;
  }

  // 搜索前缀
  search(prefix: string, limit: number = 10): any[] {
    const results: any[] = [];
    const lowerPrefix = prefix.toLowerCase();
    let node = this.root;

    // 找到前缀节点
    for (const char of lowerPrefix) {
      if (!node.children.has(char)) {
        return results;
      }
      node = node.children.get(char)!;
    }

    // DFS 收集所有匹配的单词
    this.dfs(node, prefix, results, limit);

    // 按频率排序
    results.sort((a, b) => b.frequency - a.frequency);

    return results.slice(0, limit);
  }

  private dfs(
    node: TrieNode,
    currentWord: string,
    results: any[],
    limit: number
  ): void {
    if (results.length >= limit) return;

    if (node.isEndOfWord) {
      results.push({
        ...node.data,
        frequency: node.frequency,
      });
    }

    for (const [char, childNode] of node.children) {
      this.dfs(childNode, currentWord + char, results, limit);
    }
  }

  // 删除
  delete(word: string): boolean {
    return this.deleteHelper(this.root, word.toLowerCase(), 0);
  }

  private deleteHelper(
    node: TrieNode,
    word: string,
    index: number
  ): boolean {
    if (index === word.length) {
      if (!node.isEndOfWord) return false;
      node.isEndOfWord = false;
      node.data = null;
      return node.children.size === 0;
    }

    const char = word[index];
    const childNode = node.children.get(char);

    if (!childNode) return false;

    const shouldDeleteChild = this.deleteHelper(childNode, word, index + 1);

    if (shouldDeleteChild) {
      node.children.delete(char);
      return node.children.size === 0 && !node.isEndOfWord;
    }

    return false;
  }
}

export { Trie, TrieNode };
```

---

### 4.4 Elasticsearch 集成

```typescript
import { Client } from '@elastic/elasticsearch';

const esClient = new Client({ node: 'http://localhost:9200' });

// 创建索引
async function createIndex() {
  await esClient.indices.create({
    index: 'autocomplete',
    body: {
      settings: {
        analysis: {
          analyzer: {
            autocomplete_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'autocomplete_filter'],
            },
          },
          filter: {
            autocomplete_filter: {
              type: 'edge_ngram',
              min_gram: 2,
              max_gram: 20,
            },
          },
        },
      },
      mappings: {
        properties: {
          text: {
            type: 'text',
            analyzer: 'autocomplete_analyzer',
            search_analyzer: 'standard',
          },
          category: { type: 'keyword' },
          popularity: { type: 'integer' },
          created_at: { type: 'date' },
        },
      },
    },
  });
}

// 搜索
async function searchAutocomplete(query: string, limit: number = 10) {
  const response = await esClient.search({
    index: 'autocomplete',
    body: {
      query: {
        bool: {
          should: [
            // 前缀匹配（高权重）
            {
              match_phrase_prefix: {
                text: {
                  query,
                  boost: 3,
                },
              },
            },
            // 模糊匹配（处理拼写错误）
            {
              match: {
                text: {
                  query,
                  fuzziness: 'AUTO',
                  boost: 1,
                },
              },
            },
          ],
        },
      },
      sort: [
        { _score: 'desc' },
        { popularity: 'desc' },
      ],
      size: limit,
    },
  });

  return response.hits.hits.map((hit) => ({
    id: hit._id,
    ...hit._source,
    score: hit._score,
  }));
}
```

---

## 五、性能优化

### 5.1 前端优化

#### 1. 防抖和节流

```typescript
// 防抖：用户停止输入后才发起请求
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 节流：限制请求频率
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
```

#### 2. 请求取消（AbortController）

```typescript
function useAutocomplete() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = async (query: string) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的 AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`/api/autocomplete?q=${query}`, {
        signal: controller.signal,
      });
      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request cancelled');
      } else {
        throw error;
      }
    }
  };

  return { search };
}
```

#### 3. 虚拟滚动（大量结果）

```tsx
import { FixedSizeList } from 'react-window';

function VirtualizedDropdown({ suggestions }: { suggestions: Suggestion[] }) {
  return (
    <FixedSizeList
      height={400}
      itemCount={suggestions.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style} className="autocomplete-item">
          {suggestions[index].text}
        </div>
      )}
    </FixedSizeList>
  );
}
```

---

### 5.2 后端优化

#### 1. 多级缓存策略

```typescript
class CacheManager {
  private l1Cache: Map<string, any>; // 内存缓存
  private l2Cache: Redis;            // Redis 缓存

  constructor(redisClient: Redis) {
    this.l1Cache = new Map();
    this.l2Cache = redisClient;
  }

  async get(key: string): Promise<any> {
    // L1: 内存缓存（最快）
    if (this.l1Cache.has(key)) {
      return this.l1Cache.get(key);
    }

    // L2: Redis 缓存
    const cached = await this.l2Cache.get(key);
    if (cached) {
      const data = JSON.parse(cached);
      this.l1Cache.set(key, data); // 回填 L1
      return data;
    }

    return null;
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    // 同时写入 L1 和 L2
    this.l1Cache.set(key, value);
    await this.l2Cache.setex(key, ttl, JSON.stringify(value));
  }
}
```

#### 2. 批量预加载

```typescript
// 预加载热门搜索词
async function preloadHotKeywords() {
  const hotKeywords = await db.query(
    'SELECT * FROM keywords ORDER BY popularity DESC LIMIT 1000'
  );

  for (const keyword of hotKeywords) {
    const cacheKey = `autocomplete:${keyword.text}:10:all`;
    const suggestions = await generateSuggestions(keyword.text);
    await redis.setex(cacheKey, 3600, JSON.stringify(suggestions));
  }
}

// 定时刷新
setInterval(preloadHotKeywords, 30 * 60 * 1000); // 每30分钟
```

#### 3. 数据库索引优化

```sql
-- MySQL 全文索引
CREATE FULLTEXT INDEX idx_keywords_text ON keywords(text);

-- 复合索引
CREATE INDEX idx_category_popularity ON keywords(category, popularity DESC);

-- 前缀索引
CREATE INDEX idx_text_prefix ON keywords(text(20));
```

---

## 六、高级特性

### 6.1 拼写纠错

```typescript
// Levenshtein 距离算法
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替换
          matrix[i][j - 1] + 1,     // 插入
          matrix[i - 1][j] + 1      // 删除
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// 查找相似词
function findSimilarWords(query: string, dictionary: string[], threshold: number = 2): string[] {
  return dictionary
    .map((word) => ({
      word,
      distance: levenshteinDistance(query, word),
    }))
    .filter((item) => item.distance <= threshold)
    .sort((a, b) => a.distance - b.distance)
    .map((item) => item.word);
}
```

---

### 6.2 个性化推荐

```typescript
interface UserProfile {
  userId: string;
  searchHistory: string[];
  clickHistory: string[];
  preferences: Record<string, number>; // category -> score
}

async function personalizeResults(
  suggestions: Suggestion[],
  userId: string
): Promise<Suggestion[]> {
  const profile = await getUserProfile(userId);

  return suggestions.map((suggestion) => {
    let score = suggestion.popularity || 0;

    // 1. 搜索历史加权
    if (profile.searchHistory.includes(suggestion.text)) {
      score *= 1.5;
    }

    // 2. 点击历史加权
    if (profile.clickHistory.includes(suggestion.id)) {
      score *= 2.0;
    }

    // 3. 类别偏好加权
    if (suggestion.category && profile.preferences[suggestion.category]) {
      score *= 1 + profile.preferences[suggestion.category];
    }

    return { ...suggestion, personalizedScore: score };
  }).sort((a, b) => b.personalizedScore - a.personalizedScore);
}
```

---

### 6.3 实时热门搜索

```typescript
// 使用 Redis Sorted Set 统计热门搜索
async function trackSearch(query: string): Promise<void> {
  const key = 'trending:searches';
  await redis.zincrby(key, 1, query);
  
  // 设置过期时间（24小时滑动窗口）
  await redis.expire(key, 86400);
}

async function getTrendingSearches(limit: number = 10): Promise<string[]> {
  return await redis.zrevrange('trending:searches', 0, limit - 1);
}

// 定时更新热门搜索缓存
setInterval(async () => {
  const trending = await getTrendingSearches(20);
  await redis.setex('cache:trending', 300, JSON.stringify(trending));
}, 60000); // 每分钟
```

---

## 七、监控和分析

### 7.1 性能指标

```typescript
interface PerformanceMetrics {
  queryTime: number;        // 查询耗时
  cacheHitRate: number;     // 缓存命中率
  qps: number;              // 每秒查询数
  avgSuggestions: number;   // 平均返回建议数
  errorRate: number;        // 错误率
}

class MetricsCollector {
  private metrics: Map<string, number[]> = new Map();

  record(metric: string, value: number): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }
    this.metrics.get(metric)!.push(value);
  }

  getAverage(metric: string): number {
    const values = this.metrics.get(metric) || [];
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  getPercentile(metric: string, p: number): number {
    const values = this.metrics.get(metric) || [];
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  reset(): void {
    this.metrics.clear();
  }
}

const metrics = new MetricsCollector();

// 使用
app.get('/api/autocomplete', async (req, res) => {
  const start = Date.now();
  
  // ... 处理请求
  
  const duration = Date.now() - start;
  metrics.record('query_time', duration);
  
  res.json(result);
});

// 定时上报
setInterval(() => {
  console.log({
    avgQueryTime: metrics.getAverage('query_time'),
    p95QueryTime: metrics.getPercentile('query_time', 95),
    p99QueryTime: metrics.getPercentile('query_time', 99),
  });
  metrics.reset();
}, 60000);
```

---

### 7.2 用户行为分析

```typescript
interface SearchEvent {
  userId: string;
  query: string;
  timestamp: number;
  resultCount: number;
  selectedIndex?: number;
  selectedId?: string;
  sessionId: string;
}

// 记录搜索事件
async function logSearchEvent(event: SearchEvent): Promise<void> {
  await kafka.send({
    topic: 'search-events',
    messages: [{ value: JSON.stringify(event) }],
  });
}

// 分析搜索失败
async function analyzeZeroResultQueries(): Promise<void> {
  const zeroResults = await db.query(`
    SELECT query, COUNT(*) as count
    FROM search_events
    WHERE result_count = 0
    AND timestamp > NOW() - INTERVAL 24 HOUR
    GROUP BY query
    ORDER BY count DESC
    LIMIT 100
  `);

  // 自动添加到字典或建议拼写纠正
  for (const item of zeroResults) {
    if (item.count > 10) {
      await addToDictionary(item.query);
    }
  }
}
```

---

## 八、安全性

### 8.1 输入验证和过滤

```typescript
import validator from 'validator';
import xss from 'xss';

function sanitizeQuery(query: string): string {
  // 1. 移除 HTML 标签
  let sanitized = xss(query, { whiteList: {} });

  // 2. 限制长度
  sanitized = sanitized.slice(0, 100);

  // 3. 移除特殊字符（可选）
  sanitized = sanitized.replace(/[<>'"\\]/g, '');

  // 4. trim 空格
  sanitized = sanitized.trim();

  return sanitized;
}

// 使用
app.get('/api/autocomplete', (req, res) => {
  const rawQuery = req.query.q as string;
  const sanitizedQuery = sanitizeQuery(rawQuery);
  
  // ... 处理查询
});
```

---

### 8.2 速率限制

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate_limit:',
  }),
  windowMs: 60 * 1000, // 1分钟
  max: 100, // 最多100次请求
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/autocomplete', limiter);
```

---

## 九、面试要点

### Q1: 如何实现高性能的自动完成？

**核心优化：**
1. **前端防抖** - 300ms debounce，减少请求
2. **多级缓存** - 内存 + Redis + CDN
3. **Trie 数据结构** - O(k) 前缀查询，k 为查询长度
4. **请求取消** - AbortController 取消过期请求
5. **预加载** - 热门搜索词提前缓存

### Q2: Trie vs Elasticsearch，如何选择？

| 维度 | Trie | Elasticsearch |
|------|------|---------------|
| **性能** | 极快（内存） | 稍慢（网络IO） |
| **规模** | 适合中小规模 | 适合大规模 |
| **功能** | 前缀匹配 | 模糊匹配、全文搜索 |
| **维护** | 简单 | 复杂 |

**推荐：**
- 小规模（< 10万词）：Trie
- 大规模（> 100万词）：Elasticsearch
- 混合方案：Trie 热门词 + ES 长尾词

### Q3: 如何防止缓存击穿和雪崩？

```typescript
// 1. 缓存击穿 - 互斥锁
const lockKey = `lock:${cacheKey}`;
const lock = await redis.set(lockKey, '1', 'EX', 10, 'NX');

if (lock) {
  try {
    const data = await fetchFromDB();
    await redis.setex(cacheKey, 300, JSON.stringify(data));
  } finally {
    await redis.del(lockKey);
  }
}

// 2. 缓存雪崩 - 随机过期时间
const ttl = 300 + Math.floor(Math.random() * 60); // 300-360秒
await redis.setex(cacheKey, ttl, data);

// 3. 缓存穿透 - 布隆过滤器
if (!bloomFilter.has(query)) {
  return []; // 一定不存在
}
```

### Q4: 如何实现拼写纠错？

**方案：**
1. **Levenshtein 距离** - 计算编辑距离
2. **N-gram** - 分词匹配
3. **Soundex/Metaphone** - 语音相似度
4. **机器学习** - 训练纠错模型

```typescript
// 简单实现
function suggestCorrection(query: string, dictionary: string[]): string {
  let minDistance = Infinity;
  let suggestion = query;

  for (const word of dictionary) {
    const distance = levenshteinDistance(query, word);
    if (distance < minDistance) {
      minDistance = distance;
      suggestion = word;
    }
  }

  return minDistance <= 2 ? suggestion : query;
}
```

### Q5: 如何评估自动完成系统的效果？

**关键指标：**
1. **响应时间** - P50/P95/P99 延迟
2. **缓存命中率** - > 80%
3. **点击率（CTR）** - 用户选择建议的比例
4. **零结果率** - < 5%
5. **查询覆盖率** - 前10个建议包含用户意图

---

## 十、完整示例

### 10.1 使用示例

```tsx
import React from 'react';
import Autocomplete from './Autocomplete';

function App() {
  const handleSearch = async (query: string) => {
    const response = await fetch(
      `/api/autocomplete?q=${encodeURIComponent(query)}&limit=10`
    );
    const data = await response.json();
    return data.suggestions;
  };

  const handleSelect = (suggestion: Suggestion) => {
    console.log('Selected:', suggestion);
    // 跳转到搜索结果页
    window.location.href = `/search?q=${encodeURIComponent(suggestion.text)}`;
  };

  return (
    <div className="app">
      <h1>Search</h1>
      <Autocomplete
        onSearch={handleSearch}
        onSelect={handleSelect}
        placeholder="Search for anything..."
        debounceMs={300}
        minChars={2}
        maxSuggestions={10}
      />
    </div>
  );
}

export default App;
```

---

## 总结

### 核心技术栈
**前端：**
- React + TypeScript
- 防抖/节流
- LRU 缓存
- 键盘导航
- 虚拟滚动

**后端：**
- Node.js + Express
- Trie 数据结构
- Redis 缓存
- Elasticsearch
- Rate Limiting

### 性能优化
- ✅ 多级缓存（内存 + Redis）
- ✅ 请求合并和取消
- ✅ 预加载热门搜索
- ✅ 数据库索引优化
- ✅ CDN 加速

### 高级特性
- ✅ 拼写纠错
- ✅ 个性化推荐
- ✅ 实时热门搜索
- ✅ 分类建议
- ✅ 富文本展示

### 监控和安全
- ✅ 性能监控
- ✅ 用户行为分析
- ✅ 输入验证
- ✅ 速率限制
- ✅ XSS 防护

这是系统设计面试中的经典题目！🎯