**1. 使用 `Promise` 实现每隔1秒输出1,2,3**
``` js
[...new Array(5).keys()].reduce(p => {
  return p.then(res => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log(res)
        resolve(res + 1)
      }, 1000)
    })
  })
}, Promise.resolve(1))
```

**2. 使用Promise实现红绿灯交替重复亮**
``` js
function red() {
    console.log('red');
}
function green() {
    console.log('green');
}
function yellow() {
    console.log('yellow');
}

// 解法
const light = function (cb, timer) {
  return new Promise(resolve => {
    setTimeout(() => {
      cb()
      resolve()
    }, timer)
  })
}

const step = function () {
  Promise.resolve().then(() => {
    return light(3000, red)
  }).then(() => {
    return light(2000, green)
  }).then(() => {
    return light(1000, yellow)
  }).then(() => {
    return step()
  })
}

step()
```

**3. 实现 `mergePromise` 函数**
实现mergePromise函数，把传进去的数组按顺序先后执行，并且把返回的数据先后放到数组data中。
``` js
const time = (timer) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, timer)
  })
}
const ajax1 = () => time(2000).then(() => {
  console.log(1);
  return 1
})
const ajax2 = () => time(1000).then(() => {
  console.log(2);
  return 2
})
const ajax3 = () => time(1000).then(() => {
  console.log(3);
  return 3
})

mergePromise([ajax1, ajax2, ajax3]).then(data => {
  console.log("done");
  console.log(data); // data 为 [1, 2, 3]
});

// 要求分别输出
// 1
// 2
// 3
// done
// [1, 2, 3]

// 解法
function mergePromise(pArr) {
  const resArr = []
  return pArr.reduce((p, v) => {
    return p.then(v).then((res) => {
      resArr.push(res)
      return resArr
    })
  }, Promise.resolve())
}
```

**4. 封装一个异步加载图片的方法**
``` js
function loadImg(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function() {
      console.log("一张图片加载完成");
      resolve(img);
    };
    img.onerror = function() {
    	reject(new Error('Could not load image at' + url));
    };
    img.src = url;
  });
}
```

**5. 限制异步操作的并发个数并尽可能快的完成全部**
``` js
function limitLoad(urls, handler, limit) {
  let sequence = [].concat(urls); // 复制urls
  // 这一步是为了初始化 promises 这个"容器"
  let promises = sequence.splice(0, limit).map((url, index) => {
    // 返回下标是为了知道数组中是哪一项最先完成
    return handler(url).then(() => index)
  });
  // 注意这里要将整个变量过程返回，这样得到的就是一个Promise，可以在外面链式调用
  return sequence
    .reduce((pCollect, url) => {
      return pCollect
        .then(() => {
          return Promise.race(promises); // 返回已经完成的下标
        })
        .then(fastestIndex => { // 获取到已经完成的下标
        	// 将"容器"内已经完成的那一项替换
          promises[fastestIndex] = handler(url).then(() => fastestIndex) // 要继续将这个下标返回，以便下一次变量
        })
        .catch(err => {
          console.error(err);
        });
    }, Promise.resolve()) // 初始化传入
    .then(() => { // 最后三个用.all来调用
      return Promise.all(promises);
    });
}
limitLoad(urls, loadImg, 3)
  .then(res => {
    console.log("图片全部加载完毕");
    console.log(res);
  })
  .catch(err => {
    console.error(err);
  });
```