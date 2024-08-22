import { defineField, defineType, defineArrayMember } from "sanity";

export const articleType = defineType({
    name: "article",
    title: "Article",
    type: 'document',
    fields: [
      defineField({
        name: 'title',
        title: 'Title',
        type: 'string',
      }),
      defineField({
        name: 'mainImage',
        title: 'Main Image',
        type: 'image',
        options: {
            hotspot: true 
          }
      }),
      defineField({
        name: 'body',
        title: 'Body',
        type: 'array',
        of: [
            { 
                type: 'block' },
            {
                type: 'image',
                fields: [
                    {
                    type: 'text',
                    name: 'alt',
                    title: 'Alternative text',
                    description: `Some of your visitors cannot see images, 
                        be they blind, color-blind, low-sighted; 
                        alternative text is of great help for those 
                        people that can rely on it to have a good idea of 
                        what\'s on your page.`
                    }
                ]
            }
        ]
      }),
      defineField({
        name: 'categories',
        title: 'Categories',
        type: 'array',
        of: [
            defineArrayMember({
                type: 'reference',
                to: [{ type: 'category' }]
            })
          ],
      }),
      defineField({
        name: 'moreImages',
        title: 'More Images',
        type: 'array',
        of: [{ type: 'image' }],
      }),
      defineField({
        name: 'publishDate',
        title: 'Publish Date',
        type: 'datetime',
      }),
      defineField({
        name: 'path',
        title: 'Path',
        type: 'slug',
        options: {
            source: 'title',
            maxLength: 200, // will be ignored if slugify is set
            slugify: input => input
                                 .toLowerCase()
                                 .replace(/\s+/g, '-')
                                 .slice(0, 200)
          }
      }),
    ],
  });