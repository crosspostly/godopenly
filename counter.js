// Self-made visit counter (Cloudflare Worker + D1, ours). No cookies, no personal data.
(function () {
  var API = "https://godopenly-counter.sheepoff.workers.dev/hit?k=";
  var page = document.body.getAttribute("data-page") || "page";
  var q = new URLSearchParams(location.search);
  var src = (q.get("src") || q.get("utm_source") || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
  if (src) { try { sessionStorage.setItem("go_src", src); } catch (e) {} }
  else { try { src = sessionStorage.getItem("go_src") || ""; } catch (e) {} }
  src = src || (/youtube|youtu\.be/.test(document.referrer) ? "youtube" : "direct");
  function hit(keys) { try { fetch(API + keys.join(","), { mode: "cors", keepalive: true }); } catch (e) {} }
  var keys = [page, page + "-src-" + src];
  var seen = "go_seen_" + page;
  try { if (!localStorage.getItem(seen)) { localStorage.setItem(seen, "1"); keys.push(page + "-uniq"); } } catch (e) {}
  hit(keys);
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href$='.pdf']");
    if (a) hit(["pdf-" + page, "pdf-" + page + "-src-" + src]);
  });
})();
