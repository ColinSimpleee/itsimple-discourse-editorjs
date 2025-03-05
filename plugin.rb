# name: discourse-editorjs
# about: 将Discourse默认编辑器替换为EditorJS
# version: 0.1.0
# authors: Your Name
# url: https://github.com/yourusername/discourse-editorjs

register_asset 'stylesheets/editorjs.scss'

# 添加授权
register_svg_icon "fab-js-square" if respond_to?(:register_svg_icon)

# 确保在开发模式下正确重新加载插件
if Rails.env.development?
  Dir.glob(File.join(File.dirname(__FILE__), "assets", "javascripts", "**/*.js.es6")).each do |f|
    name = File.basename(f, ".js.es6")
    register_asset "javascripts/#{name}"
  end
end 