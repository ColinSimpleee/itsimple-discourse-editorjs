# frozen_string_literal: true

# name: itsimple-discourse-editorjs
# about: Integrates EditorJS into Discourse
# version: 0.1
# authors: IT-SIMPLE
# url: https://github.com/IT-SIMPLE/itsimple-discourse-editorjs


register_asset "stylesheets/editorjs.scss"

# 添加授权
register_svg_icon "fab-js-square" if respond_to?(:register_svg_icon)

# 确保在开发模式下正确重新加载插件
if Rails.env.development?
  Dir.glob(File.join(File.dirname(__FILE__), "assets", "javascripts", "**/*.js.es6")).each do |f|
    name = File.basename(f, ".js.es6")
    register_asset "javascripts/#{name}"
  end
end

# 使用 discourse-video 插件的 API，但不重复挂载路由
after_initialize do
  # 检查 DiscourseVideo 插件是否已加载，但不重复挂载路由
  if defined?(DiscourseVideo)
    Rails.logger.info("DiscourseVideo 插件已加载，EditorJS 将使用其 API")
  else
    Rails.logger.warn("DiscourseVideo 插件未加载，EditorJS 的视频功能可能无法正常工作")
  end
end 