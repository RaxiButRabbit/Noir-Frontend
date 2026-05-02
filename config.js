// ==============================================================
// NOIR FRONTEND CONFIG
// --------------------------------------------------------------
// Bu dosyada HIC BIR SIR (api key, secret, token) bulunmaz.
// Sadece backend API'nin hangi URL'de oldugu bilgisi tutulur.
// ==============================================================

(function () {
    const host = window.location.hostname;

    // GitHub Pages / production: backend Render/Railway'de
    // Local gelistirme: backend same-origin (http://localhost:8080)
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';

    window.NOIR_CONFIG = {
        // PRODUCTION: kendi Render URL'inizi buraya yazin
        API_BASE: isLocal ? '' : 'https://noir-backend.onrender.com'
    };
})();
