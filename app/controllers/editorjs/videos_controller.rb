module Editorjs
  class VideosController < ::ApplicationController
    requires_login
    skip_before_action :verify_authenticity_token, only: [:webhook]
    
    def create_upload
      # 检查用户权限
      return render json: { error: "权限不足" }, status: 403 unless guardian.can_upload_video?
      
      begin
        # 创建直接上传
        result = Editorjs::MuxApi.create_direct_upload
        
        video = EditorjsVideo.new(
          user_id: current_user.id,
          video_id: result["data"]["id"],
          state: "waiting"
        )
        
        video.save!
        
        render json: {
          url: result["data"]["url"],
          video_id: video.video_id
        }
      rescue => e
        Rails.logger.error("Mux上传创建失败: #{e.message}")
        render json: { error: "上传初始化失败" }, status: 500
      end
    end
    
    def video_status
      video_id = params.require(:video_id)
      video = EditorjsVideo.find_by(video_id: video_id)
      
      if !video
        return render json: { error: "视频不存在" }, status: 404
      end
      
      response_data = {
        state: video.state
      }
      
      if video.state == "ready"
        response_data.merge!({
          playback_id: video.playback_id,
          thumbnail_url: video.thumbnail_url,
          duration: video.duration
        })
      end
      
      render json: response_data
    end
    
    def webhook
      # 验证webhook签名
      unless verified_webhook_request?
        return render json: { error: "无效的签名" }, status: 403
      end
      
      # 处理webhook数据
      data = JSON.parse(request.body.read)
      type = data["type"]
      
      case type
      when "video.upload.asset_created"
        process_asset_created(data)
      when "video.asset.ready"
        process_asset_ready(data)
      when "video.asset.static_renditions.ready"
        process_static_renditions(data)
      end
      
      render json: { status: "success" }
    end
    
    private
    
    def verified_webhook_request?
      return true if Rails.env.development? # 开发环境跳过验证
      
      mux_signature = request.headers["Mux-Signature"]
      return false unless mux_signature
      
      # 解析签名
      mux_sig_array = mux_signature.split(",")
      return false unless mux_sig_array.length >= 2
      
      mux_timestamp = mux_sig_array[0].gsub("t=", "")
      mux_hash = mux_sig_array[1].gsub("v1=", "")
      
      # 生成签名
      webhook_secret = SiteSetting.editorjs_mux_webhook_secret
      payload = "#{mux_timestamp}.#{request.body.string}"
      signature = OpenSSL::HMAC.hexdigest(
        OpenSSL::Digest.new("sha256"),
        webhook_secret,
        payload
      )
      
      # 验证签名
      signature == mux_hash
    end
    
    def process_asset_created(data)
      upload_id = data["object"]["id"]
      asset_id = data["data"]["asset_id"]
      
      video = EditorjsVideo.find_by(video_id: upload_id)
      return unless video
      
      video.asset_id = asset_id
      video.state = "pending" if video.state != "ready"
      video.save!
    end
    
    def process_asset_ready(data)
      asset_id = data["object"]["id"]
      upload_id = data["data"]["upload_id"]
      
      video = EditorjsVideo.find_by(video_id: upload_id)
      return unless video
      
      # 更新视频信息
      video.asset_id = asset_id unless video.asset_id
      video.playback_id = data["data"]["playback_ids"][0]["id"]
      video.state = "ready"
      video.duration = data["data"]["duration"]
      
      # 添加缩略图URL
      playback_id = video.playback_id
      video.thumbnail_url = "https://image.mux.com/#{playback_id}/thumbnail.jpg?time=0"
      
      video.save!
    end
    
    def process_static_renditions(data)
      upload_id = data["data"]["upload_id"]
      video = EditorjsVideo.find_by(video_id: upload_id)
      return unless video
      
      # 查找MP4文件
      files = data["data"]["static_renditions"]["files"]
      mp4_file = files.find { |f| f["name"] == "high.mp4" } || files.find { |f| f["name"] == "low.mp4" }
      
      if mp4_file
        video.mp4_filename = mp4_file["name"]
        video.save!
      end
    end
  end
end 