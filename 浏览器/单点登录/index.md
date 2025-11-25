# 单点登录（SSO）深度解析

> 完整覆盖 SSO 原理、主流方案（CAS、OAuth 2.0、JWT、SAML）、安全机制、实战代码、面试高频题

---

## 目录

- [一、单点登录基本概念](#一单点登录基本概念)
  - [1. 什么是 SSO](#1-什么是单点登录sso)
  - [2. 核心角色](#2-核心角色)
- [二、SSO 实现方案](#二sso-实现方案)
  - [1. CAS 协议](#1-cas-协议central-authentication-service)
  - [2. OAuth 2.0 / OpenID Connect](#2-oauth-20--openid-connect)
  - [3. JWT + 共享 Cookie](#3-jwt--共享-cookie)
- [三、OAuth 2.0 深度原理解析](#三oauth-20-深度原理解析)
  - [1. OAuth 2.0 核心概念](#1-oauth-20-核心概念)
  - [2. 四种授权模式深度解析](#2-oauth-20-四种授权模式深度解析)
  - [3. PKCE 扩展](#模式-2pkce-扩展proof-key-for-code-exchange)
- [四、跨域 SSO 解决方案](#四跨域-sso-解决方案)
- [五、SSO 安全机制](#五sso-安全机制)
- [六、单点登出（SLO）](#六单点登出slo)
- [七、面试高频题](#七单点登录面试高频题)
- [八、最佳实践](#八最佳实践)

---

## 一、单点登录基本概念

### 1. 什么是单点登录（SSO）？

**定义**：
Single Sign-On（单点登录）是指在多个应用系统中，用户只需登录一次，就可以访问所有相互信任的应用系统，无需重复登录。

**核心价值**：

- 用户体验：一次登录，处处访问
- 安全管理：统一认证中心，集中管控
- 降低成本：减少多套账号管理，降低运维成本

**典型场景**：

- 企业内部多个系统（OA、HR、财务、邮箱等）
- 互联网产品矩阵（阿里系、腾讯系、Google 全家桶）
- 教育平台（统一身份认证系统）

### 2. 核心角色

```
┌─────────────────────────────────────────────────────┐
│                    SSO 架构                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐      ┌──────────────┐                │
│  │  用户     │ ───→ │ 认证中心(CAS) │                │
│  │ (User)   │ ←─── │ (SSO Server)  │                │
│  └──────────┘      └──────────────┘                │
│       ↓                    ↓                        │
│       └────────┬───────────┴───────────┐           │
│                ↓                       ↓            │
│         ┌──────────┐           ┌──────────┐        │
│         │ 应用A     │           │ 应用B     │        │
│         │ (Client1)│           │ (Client2) │        │
│         └──────────┘           └──────────┘        │
└─────────────────────────────────────────────────────┘
```

- **用户（User）**：访问者
- **认证中心（SSO Server/CAS）**：统一认证服务，颁发和验证令牌
- **应用系统（Client）**：各业务系统，信任认证中心

---

## 二、SSO 实现方案

### 1. CAS 协议（Central Authentication Service）

**原理**：

- 认证中心独立部署，统一管理用户认证
- 应用系统信任认证中心，通过票据验证身份

**核心流程**：

```
1. 用户访问应用A（未登录）
2. 应用A重定向到 CAS Server:
   https://cas.example.com/login?service=https://app-a.com/callback

3. 用户在 CAS Server 登录，CAS 创建 TGT（Ticket Granting Ticket）
4. CAS 重定向回应用A，携带 ST（Service Ticket）:
   https://app-a.com/callback?ticket=ST-123456

5. 应用A 后端用 ST 向 CAS Server 验证:
   https://cas.example.com/validate?ticket=ST-123456&service=https://app-a.com

6. CAS Server 返回用户信息，应用A 创建局部会话
7. 用户访问应用B，应用B 重定向到 CAS Server
8. CAS 检查 TGT 已存在，直接颁发新的 ST，重定向回应用B
9. 应用B 验证 ST，创建局部会话，完成 SSO
```

**代码示例（Node.js）**：

```javascript
// 应用系统检查登录
app.get("/secure", (req, res) => {
  if (!req.session.user) {
    // 未登录，重定向到 CAS
    const serviceUrl = encodeURIComponent("https://app-a.com/callback");
    res.redirect(`https://cas.example.com/login?service=${serviceUrl}`);
  } else {
    res.send("Welcome, " + req.session.user.name);
  }
});

// CAS 回调验证
app.get("/callback", async (req, res) => {
  const ticket = req.query.ticket;

  // 向 CAS Server 验证 ticket
  const validateUrl = `https://cas.example.com/validate?ticket=${ticket}&service=https://app-a.com`;
  const response = await fetch(validateUrl);
  const userInfo = await response.json();

  if (userInfo.success) {
    // 创建局部会话
    req.session.user = userInfo.user;
    res.redirect("/secure");
  } else {
    res.status(401).send("Authentication failed");
  }
});
```

### 2. OAuth 2.0 / OpenID Connect

**原理**：

- OAuth 2.0 用于授权，OpenID Connect 在其基础上增加身份认证
- 认证服务器颁发 access_token 和 id_token

**核心流程（授权码模式）**：

```
1. 用户访问应用A，点击"使用 Google 登录"
2. 应用A 重定向到 OAuth 认证服务器:
   https://oauth.example.com/authorize?
     client_id=app-a&
     redirect_uri=https://app-a.com/callback&
     response_type=code&
     scope=openid profile email

3. 用户在认证服务器登录并授权
4. 认证服务器重定向回应用A，携带授权码:
   https://app-a.com/callback?code=AUTH_CODE_123

5. 应用A 后端用授权码换取 access_token:
   POST https://oauth.example.com/token
   Body: {
     code: AUTH_CODE_123,
     client_id: app-a,
     client_secret: SECRET,
     redirect_uri: https://app-a.com/callback
   }

6. 认证服务器返回 access_token 和 id_token
7. 应用A 用 id_token 获取用户信息，创建会话
```

**代码示例（Node.js + Passport.js）**：

```javascript
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "https://app-a.com/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      // 获取用户信息
      const user = {
        id: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
      };
      return done(null, user);
    }
  )
);

// 登录路由
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 回调路由
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // 登录成功，创建会话
    req.session.user = req.user;
    res.redirect("/dashboard");
  }
);
```

### 3. JWT + 共享 Cookie

**原理**：

- 认证中心颁发 JWT，存储在共享域的 Cookie 中
- 各子系统共享同一个顶级域名，可读取 Cookie

**适用场景**：

- 同一主域名下的多个子系统（如 \*.example.com）

**核心流程**：

```
1. 用户在 sso.example.com 登录
2. 认证中心验证成功，生成 JWT
3. 设置 Cookie:
   Set-Cookie: token=JWT_TOKEN; Domain=.example.com; Path=/; HttpOnly; Secure

4. 用户访问 app-a.example.com
5. 浏览器自动携带 Cookie（因为同主域）
6. app-a 验证 JWT，创建局部会话

7. 用户访问 app-b.example.com
8. 浏览器自动携带 Cookie
9. app-b 验证 JWT，完成 SSO
```

**代码示例**：

```javascript
// 认证中心登录
app.post("/sso/login", (req, res) => {
  const { username, password } = req.body;
  const user = authenticateUser(username, password);

  if (user) {
    const token = jwt.sign({ userId: user.id, name: user.name }, SECRET_KEY, {
      expiresIn: "1h",
    });

    // 设置共享 Cookie
    res.cookie("sso_token", token, {
      domain: ".example.com", // 共享给所有子域
      httpOnly: true,
      secure: true,
      maxAge: 3600000,
    });

    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// 子应用验证
app.use((req, res, next) => {
  const token = req.cookies.sso_token;

  if (!token) {
    return res.redirect("https://sso.example.com/login");
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    req.user = payload;
    next();
  } catch (err) {
    res.redirect("https://sso.example.com/login");
  }
});
```

**限制**：

- 只适用于同一主域名
- 跨域场景无法使用

## 三、OAuth 2.0 深度原理解析

### 1. OAuth 2.0 核心概念

**OAuth 2.0 是授权协议，不是认证协议**。它解决的是：如何让第三方应用安全地访问用户在另一个服务上的资源，而无需用户提供密码。

#### OAuth 2.0 四大角色

```
┌────────────────────────────────────────────────────────────┐
│                   OAuth 2.0 角色关系图                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐                                      │
│  │ Resource Owner   │  资源拥有者（用户）                   │
│  │    (User)        │  拥有受保护资源的用户                 │
│  └────────┬─────────┘                                      │
│           │ ① 授权                                          │
│           ↓                                                 │
│  ┌──────────────────┐        ┌──────────────────────┐     │
│  │ Client           │←─②───→ │ Authorization Server │     │
│  │ (第三方应用)      │ 请求    │  (授权服务器)         │     │
│  │                  │ 令牌    │                      │     │
│  └────────┬─────────┘        └──────────────────────┘     │
│           │ ③ 携带令牌访问              ↑                   │
│           ↓                            │ ④ 验证令牌         │
│  ┌──────────────────┐                 │                   │
│  │ Resource Server  │←────────────────┘                   │
│  │  (资源服务器)     │                                      │
│  └──────────────────┘                                      │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

- **Resource Owner（资源拥有者）**：用户，拥有受保护资源的所有者
- **Client（客户端）**：第三方应用，想要访问用户资源
- **Authorization Server（授权服务器）**：认证用户并颁发访问令牌
- **Resource Server（资源服务器）**：存储受保护资源，验证令牌后提供资源

#### 核心令牌类型

```javascript
// 1. Authorization Code（授权码）
// - 临时凭证，用于换取 access_token
// - 短期有效（通常 10 分钟）
// - 只能使用一次
code: "AUTH_CODE_abc123"

// 2. Access Token（访问令牌）
// - 用于访问受保护资源
// - 短期有效（通常 15-60 分钟）
access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// 3. Refresh Token（刷新令牌）
// - 用于获取新的 access_token
// - 长期有效（天/周/月）
// - 可以被撤销
refresh_token: "REFRESH_TOKEN_xyz789"

// 4. ID Token（身份令牌 - OIDC 扩展）
// - JWT 格式，包含用户身份信息
// - 用于身份认证
id_token: {
  sub: "user123",
  name: "John Doe",
  email: "john@example.com"
}
```

---

### 2. OAuth 2.0 四种授权模式深度解析

#### 模式 1：授权码模式（Authorization Code） - 最安全，推荐使用

**适用场景**：有后端服务器的 Web 应用

**核心优势**：

- ✅ client_secret 保存在后端，不暴露给前端
- ✅ 授权码只能使用一次，安全性高
- ✅ 支持 refresh_token，体验好

**完整流程图**：

```
用户                  客户端                授权服务器              资源服务器
 │                     │                      │                      │
 │  ① 访问应用          │                      │                      │
 │ ───────────────────→│                      │                      │
 │                     │                      │                      │
 │  ② 重定向到授权页    │                      │                      │
 │ ←───────────────────│                      │                      │
 │                     │                      │                      │
 │  ③ 请求授权 (带 client_id, scope, state)  │                      │
 │ ─────────────────────────────────────────→│                      │
 │                     │                      │                      │
 │  ④ 显示授权页面     │                      │                      │
 │ ←─────────────────────────────────────────│                      │
 │                     │                      │                      │
 │  ⑤ 用户同意授权     │                      │                      │
 │ ─────────────────────────────────────────→│                      │
 │                     │                      │                      │
 │  ⑥ 重定向回客户端 (带授权码 code)          │                      │
 │ ←─────────────────────────────────────────│                      │
 │ ───────────────────→│                      │                      │
 │                     │                      │                      │
 │                     │ ⑦ 用授权码换取 token (带 client_secret)    │
 │                     │ ────────────────────→│                      │
 │                     │                      │                      │
 │                     │ ⑧ 返回 access_token + refresh_token         │
 │                     │ ←────────────────────│                      │
 │                     │                      │                      │
 │                     │ ⑨ 用 access_token 访问资源                  │
 │                     │ ─────────────────────────────────────────→ │
 │                     │                      │ ⑩ 验证 token         │
 │                     │                      │ ←─────────────────── │
 │                     │ ⑪ 返回受保护资源     │                      │
 │                     │ ←───────────────────────────────────────── │
```

**详细代码实现**：

```javascript
// ======== 步骤1-3：客户端发起授权请求 ========
app.get("/auth/oauth", (req, res) => {
  // 生成随机 state，防止 CSRF 攻击
  const state = crypto.randomUUID();
  req.session.oauthState = state;

  // 构建授权 URL
  const authUrl = new URL("https://oauth.example.com/authorize");
  authUrl.searchParams.set("response_type", "code"); // 指定授权码模式
  authUrl.searchParams.set("client_id", CLIENT_ID); // 客户端 ID
  authUrl.searchParams.set("redirect_uri", "https://myapp.com/callback");
  authUrl.searchParams.set("scope", "read write profile"); // 请求的权限范围
  authUrl.searchParams.set("state", state); // 防 CSRF

  // 重定向到授权服务器
  res.redirect(authUrl.toString());
});

// ======== 步骤6-8：接收授权码并换取 token ========
app.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  // 验证 state，防止 CSRF 攻击
  if (state !== req.session.oauthState) {
    return res.status(403).send("CSRF attack detected");
  }

  // 用授权码换取 access_token（后端调用，client_secret 不暴露）
  const tokenResponse = await fetch("https://oauth.example.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // 或者使用 Basic Auth:
      // 'Authorization': `Basic ${Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')}`
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET, // 关键：只在后端使用
      redirect_uri: "https://myapp.com/callback",
    }),
  });

  const tokens = await tokenResponse.json();
  /*
  {
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: 'REFRESH_TOKEN_xyz',
    scope: 'read write profile'
  }
  */

  // 保存令牌（建议加密存储）
  req.session.accessToken = tokens.access_token;
  req.session.refreshToken = tokens.refresh_token;

  res.redirect("/dashboard");
});

// ======== 步骤9-11：使用 access_token 访问资源 ========
app.get("/api/user-profile", async (req, res) => {
  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.redirect("/auth/oauth");
  }

  try {
    const response = await fetch("https://api.example.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      // Token 过期，尝试刷新
      return await refreshAccessToken(req, res);
    }

    const userData = await response.json();
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// ======== Token 刷新 ========
async function refreshAccessToken(req, res) {
  const refreshToken = req.session.refreshToken;

  if (!refreshToken) {
    return res.redirect("/auth/oauth");
  }

  const tokenResponse = await fetch("https://oauth.example.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  const tokens = await tokenResponse.json();

  // 更新 access_token（某些实现也会返回新的 refresh_token）
  req.session.accessToken = tokens.access_token;
  if (tokens.refresh_token) {
    req.session.refreshToken = tokens.refresh_token;
  }

  res.redirect("/api/user-profile");
}
```

**关键安全点**：

1. `client_secret` 只在后端使用，前端永远不接触
2. `state` 参数防止 CSRF 攻击
3. 授权码只能使用一次，且短时有效
4. `redirect_uri` 必须严格匹配注册的白名单

---

#### 模式 2：PKCE 扩展（Proof Key for Code Exchange）

**为什么需要 PKCE？**

传统授权码模式问题：

- SPA 和移动 App 无法安全存储 `client_secret`
- 授权码可能被恶意 App 拦截

**PKCE 原理**：

```
客户端                              授权服务器
  │                                    │
  │ ① 生成 code_verifier (随机字符串)  │
  │ ② 计算 code_challenge              │
  │    = BASE64URL(SHA256(code_verifier))
  │                                    │
  │ ③ 授权请求 (带 code_challenge)    │
  │ ──────────────────────────────────→│
  │                                    │ ④ 保存 code_challenge
  │ ⑤ 返回授权码                       │
  │ ←──────────────────────────────────│
  │                                    │
  │ ⑥ 换取 token (带 code_verifier)   │
  │ ──────────────────────────────────→│
  │                                    │ ⑦ 验证：
  │                                    │   SHA256(code_verifier)
  │                                    │   == code_challenge ?
  │ ⑧ 返回 access_token                │
  │ ←──────────────────────────────────│
```

**代码实现**：

```javascript
// ======== 工具函数 ========
function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// 生成 code_verifier（随机字符串）
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

// 生成 code_challenge
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(hash);
}

// ======== 前端：发起授权请求 ========
async function startOAuthFlow() {
  // 步骤1-2：生成 PKCE 参数
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // 保存 code_verifier（后续换取 token 时需要）
  sessionStorage.setItem("pkce_code_verifier", codeVerifier);

  // 步骤3：发起授权请求
  const authUrl = new URL("https://oauth.example.com/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", "https://myapp.com/callback");
  authUrl.searchParams.set("scope", "read write");
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256"); // SHA256
  authUrl.searchParams.set("state", crypto.randomUUID());

  window.location.href = authUrl.toString();
}

// ======== 前端：处理回调 ========
async function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");

  // 验证 state...

  // 步骤6：换取 token（携带 code_verifier）
  const codeVerifier = sessionStorage.getItem("pkce_code_verifier");

  const tokenResponse = await fetch("https://oauth.example.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: code,
      client_id: CLIENT_ID,
      redirect_uri: "https://myapp.com/callback",
      code_verifier: codeVerifier, // 关键：发送原始 code_verifier
    }),
  });

  const tokens = await tokenResponse.json();
  // 获得 access_token，无需 client_secret！

  sessionStorage.removeItem("pkce_code_verifier");
  localStorage.setItem("access_token", tokens.access_token);
}
```

**PKCE 优势**：

- ✅ 无需 client_secret，适合公开客户端（SPA、移动 App）
- ✅ 防止授权码被拦截后滥用
- ✅ 即使授权码泄露，没有 code_verifier 也无法换取 token

---

## 四、跨域 SSO 解决方案

### 1. 问题背景

当应用分布在不同域名下，Cookie 无法共享，需要特殊方案：

```
app-a.com       ← Cookie 无法共享 →       app-b.net
```

### 2. 方案一：认证中心重定向（CAS 模式）

**原理**：所有应用重定向到统一认证中心，通过票据验证身份。

```
用户访问 app-a.com
  ↓
重定向到 sso.auth.com?service=app-a.com
  ↓
用户登录，认证中心生成 TGT（全局会话）
  ↓
重定向回 app-a.com?ticket=ST_123
  ↓
app-a.com 后端验证 ticket，创建局部会话
  ↓
用户访问 app-b.net
  ↓
重定向到 sso.auth.com?service=app-b.net
  ↓
检测到 TGT 已存在，直接颁发新 ticket
  ↓
重定向回 app-b.net?ticket=ST_456
  ↓
app-b.net 验证 ticket，完成 SSO ✅
```

**优势**：

- ✅ 支持任意跨域
- ✅ 票据一次有效，安全性高
- ✅ 认证中心统一管控

**代码示例**：

```javascript
// 应用 A
app.use((req, res, next) => {
  if (!req.session.user) {
    const serviceUrl = encodeURIComponent("https://app-a.com/callback");
    res.redirect(`https://sso.auth.com/login?service=${serviceUrl}`);
  } else {
    next();
  }
});

app.get("/callback", async (req, res) => {
  const ticket = req.query.ticket;

  // 后端验证票据
  const validateUrl = `https://sso.auth.com/validate?ticket=${ticket}&service=https://app-a.com`;
  const response = await fetch(validateUrl);
  const result = await response.json();

  if (result.valid) {
    req.session.user = result.user;
    res.redirect("/dashboard");
  } else {
    res.status(401).send("Invalid ticket");
  }
});
```

### 3. 方案二：PostMessage + iframe

**原理**：在各应用中嵌入认证中心 iframe，通过 PostMessage 通信。

```html
<!-- app-a.com -->
<iframe
  id="sso-iframe"
  src="https://sso.auth.com/iframe"
  style="display:none;"
></iframe>

<script>
  window.addEventListener("message", (event) => {
    if (event.origin !== "https://sso.auth.com") return;

    const { type, token } = event.data;

    if (type === "SSO_TOKEN") {
      // 获取到 token，发送到后端验证
      fetch("/api/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).then((res) => {
        if (res.ok) {
          location.href = "/dashboard";
        }
      });
    }
  });

  // 请求 token
  const iframe = document.getElementById("sso-iframe");
  iframe.onload = () => {
    iframe.contentWindow.postMessage(
      { type: "REQUEST_TOKEN" },
      "https://sso.auth.com"
    );
  };
</script>
```

```javascript
// sso.auth.com/iframe 内部
window.addEventListener("message", (event) => {
  if (event.data.type === "REQUEST_TOKEN") {
    // 从 Cookie 读取 token（同域可访问）
    const token = document.cookie.match(/sso_token=([^;]+)/)?.[1];

    // 返回给父页面
    event.source.postMessage(
      {
        type: "SSO_TOKEN",
        token: token,
      },
      event.origin
    );
  }
});
```

**优势**：

- ✅ 前端实现，无需后端重定向
- ✅ 用户无感知

**限制**：

- ❌ 依赖 iframe，某些浏览器限制
- ❌ 安全性依赖 origin 验证

### 4. 方案三：Token 存储 LocalStorage + API 接口验证

**原理**：不依赖 Cookie，token 存储在 LocalStorage，每次请求携带。

```javascript
// 登录后存储 token
localStorage.setItem("access_token", token);

// API 请求携带 token
fetch("https://api.example.com/data", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  },
});
```

**跨域 SSO 实现**：

```javascript
// 用户在 app-a.com 登录
// 1. 认证中心返回 token
const { access_token } = await loginToSSO(username, password);
localStorage.setItem("access_token", access_token);

// 2. 用户访问 app-b.net
// app-b.net 前端检查是否有 token
if (!localStorage.getItem("access_token")) {
  // 重定向到 SSO 登录
  location.href = "https://sso.auth.com/login?redirect=app-b.net";
}

// 3. SSO 检测已登录，生成 token 并重定向
location.href = `https://app-b.net/callback?token=${token}`;

// 4. app-b.net 接收 token 并存储
const token = new URLSearchParams(location.search).get("token");
localStorage.setItem("access_token", token);
```

**优势**：

- ✅ 支持任意跨域
- ✅ 无需 Cookie

**限制**：

- ❌ XSS 攻击风险（LocalStorage 可被脚本读取）
- ❌ 需要完善的 CSRF 防护

---

## 五、SSO 安全机制

### 1. 核心安全威胁

| 威胁类型       | 攻击方式         | 防护方案                        |
| -------------- | ---------------- | ------------------------------- |
| **CSRF**       | 伪造授权请求     | state 参数验证                  |
| **XSS**        | 窃取 token       | HttpOnly Cookie + CSP           |
| **中间人攻击** | 截获授权码/token | HTTPS + PKCE                    |
| **重放攻击**   | 重复使用票据     | 票据一次有效 + 短期过期         |
| **Token 泄露** | Token 被盗用     | 短期 token + refresh token 轮转 |
| **恶意重定向** | 钓鱼网站         | redirect_uri 白名单             |

### 2. 关键安全措施

#### (1) state 参数防 CSRF

```javascript
// 发起授权
const state = crypto.randomUUID();
sessionStorage.setItem("oauth_state", state);
location.href = `https://oauth.example.com/authorize?...&state=${state}`;

// 回调验证
const returnedState = new URLSearchParams(location.search).get("state");
if (returnedState !== sessionStorage.getItem("oauth_state")) {
  throw new Error("CSRF attack detected");
}
```

#### (2) PKCE 防止授权码拦截

```javascript
// 授权时发送 code_challenge
code_challenge: SHA256(code_verifier);

// 换取 token 时发送原始 code_verifier
// 服务端验证：SHA256(code_verifier) == code_challenge
```

#### (3) Token 存储最佳实践

| 存储方式            | 优势                 | 劣势                | 适用场景           |
| ------------------- | -------------------- | ------------------- | ------------------ |
| **HttpOnly Cookie** | 防 XSS               | 需要同域或配置 CORS | 同域或可控后端     |
| **内存（变量）**    | 最安全，页面刷新清除 | 用户体验差          | 高安全要求         |
| **SessionStorage**  | 标签页隔离           | 页面刷新清除        | 短期操作           |
| **LocalStorage**    | 持久化，体验好       | XSS 攻击风险        | 结合 refresh token |

**推荐方案**：

```javascript
// access_token 存内存（刷新后丢失，需重新获取）
let accessToken = null;

// refresh_token 存 HttpOnly Cookie（后端设置）
// 或加密后存 LocalStorage（前端需解密）
```

#### (4) Token 黑名单（Redis）

```javascript
// 登出时加入黑名单
await redis.setex(`blacklist:${tokenId}`, 3600, "1");

// 验证时检查
if (await redis.exists(`blacklist:${tokenId}`)) {
  throw new Error("Token revoked");
}
```

#### (5) IP/设备指纹绑定

```javascript
// 颁发 token 时记录 IP/设备
const tokenPayload = {
  userId: user.id,
  ip: req.ip,
  userAgent: req.headers["user-agent"],
};

// 验证时检查
if (payload.ip !== req.ip) {
  // 触发二次认证或报警
  sendSecurityAlert(user.id);
}
```

---

## 六、单点登出（SLO）

### 1. 核心挑战

单点登录容易，单点登出困难：

- 多个应用各自维护局部会话
- 如何通知所有应用同步登出？

### 2. 方案一：认证中心主动通知

**原理**：认证中心维护应用列表，登出时主动调用各应用的登出接口。

```javascript
// 认证中心：用户登出
app.post("/logout", async (req, res) => {
  const userId = req.session.userId;

  // 撤销全局会话（TGT）
  await redis.del(`session:${userId}`);

  // 获取所有已登录的应用
  const apps = await redis.smembers(`user:${userId}:apps`);

  // 并行通知所有应用登出
  await Promise.all(
    apps.map((appUrl) =>
      fetch(`${appUrl}/slo-callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionId: req.session.id }),
      })
    )
  );

  res.json({ success: true });
});
```

```javascript
// 应用 A：接收登出通知
app.post("/slo-callback", (req, res) => {
  const { userId, sessionId } = req.body;

  // 验证请求来源（签名/白名单）
  // ...

  // 销毁局部会话
  sessionStore.destroy(sessionId);

  res.json({ success: true });
});
```

**优势**：

- ✅ 立即生效，实时同步

**限制**：

- ❌ 需要维护应用列表
- ❌ 某些应用不可达时失败

### 3. 方案二：前端广播（同域）

**原理**：利用 localStorage + storage 事件，同域下所有标签页监听登出事件。

```javascript
// 登出时广播
localStorage.setItem("logout_event", Date.now());
localStorage.removeItem("logout_event"); // 触发 storage 事件

// 其他标签页监听
window.addEventListener("storage", (e) => {
  if (e.key === "logout_event") {
    // 清除本地会话
    sessionStorage.clear();
    location.href = "/login";
  }
});
```

### 4. 方案三：Refresh Token 撤销

**原理**：登出时撤销 refresh_token，access_token 过期后无法刷新。

```javascript
// 登出时
await redis.del(`refresh_token:${refreshToken}`);

// access_token 过期后，刷新失败，强制重新登录
```

**优势**：

- ✅ 简单，无需复杂通知
- ✅ 自然过期，安全性高

**限制**：

- ❌ 非实时，需等 access_token 过期

### 5. 完整登出流程

```
用户点击登出
  ↓
前端调用 /logout API
  ↓
后端：
  1. 撤销 refresh_token (Redis)
  2. access_token 加入黑名单
  3. 通知其他应用登出（可选）
  ↓
前端：
  1. 清除 token (LocalStorage/SessionStorage)
  2. 广播登出事件（同域）
  3. 重定向到登录页
```

---

## 七、单点登录面试高频题

### 1. OAuth 2.0 和 SSO 有什么区别？

| 对比项       | SSO                        | OAuth 2.0                  |
| ------------ | -------------------------- | -------------------------- |
| **核心目的** | 身份认证（Authentication） | 授权（Authorization）      |
| **解决问题** | 一次登录，处处访问         | 第三方应用授权             |
| **典型场景** | 企业内部多系统             | 第三方应用授权             |
| **用户感知** | 无感切换，自动登录         | 明确授权，用户同意         |
| **协议**     | CAS、SAML 2.0              | OAuth 2.0                  |
| **扩展**     | -                          | OpenID Connect（增加认证） |

**关键点**：OAuth 2.0 不是认证协议，但可以通过 OIDC 扩展实现 SSO。

### 2. 为什么说 OAuth 2.0 不是认证协议？

**答案**：

- OAuth 2.0 只关心"是否有权限访问资源"，不关心"你是谁"
- access_token 不包含用户身份信息（可能是代理授权）
- 需要 OpenID Connect 扩展（id_token）才能确认用户身份

**举例**：

```
场景：用户 A 授权应用 B 访问自己的照片
- OAuth 2.0：应用 B 获得访问照片的权限（授权）
- 不保证：应用 B 知道用户是 A（认证）
```

### 3. PKCE 解决了什么问题？原理是什么？

**问题**：

- 移动 App 和 SPA 无法安全存储 client_secret
- 恶意 App 可能拦截授权码

**原理**：

```
1. 客户端生成随机字符串 code_verifier
2. 计算 code_challenge = BASE64URL(SHA256(code_verifier))
3. 授权时发送 code_challenge
4. 换取 token 时发送 code_verifier
5. 服务端验证：SHA256(code_verifier) == code_challenge
```

**优势**：

- 即使授权码被拦截，没有 code_verifier 也无法换取 token
- 无需 client_secret

### 4. JWT Token 被盗取后如何防范？

**答案要点**：

1. **短期有效**：access_token 15 分钟，减少滥用窗口
2. **刷新令牌轮转**：每次刷新颁发新 refresh_token，旧的失效
3. **黑名单机制**：登出/异常时将 token 加入黑名单（Redis）
4. **敏感操作二次认证**：转账、改密等要求密码/短信验证
5. **IP/设备指纹绑定**：检测 token 使用的 IP/设备是否异常
6. **HttpOnly Cookie**：防止 XSS 窃取
7. **行为风控**：异常访问模式自动冻结

### 5. state 参数的作用是什么？如何实现？

**作用**：防止 CSRF 攻击

**实现**：

```javascript
// 发起授权
const state = crypto.randomUUID();
sessionStorage.setItem("oauth_state", state);
window.location.href = `...&state=${state}`;

// 回调验证
const returnedState = new URLSearchParams(location.search).get("state");
if (returnedState !== sessionStorage.getItem("oauth_state")) {
  throw new Error("CSRF attack detected");
}
```

### 6. Refresh Token 为什么需要轮转（Rotation）？

**问题**：如果 refresh_token 长期有效且不变，被盗后可以持续刷新 access_token。

**轮转方案**：

```javascript
// 每次刷新返回新的 refresh_token
{
  access_token: 'NEW_ACCESS',
  refresh_token: 'NEW_REFRESH'  // 新的
}

// 旧的 refresh_token 立即失效
// 如果再次使用旧 token，撤销所有相关 token
```

**优势**：

- 限制 refresh_token 泄露的影响范围
- 检测到重复使用时，说明可能被盗，撤销所有 token

### 7. 如何实现单点登出（SLO）？

**答案要点**：

1. **黑名单机制**：token 加入 Redis 黑名单，全局失效
2. **前端广播**：localStorage + storage 事件（同域）
3. **后端通知**：认证中心主动通知所有应用
4. **Refresh Token 撤销**：撤销 refresh_token，无法刷新新 token

---
