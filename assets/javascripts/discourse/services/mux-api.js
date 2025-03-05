import Service from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

export default class MuxApiService extends Service {
  createDirectUpload() {
    return ajax("/discourse-video/upload", {
      type: "POST",
    })
      .then((result) => {
        return result;
      })
      .catch(popupAjaxError);
  }

  getVideoStatus(videoId) {
    return ajax(`/discourse-video/display/${videoId}`, {
      type: "GET",
    })
      .then((result) => {
        return result;
      })
      .catch(popupAjaxError);
  }
} 