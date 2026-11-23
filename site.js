(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const bounded = value => String(value || '').slice(0, 160);
  let referrer = '';
  try { referrer = document.referrer ? new URL(document.referrer).hostname : ''; } catch (_) {}
  const attribution = {
    source: bounded(params.get('utm_source') || referrer || 'direto'),
    medium: bounded(params.get('utm_medium')),
    campaign: bounded(params.get('utm_campaign')),
    content: bounded(params.get('utm_content')),
    term: bounded(params.get('utm_term'))
  };

  // Registro local de demonstração; nenhum evento é enviado a um servidor.
  function track(event, detail = '') {
    try {
      const saved = JSON.parse(localStorage.getItem('pimenta_demo_events') || '[]');
      const events = Array.isArray(saved) ? saved : [];
      events.push({ date: new Date().toISOString(), event, detail, ...attribution });
      localStorage.setItem('pimenta_demo_events', JSON.stringify(events.slice(-1000)));
    } catch (_) {}
  }

  function originLines() {
    return [
      `Origem: ${attribution.source}`,
      attribution.medium && `Canal: ${attribution.medium}`,
      attribution.campaign && `Campanha: ${attribution.campaign}`,
      attribution.content && `Peça: ${attribution.content}`
    ].filter(Boolean);
  }

  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(link => {
    const destination = new URL(link.href);
    const greeting = destination.searchParams.get('text') || 'Olá, vim pelo site da Pimenta IA & Analytics.';
    destination.searchParams.set('text', greeting + '\n\n' + originLines().join('\n'));
    link.href = destination.toString();
  });

  track('page_view', location.pathname);
  document.querySelectorAll('[data-track]').forEach(link => {
    link.addEventListener('click', () => track('click', link.dataset.track));
  });
  document.getElementById('year').textContent = new Date().getFullYear();

  const menu = document.getElementById('menu');
  const links = document.getElementById('links');
  function closeMenu() {
    links.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Abrir menu');
  }
  menu.addEventListener('click', () => {
    const expanded = links.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(expanded));
    menu.setAttribute('aria-label', expanded ? 'Fechar menu' : 'Abrir menu');
  });
  document.querySelectorAll('.links a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  const triageMap = {
    planilhas: ['Pimenta AutoFlow', 'Automatizar consolidações e validações pode liberar tempo da equipe. Primeiro mapeamos frequência, fontes e exceções.', 'Automação de processos'],
    indicadores: ['Pimenta BI Express', 'Começamos pelos indicadores que influenciam decisões e pela qualidade das fontes antes de construir o painel.', 'Dashboards e BI'],
    ia: ['Pimenta AI Assistant + Workshop', 'Priorizamos casos de uso viáveis, governança e capacitação antes de propor agentes ou integrações.', 'Agentes de IA']
  };
  document.querySelectorAll('.triage').forEach(button => {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      document.querySelectorAll('.triage').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      const [title, copy, interest] = triageMap[button.dataset.problem];
      document.getElementById('triage-title').textContent = title;
      document.getElementById('triage-copy').textContent = copy;
      document.getElementById('triage-result').style.display = 'block';
      document.getElementById('interesse').value = interest;
      track('triage_selected', button.dataset.problem);
    });
  });

  document.querySelectorAll('.demo-card input, .demo-card select').forEach(control => {
    control.addEventListener('change', () => track('demo_interaction', control.id));
  });

  document.getElementById('leadform').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const value = name => form.elements[name].value.trim();
    const subject = 'Contato pelo site Pimenta IA & Analytics — ' + value('empresa');
    const body = [
      `Nome: ${value('nome')}`,
      `Empresa: ${value('empresa')}`,
      `E-mail: ${value('email')}`,
      `Interesse: ${value('interesse')}`,
      `Desafio: ${value('desafio')}`,
      ...originLines()
    ].join('\n');
    track('lead_email_intent', value('interesse'));
    location.href = 'mailto:ajulianapimenta17@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
})();
