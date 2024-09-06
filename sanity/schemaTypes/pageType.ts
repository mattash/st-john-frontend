import { defineField, defineType } from "sanity";
import { embeddedFormType } from "./embeddedFormType";

export const pageType = defineType({
    name: "page",
    title: "Page",
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
            },
            {
              type: 'youtubeVideo'
            },
            {
                type: 'embeddedForm' 
            }
        ]
      }),
      defineField({
        name: 'moreImages',
        title: 'More Images',
        type: 'array',
        of: [{ type: 'image' }],
      }),
      defineField({
        name: 'path',
        title: 'Path',
        type: 'slug',
        options: {
            source: 'title',
            maxLength: 200,
            slugify: input => input
              .toLowerCase()
              .replace(/\s+/g, '-')  // Replace spaces with hyphens
              .replace(/[^\w\-\/]+/g, '')  // Remove all non-word chars except hyphens and slashes
              .replace(/\-\-+/g, '-')  // Replace multiple hyphens with single hyphen
              .replace(/^-+/, '')  // Trim hyphens from start
              .replace(/-+$/, '')  // Trim hyphens from end
              .slice(0, 200)
        }
      }),
    ],
  });

  export default pageType;