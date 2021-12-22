## koa
洋葱模型

中间件

### 创建服务
``` js
/**
 * Expose `Application` class.
 * Inherits from `Emitter.prototype`.
 */
class Application extends Emitter {
  /**
  *
  * @param {object} [options] Application options
  * @param {string} [options.env='development'] Environment
  * @param {string[]} [options.keys] Signed cookie keys
  * @param {boolean} [options.proxy] Trust proxy headers
  * @param {number} [options.subdomainOffset] Subdomain offset
  * @param {string} [options.proxyIpHeader] Proxy IP header, defaults to X-Forwarded-For
  * @param {number} [options.maxIpsCount] Max IPs read from proxy IP header, default to 0 (means infinity)
  *
  */
  constructor (options) {
    super()
    options = options || {}
    this.proxy = options.proxy || false
    this.subdomainOffset = options.subdomainOffset || 2
    this.proxyIpHeader = options.proxyIpHeader || 'X-Forwarded-For'
    this.maxIpsCount = options.maxIpsCount || 0
    this.env = options.env || process.env.NODE_ENV || 'development'
    if (options.keys) this.keys = options.keys
    this.middleware = []
    this.context = Object.create(context)
    this.request = Object.create(request)
    this.response = Object.create(response)
    // util.inspect.custom support for node 6+
    /* istanbul ignore else */
    if (util.inspect.custom) {
      this[util.inspect.custom] = this.inspect
    }
  }
}

listen (...args) {
  debug('listen')
  const server = http.createServer(this.callback())
  return server.listen(...args)
}

/**
 * Return a request handler callback
 * for node's native http server.
 *
 * @return {Function}
 * @api public
 */
callback () {
  // 中间件处理，洋葱模型实现
  const fn = compose(this.middleware)

  if (!this.listenerCount('error')) this.on('error', this.onerror)

  const handleRequest = (req, res) => {
    // 把 req、res 处理成 ctx，供中间件使用
    const ctx = this.createContext(req, res)
    return this.handleRequest(ctx, fn)
  }

  return handleRequest
}

/**
 * Initialize a new context.
 *
 * @api private
 */
createContext (req, res) {
  const context = Object.create(this.context)
  const request = context.request = Object.create(this.request)
  const response = context.response = Object.create(this.response)
  context.app = request.app = response.app = this
  context.req = request.req = response.req = req
  context.res = request.res = response.res = res
  request.ctx = response.ctx = context
  request.response = response
  response.request = request
  context.originalUrl = request.originalUrl = req.url
  context.state = {}
  return context
}

/**
 * Handle request in callback.
 *
 * @api private
 */
handleRequest (ctx, fnMiddleware) {
  const res = ctx.res
  res.statusCode = 404
  const onerror = err => ctx.onerror(err)
  const handleResponse = () => respond(ctx)
  onFinished(res, onerror)
  
  // ctx 传入中间件使用
  return fnMiddleware(ctx).then(handleResponse).catch(onerror)
}

/**
 * Response helper.
 */
function respond (ctx) {
  // allow bypassing koa
  if (ctx.respond === false) return

  if (!ctx.writable) return

  const res = ctx.res
  let body = ctx.body
  const code = ctx.status

  // ignore body
  if (statuses.empty[code]) {
    // strip headers
    ctx.body = null
    return res.end()
  }

  if (ctx.method === 'HEAD') {
    if (!res.headersSent && !ctx.response.has('Content-Length')) {
      const { length } = ctx.response
      if (Number.isInteger(length)) ctx.length = length
    }
    return res.end()
  }

  // status body
  if (body == null) {
    if (ctx.response._explicitNullBody) {
      ctx.response.remove('Content-Type')
      ctx.response.remove('Transfer-Encoding')
      ctx.length = 0
      return res.end()
    }
    if (ctx.req.httpVersionMajor >= 2) {
      body = String(code)
    } else {
      body = ctx.message || String(code)
    }
    if (!res.headersSent) {
      ctx.type = 'text'
      ctx.length = Buffer.byteLength(body)
    }
    return res.end(body)
  }

  // responses
  if (Buffer.isBuffer(body)) return res.end(body)
  if (typeof body === 'string') return res.end(body)
  if (body instanceof Stream) return body.pipe(res)

  // body: json
  body = JSON.stringify(body)
  if (!res.headersSent) {
    ctx.length = Buffer.byteLength(body)
  }
  res.end(body)
}
```

#### http.createServer
nodejs 内置方法，创建服务。传入一个函数，其传参为 req 和 res，后面处理成 ctx 后，会传入每个中间件，所以每个中间件都能拿到 req 和 res。
``` ts
/**
  * Returns a new instance of {@link Server}.
  *
  * The `requestListener` is a function which is automatically
  * added to the `'request'` event.
  * @since v0.1.13
  */
function createServer(requestListener?: RequestListener): Server;

type RequestListener = (req: IncomingMessage, res: ServerResponse) => void;
```

#### compose
``` js
/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */

function compose (middleware) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
  }

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    // last called middleware #
    let index = -1
    return dispatch(0)
    function dispatch (i) {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      let fn = middleware[i]
      if (i === middleware.length) fn = next
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)))
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
```