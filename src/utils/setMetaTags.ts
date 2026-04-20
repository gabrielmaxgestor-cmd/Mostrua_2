export function setMetaTags(params: {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}) {
  // Title
  document.title = params.title;
 
  const setMeta = (property: string, content: string) => {
    let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('property', property);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };
 
  const setNameMeta = (name: string, content: string) => {
    let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };
 
  setMeta('og:title', params.title);
  setMeta('og:type', 'website');
  if (params.description) { setMeta('og:description', params.description); setNameMeta('description', params.description); }
  if (params.image) setMeta('og:image', params.image);
  if (params.url) setMeta('og:url', params.url);
  setMeta('og:site_name', 'Mostrua');
 
  // WhatsApp usa tambem og:image:width e og:image:height para otimizar o preview
  setMeta('og:image:width', '1200');
  setMeta('og:image:height', '630');
}
 
export function resetMetaTags() {
  document.title = 'Mostrua — Catalogo Online';
  ['og:title','og:description','og:image','og:url'].forEach(prop => {
    document.querySelector(`meta[property="${prop}"]`)?.remove();
  });
}
