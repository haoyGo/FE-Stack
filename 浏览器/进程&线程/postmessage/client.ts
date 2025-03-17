/**
 * postMessage promise
 */
export interface SendMessage {
  api: string;
  data: any;
  origin?: string;
}

interface GetMessage {
  api: string;
  data: any;
}

const PostMessageCallBackMap = new Map();

const apiPrefix = "bits_post_message_prefix_";
const arkOrigin = "https://ark-operation.bytedance.net";

export const getMessage = (event: MessageEvent) => {
  try {
    if (event.origin !== arkOrigin) return;

    const message: GetMessage = event.data;

    if (message?.api?.startsWith("parent_" + apiPrefix)) {
      // alert('messagemessage>>>>' + JSON.stringify(message))
      const api = message.api.replace("parent_", "");

      if (PostMessageCallBackMap.has(api)) {
        PostMessageCallBackMap.get(api)(message.data);
        PostMessageCallBackMap.delete(api);
      }
    }
  } catch (e: any) {
    // alert('errorerrorerror>>>>' + e.message)
  }
};

// 发送
export const sendMessage = (message: SendMessage): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (window.parent) {
      const api = apiPrefix + message.api;
      window.parent.postMessage(
        { ...message, api },
        message.origin || arkOrigin
      );
      // 将当前的 resolve 添加到 Map 中，等待返回事件触发
      PostMessageCallBackMap.set(api, resolve);
    }
  });
};

// use example
// const mmmmm = await sendMessage({
//   api: 'test',
//   origin: arkOrigin,
//   data: {
//     test: 'blabla',
//   },
// })
