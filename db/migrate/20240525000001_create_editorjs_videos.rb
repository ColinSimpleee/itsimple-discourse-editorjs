class CreateEditorjsVideos < ActiveRecord::Migration[6.1]
  def change
    create_table :editorjs_videos do |t|
      t.integer :user_id, null: false                # 上传用户ID
      t.string :video_id, null: false                # Mux 上传ID
      t.string :state, null: false                   # 视频状态：waiting, pending, ready, errored
      t.string :asset_id                             # Mux 资产ID
      t.string :playback_id                          # Mux 播放ID
      t.string :mp4_filename                         # MP4文件名(用于下载)
      t.string :thumbnail_url                        # 缩略图URL
      t.float :duration                              # 视频时长(秒)
      t.timestamps                                   # 创建和更新时间
    end
    
    add_index :editorjs_videos, :video_id, unique: true  # 添加唯一索引
    add_index :editorjs_videos, :user_id                 # 添加用户ID索引
  end
end 