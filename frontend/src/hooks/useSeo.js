import { useEffect } from 'react';

const upsertMetaTag = (name, content) => {
  if (typeof document === 'undefined') return;
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content || '');
};

const useSeo = ({ title, description, keywords }) => {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
    if (description) {
      upsertMetaTag('description', description);
    }
    if (keywords) {
      upsertMetaTag('keywords', keywords);
    }
  }, [title, description, keywords]);
};

export default useSeo;
