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

# Editor.js整合
after_initialize do
  # 添加站点设置
  SiteSetting.class_eval do
    attr_accessor :editorjs_mux_token_id, :editorjs_mux_token_secret, :editorjs_mux_webhook_secret
    attr_accessor :editorjs_enable_mp4_download
  end

  # 加载模型和服务
  load File.expand_path('../app/models/editorjs_video.rb', __FILE__)
  load File.expand_path('../lib/editorjs/mux_api.rb', __FILE__)
  load File.expand_path('../app/controllers/editorjs/videos_controller.rb', __FILE__)

  # 添加路由
  Discourse::Application.routes.append do
    namespace :editorjs do
      post "videos/upload" => "videos#create_upload"
      get "videos/:video_id/status" => "videos#video_status"
      post "videos/webhook" => "videos#webhook"
    end
  end
  
  # 添加权限检查
  add_to_class(:guardian, :can_upload_video?) do
    return true if @user.admin || @user.moderator
    @user.trust_level >= SiteSetting.editorjs_min_trust_level
  end
  
  # 检查 DiscourseVideo 插件是否已加载，但不重复挂载路由
  if defined?(DiscourseVideo)
    Rails.logger.info("DiscourseVideo 插件已加载，EditorJS 将使用其 API")
  else
    Rails.logger.warn("DiscourseVideo 插件未加载，EditorJS 的视频功能已自行实现")
  end
end 