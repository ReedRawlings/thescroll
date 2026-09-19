const params = new URLSearchParams(location.search);
if (params.has("editor")) {
  import("./editor/editor.js");
} else if (params.has("tileset")) {
  import("./tileset/study.js");
} else if (params.has("rooms")) {
  import("./rooms/gallery.js");
} else if (params.has("floors") || params.has("bsp")) {
  import("./floors/gallery.js");
} else if (new URLSearchParams(location.search).has("ui")) {
  import("./ui/review.js");
} else {
  import("./main.js");
}
