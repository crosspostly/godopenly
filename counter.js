// Tiny self-made visit counter (no cookies, no Google/Yandex). Counts via abacus.jasoncameron.dev.
(function () {
  var NS = "godopenly-v1", API = "https://abacus.jasoncameron.dev/hit/" + NS + "/";
  var page = document.body.getAttribute("data-page") || "page";
  var q = new URLSearchParams(location.search);
  var src = (q.get("src") || q.get("utm_source") || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
  if (src) { try { sessionStorage.setItem("go_src", src); } catch (e) {} }
  else { try { src = sessionStorage.getItem("go_src") || ""; } catch (e) {} }
  src = src || (document.referrer.indexOf("youtube") > -1 ? "youtube" : "direct");
  function hit(key) { try { fetch(API + key, { mode: "cors", keepalive: true }); } catch (e) {} }
  hit(page);                        // all views
  hit(page + "-src-" + src);        // views by source
  var seen = "go_seen_" + page;     // unique visitors (per browser)
  try { if (!localStorage.getItem(seen)) { localStorage.setItem(seen, "1"); hit(page + "-uniq"); } } catch (e) {}
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href$='.pdf']");
    if (a) hit("pdf-" + page);
  });
})();
