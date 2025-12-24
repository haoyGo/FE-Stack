### Q7: feeds 流如何实现千人千面？

**考察点：** 推荐算法理解、前端实时个性化、A/B 测试

#### 标准答案

**1. 推荐策略（后端为主，前端配合）**

```javascript
// 后端推荐服务返回的数据结构
{
  "feeds": [
    {
      "id": "note123",
      "title": "冬季穿搭分享",
      "cover": "https://...",
      "author": { "id": "user456", "name": "小红" },
      "tags": ["穿搭", "冬季"],
      "score": 0.92, // 推荐分数
      "reason": "因为你关注了时尚博主" // 推荐理由
    }
  ],
  "strategy": "interest_based", // 推荐策略
  "experimentId": "exp_20241209_v1" // A/B 测试实验 ID
}
```

**2. 前端实时个性化**

```javascript
// 用户行为埋点
function trackUserBehavior(action, noteId) {
  const event = {
    userId: getCurrentUserId(),
    action, // 'view', 'like', 'comment', 'share', 'skip'
    noteId,
    timestamp: Date.now(),
    duration: action === "view" ? getViewDuration() : null,
  };

  // 实时上报（批量发送）
  behaviorQueue.push(event);
  if (behaviorQueue.length >= 10) {
    sendBatch(behaviorQueue);
    behaviorQueue = [];
  }
}

// 停留时长统计
function useViewTracking(noteId) {
  const { ref, inView } = useInView({ threshold: 0.5 });
  const startTime = useRef(null);

  useEffect(() => {
    if (inView) {
      startTime.current = Date.now();
    } else if (startTime.current) {
      const duration = Date.now() - startTime.current;
      if (duration > 1000) {
        // 停留超过 1 秒才计为有效浏览
        trackUserBehavior("view", noteId);
      }
      startTime.current = null;
    }
  }, [inView, noteId]);

  return ref;
}
```

**3. A/B 测试框架**

```javascript
// 实验配置
const experiments = {
  feed_algorithm_v2: {
    variants: ["control", "variant_a", "variant_b"],
    weights: [0.5, 0.25, 0.25], // 50% 对照组，25% 实验组 A，25% 实验组 B
  },
};

// 获取用户实验分组（哈希分桶）
function getUserVariant(userId, experimentId) {
  const hash = murmurhash(userId + experimentId);
  const bucket = hash % 100;

  const experiment = experiments[experimentId];
  let cumulative = 0;

  for (let i = 0; i < experiment.variants.length; i++) {
    cumulative += experiment.weights[i] * 100;
    if (bucket < cumulative) {
      return experiment.variants[i];
    }
  }

  return experiment.variants[0];
}

// 使用
function FeedsList() {
  const variant = getUserVariant(userId, "feed_algorithm_v2");

  // 不同分组使用不同算法
  const fetchFeeds =
    variant === "variant_a" ? fetchFeedsAlgorithmA : fetchFeedsAlgorithmB;

  const { data } = useSWR("/api/feeds", fetchFeeds);

  // 埋点上报实验数据
  useEffect(() => {
    trackExperiment("feed_algorithm_v2", variant);
  }, [variant]);

  return <FeedsList items={data} />;
}
```

**4. 本地缓存策略（提升体验）**

```javascript
// IndexedDB 缓存已浏览笔记
import Dexie from "dexie";

const db = new Dexie("xiaohongshu");
db.version(1).stores({
  viewedNotes: "id, timestamp",
  cachedFeeds: "userId, feeds, timestamp",
});

// 过滤已浏览内容
async function getPersonalizedFeeds(userId) {
  const viewedIds = await db.viewedNotes
    .where("timestamp")
    .above(Date.now() - 7 * 24 * 3600 * 1000) // 7 天内
    .toArray()
    .then((notes) => notes.map((n) => n.id));

  const feeds = await fetchFeeds(userId);

  // 过滤已浏览，保证新鲜感
  return feeds.filter((note) => !viewedIds.includes(note.id));
}
```

---
