const params = new URLSearchParams(location.search);
if (params.has("rooms")) {
  import("./rooms/gallery.js");
} else if (params.has("floors")) {
  import("./floors/gallery.js");
} else if (new URLSearchParams(location.search).has("ui")) {
  import("./ui/review.js");
} else {
  import("./main.js");
}
