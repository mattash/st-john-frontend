import { createClient } from '@sanity/client';
import {htmlToBlocks, getBlockContentFeatures} from '@sanity/block-tools'
import { pageType } from '../sanity/schemaTypes/pageType';
import { embeddedFormType } from "../sanity/schemaTypes/embeddedFormType";

import {Schema} from '@sanity/schema'
import { schemaTypes } from "../sanity/schemaTypes";
import { youtubeInput } from 'sanity-plugin-youtube-input'


// get blockcontent features of the pageType 
const schema = Schema.compile({
  name: 'mySchema',
  types: [pageType, embeddedFormType]
})

const pageTypeSchema = schema.get('page')
if (!pageTypeSchema) {
  throw new Error('Page type not found in schema')
}

const bodyField = pageTypeSchema.fields.find(field => field.name === 'body')
if (!bodyField) {
  throw new Error('Body field not found in page type')
}

const blockContentType = bodyField.type

const blockContentFeatures = getBlockContentFeatures(blockContentType)
console.log(blockContentFeatures)