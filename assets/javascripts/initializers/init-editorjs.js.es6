import { withPluginApi } from "discourse/lib/plugin-api";
import loadScript from "discourse/lib/load-script";
import I18n from "I18n";
import { ajax } from "discourse/lib/ajax";
import VideoTool from "../lib/video-tool";
import PollTool from "../lib/poll-tool";

// Debug helper functions
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
      // Load EditorJS library and its plugins
      const loadEditorJs = async () => {
        try {
          // First load the main library
          log("Loading EditorJS main library");
          await loadScript("https://cdn.jsdelivr.net/npm/@editorjs/editorjs@2.30.8");

          // Then load all tools with specified versions
          log("Loading EditorJS tools");
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
            loadScript("https://cdn.jsdelivr.net/npm/@editorjs/embed@2.5.3"),
            loadScript("https://cdn.jsdelivr.net/npm/editorjs-drag-drop@1.1.13/dist/bundle.min.js"),
            loadScript("https://cdn.jsdelivr.net/npm/editorjs-text-color-plugin@2.0.4/dist/bundle.js")
          ]);

          log("EditorJS and all tools loaded successfully");
          return true;
        } catch (error) {
          error("Failed to load EditorJS:", error);
          return false;
        }
      };

      // Immediately start loading EditorJS
      loadEditorJs();

      // Overwrite editor component
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
          // If EditorJS is not loaded yet, try again later
          if (typeof window.EditorJS === "undefined") {
            log("Waiting for EditorJS to load...");
            setTimeout(() => this._initEditorJS(), 200);
            return;
          }

          // Validate that necessary tool classes are loaded
          if (!window.Paragraph) {
            log("Waiting for Paragraph tool to load...");
            setTimeout(() => this._initEditorJS(), 200);
            return;
          }

          if (!window.Header) {
            log("Waiting for Header tool to load...");
            setTimeout(() => this._initEditorJS(), 200);
            return;
          }

          // Create EditorJS instance
          const editorContainer = document.createElement("div");
          editorContainer.id = `editorjs-container-${this.elementId}`;
          editorContainer.className = "editorjs-container";

          // Hide original editor
          const originalEditor = this.element.querySelector(".d-editor-input");
          if (!originalEditor) {
            error("Original editor not found");
            return;
          }

          originalEditor.style.display = "none";

          // Hide native toolbar
          const originalToolbar = this.element.querySelector(".d-editor-button-bar");
          if (originalToolbar) {
            originalToolbar.style.display = "none";
            log("Native toolbar hidden");
          } else {
            error("Native toolbar not found");
          }

          originalEditor.insertAdjacentElement("afterend", editorContainer);

          try {
            log("Starting EditorJS initialization");

            // Get upload manager
            const uploadManager = this.uploadManager || container.lookup("service:upload-manager");
            const store = container.lookup("service:store");
            if (!uploadManager) {
              error("Upload manager service not available");
            }

            // Define available tools
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
                      log("Starting image upload:", file.name, "size:", Math.round(file.size/1024), "KB");

                      // Implement Discourse upload
                      return new Promise((resolve, reject) => {
                        try {
                          if (uploadManager) {
                            // Use upload manager
                            log("Using upload manager service");
                            const upload = uploadManager.createUpload(store, {
                              file,
                              type: "composer"
                            });

                            upload.start().then(response => {
                              log("Upload manager upload success:", response);
                              let imageUrl = response.url;
                              if (imageUrl.startsWith('//')) {
                                imageUrl = window.location.protocol + imageUrl;
                              }
                              log("Generated image URL:", imageUrl);

                              // Fix loading state issues - ensure complete success object structure
                              resolve({
                                success: 1,
                                file: {
                                  url: imageUrl,
                                  // Add width and height information
                                  width: response.width || 0,
                                  height: response.height || 0,
                                  // Add extension information
                                  extension: response.extension || "",
                                  name: response.original_filename || file.name,
                                  size: response.filesize || file.size
                                }
                              });

                              // Manually handle loading state
                              setTimeout(() => {
                                try {
                                  // Try to find and hide all loading state elements
                                  const preloaders = document.querySelectorAll('.image-tool__image-preloader');
                                  if (preloaders && preloaders.length > 0) {
                                    log("Found", preloaders.length, "preloader elements, attempting to hide");
                                    preloaders.forEach(el => {
                                      el.style.display = 'none';
                                      el.classList.add('image-tool__image-preloader--hidden');
                                      // Try to find parent element and add loaded class
                                      const parent = el.closest('.image-tool');
                                      if (parent) {
                                        parent.classList.add('image-tool--loaded');
                                      }
                                    });
                                  }
                                } catch (e) {
                                  error("Failed to manually hide loading state:", e);
                                }
                              }, 500);
                            }).catch(err => {
                              error("Upload manager upload failed:", err);
                              reject(err);
                            });
                          } else {
                            // Fallback: Use AJAX upload directly
                            log("Upload manager unavailable, using AJAX upload");
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
                              log("API response:", response);
                              // Response data might directly be the upload object, no need for .url check
                              if (response) {
                                // Handle relative URLs, ensure protocol prefix
                                let imageUrl = response.url || "";
                                if (imageUrl.startsWith('//')) {
                                  imageUrl = window.location.protocol + imageUrl;
                                }
                                log("Generated image URL:", imageUrl);

                                // Provide complete image data structure
                                resolve({
                                  success: 1,
                                  file: {
                                    url: imageUrl,
                                    // Add width and height information
                                    width: response.width || 0,
                                    height: response.height || 0,
                                    // Add extension information
                                    extension: response.extension || "",
                                    name: response.original_filename || file.name,
                                    size: response.filesize || file.size
                                  }
                                });

                                // Manually handle loading state
                                setTimeout(() => {
                                  try {
                                    // Try to find and hide all loading state elements
                                    const preloaders = document.querySelectorAll('.image-tool__image-preloader');
                                    if (preloaders && preloaders.length > 0) {
                                      log("Found", preloaders.length, "preloader elements, attempting to hide");
                                      preloaders.forEach(el => {
                                        el.style.display = 'none';
                                        el.classList.add('image-tool__image-preloader--hidden');
                                        // Try to find parent element and add loaded class
                                        const parent = el.closest('.image-tool');
                                        if (parent) {
                                          parent.classList.add('image-tool--loaded');
                                        }
                                      });
                                    }
                                  } catch (e) {
                                    error("Failed to manually hide loading state:", e);
                                  }
                                }, 500);
                              } else {
                                error("Invalid API response data:", response);
                                reject(new Error("Invalid upload response data"));
                              }
                            })
                            .catch(err => {
                              error("AJAX upload failed:", err);
                              reject(err);
                            });
                          }
                        } catch (err) {
                          error("Exception during upload process:", err);
                          reject(err);
                        }
                      });
                    }
                  },
                  captionPlaceholder: I18n.t('discourse_editorjs.image_caption_placeholder', { defaultValue: 'Image caption' })
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
              // Add video tool
              video: {
                class: VideoTool,
                inlineToolbar: true
              },
              // Add text color tool
              Color: window.ColorPlugin && {
                class: window.ColorPlugin,
                config: {
                  colorCollections: ['#EC7878','#9C27B0','#673AB7','#3F51B5','#0070FF','#03A9F4','#00BCD4','#4CAF50','#8BC34A','#CDDC39', '#FFF'],
                  defaultColor: '#FF1300',
                  type: 'text',
                  customPicker: true
                }
              },
              // Add text background color tool
              Marker: window.ColorPlugin && {
                class: window.ColorPlugin,
                config: {
                  defaultColor: '#FFBF00',
                  type: 'marker'
                }
              },
              // Add poll tool
              poll: PollTool && {
                class: PollTool,
                inlineToolbar: true
              }
            };

            // Filter out valid tools
            const validTools = {};
            Object.keys(tools).forEach(toolName => {
              if (tools[toolName]) {
                validTools[toolName] = tools[toolName];
              }
            });

            log("Loaded valid tools:", Object.keys(validTools));

            // Initialize EditorJS
            this.editorJS = new window.EditorJS({
              holder: editorContainer.id,
              placeholder: I18n.t("composer.reply_placeholder"),
              autofocus: true,
              tools: validTools,
              onChange: () => {
                this._syncContent();
              },
              data: this._parseMarkdownToBlocks(this.value || ""),
              // Add DragDrop plugin configuration
              onReady: () => {
                // Check if DragDrop plugin loaded successfully
                if (window.DragDrop) {
                  log("Initializing DragDrop plugin");
                  new window.DragDrop(this.editorJS);
                } else {
                  error("DragDrop plugin failed to load");
                }
              }
            });

            // Add post-rendering processing for image blocks
            this.editorJS.isReady.then(() => {
              log("EditorJS ready, adding image load listeners");

              // Monitor image block additions
              document.addEventListener('DOMNodeInserted', function(e) {
                try {
                  // Check if a new image preloader is added
                  if (e.target && e.target.classList && e.target.classList.contains('image-tool__image-preloader')) {
                    log("New image preloader detected");

                    // Look for possibly already loaded images
                    const parent = e.target.closest('.image-tool');
                    if (parent) {
                      const image = parent.querySelector('.image-tool__image-picture');
                      if (image && image.complete) {
                        log("Image already loaded, hiding preloader");
                        e.target.style.display = 'none';
                        e.target.classList.add('image-tool__image-preloader--hidden');
                        parent.classList.add('image-tool--loaded');
                      } else if (image) {
                        // Add image load complete event
                        image.addEventListener('load', function() {
                          log("Image load event triggered, hiding preloader");
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
                  error("Error processing image load complete event:", err);
                }
              });
            }).catch(err => {
              error("EditorJS initialization ready failed:", err);
            });

            this.isEditorJSLoaded = true;
            log("EditorJS initialized successfully");
          } catch (err) {
            error("EditorJS initialization failed:", err);
            error("Error details:", err.stack);
            // If initialization fails, restore the original editor
            originalEditor.style.display = "";
          }
        },

        _syncContent() {
          if (!this.editorJS) return;

          this.editorJS.save().then(data => {
            // Convert EditorJS content to Markdown
            const markdown = this._convertToMarkdown(data);
            this.set("value", markdown);
          }).catch(err => {
            error("Failed to save EditorJS content:", err);
          });
        },

        _parseMarkdownToBlocks(markdown) {
          if (!markdown) return { blocks: [] };

          // Advanced Markdown to EditorJS Blocks conversion
          const blocks = [];

          // 预处理 - 首先提取所有完整的投票块
          const pollBlocks = [];
          const pollRegex = /\[poll.*?\][\s\S]*?\[\/poll\]/g;
          let pollMatch;
          let processedMarkdown = markdown;
          
          // 第一步：提取所有投票块
          while ((pollMatch = pollRegex.exec(markdown)) !== null) {
            const pollContent = pollMatch[0];
            const pollStart = pollMatch.index;
            const pollEnd = pollStart + pollContent.length;
            
            // 存储投票块及其位置信息
            pollBlocks.push({
              content: pollContent,
              start: pollStart,
              end: pollEnd
            });
            
            // 用占位符替换原始Markdown中的投票块，防止被其他解析器错误解析
            const placeholderBefore = processedMarkdown.substring(0, pollStart);
            const placeholderAfter = processedMarkdown.substring(pollEnd);
            const placeholderText = `[POLL_PLACEHOLDER_${pollBlocks.length - 1}]`;
            processedMarkdown = placeholderBefore + placeholderText + placeholderAfter;
            
            // 重置正则表达式的lastIndex，因为我们修改了源字符串
            pollRegex.lastIndex = pollStart + placeholderText.length;
          }
          
          // 第二步：解析占位符处理后的Markdown
          const paragraphs = processedMarkdown.split(/\n{2,}/);
          
          paragraphs.forEach(paragraph => {
            // 检查是否为投票占位符
            const placeholderMatch = paragraph.match(/\[POLL_PLACEHOLDER_(\d+)\]/);
            if (placeholderMatch) {
              const pollIndex = parseInt(placeholderMatch[1]);
              const pollData = pollBlocks[pollIndex];
              
              if (pollData) {
                // 处理找到的投票块
                const pollContent = pollData.content;
                const match = pollContent.match(/\[poll(.*?)\]([\s\S]*?)\[\/poll\]/);
                
                if (match) {
                  const pollAttributes = match[1].trim();
                  const pollContent = match[2].trim();
                  
                  // 解析投票属性
                  const nameMatch = pollAttributes.match(/name=["']?([^"'\s]+)["']?/);
                  const typeMatch = pollAttributes.match(/type=["']?([^"'\s]+)["']?/);
                  
                  // 创建投票块
                  const pollBlock = {
                    type: "poll",
                    data: {
                      pollName: nameMatch ? nameMatch[1] : `poll_${Math.floor(Math.random() * 1000)}`,
                      pollTitle: "",
                      pollType: typeMatch ? typeMatch[1] : "regular",
                      pollOptions: [],
                      pollOptionsWithImages: []
                    }
                  };
                  
                  // 处理投票内容
                  const lines = pollContent.split("\n");
                  for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    
                    // 标题检测
                    if (line.startsWith("# ")) {
                      pollBlock.data.pollTitle = line.substring(2);
                      continue;
                    }
                    
                    // 选项检测
                    if (line.startsWith("* ") || line.startsWith("- ")) {
                      const optionText = line.substring(2).trim();
                      
                      // 检查选项是否包含图片
                      const imageMatch = optionText.match(/!\[(.*?)\]\((.*?)\)/);
                      
                      if (imageMatch) {
                        // 选项包含图片
                        const imageAlt = imageMatch[1];
                        const imageUrl = imageMatch[2];
                        
                        // 提取图片前的文本
                        const textBeforeImage = optionText.substring(0, optionText.indexOf('!['));
                        
                        // 添加到选项数组
                        pollBlock.data.pollOptions.push(textBeforeImage.trim() || imageAlt);
                        pollBlock.data.pollOptionsWithImages.push({
                          text: textBeforeImage.trim(),
                          image: imageUrl
                        });
                      } else {
                        // 纯文本选项
                        pollBlock.data.pollOptions.push(optionText);
                        pollBlock.data.pollOptionsWithImages.push({
                          text: optionText,
                          image: ""
                        });
                      }
                    }
                  }
                  
                  blocks.push(pollBlock);
                  return; // 退出当前迭代
                }
              }
            } 
            // 如果不是投票占位符，继续解析其他类型的块
            else {
              const lines = paragraph.split("\n");
              const firstLine = lines[0].trim();

              // Identify headers
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
              // Identify unordered lists
              else if (lines.every(line => line.trim().startsWith("- "))) {
                blocks.push({
                  type: "list",
                  data: {
                    style: "unordered",
                    items: lines.map(line => line.trim().substring(2))
                  }
                });
              }
              // Identify ordered lists
              else if (lines.every(line => /^\d+\.\s/.test(line.trim()))) {
                blocks.push({
                  type: "list",
                  data: {
                    style: "ordered",
                    items: lines.map(line => line.trim().replace(/^\d+\.\s/, ""))
                  }
                });
              }
              // Identify quotes
              else if (lines.every(line => line.trim().startsWith("> "))) {
                blocks.push({
                  type: "quote",
                  data: {
                    text: lines.map(line => line.trim().substring(2)).join("\n"),
                    caption: ""
                  }
                });
              }
              // Identify code blocks
              else if (paragraph.startsWith("```") && paragraph.endsWith("```")) {
                const code = paragraph.substring(3, paragraph.length - 3).trim();
                blocks.push({
                  type: "code",
                  data: {
                    code: code
                  }
                });
              }
              // Identify separator
              else if (paragraph.trim() === "---") {
                blocks.push({
                  type: "delimiter",
                  data: {}
                });
              }
              // Identify embedded content (iframe)
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
              // Identify video blocks
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
              // Identify images
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
              // Identify links
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
              // Other content as regular paragraphs
              else if (paragraph.trim() !== "") {
                blocks.push({
                  type: "paragraph",
                  data: {
                    text: paragraph
                  }
                });
              }
            }
          });

          return { blocks };
        },

        _convertToMarkdown(data) {
          // Convert EditorJS content to Markdown
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
                  // Header
                  markdown += "| " + block.data.content[0].join(" | ") + " |\n";
                  // Separator
                  markdown += "| " + block.data.content[0].map(() => "---").join(" | ") + " |\n";
                  // Table content
                  for (let i = 1; i < block.data.content.length; i++) {
                    markdown += "| " + block.data.content[i].join(" | ") + " |\n";
                  }
                  markdown += "\n";
                }
                break;
              case "warning":
                markdown += "> **Warning:** " + block.data.title + "\n>\n> " + block.data.message + "\n\n";
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
              case "poll":
                // Build poll Markdown
                let pollMarkdown = "[poll";

                // Add poll name
                if (block.data.pollName) {
                  pollMarkdown += ` name="${block.data.pollName}"`;
                }

                // Add poll type
                if (block.data.pollType && block.data.pollType !== "regular") {
                  pollMarkdown += ` type=${block.data.pollType}`;
                }

                // 添加更多选项：结果和公开设置
                pollMarkdown += ` results=always public=true`;
                
                // 添加图表类型
                pollMarkdown += ` chartType=bar`;

                pollMarkdown += "]\n";

                // Add poll title
                if (block.data.pollTitle) {
                  pollMarkdown += `# ${block.data.pollTitle}\n`;
                }

                // Add poll options - 支持图片选项
                if (block.data.pollOptionsWithImages && block.data.pollOptionsWithImages.length > 0) {
                  // 新的含图片选项格式
                  block.data.pollOptionsWithImages.forEach(option => {
                    pollMarkdown += `* `;
                    
                    // 如果有文本，先添加文本
                    if (option.text && option.text.trim() !== '') {
                      pollMarkdown += `${option.text.trim()} `;
                    }
                    
                    // 如果有图片，添加图片markdown
                    if (option.image && option.image !== '') {
                      const imageName = option.text || "Poll Option";
                      pollMarkdown += `![${imageName}](${option.image})`;
                    }
                    
                    pollMarkdown += `\n`;
                  });
                } else if (block.data.pollOptions && block.data.pollOptions.length > 0) {
                  // 兼容旧格式
                  block.data.pollOptions.forEach(option => {
                    pollMarkdown += `* ${option}\n`;
                  });
                }

                pollMarkdown += "[/poll]\n\n";
                markdown += pollMarkdown;
                break;

              default:
                console.warn("Unknown block type:", block.type);
                if (block.data.text) {
                  markdown += block.data.text + "\n\n";
                }
            }
          });

          return markdown;
        }
      });
    });
  }
};