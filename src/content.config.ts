import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    publishDate: z.string(),
    updatedDate: z.string().optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    aideMontant: z.string().optional(),
  }),
});

export const collections = { guides };
