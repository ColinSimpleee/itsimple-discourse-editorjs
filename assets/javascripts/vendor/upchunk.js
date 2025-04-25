/**
 * UpChunk 是一个用于大文件分块上传的库
 * 这个文件是一个简单的包装器，用于在 Discourse 中使用 UpChunk
 */

/**
 * UpChunk实现
 * 用于分块上传大文件到Mux
 */
export function createUpload({ file, endpoint, chunkSize = 5120 }) {
  // 计算分块大小 (5MB)
  const CHUNK_SIZE = chunkSize * 1024;
  
  // 创建事件发射器
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
        this.events[event].forEach(callback => callback({ detail: data }));
      }
      return this;
    }
  };

  // 初始化上传
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  let currentChunk = 0;
  let aborted = false;

  // 添加取消方法
  eventEmitter.abort = () => {
    aborted = true;
  };

  // 上传下一个分块
  const uploadNextChunk = async () => {
    if (aborted) {
      return;
    }

    if (currentChunk >= totalChunks) {
      eventEmitter.emit('success', 100);
      return;
    }

    const start = currentChunk * CHUNK_SIZE;
    const end = Math.min(file.size, start + CHUNK_SIZE);
    const chunk = file.slice(start, end);

    try {
      // 准备请求头
      const headers = {
        'Content-Type': 'application/octet-stream',
        'Content-Range': `bytes ${start}-${end - 1}/${file.size}`
      };

      // 发送分块
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers,
        body: chunk
      });

      if (!response.ok) {
        throw new Error(`上传失败: ${response.status} ${response.statusText}`);
      }

      // 更新进度
      currentChunk++;
      const progress = Math.min(100, Math.round((currentChunk / totalChunks) * 100));
      eventEmitter.emit('progress', progress);

      // 上传下一个分块
      uploadNextChunk();

    } catch (error) {
      eventEmitter.emit('error', { message: error.message, detail: error });
    }
  };

  // 开始上传
  uploadNextChunk();

  return eventEmitter;
}