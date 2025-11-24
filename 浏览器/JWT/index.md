# JWT（JSON Web Token）深度解析

## 一、JWT 基本原理

JWT（JSON Web Token）是一种用于在网络应用环境中安全传递声明信息的基于 JSON 的令牌格式，常用于身份认证和信息交换。

### 1. 结构组成

JWT 由三部分组成：

```
Header.Payload.Signature
```

每部分之间用点（.）分隔。

#### Header（头部）

- 描述令牌类型和签名算法
- 示例：
  ```json
  {
    "alg": "HS256",
    "typ": "JWT"
  }
  ```

#### Payload（载荷）

- 存放实际要传递的数据（声明/Claims）
- 常见字段：iss（签发者）、exp（过期时间）、sub（主题）、aud（受众）、iat（签发时间）、jti（唯一 ID）
- 示例：
  ```json
  {
    "sub": "1234567890",
    "name": "John Doe",
    "admin": true,
    "exp": 1700000000
  }
  ```

#### Signature（签名）

- 用于验证数据完整性和身份
- 生成方式：
  ```
  HMACSHA256(
    base64UrlEncode(header) + "." + base64UrlEncode(payload),
    secret
  )
  ```
- 服务端用密钥对前两部分签名，客户端无法伪造

### 2. 编码与解码流程

- Header 和 Payload 都是 JSON 对象，先 base64Url 编码
- Signature 用密钥和算法生成
- 最终 JWT 如：
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
  ```

---

## 二、JWT 应用场景与安全机制

### 1. 应用场景

- 用户身份认证（登录后返回 JWT，前端存储于 localStorage/cookie）
- API 权限校验（每次请求携带 JWT，服务端校验）
- 单点登录（SSO）
- 前后端分离项目的无状态认证
- 移动端/小程序认证

### 2. 安全机制

- 签名防篡改：服务端用密钥签名，客户端无法伪造
- 过期时间（exp）：防止令牌长期有效
- 载荷不可加密（默认），敏感信息不要放入 payload
- 支持多种算法：HS256（对称）、RS256（非对称）

### 3. 常见用法

#### 登录认证流程

```javascript
// 登录成功后，服务端返回 JWT
fetch("/api/login", {
  method: "POST",
  body: JSON.stringify({ username, password }),
})
  .then((res) => res.json())
  .then((data) => {
    localStorage.setItem("token", data.token);
  });

// 前端请求时携带 JWT
fetch("/api/userinfo", {
  headers: {
    Authorization: "Bearer " + localStorage.getItem("token"),
  },
});
```

#### 服务端校验 JWT（Node.js 示例）

```javascript
const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
}
```

#### 令牌续签与刷新

- 令牌过期后，前端可用 refresh_token 换取新 JWT
- 避免长期有效的 access_token

---

## 三、JWT 优缺点与安全问题

### 1. 优点

- 无状态，服务端无需保存会话数据，易于扩展
- 前后端分离，适合微服务和移动端
- 支持多平台（Web、App、小程序）
- 可自定义载荷，灵活扩展

### 2. 缺点

- 令牌一旦签发，无法主动失效（除非用黑名单）
- 载荷默认不加密，敏感信息泄露风险
- 长期有效令牌有安全隐患
- 令牌体积较大，频繁传输有性能损耗

### 3. 常见安全问题

- **密钥泄露**：服务端密钥泄露，所有令牌可伪造
- **算法攻击**：alg 字段被篡改为 none，服务端未校验算法
- **重放攻击**：令牌被窃取后重复使用
- **XSS/CSRF**：令牌存储于 localStorage，易被 XSS 攻击窃取
- **过期未处理**：令牌过期后未及时刷新或登出

### 4. 最佳实践

- 令牌只存储于 HttpOnly Cookie 或内存，避免 localStorage
- 设置合理的过期时间（exp），配合 refresh_token
- 服务端强制校验 alg 字段，禁止 none 算法
- 重要操作需二次校验（如密码修改、转账）
- 令牌体积控制，避免存储过多信息
- HTTPS 传输，防止中间人窃取
- 及时清理黑名单（如登出、账号冻结）

---

## 四、JWT 面试题与答案要点

### 1. JWT 的结构和原理是什么？

- 三部分：Header、Payload、Signature
- Header 指定算法和类型，Payload 存储声明，Signature 用密钥签名防篡改

### 2. JWT 如何防止伪造和篡改？

- 服务端用密钥签名，客户端无法伪造
- 校验 Signature，发现篡改则拒绝

### 3. JWT 为什么适合前后端分离？

- 无状态认证，服务端无需保存 session
- 令牌可跨服务、跨平台传递

### 4. JWT 有哪些安全隐患？如何防范？

- 密钥泄露、算法攻击、XSS/CSRF、重放攻击
- 防范：HttpOnly Cookie、校验 alg 字段、HTTPS、合理过期、黑名单

### 5. JWT 如何实现令牌刷新？

- access_token 设置短有效期，refresh_token 长期有效
- access_token 过期后用 refresh_token 换新令牌

### 6. JWT 和 session/cookie 有什么区别？

- session/cookie 需服务端存储，JWT 无状态
- JWT 体积大，cookie 体积小
- JWT 适合分布式，session 适合单体应用

### 7. JWT 如何在 Node.js/前端中校验和使用？

- Node.js 用 jsonwebtoken 库校验
- 前端用 Authorization 头携带令牌

### 8. JWT 如何防止 CSRF？

- 推荐存储于 HttpOnly Cookie，配合 CSRF Token 校验

### 9. JWT 的 exp 字段如何用？

- 指定令牌过期时间，服务端校验拒绝过期令牌

### 10. JWT 如何实现单点登录（SSO）？

- 各服务共享密钥或公钥，统一签发和校验令牌

---
