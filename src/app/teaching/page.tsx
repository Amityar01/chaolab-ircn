import { getAllTeachingCourses } from '@/lib/content';
import TeachingClient from './TeachingClient';

export default function TeachingPage() {
  const courses = getAllTeachingCourses();
  return <TeachingClient courses={courses} />;
}
