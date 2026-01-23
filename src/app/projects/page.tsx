import { getAllProjects } from '@/lib/content';
import ProjectsClient from './ProjectsClient';

export default function ProjectsPage() {
  const projects = getAllProjects();
  return <ProjectsClient projects={projects} />;
}
