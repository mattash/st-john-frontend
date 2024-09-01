import { createClient } from '@sanity/client';
import {htmlToBlocks, getBlockContentFeatures} from '@sanity/block-tools'
import { pageType } from '../sanity/schemaTypes/pageType';
import {Schema} from '@sanity/schema'
import { schemaTypes } from "../sanity/schemaTypes";

validateSchema(schemaTypes);
// get blockcontent features of the pageType
//const blockContentFeatures = getBlockContentFeatures(schemaTypes.find(type => type.name === 'page'));
