import { redirect } from 'next/navigation';

export default function RegisterTrackRedirectPage() {
  redirect('/login');
}
