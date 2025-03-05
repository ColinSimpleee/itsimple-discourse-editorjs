import { withPluginApi } from "discourse/lib/plugin-api";
import loadScript from "discourse/lib/load-script";
import I18n from "I18n";
import { ajax } from "discourse/lib/ajax";
import DemoTool from "../lib/editorjs-demo-tool";
import VideoTool from "../lib/video-tool";

// 调试辅助函数
const DEBUG = true;
function log(...args) {
  if (DEBUG) console.log("[EditorJS]", ...args);
}

function error(...args) {
  console.error("[EditorJS ERROR]", ...args);
}

export default {
  name: "discourse-editorjs",
  initialize(container) {
    withPluginApi("0.8.31", api => {
      // 加载EditorJS库及其插件
      const loadEditorJs = async () => {
        try {
          // 首先加载主库
          log("开始加载 EditorJS 主库");
          await loadScript("https://cdn.jsdelivr.net/npm/@editorjs/editorjs@2.30.8");
          
          // 然后加载所有工具，指定版本
          log("加载 EditorJS 工具");
          await Promise.all([
            loadScript("https://cdn.jsdelivr.net/npm/@editorjs/paragraph@2.10.0"),
            loadScript("https://cdn.jsdelivr.net/npm/@editorjs/header@2.7.0"),
            loadScript("https://cdn.jsdelivr.net/npm/@editorjs/list@1.8.0"),
            loadScript("https://cdn.jsdelivr.net/npm/@editorjs/quote@2.5.0"),
            loadScript("https://cdn.jsdelivr.net/npm/@editorjs/code@2.8.0"),
            loadScript("https://cdn.jsdelivr.net/npm/@editorjs/image@2.8.1"),
            loadScript("https://cdn.jsdelivr.net/npm/@editorjs/delimiter@1.3.0"),
            loadScript("https://cdn.jsdelivr.net/npm/@editorjs/table@2.2.2"),
            loadScript("https://cdn.jsdelivr.net/npm/@editorjs/marker@1.3.0"),
            loadScript("https://cdn.jsdelivr.net/npm/@editorjs/warning@1.3.0"),
            loadScript("https://cdn.jsdelivr.net/npm/@editorjs/embed@2.5.3")
          ]);
          
          log("EditorJS 和所有工具已成功加载");
          return true;
        } catch (error) {
          error("加载 EditorJS 失败:", error);
          return false;
        }
      };
      
      // 立即开始加载 EditorJS
      loadEditorJs();
      
      // 重写编辑器组件
      api.modifyClass("component:d-editor", {
        editorJS: null,
        isEditorJSLoaded: false,
        
        didInsertElement() {
          this._super(...arguments);
          this._initEditorJS();
        },
        
        willDestroyElement() {
          this._super(...arguments);
          if (this.editorJS) {
            this.editorJS.destroy();
            this.editorJS = null;
          }
        },
        
        async _initEditorJS() {
          // 如果EditorJS还没加载完成，稍后再试
          if (typeof window.EditorJS === "undefined") {
            log("等待 EditorJS 加载...");
            setTimeout(() => this._initEditorJS(), 200);
            return;
          }
          
          // 验证必要的工具类是否加载
          if (!window.Paragraph) {
            log("等待 Paragraph 工具加载...");
            setTimeout(() => this._initEditorJS(), 200);
            return;
          }
          
          if (!window.Header) {
            log("等待 Header 工具加载...");
            setTimeout(() => this._initEditorJS(), 200);
            return;
          }
          
          // 创建EditorJS实例
          const editorContainer = document.createElement("div");
          editorContainer.id = `editorjs-container-${this.elementId}`;
          editorContainer.className = "editorjs-container";
          
          // 隐藏原来的编辑器
          const originalEditor = this.element.querySelector(".d-editor-input");
          if (!originalEditor) {
            error("找不到原始编辑器");
            return;
          }
          
          originalEditor.style.display = "none";
          
          // 隐藏原生工具栏
          const originalToolbar = this.element.querySelector(".d-editor-button-bar");
          if (originalToolbar) {
            originalToolbar.style.display = "none";
            log("已隐藏原生工具栏");
          } else {
            error("找不到原生工具栏");
          }
          
          originalEditor.insertAdjacentElement("afterend", editorContainer);
          
          try {
            log("开始初始化 EditorJS");
            
            // 获取上传管理器
            const uploadManager = this.uploadManager || container.lookup("service:upload-manager");
            const store = container.lookup("service:store");
            if (!uploadManager) {
              error("无法获取上传管理器服务");
            }
            
            // 定义可用工具
            const tools = {
              paragraph: window.Paragraph && {
                class: window.Paragraph,
                inlineToolbar: true
              },
              header: window.Header && {
                class: window.Header,
                inlineToolbar: true,
                config: {
                  levels: [1, 2, 3, 4]
                }
              },
              list: window.List && {
                class: window.List,
                inlineToolbar: true,
                config: {
                  defaultStyle: 'unordered'
                }
              },
              quote: window.Quote && {
                class: window.Quote,
                inlineToolbar: true
              },
              code: window.CodeTool && {
                class: window.CodeTool
              },
              image: window.ImageTool && {
                class: window.ImageTool,
                config: {
                  uploader: {
                    uploadByFile: (file) => {
                      log("开始上传图片:", file.name, "大小:", Math.round(file.size/1024), "KB");
                      
                      // 实现Discourse上传
                      return new Promise((resolve, reject) => {
                        try {
                          if (uploadManager) {
                            // 使用上传管理器
                            log("使用上传管理器服务");
                            const upload = uploadManager.createUpload(store, {
                              file,
                              type: "composer"
                            });
                            
                            upload.start().then(response => {
                              log("上传管理器上传成功:", response);
                              let imageUrl = response.url;
                              if (imageUrl.startsWith('//')) {
                                imageUrl = window.location.protocol + imageUrl;
                              }
                              log("生成的图片URL:", imageUrl);
                              
                              // 修复加载状态问题 - 确保完整的success对象结构
                              resolve({
                                success: 1,
                                file: {
                                  url: imageUrl,
                                  // 添加宽高信息
                                  width: response.width || 0,
                                  height: response.height || 0,
                                  // 添加扩展名信息
                                  extension: response.extension || "",
                                  name: response.original_filename || file.name,
                                  size: response.filesize || file.size
                                }
                              });
                              
                              // 手动处理加载状态
                              setTimeout(() => {
                                try {
                                  // 尝试找到并隐藏所有加载状态元素
                                  const preloaders = document.querySelectorAll('.image-tool__image-preloader');
                                  if (preloaders && preloaders.length > 0) {
                                    log("找到", preloaders.length, "个预加载器元素，尝试隐藏");
                                    preloaders.forEach(el => {
                                      el.style.display = 'none';
                                      el.classList.add('image-tool__image-preloader--hidden');
                                      // 尝试找到父元素并添加loaded类
                                      const parent = el.closest('.image-tool');
                                      if (parent) {
                                        parent.classList.add('image-tool--loaded');
                                      }
                                    });
                                  }
                                } catch (e) {
                                  error("尝试手动隐藏加载状态失败:", e);
                                }
                              }, 500);
                            }).catch(error => {
                              error("上传管理器上传失败:", error);
                              reject(error);
                            });
                          } else {
                            // 回退方案：直接使用AJAX上传
                            log("上传管理器不可用，使用AJAX上传");
                            const data = new FormData();
                            data.append("type", "composer");
                            data.append("files[]", file);
                            
                            ajax("/uploads.json", {
                              type: "POST",
                              data,
                              processData: false,
                              contentType: false
                            })
                            .then(response => {
                              log("API返回:", response);
                              // 响应数据可能直接是上传对象，不需要.url检查
                              if (response) {
                                // 处理相对URL，确保有协议前缀
                                let imageUrl = response.url || "";
                                if (imageUrl.startsWith('//')) {
                                  imageUrl = window.location.protocol + imageUrl;
                                }
                                log("生成的图片URL:", imageUrl);

                                // 提供完整的图片数据结构
                                resolve({
                                  success: 1,
                                  file: {
                                    url: imageUrl,
                                    // 添加宽高信息
                                    width: response.width || 0,
                                    height: response.height || 0,
                                    // 添加扩展名信息
                                    extension: response.extension || "",
                                    name: response.original_filename || file.name,
                                    size: response.filesize || file.size
                                  }
                                });
                                
                                // 手动处理加载状态
                                setTimeout(() => {
                                  try {
                                    // 尝试找到并隐藏所有加载状态元素
                                    const preloaders = document.querySelectorAll('.image-tool__image-preloader');
                                    if (preloaders && preloaders.length > 0) {
                                      log("找到", preloaders.length, "个预加载器元素，尝试隐藏");
                                      preloaders.forEach(el => {
                                        el.style.display = 'none';
                                        el.classList.add('image-tool__image-preloader--hidden');
                                        // 尝试找到父元素并添加loaded类
                                        const parent = el.closest('.image-tool');
                                        if (parent) {
                                          parent.classList.add('image-tool--loaded');
                                        }
                                      });
                                    }
                                  } catch (e) {
                                    error("尝试手动隐藏加载状态失败:", e);
                                  }
                                }, 500);
                              } else {
                                error("API返回数据无效:", response);
                                reject(new Error("上传返回数据无效"));
                              }
                            })
                            .catch(error => {
                              error("AJAX上传失败:", error);
                              reject(error);
                            });
                          }
                        } catch (error) {
                          error("上传过程中出现异常:", error);
                          reject(error);
                        }
                      });
                    }
                  },
                  captionPlaceholder: I18n.t('discourse_editorjs.image_caption_placeholder', { defaultValue: '图片说明' })
                }
              },
              // delimiter: window.Delimiter && {
              //   class: window.Delimiter
              // },
              table: window.Table && {
                class: window.Table,
                inlineToolbar: true
              },
              marker: window.Marker && {
                class: window.Marker,
                shortcut: 'CMD+SHIFT+M'
              },
              // warning: window.Warning && {
              //   class: window.Warning,
              //   inlineToolbar: true
              // },
              embed: window.Embed && {
                class: window.Embed,
                inlineToolbar: true,
                config: {
                  services: {
                    youtube: true,
                    coub: true,
                    codepen: true,
                    imgur: true,
                    gfycat: true,
                    vimeo: true,
                    twitter: true,
                    instagram: true,
                    twitch: true,
                    miro: true,
                    figma: true
                  }
                }
              },
              // 添加视频工具
              video: {
                class: VideoTool,
                inlineToolbar: true
              },
              // 添加自定义 Demo 工具
              demo: {
                class: DemoTool,
                inlineToolbar: false
              }
            };
            
            // 过滤出有效的工具
            const validTools = {};
            Object.keys(tools).forEach(toolName => {
              if (tools[toolName]) {
                validTools[toolName] = tools[toolName];
              }
            });
            
            log("加载的有效工具:", Object.keys(validTools));
            
            // 初始化EditorJS
            this.editorJS = new window.EditorJS({
              holder: editorContainer.id,
              placeholder: I18n.t("composer.reply_placeholder"),
              autofocus: true,
              tools: validTools,
              onChange: () => {
                this._syncContent();
              },
              data: this._parseMarkdownToBlocks(this.value || "")
            });
            
            // 添加图片块渲染后处理
            this.editorJS.isReady.then(() => {
              log("EditorJS 准备就绪，添加图片加载监听");
              
              // 监听图片块添加
              document.addEventListener('DOMNodeInserted', function(e) {
                try {
                  // 检查是否有新的图片预加载器添加
                  if (e.target && e.target.classList && e.target.classList.contains('image-tool__image-preloader')) {
                    log("检测到新的图片预加载器添加");
                    
                    // 查找可能已加载完成的图片
                    const parent = e.target.closest('.image-tool');
                    if (parent) {
                      const image = parent.querySelector('.image-tool__image-picture');
                      if (image && image.complete) {
                        log("图片已加载完成，隐藏预加载器");
                        e.target.style.display = 'none';
                        e.target.classList.add('image-tool__image-preloader--hidden');
                        parent.classList.add('image-tool--loaded');
                      } else if (image) {
                        // 添加图片加载完成事件
                        image.addEventListener('load', function() {
                          log("图片加载完成事件触发，隐藏预加载器");
                          const preloader = parent.querySelector('.image-tool__image-preloader');
                          if (preloader) {
                            preloader.style.display = 'none';
                            preloader.classList.add('image-tool__image-preloader--hidden');
                            parent.classList.add('image-tool--loaded');
                          }
                        });
                      }
                    }
                  }
                } catch (err) {
                  error("处理图片加载完成事件出错:", err);
                }
              });
            }).catch(err => {
              error("EditorJS 初始化就绪失败:", err);
            });
            
            this.isEditorJSLoaded = true;
            log("EditorJS 初始化成功");
          } catch (error) {
            error("初始化 EditorJS 失败:", error);
            error("错误详情:", error.stack);
            // 如果初始化失败，恢复原来的编辑器
            originalEditor.style.display = "";
          }
        },
        
        _syncContent() {
          if (!this.editorJS) return;
          
          this.editorJS.save().then(data => {
            // 将EditorJS内容转换为Markdown
            const markdown = this._convertToMarkdown(data);
            this.set("value", markdown);
          }).catch(error => {
            error("保存 EditorJS 内容失败:", error);
          });
        },
        
        _parseMarkdownToBlocks(markdown) {
          if (!markdown) return { blocks: [] };
          
          // 更高级的Markdown到EditorJS Blocks的转换
          const blocks = [];
          
          // 分割文本为段落
          const paragraphs = markdown.split(/\n{2,}/);
          
          paragraphs.forEach(paragraph => {
            const lines = paragraph.split("\n");
            const firstLine = lines[0].trim();
            
            // 识别标题
            if (firstLine.startsWith("# ")) {
              blocks.push({
                type: "header",
                data: {
                  text: firstLine.substring(2),
                  level: 1
                }
              });
            } else if (firstLine.startsWith("## ")) {
              blocks.push({
                type: "header",
                data: {
                  text: firstLine.substring(3),
                  level: 2
                }
              });
            } else if (firstLine.startsWith("### ")) {
              blocks.push({
                type: "header",
                data: {
                  text: firstLine.substring(4),
                  level: 3
                }
              });
            } else if (firstLine.startsWith("#### ")) {
              blocks.push({
                type: "header",
                data: {
                  text: firstLine.substring(5),
                  level: 4
                }
              });
            } 
            // 识别无序列表
            else if (lines.every(line => line.trim().startsWith("- "))) {
              blocks.push({
                type: "list",
                data: {
                  style: "unordered",
                  items: lines.map(line => line.trim().substring(2))
                }
              });
            }
            // 识别有序列表
            else if (lines.every(line => /^\d+\.\s/.test(line.trim()))) {
              blocks.push({
                type: "list",
                data: {
                  style: "ordered",
                  items: lines.map(line => line.trim().replace(/^\d+\.\s/, ""))
                }
              });
            }
            // 识别引用
            else if (lines.every(line => line.trim().startsWith("> "))) {
              blocks.push({
                type: "quote",
                data: {
                  text: lines.map(line => line.trim().substring(2)).join("\n"),
                  caption: ""
                }
              });
            }
            // 识别代码块
            else if (paragraph.startsWith("```") && paragraph.endsWith("```")) {
              const code = paragraph.substring(3, paragraph.length - 3).trim();
              blocks.push({
                type: "code",
                data: {
                  code: code
                }
              });
            }
            // 识别分隔线
            else if (paragraph.trim() === "---") {
              blocks.push({
                type: "delimiter",
                data: {}
              });
            }
            // 识别嵌入内容 (iframe)
            else if (/<iframe.*?src="(.*?)".*?><\/iframe>/.test(paragraph)) {
              const match = paragraph.match(/<iframe.*?src="(.*?)".*?><\/iframe>/);
              if (match) {
                const captionMatch = paragraph.match(/<iframe.*?><\/iframe>\s*\*(.*?)\*/);
                blocks.push({
                  type: "embed",
                  data: {
                    service: "custom",
                    source: match[1],
                    embed: match[1],
                    width: 600,
                    height: 400,
                    caption: captionMatch ? captionMatch[1] : ""
                  }
                });
              }
            }
            // 识别图片
            else if (/!\[.*?\]\(.*?\)/.test(paragraph)) {
              const match = paragraph.match(/!\[(.*?)\]\((.*?)\)/);
              if (match) {
                blocks.push({
                  type: "image",
                  data: {
                    file: {
                      url: match[2]
                    },
                    caption: match[1] || ""
                  }
                });
              }
            }
            // 识别链接
            else if (/\[.*?\]\(.*?\)/.test(paragraph) && !/!\[.*?\]\(.*?\)/.test(paragraph)) {
              const match = paragraph.match(/\[(.*?)\]\((.*?)\)/);
              if (match) {
                blocks.push({
                  type: "paragraph",
                  data: {
                    text: `<a href="${match[2]}">${match[1]}</a>`
                  }
                });
              }
            }
            // 识别 Demo 块
            else if (paragraph.trim().startsWith("[demo]")) {
              blocks.push({
                type: "demo",
                data: {
                  message: "Hello World"
                }
              });
            }
            // 识别视频块
            else if (paragraph.trim().startsWith("[video]")) {
              blocks.push({
                type: "video",
                data: {
                  videoId: "",
                  playbackId: "",
                  thumbnailUrl: "",
                  duration: 0
                }
              });
            }
            // 其他内容视为普通段落
            else if (paragraph.trim() !== "") {
              blocks.push({
                type: "paragraph",
                data: {
                  text: paragraph
                }
              });
            }
          });
          
          return { blocks };
        },
        
        _convertToMarkdown(data) {
          // 将EditorJS内容转换为Markdown
          let markdown = "";
          
          if (!data || !data.blocks) return markdown;
          
          data.blocks.forEach(block => {
            switch (block.type) {
              case "header":
                markdown += "#".repeat(block.data.level) + " " + block.data.text + "\n\n";
                break;
              case "paragraph":
                markdown += block.data.text + "\n\n";
                break;
              case "list":
                block.data.items.forEach(item => {
                  const prefix = block.data.style === "ordered" ? "1. " : "- ";
                  markdown += prefix + item + "\n";
                });
                markdown += "\n";
                break;
              case "quote":
                markdown += "> " + block.data.text.split("\n").join("\n> ") + "\n\n";
                break;
              case "code":
                markdown += "```\n" + block.data.code + "\n```\n\n";
                break;
              case "image":
                const caption = block.data.caption || "Image";
                markdown += "![" + caption + "](" + block.data.file.url + ")\n\n";
                break;
              case "delimiter":
                markdown += "---\n\n";
                break;
              case "table":
                if (block.data.content) {
                  // 表头
                  markdown += "| " + block.data.content[0].join(" | ") + " |\n";
                  // 分隔线
                  markdown += "| " + block.data.content[0].map(() => "---").join(" | ") + " |\n";
                  // 表内容
                  for (let i = 1; i < block.data.content.length; i++) {
                    markdown += "| " + block.data.content[i].join(" | ") + " |\n";
                  }
                  markdown += "\n";
                }
                break;
              case "warning":
                markdown += "> **警告：** " + block.data.title + "\n>\n> " + block.data.message + "\n\n";
                break;
              case "embed":
                markdown += `${block.data.embed}\n\n`;
                if (block.data.caption) {
                  markdown += `*${block.data.caption}*\n\n`;
                }
                break;
              case "video":
                markdown += `[video]\n\n`;
                break;
              case "demo":
                markdown += `[demo]\n\n`;
                break;
              default:
                console.warn("未知的块类型:", block.type);
                if (block.data.text) {
                  markdown += block.data.text + "\n\n";
                }
            }
          });

          console.log(markdown);
          
          return markdown;
        }
      });
    });
  }
};