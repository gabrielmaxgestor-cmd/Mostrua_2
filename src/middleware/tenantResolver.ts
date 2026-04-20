import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export async function resolveReseller(host: string, slug?: string) {
  // Check if it's localhost or the main domain (e.g., vercel.app, run.app)
  const isMainDomain = host.includes('localhost') || host.includes('vercel.app') || host.includes('run.app');

  if (isMainDomain && slug) {
    // Resolve by slug
    const q = query(
      collection(db, 'resellers'), 
      where('slug', '==', slug), 
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
  } else if (!isMainDomain) {
    // Resolve by custom domain
    const q = query(
      collection(db, 'resellers'),
      where('customDomain', '==', host),
      where('customDomainStatus', '==', 'active')
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }
  }

  return null;
}
