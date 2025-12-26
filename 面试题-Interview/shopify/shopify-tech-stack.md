# Shopify 技术栈深度解析

> 面向高级/资深前端，深入理解 Shopify 生态技术细节

---

## 一、Shopify Liquid 模板引擎

### 1. Liquid 核心概念

**Liquid 是什么？**

- Ruby 编写的模板语言
- 由 Shopify 开源并维护
- 用于动态生成 HTML
- 安全：限制了危险操作

**三大组件**：

```liquid
{%- comment -%} 1. Objects（对象）- 输出内容 {%- endcomment -%}
{{ product.title }}

{%- comment -%} 2. Tags（标签）- 逻辑控制 {%- endcomment -%}
{% if product.available %}
  <button>加入购物车</button>
{% endif %}

{%- comment -%} 3. Filters（过滤器）- 数据处理 {%- endcomment -%}
{{ product.price | money }}
```

### 2. Liquid 核心对象

#### 商品对象（Product）

```liquid
{%- comment -%} 商品基本信息 {%- endcomment -%}
{{ product.title }}              {%- comment -%} 商品名称 {%- endcomment -%}
{{ product.description }}        {%- comment -%} 商品描述 {%- endcomment -%}
{{ product.price }}              {%- comment -%} 价格（分） {%- endcomment -%}
{{ product.compare_at_price }}   {%- comment -%} 原价 {%- endcomment -%}
{{ product.available }}          {%- comment -%} 是否有货 {%- endcomment -%}
{{ product.vendor }}             {%- comment -%} 品牌 {%- endcomment -%}
{{ product.type }}               {%- comment -%} 类型 {%- endcomment -%}
{{ product.tags }}               {%- comment -%} 标签数组 {%- endcomment -%}

{%- comment -%} 商品变体（Variants） {%- endcomment -%}
{% for variant in product.variants %}
  <div>
    {{ variant.title }}        {%- comment -%} 尺寸/颜色等 {%- endcomment -%}
    {{ variant.price }}
    {{ variant.sku }}
    {{ variant.inventory_quantity }}
  </div>
{% endfor %}

{%- comment -%} 商品图片 {%- endcomment -%}
{{ product.featured_image | img_url: 'large' }}
{% for image in product.images %}
  <img src="{{ image | img_url: 'medium' }}" alt="{{ image.alt }}">
{% endfor %}
```

#### 购物车对象（Cart）

```liquid
{%- comment -%} 购物车信息 {%- endcomment -%}
{{ cart.item_count }}           {%- comment -%} 商品数量 {%- endcomment -%}
{{ cart.total_price | money }}  {%- comment -%} 总价 {%- endcomment -%}
{{ cart.currency.iso_code }}    {%- comment -%} 货币代码 {%- endcomment -%}

{%- comment -%} 购物车商品 {%- endcomment -%}
{% for item in cart.items %}
  <div>
    {{ item.title }}
    {{ item.quantity }}
    {{ item.line_price | money }}
    {{ item.product.url }}
  </div>
{% endfor %}
```

#### 集合对象（Collection）

```liquid
{%- comment -%} 商品集合 {%- endcomment -%}
{{ collection.title }}
{{ collection.description }}
{{ collection.products_count }}

{%- comment -%} 遍历集合商品 {%- endcomment -%}
{% for product in collection.products %}
  {%- comment -%} 渲染商品 {%- endcomment -%}
{% endfor %}

{%- comment -%} 分页 {%- endcomment -%}
{% paginate collection.products by 12 %}
  {% for product in paginate.collection %}
    {%- comment -%} 商品卡片 {%- endcomment -%}
  {% endfor %}

  {{ paginate | default_pagination }}
{% endpaginate %}
```

### 3. 高级 Liquid 技巧

#### 性能优化

```liquid
{%- comment -%} 使用 assign 缓存结果 {%- endcomment -%}
{% assign featured_products = collection.products | where: "featured", true %}

{%- comment -%} 使用 capture 构建复杂内容 {%- endcomment -%}
{% capture product_json %}
{
  "id": {{ product.id }},
  "title": {{ product.title | json }},
  "price": {{ product.price }}
}
{% endcapture %}

{%- comment -%} 移除空白（减小 HTML 体积） {%- endcomment -%}
{%- liquid
  assign price = product.price | money
  echo price
-%}
```

#### 条件判断优化

```liquid
{%- comment -%} 使用 case 代替多个 if {%- endcomment -%}
{% case product.type %}
  {% when 'Clothing' %}
    <span class="icon-shirt"></span>
  {% when 'Electronics' %}
    <span class="icon-laptop"></span>
  {% else %}
    <span class="icon-box"></span>
{% endcase %}

{%- comment -%} 使用 unless 简化逻辑 {%- endcomment -%}
{% unless product.available %}
  <span class="sold-out">售罄</span>
{% endunless %}
```

#### 自定义 Filter 组合

