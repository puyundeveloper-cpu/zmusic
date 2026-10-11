const axios = require('axios');
const crypto = require('crypto');

                                                       
const ytCache = new Map();
const CACHE_TTL = 90 * 60 * 1000;

                                                                      
                                                                                 
async function tryVidssave(fullUrl, idMatch, signal) {
  const api = axios.create({
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "origin": "https://vidssave.com",
      "referer": "https://vidssave.com/",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "accept": "application/json, text/plain, */*"
    },
    timeout: 9000,
    signal
  });

  const params = new URLSearchParams({
    auth: "20250901majwlqo",
    domain: "api-ak.vidssave.com",
    origin: "source",
    link: fullUrl
  });

  const res = await api.post("https://api.vidssave.com/api/contentsite_api/media/parse", params.toString());
  const data = res?.data?.data;
  if (!data) {
    throw new Error(`No data from vidssave — raw response: ${JSON.stringify(res.data).slice(0, 300)}`);
  }

                                                                                    
  const audioList = (data.resources || []).filter(r => r.type === "audio" && r.download_url);
  const pick = audioList.find(r => r.quality === "128KBPS") || audioList[0];
  if (!pick) throw new Error("No audio resource from vidssave");

  return {
    duration: `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, "0")}`,
    audio: pick.download_url,
    cdn: "vidssave"
  };
}

async function getDownload(url) {
  const idMatch = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/
  ].find(p => p.test(url))?.exec(url)?.[1] || (url.length === 11 ? url : null);

  if (!idMatch) {
    console.error("Invalid URL or video ID:", url);
    return null;
  }

                      
  const cached = ytCache.get(idMatch);
  if (cached && cached.expireAt > Date.now()) {
    console.log(`[EXTRACT] Cache hit for video ID: ${idMatch}`);
    return cached.data;
  }

  const fullUrl = "https://www.youtube.com/watch?v=" + idMatch;
  const cdns = ["cdn405.savetube.vip", "cdn403.savetube.vip", "cdn401.savetube.vip"];

                                                               
                                                                          
                                                                            
                                                                          
  const PER_CDN_TIMEOUT = 20000;                                                         
                                                                                      
  const controller = new AbortController();

  async function tryCdn(cdn) {
    const api = axios.create({
      headers: {
        "content-type": "application/json",
        "origin": "https://yt.savetube.me",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      },
      timeout: PER_CDN_TIMEOUT,
      signal: controller.signal
    });

    const infoResponse = await api.post(`https://${cdn}/v2/info`, { url: fullUrl }).catch(err => {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        throw new Error(`${cdn} unreachable/timeout (likely dead CDN)`);
      }
      throw err;
    });
    const encryptedData = infoResponse?.data?.data;
    if (!encryptedData) throw new Error(`No data from ${cdn}`);

    const encrypted = Buffer.from(encryptedData, "base64");
    const decipher = crypto.createDecipheriv("aes-128-cbc",
      Buffer.from("C5D58EF67A7584E4A29F6C35BBC4EB12", "hex"),
      encrypted.slice(0, 16)
    );

    const decryptedBuffer = Buffer.concat([
      decipher.update(encrypted.slice(16)),
      decipher.final()
    ]);

    const decrypted = JSON.parse(decryptedBuffer.toString());
    const downloadRes = await api.post(`https://${cdn}/download`, {
      id: idMatch,
      downloadType: "audio",
      quality: "128",
      key: decrypted.key
    });

    const audioUrl = downloadRes.data?.data?.downloadUrl || downloadRes.data?.downloadUrl;
    if (!audioUrl) throw new Error(`No audio URL from ${cdn}`);

    return {
      duration: `${Math.floor(decrypted.duration / 60)}:${(decrypted.duration % 60).toString().padStart(2, "0")}`,
      audio: audioUrl,
      cdn
    };
  }

                                                                               
                                                                              
                                                                                       
  const HEAD_START_MS = 200;
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  try {
    const racers = [
      tryVidssave(fullUrl, idMatch, controller.signal).catch(err => {
        const detail = err?.response ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}` : err.message;
        console.error(`[EXTRACT] vidssave failed:`, detail);
        err.__provider = 'vidssave';
        err.__detail = detail;
        throw err;
      }),
      ...cdns.map(cdn =>
        delay(HEAD_START_MS).then(() => tryCdn(cdn)).catch(err => {
          const detail = err?.response ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}` : err.message;
          console.error(`[EXTRACT] ${cdn} failed:`, detail);
          err.__provider = cdn;
          err.__detail = detail;
          throw err;
        })
      )
    ];

    const result = await Promise.any(racers);

                                                                     
                                                     
    controller.abort();

    console.log(`[EXTRACT] Winner: ${result.cdn}`);
    ytCache.set(idMatch, { data: result, expireAt: Date.now() + CACHE_TTL });
    return result;
  } catch (aggregateErr) {
    const details = (aggregateErr?.errors || []).map(e => `${e.__provider}: ${e.__detail || e.message}`);
    console.error("[EXTRACT] All CDNs failed:", details.join(" | "));
    const notFoundErr = new Error("All providers failed");
    notFoundErr.__details = details;
    throw notFoundErr;
  }
}

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }
    if (req.method !== 'POST') { res.status(405).json({ status: false, message: 'Method not allowed' }); return; }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    const url = (body.query || body.url || '').trim();
    if (!url) { res.status(400).json({ status: false, message: 'Parameter query wajib diisi' }); return; }

    console.log(`[EXTRACT] Starting extraction for: ${url}`);
    const debug = req.query?.debug === '1';

    try {
        let audioData = await getDownload(url);

        if (audioData && audioData.audio) {
            console.log("[EXTRACT] Success");
            return res.status(200).json({
                status: true,
                result: {
                    duration: audioData.duration || null,
                    download: { audio: audioData.audio }
                }
            });
        }
    } catch (err) {
        console.error("[EXTRACT] All providers failed:", err.__details?.join(" | ") || err.message);
        return res.status(503).json({
            status: false,
            error: "Media extraction services are currently overloaded. Please try another track.",
            ...(debug ? { debug: err.__details || [err.message] } : {})
        });
    }

    console.error("[EXTRACT] All methods failed");
    res.status(503).json({ status: false, error: "Media extraction services are currently overloaded. Please try another track." });
};
