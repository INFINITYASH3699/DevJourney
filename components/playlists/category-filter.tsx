'use client';

import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CategoryFilterProps {
  categories: string[];
  currentCategory?: string;
}

export function CategoryFilter({
  categories,
  currentCategory,
}: CategoryFilterProps) {
  const router = useRouter();

  const handleChange = (value: string) => {
    if (value === 'all') {
      router.push('/playlists');
    } else {
      router.push(`/playlists?category=${encodeURIComponent(value)}`);
    }
  };

  return (
    <Select value={currentCategory || 'all'} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-[180px]">
        <SelectValue placeholder="All Categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {categories.map((cat) => (
          <SelectItem key={cat} value={cat}>
            {cat}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}