```liquid
{%- comment -%} 链式 Filter {%- endcomment -%}
{{ product.title | upcase | truncate: 50 }}

{%- comment -%} 常用 Filter {%- endcomment -%}
{{ product.price | money }}                    {%- comment -%} 格式化货币 {%- endcomment -%}
{{ product.title | escape }}                   {%- comment -%} HTML 转义 {%- endcomment -%}
{{ product.description | strip_html }}        {%- comment -%} 移除 HTML {%- endcomment -%}
{{ product.url | within: collection }}        {%- comment -%} 保持集合上下文 {%- endcomment -%}
{{ 'product.jpg' | asset_url | img_tag }}     {%- comment -%} 生成图片标签 {%- endcomment -%}
```

---

## 二、Shopify Storefront API（GraphQL）

### 1. API 基础

**为什么用 GraphQL？**

- 按需查询：只请求需要的字段
- 单次请求：避免多次 REST 调用
- 类型安全：强类型 Schema
- 实时文档：自文档化

**认证方式**：

```javascript
const STOREFRONT_ACCESS_TOKEN = "your-token";
const SHOP_DOMAIN = "your-store.myshopify.com";
const API_VERSION = "2024-01";

const headers = {
  "Content-Type": "application/json",
  "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN,
};
```

### 2. 常用查询

#### 查询商品列表

```graphql
query GetProducts($first: Int!, $query: String) {
  products(first: $first, query: $query) {
    edges {
      node {
        id
        title
        handle
        description
        vendor
        productType
        tags

        # 价格范围
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }

        # 图片
        images(first: 5) {
          edges {
            node {
              url
              altText
              width
              height
            }
          }
        }

        # 变体
        variants(first: 10) {
          edges {
            node {
              id
              title
              sku
              availableForSale
              quantityAvailable
              price {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
  }
}
```

#### 查询单个商品

```graphql
query GetProduct($handle: String!) {
  productByHandle(handle: $handle) {
    id
    title
    description
    descriptionHtml

    # SEO 信息
    seo {
      title
      description
    }

    # 选项（颜色、尺寸等）
    options {
      id
      name
      values
    }

    # 变体
    variants(first: 50) {
      edges {
        node {
          id
          title
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          image {
            url
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
}
```

#### 购物车操作

```graphql
# 创建购物车
mutation CreateCart($input: CartInput!) {
  cartCreate(input: $input) {
    cart {
      id
      checkoutUrl
      lines(first: 10) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
      cost {
        totalAmount {
          amount
          currencyCode
        }
        subtotalAmount {
          amount
          currencyCode
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}

# 添加商品
mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart {
      id
      lines(first: 10) {
        edges {
          node {
            id
            quantity
          }
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}

# 更新数量
mutation UpdateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
  cartLinesUpdate(cartId: $cartId, lines: $lines) {
    cart {
      id
    }
    userErrors {
      field
      message
    }
  }
}
```

### 3. React 集成示例

```typescript
// hooks/useShopifyAPI.ts
import { useMemo } from "react";

export const useShopifyAPI = () => {
  const client = useMemo(() => {
    const endpoint = `https://${process.env.NEXT_PUBLIC_SHOP_DOMAIN}/api/${process.env.NEXT_PUBLIC_API_VERSION}/graphql.json`;

    return {
      query: async (query: string, variables?: any) => {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token":
              process.env.NEXT_PUBLIC_STOREFRONT_TOKEN!,
          },
          body: JSON.stringify({ query, variables }),
        });

        const { data, errors } = await response.json();

        if (errors) {
          throw new Error(errors[0].message);
        }

        return data;
      },
    };
  }, []);

  return client;
};

// hooks/useProduct.ts
import { useQuery } from "@tanstack/react-query";
import { useShopifyAPI } from "./useShopifyAPI";

const GET_PRODUCT = `
  query GetProduct($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      description
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;

export const useProduct = (handle: string) => {
  const client = useShopifyAPI();

  return useQuery({
    queryKey: ["product", handle],
    queryFn: () => client.query(GET_PRODUCT, { handle }),
    staleTime: 5 * 60 * 1000, // 5分钟
  });
};
```

---

## 三、Shopify Hydrogen 深度

### 1. Hydrogen 核心特性

**什么是 Hydrogen？**

- Shopify 官方 React 框架
- 基于 Remix/Vite
- 原生支持 React Server Components
- 内置 Shopify API 客户端
- Oxygen 边缘部署

**关键优势**：

- ✅ 极致性能（RSC + 边缘计算）
- ✅ SEO 友好（SSR）
- ✅ 开发体验优秀（Hot Reload）
- ✅ 内置最佳实践

### 2. Hydrogen 项目结构

```
my-hydrogen-store/
├── app/
│   ├── routes/                # 路由文件
│   │   ├── _index.tsx        # 首页
│   │   ├── products.$handle.tsx  # 商品详情
│   │   └── collections.$handle.tsx  # 集合页
│   ├── components/            # 组件
│   ├── lib/                   # 工具函数
│   └── styles/                # 样式
├── public/                    # 静态资源
├── .env                       # 环境变量
└── package.json
```

