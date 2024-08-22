import { defineField, defineType } from "sanity";

export const categoryType = defineType({
    name: "category",
    title: "Category",
    type: 'document',
    description: 'Categories are used for categorizing articles',
    fields: [
      defineField({
        name: 'name',
        title: 'Name',
        type: 'string',
      }),
      defineField({
        name: 'slug',
        title: 'Slug',
        type: 'slug',
        options: {
            source: 'name',
          }
      }),
    ],
  });