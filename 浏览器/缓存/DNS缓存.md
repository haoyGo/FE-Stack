## DNS 缓存
DNS（Domain Name System，域名系统）

### DNS 解析
当用户在浏览器中输入网址的地址后，浏览器要做的第一件事就是解析 `DNS`：
1. 浏览器检查缓存中是否有域名对应的 IP，如果有就结束 DNS 解析过程。**浏览器中的 DNS 缓存**有时间和大小双重限制，时间一般为几分钟到几个小时不等。
   * 时长和浏览器有关
2. 如果浏览器缓存中没有对应的 IP 地址，浏览器会继续查找**操作系统缓存**中是否有域名对应的 DNS 解析结果。我们可以通过在操作系统中设置 `hosts` 文件来设置 IP 与域名的关系。
   * Windows系统默认开启DNS缓存服务，叫做 `DNSClient`，可以缓存一些常用的域名。
    * `ipconfig/displaydns` – 这个命令可以展示现在你电脑已经缓存的域名
    * `ipconfig/flushdns` –这条记录可以帮你马上清空已经缓存的记录
  * Linux 系统的 `nscd` 服务可以实现DNS缓存的功能。
3. 路由器缓存
4. 如果还没有拿到解析结果，操作系统就会把域名发送给**本地区的域名服务器（`LDNS`）**，`LDNS` 通常由**互联网服务提供商（`ISP`）提供**，比如电信或者联通。这个域名服务器一般在城市某个角落，并且性能较好，当拿到域名后，首先也是从缓存中查找，看是否有匹配的结果。一般来说，大多数的 DNS 解析到这里就结束了，所以 `LDNS/ISP DNS` 承担了大部分的域名解析工作。如果缓存中有 IP 地址，就直接返回，并且会被标记为**非权威服务器应答**。
5. 如果前面三步还没有命中 DNS 缓存，那只能到 **`Root Server` 域名服务器**中请求解析了。**根域名服务器**拿到请求后，首先判断域名是哪个顶级域名下的，比如 .com, .cn, .org 等，全球一共 13 台**顶级域名服务器**。根域名服务器返回对应的顶级域名服务器（`gTLD Server`）地址。
6. 本地域名服务器（`LDNS`）拿到地址后，向 `gTLD Server` 发送请求，`gTLD` 服务器查找并且返回此域名对应的 `Name Server` 域名服务器地址。这个 `Name Server` 通常就是用户注册的域名服务器，例如用户在某个**域名服务提供商**申请的域名，那么这个域名解析任务就由这个域名提供商的服务器来完成。
   * 这个过程的解析方式为**递归搜索**。比如：`https://movie.lz5z.com`，本地域名服务器首先向顶级域名服务器（`com 域`）发送请求，`com` 域名服务器将域名中的二级域 `lz5z` 的 IP 地址返回给 `LDNS`，`LDNS` 再向二级域名服务器发送请求进行查询，之后不断重复直到 `LDNS` 得到最终的查询结果。
7. `Name Server` 域名服务器会查询存储的域名和 IP 的映射关系表，在正常情况下都根据域名得到目标 IP 地址，连同一个 `TTL` 值返回给 `LDNS`。`LDNS` 会缓存这个域名和 IP 的对应关系，缓存时间由 `TTL` 值控制。`LDNS` 会把解析结果返回给用户，DNS 解析结束。

### 清除 DNS 缓存
* chrome: chrome://net-internals/#dns
* 本地 DNS
  * Windows: ipconfig/flushdns; 
  * Linux 和 mac 根据不同的版本有不同的方式

### 减少 DNS 解析
* 通过 `meta` 信息告诉浏览器，页面需要做 DNS 预解析。
  `<meta http-equiv="x-dns-prefetch-control" content="on" />`
* 通过 `link` 标签强制 DNS 预解析
  `<link rel="dns-prefetch" href="https://lz5z.com" />`
* 域名发散
  PC 端因为浏览器有域名并发请求限制（chrome 为 6 个），也就是同一时间，浏览器最多向同一个域名发送 6 个请求，因此 PC 端使用域名发散策略，将**http静态资源**放入多个域名/子域名中，以保证资源更快加载。常见的办法为使用 `cdn`。
* 域名收敛
  将**静态资源**放在同一个域名下，减少 DNS 解析的开销。域名收敛是移动互联网时代的产物，在 `LDNS` 没有缓存的情况下，DNS 解析占据一个请求的大多数时间，因此，采用尽可能少的域名对整个页面加载速度有显著的提高。
* HttpDNS / DNS-over-HTTPS
  DNS 请求使用的是 `UDP` 协议，虽然没有 `TCP` 三次握手的开销，但是可能导致弱网环境下（2G，3G）数据丢失的问题。
  为了应对以上两个问题，`HttpDNS` 应运而生，原理也非常简单，将 DNS 这种容易被劫持的协议，转而使用 `HTTP` 协议请求 `Domain` 与 `IP` 地址之间的映射。获得正确的 IP 地址后，就不用担心 `ISP` 篡改数据了。