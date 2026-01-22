import { getContactInfo } from '@/lib/content';
import ContactClient from './ContactClient';

export default function ContactPage() {
  const contact = getContactInfo();
  return <ContactClient contact={contact} />;
}
