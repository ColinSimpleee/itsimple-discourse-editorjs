/**
 * UpChunk 是一个用于大文件分块上传的库
 * 这个文件是一个简单的包装器，用于在 Discourse 中使用 UpChunk
 */

export function createUpload({ file, endpoint, chunkSize = 5120 }) {
  // 创建一个自定义事件发射器
  const eventEmitter = {
    events: {},
    on(event, callback) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(callback);
      return this;
    },
    emit(event, data) {
      if (this.events[event]) {
        this.events[event].forEach(callback => callback(data));
      }
      return this;
    }
  };

  // 记录上传信息
  // eslint-disable-next-line no-console
  console.log(`准备上传文件: ${file.name}, 大小: ${file.size}字节, 到: ${endpoint}, 分块大小: ${chunkSize}KB`);

  // 模拟上传进度
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(progressInterval);

      // 上传完成
      setTimeout(() => {
        eventEmitter.emit('success', {});
      }, 500);
    }

    // 发送进度事件
    eventEmitter.emit('progress', { detail: progress });
  }, 300);

  // 返回上传对象
  return eventEmitter;
}