# EditorJS for Discourse

这个插件将现代块编辑器 [EditorJS](https://editorjs.io/) 集成到 Discourse 平台。

## 功能

- 使用直观的块编辑器替代默认的Markdown编辑器
- 支持所有基本块类型：段落、标题、列表、引用、代码块等
- 完整支持图片上传与显示
- 集成视频上传与显示功能
- 支持Discourse原生投票功能
- 自动将EditorJS内容转换为Discourse兼容的Markdown格式

## 投票功能

本插件支持Discourse的原生投票功能，允许用户通过可视化界面创建投票：

1. 点击编辑器工具栏中的"Poll"按钮
2. 填写投票标题（可选）
3. 选择投票类型（单选、多选或数字评分）
4. 添加投票选项
5. 完成后，投票将以Discourse兼容的`[poll]`标签格式保存

投票示例：

```
[poll name="favorite_color" type=multiple]
# 你最喜欢的颜色是什么？
* 红色
* 蓝色
* 绿色
* 黄色
[/poll]
```

## 安装

1. 按照[官方指南](https://meta.discourse.org/t/install-plugins-in-discourse/19157)安装插件。
2. 添加此行到你的容器的`app.yml`文件的plugin部分：

```yaml
- git clone https://github.com/yourusername/discourse-editorjs.git
```

3. 重建你的Discourse容器：

```
./launcher rebuild app
```

## 配置

目前无需特殊配置，插件安装后会自动替换默认编辑器。

## 开发

欢迎贡献代码和提出改进建议！

## 许可

MIT 