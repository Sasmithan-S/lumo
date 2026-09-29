(function () {
  const config = window.LUMO_CONFIG || {};
  const apiUrl = config.apiUrl;
  const clientId = config.googleClientId;

  function showLogin(message) {
    if (document.getElementById('lumo-login')) return;
    const overlay = document.createElement('div');
    overlay.id = 'lumo-login';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100;background:#0b0e17;display:grid;place-items:center;padding:24px;color:#f0f3fc;font-family:Inter,system-ui,sans-serif';
    overlay.innerHTML = '<div style="width:min(390px,100%);padding:32px;border:1px solid #293044;border-radius:20px;background:#131927;text-align:center"><div style="width:44px;height:44px;margin:0 auto 18px;border-radius:14px;background:#b4fa69;color:#182211;display:grid;place-items:center;font-weight:900;font-size:24px">L.</div><h1 style="margin:0 0 8px;font-size:25px">Connexion Lumo</h1><p style="margin:0 0 22px;color:#9ba4ba;font-size:13px">Utilise ton compte Google autorisé.</p><div id="google-login"></div><p style="margin:18px 0 0;color:#e9a86c;font-size:11px">'+(message || '')+'</p></div>';
    document.body.appendChild(overlay);
    if (!clientId) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      window.google.accounts.id.initialize({client_id: clientId, callback: receiveCredential});
      window.google.accounts.id.renderButton(document.getElementById('google-login'), {theme:'filled_black', size:'large', text:'signin_with', shape:'rectangular', width:280});
    };
    document.head.appendChild(script);
  }

  function receiveCredential(response) {
    fetch(apiUrl, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({action:'auth', token:response.credential})})
      .then(result => result.json())
      .then(result => {
        if (!result.ok) throw new Error(result.error || 'Compte Google non autorisé.');
        const session = {...result.account, token: response.credential};
        sessionStorage.setItem('lumo-auth', JSON.stringify(session));
        window.LumoAuth = session;
        document.getElementById('lumo-login')?.remove();
        document.dispatchEvent(new CustomEvent('lumo-authenticated', {detail:result.account}));
      })
      .catch(error => showLogin(error.message));
  }

  window.LumoAuth = JSON.parse(sessionStorage.getItem('lumo-auth') || 'null');
  window.LumoLogin = {show: showLogin, enabled: Boolean(clientId)};
  if (!window.LumoAuth && clientId) showLogin('');
})();
