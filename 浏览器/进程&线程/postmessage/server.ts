/**
 * bits 原子服务通信
 */

import { createRequest } from "@services/custom-request";

const apiPrefix = "bits_post_message_prefix_";
const bitsOrigin = "https://bits.bytedance.net";

export const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
};

export const uploadFn = async (base64: string) => {
  try {
    const formData = new FormData();
    formData.append("file", base64ToFile(base64, "uploadImage"));
    const uploadRes = await createRequest({
      url: "/ark/api/game/creator_ops/file/inner_upload/",
      method: "post",
      params: formData,
      headers: {
        "Content-Type": "multipart/form-data",
        "x-appid": 3000,
        "x-sub-web-id": 1038,
      },
      config: {
        isOrigin: true,
      },
    });
    const { domain_group, bucket, uri } = uploadRes;
    return `${domain_group[0]}/obj/${bucket}/${uri}`;
  } catch (err) {
    console.log(err);
  }
};

const EventMap: Record<
  string,
  ((...arg: any) => any) | ((...arg: any) => Promise<any>)
> = {
  upload: uploadFn,
  // test: async () => "hahahaha2222",
};

interface GetMessage {
  api: string;
  data: any;
}

export const getMessage = (event: MessageEvent) => {
  if (event.origin !== bitsOrigin) return;
  console.log("getMessage outout>>>", event);

  const message: GetMessage = event.data;

  if (message?.api?.startsWith(apiPrefix)) {
    const api = message.api.replace(apiPrefix, "");
    if (EventMap[api]) {
      EventMap[api](message.data).then((res: any) => {
        console.log("getMessage res>>>", res);
        event.source?.postMessage(
          { api: "parent_" + message.api, data: res },
          event.origin as any
        );
      });
    }
  }
};
