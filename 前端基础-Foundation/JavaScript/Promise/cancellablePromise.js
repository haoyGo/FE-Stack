function createCancellablePromise(fn) {
  let cancel;
  const promise = new Promise((resolve, reject) => {
    cancel = () => {
      reject(new Error('Promise cancelled'));
    };
    fn(resolve, reject);
  });
  
  return {
    promise,
    cancel
  };
}

// 使用示例
const temp = createCancellablePromise((resolve) => {
  setTimeout(() => {
    resolve();
  }, 1000);
});

temp.promise.then(() => {
  console.log('这里需要一秒后输出');
}).catch(e => {
  if (e.message === 'Promise cancelled') {
    console.log('Promise已被取消');
  }
});

// 调用cancel取消Promise
temp.cancel();