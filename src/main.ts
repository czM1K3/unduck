import { bangs } from "./bang";
import "./global.css";

function noSearchDefaultPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
      <div class="content-container">
        <h1>Und*ck Fork</h1>
        <p>DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables <a href="https://duckduckgo.com/bang.html" target="_blank">all of DuckDuckGo's bangs.</a></p>
        <div class="url-container"> 
          <input 
            type="text" 
            class="url-input"
            value="${window.location.origin}?q=%s"
            readonly 
          />
          <button class="copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
        </div>

        <div style="margin-top: 40px; text-align: center;">
          <h2 style="font-size: 1.2rem; margin-bottom: 12px;">Custom Default Bang</h2>
          <div style="display: flex; flex-direction: column; gap: 8px; align-items: stretch;">
            <input type="text" class="custom-domain-input url-input" placeholder="Domain (e.g. google.com)" value="${customBang?.d ?? ""}" />
            <input type="text" class="custom-url-input url-input" placeholder="Search URL (e.g. https://google.com/search?q={{{s}}})" value="${customBang?.u ?? ""}" />
            <button class="save-button" style="padding: 8px; background: #444; color: white; border-radius: 4px; cursor: pointer; font-weight: 600;">Save Custom Bang</button>
          </div>
        </div>
      </div>
      <footer class="footer">
        <a href="https://t3.chat" target="_blank">t3.chat</a>
        •
        <a href="https://x.com/theo" target="_blank">theo</a>
        •
        <a href="https://github.com/t3dotgg/unduck" target="_blank">github</a>
      </footer>
    </div>
  `;

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";

    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });

  const saveButton = app.querySelector<HTMLButtonElement>(".save-button")!;
  const customDomainInput = app.querySelector<HTMLInputElement>(".custom-domain-input")!;
  const customUrlInput = app.querySelector<HTMLInputElement>(".custom-url-input")!;

  saveButton.addEventListener("click", () => {
    const domain = customDomainInput.value.trim();
    const url = customUrlInput.value.trim();
    if (domain && url) {
      localStorage.setItem(CUSTOM_BANG_VALUE, `${domain};${url}`);
      localStorage.setItem(DEFAULT_BANG, "custom");
      window.location.reload();
    } else {
      localStorage.removeItem(CUSTOM_BANG_VALUE);
      localStorage.removeItem(DEFAULT_BANG);
      window.location.reload();
    }
  });
}

const DEFAULT_BANG = "default-bang";
const CUSTOM_BANG_VALUE = "custom-bang";

const customBangUrl = localStorage.getItem(CUSTOM_BANG_VALUE);
const customBang = (() => {
  if (!customBangUrl) return null;
  const parts = customBangUrl.split(";");
  if (parts.length !== 2) return null;
  return {
    t: "custom",
    u: parts[1],
    d: parts[0],
    s: "Custom",
    c: "Custom",
    sc: "Custom",
    r: 0,
  };
})();
const allBangs = customBang ? [...bangs, customBang] : bangs;

const LS_DEFAULT_BANG = localStorage.getItem(DEFAULT_BANG) ?? "g";
const defaultBang = allBangs.find((b) => b.t === LS_DEFAULT_BANG);

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);

  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang = allBangs.find((b) => b.t === bangCandidate) ?? defaultBang;

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // If the query is just `!gh`, use `github.com` instead of `github.com/search?q=`
  if (cleanQuery === "")
    return selectedBang ? `https://${selectedBang.d}` : null;

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}
  const searchUrl = selectedBang?.u.replace(
    "{{{s}}}",
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
  );
  if (!searchUrl) return null;

  return searchUrl;
}

function doRedirect() {
  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
