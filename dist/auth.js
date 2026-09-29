(function () {
  const apiUrl = window.LUMO_CONFIG?.apiUrl;

  function showLogin(message) {
    if (document.getElementById('lumo-login')) return;
    const overlay = document.createElement('div');
    overlay.id = 'lumo-login';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100;background:#0b0e17;display:grid;place-items:center;padding:24px;color:#f0f3fc;font-family:Inter,system-ui,sans-serif';
    overlay.innerHTML = '<form id="lumo-login-form" style="width:min(390px,100%);padding:32px;border:1px solid #293044;border-radius:20px;background:#131927"><div style="width:44px;height:44px;margin:0 auto 18px;border-radius:14px;background:#b4fa69;color:#182211;display:grid;place-items:center;font-weight:900;font-size:24px">L.</div><h1 style="margin:0 0 8px;text-align:center;font-size:25px">Connexion Lumo</h1><p style="margin:0 0 22px;text-align:center;color:#9ba4ba;font-size:13px">Entre ton identifiant et ton mot de passe.</p><label style="display:block;margin:0 0 12px;font-size:12px;color:#aeb8cb">Identifiant<input name="username" required autocomplete="username" style="display:block;width:100%;margin-top:6px;padding:12px;border:1px solid #344058;border-radius:9px;background:#20283a;color:#fff"></label><label style="display:block;margin:0 0 18px;font-size:12px;color:#aeb8cb">Mot de passe<input name="password" required type="password" autocomplete="current-password" style="display:block;width:100%;margin-top:6px;padding:12px;border:1px solid #344058;border-radius:9px;background:#20283a;color:#fff"></label><button style="width:100%;padding:12px;border:0;border-radius:9px;background:#b4fa69;color:#182211;font-weight:700">Se connecter</button><p id="lumo-login-error" style="margin:16px 0 0;text-align:center;color:#e9a86c;font-size:11px">'+(message || '')+'</p></form>';
    document.body.appendChild(overlay);
    overlay.querySelector('form').onsubmit = event => {event.preventDefault(); const data = new FormData(event.currentTarget); login(String(data.get('username')), String(data.get('password')));};
  }

  function login(username, password) {
    fetch(apiUrl, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({action:'auth', username, password})})
      .then(response => response.json())
      .then(result => {if (!result.ok) throw new Error(result.error || 'Connexion refusée.'); const session = {...result.account, sessionToken: result.sessionToken}; sessionStorage.setItem('lumo-auth', JSON.stringify(session)); window.LumoAuth = session; document.getElementById('lumo-login')?.remove(); document.dispatchEvent(new CustomEvent('lumo-authenticated', {detail:session}));})
      .catch(error => {const field = document.getElementById('lumo-login-error'); if (field) field.textContent = error.message;});
  }

  window.LumoAuth = JSON.parse(sessionStorage.getItem('lumo-auth') || 'null');
  window.LumoLogin = {show: showLogin, enabled: true};
  if (config.authRequired && !window.LumoAuth) showLogin('');
})();
