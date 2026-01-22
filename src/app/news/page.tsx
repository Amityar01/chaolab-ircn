import { getAllNews } from '@/lib/content';
import NewsClient from './NewsClient';

export default function NewsPage() {
  const news = getAllNews();
  return <NewsClient news={news} />;
}