### 3. 核心代码示例

#### 商品详情页

```typescript
// app/routes/products.$handle.tsx
import { json, type LoaderFunctionArgs } from "@shopify/remix-oxygen";
import { useLoaderData } from "@remix-run/react";
import { Image, Money } from "@shopify/hydrogen";

export async function loader({ params, context }: LoaderFunctionArgs) {
  const { handle } = params;
  const { storefront } = context;

  const { product } = await storefront.query(PRODUCT_QUERY, {
    variables: { handle },
  });

  if (!product) {
    throw new Response("Not found", { status: 404 });
  }

  return json({ product });
}

export default function Product() {
  const { product } = useLoaderData<typeof loader>();

  return (
    <div className="product-page">
      <div className="product-images">
        <Image
          data={product.featuredImage}
          sizes="(min-width: 768px) 50vw, 100vw"
          loading="eager"
        />
      </div>

      <div className="product-info">
        <h1>{product.title}</h1>

        <div className="price">
          <Money data={product.priceRange.minVariantPrice} />
        </div>

        <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />

        <AddToCartButton variantId={product.variants.nodes[0].id} />
      </div>
    </div>
  );
}

const PRODUCT_QUERY = `#graphql
  query Product($handle: String!) {
    product(handle: $handle) {
      id
      title
      descriptionHtml
      featuredImage {
        url
        altText
        width
        height
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 1) {
        nodes {
          id
        }
      }
    }
  }
`;
```

#### 使用 Hydrogen 组件

```typescript
import {
  Image,
  Money,
  ShopPayButton,
  Video,
  MediaFile,
} from '@shopify/hydrogen';

// 1. 图片组件（自动优化）
<Image
  data={product.image}
  aspectRatio="1/1"
  sizes="(min-width: 768px) 50vw, 100vw"
  loading="lazy"
/>

// 2. 价格组件（自动格式化）
<Money data={product.price} />

// 3. Shop Pay 按钮
<ShopPayButton variantIds={[variantId]} />

// 4. 媒体文件（自动识别类型）
<MediaFile data={media} />
```

---

## 四、Shopify Polaris（Admin UI）

### 1. Polaris 简介

**用途**：构建 Shopify App 管理界面

**核心组件**：

```tsx
import {
  Page,
  Card,
  Button,
  DataTable,
  TextField,
  FormLayout,
  Layout,
} from "@shopify/polaris";

function MyApp() {
  return (
    <Page title="Orders" primaryAction={{ content: "Create order" }}>
      <Layout>
        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={["text", "numeric", "text"]}
              headings={["Order", "Total", "Status"]}
              rows={[
                ["#1001", "$150.00", "Paid"],
                ["#1002", "$250.00", "Pending"],
              ]}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
```

---

## 五、面试高频问题

### Q1：Liquid 和 JavaScript 的性能对比？

**答**：

- Liquid 在服务端执行，减少客户端压力
- 但 Liquid 不支持复杂交互，需配合 JS
- 最佳实践：Liquid 做数据渲染，JS 做交互逻辑

### Q2：Storefront API 有什么限制？

**答**：

- 速率限制：默认每秒 2 次请求
- 数据限制：单次查询最多 250 个节点
- 权限限制：只能读取公开数据，不能修改订单
- 解决：使用 Admin API + 批量查询优化

### Q3：Hydrogen 相比 Next.js 的优势？

**答**：

- 内置 Shopify API 集成，开箱即用
- 针对电商场景优化（商品、购物车组件）
- Oxygen 边缘部署，全球加速
- 但生态不如 Next.js 成熟，需权衡

### Q4：如何优化 Liquid 模板性能？

**答**：

1. 减少循环嵌套
2. 使用 `assign` 缓存变量
3. 使用 `{%- -%}` 移除空白
4. 避免在循环中调用 Filter
5. 使用 Section 进行模块化

---

## 六、最佳实践总结

### 1. API 调用优化

```javascript
// ❌ 避免：多次请求
const product = await fetchProduct(id);
const reviews = await fetchReviews(id);
const related = await fetchRelated(id);

// ✅ 推荐：单次请求
const { product, reviews, related } = await fetchProductWithDetails(id);
```

### 2. 错误处理

```typescript
try {
  const data = await storefront.query(QUERY);
} catch (error) {
  // 记录错误
  console.error("Storefront API error:", error);

  // 降级处理
  return fallbackData;
}
```

### 3. 缓存策略

```typescript
// React Query 缓存配置
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
      cacheTime: 10 * 60 * 1000, // 10分钟后清除缓存
      retry: 3, // 失败重试3次
    },
  },
});
```

---

## 资源链接

- [Shopify Liquid 文档](https://shopify.dev/docs/api/liquid)
- [Storefront API 文档](https://shopify.dev/docs/api/storefront)
- [Hydrogen 文档](https://shopify.dev/docs/custom-storefronts/hydrogen)
- [Polaris 组件库](https://polaris.shopify.com/)
