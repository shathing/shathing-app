import { type Category } from './category';
import { type Member } from './member';
import { type Region } from './region';

export interface ShareItem {
  id: number;
  title: string;
  content: string;
  createdDate: string;
  photoUrls: string[];
  category: Category;
  member: Omit<Member, 'email'>;
  region: Region;
}
