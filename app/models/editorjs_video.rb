class EditorjsVideo < ActiveRecord::Base
  ERRORED = "errored"
  READY = "ready"
  PENDING = "pending"
  WAITING = "waiting"

  belongs_to :user

  validates :state, inclusion: { 
    in: %w[pending ready errored waiting],
    message: "%{value} is not a valid state" 
  }
end 