import { defineField, defineType } from "sanity";

export const embeddedFormType = defineType({
  name: 'embeddedForm',
  title: 'Embedded Form',
  type: 'object',
  fields: [
    {
      name: 'formId',
      title: 'Form ID',
      type: 'string',
      description: 'The ID of the form to embed.',
    },
    {
      name: 'srcUrl',
      title: 'Source URL',
      type: 'url',
      description: 'The base URL for the embedded form script.',
      initialValue: 'https://forms.ministryforms.net/embed.aspx',
      readOnly: true,
    }
  ],
  preview: {
    select: {
      title: 'formId',
    },
    prepare(selection) {
      const { title } = selection;
      return {
        title: `Embedded Form: ${title}`,
      };
    }
  }
});
