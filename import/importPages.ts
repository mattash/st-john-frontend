import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
import { createRequire } from 'module';
import xml2js from 'xml2js';
import axios from 'axios';
import { createClient } from '@sanity/client';
import * as path from 'path';
import {htmlToBlocks, getBlockContentFeatures} from '@sanity/block-tools'
import { pageType } from '../sanity/schemaTypes/pageType';
import {Schema} from '@sanity/schema'
import { embeddedFormType } from "../sanity/schemaTypes/embeddedFormType";

import { schemaTypes } from "../sanity/schemaTypes";
import { youtubeInput } from 'sanity-plugin-youtube-input';
import { ArraySchemaType } from '@sanity/types';
import { JSDOM } from 'jsdom';


// Initialize Sanity client
const client = createClient({
  projectId: '825c0oq2', // Replace with your Sanity project ID
  dataset: 'production', // Replace with your dataset name
  token: 'skzVuyThc1ySHg86ggtC7M3vsYOWAQ8TlZJ5dl0JUNbWJb7plQnRiMRmaGS4jM6FQc3ECVsYO71nSb2rzxNRiDiBcZjvV22ARNzPRBKBZdxrem5Y5jaK8DEDtIZkZ6D1LlUe8nsVPkYqXLnFJtuHqoAIz9YNvlBhAIrKijgZ1MCb7RrMM6QS', // Replace with your Sanity API token
  useCdn: false,
  apiVersion: '2021-03-25', // Add this line to specify the API version
});

// Variable to limit the number of items to process
const maxItemsToProcess = 2; // Set the number of items to process

// Function to extract image URL from an HTML img tag
function extractImageUrl(htmlString) {
  const match = htmlString.match(/src="([^"]+)"/);
  return match ? match[1] : null;
}

// Function to ensure directory exists
function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  fs.mkdirSync(dirname, { recursive: true });
}

// Function to download an image and upload to Sanity
async function downloadAndUploadImage(url) {
  if (!url) {
    console.error('No URL provided for image download.');
    return null;
  }

  try {
    console.log(`Attempting to download image from: ${url}`);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const filename = path.basename(url);
    const filePath = `./images/${filename}`;

    // Ensure the directory exists
    ensureDirectoryExistence(filePath);

    // Write the image to the file
    fs.writeFileSync(filePath, buffer);
    console.log(`Image downloaded and saved to: ${filePath}`);

    // Check if the file exists and has content
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      console.error(`File does not exist or is empty: ${filePath}`);
      return null;
    }

    // Read the file into a buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Upload the image to Sanity
    console.log(`Uploading image to Sanity: ${filename}`);
    try {
      const imageAsset = await client.assets.upload('image', fileBuffer, {
        filename,
      });

      if (imageAsset && imageAsset._id) {
        console.log(`Image successfully uploaded to Sanity. Asset ID: ${imageAsset._id}`);
        return {
          _type: 'image',
          asset: { _ref: imageAsset._id },
        };
      } else {
        console.error('Failed to upload image to Sanity: No asset ID returned');
        return null;
      }
    } catch (uploadError) {
      console.error('Detailed upload error:', uploadError);
      if (uploadError.response) {
        console.error('Response data:', uploadError.response.data);
        console.error('Response status:', uploadError.response.status);
        console.error('Response headers:', uploadError.response.headers);
      }
      return null;
    }

  } catch (error) {
    console.error(`Failed to download or process image: ${url}`, error);
    return null;
  }
}

export function getBlockContentType() {
  // Find the 'body' field
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
  return blockContentType
}



// Function to create a page document in Sanity
async function createPageDocument(pageData) {
  // Get the block content type from your schema
  //const blockContentType = defaultSchema.get('portableText').fields.find(type => type.name === 'blockContent');
		//const blockContentType = defaultSchema.get('body').fields.find((field: Record<string, string | []>) => field.name === 'body').type

  const blockContentType = getBlockContentType();

  if (blockContentType !== undefined) {
    console.log('Block content type is ready to use.');
  } else {
    console.error('Failed to extract blockContentType.');
  }

  global.DOMParser = new JSDOM().window.DOMParser;

  // Convert the HTML body content to Sanity block content
  const bodyBlocks = htmlToBlocks(pageData.body, blockContentType as ArraySchemaType<unknown>);
  
  console.log('Main image data:', pageData.mainImage);

  try {
    const doc = {
      _type: 'page',
      _id: `page_${pageData.path.replace(/\//g, '_')}`,
      title: pageData.title,
      body: bodyBlocks,
      path: pageData.path,
      mainImage: pageData.mainImage ? {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: pageData.mainImage.asset._ref
        }
      } : null,
      moreImages: pageData.moreImages && pageData.moreImages.length > 0 
        ? pageData.moreImages.map(img => ({
            _type: 'image',
            asset: {
              _type: 'reference',
              _ref: img.asset._ref
            }
          }))
        : [],
    };

    console.log('Document to be created:', JSON.stringify(doc, null, 2));

    await client.createOrReplace(doc);
    console.log(`Created page: ${pageData.title}`);
    // Remove downloaded images after successful document creation
    await removeDownloadedImages(pageData);
  } catch (error) {
    console.error(`Failed to create page: ${pageData.title}`, error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

async function removeDownloadedImages() {
  const imageDir = './images';
  try {
    const files = await fsPromises.readdir(imageDir);
    for (const file of files) {
      await fsPromises.unlink(path.join(imageDir, file));
      console.log(`Removed downloaded image: ${file}`);
    }
  } catch (error) {
    console.error('Failed to remove images:', error);
  }
}

// Function to parse XML and process pages
async function processXMLFile(filePath) {
  const xmlData = fs.readFileSync(filePath, 'utf8');
  const parser = new xml2js.Parser();

  parser.parseString(xmlData, async (err, result) => {
    if (err) {
      console.error('Failed to parse XML:', err);
      return;
    }

    const pages = result.nodes.node;
    const itemsToProcess = Math.min(pages.length, maxItemsToProcess); // Determine how many items to process

    for (let i = 0; i < itemsToProcess; i++) {
      const page = pages[i];
      const title = page.Title[0];
      const body = page.Body[0];
      const mainImageHTML = page['Main-Image'][0];
      const moreImagesHTML = page['More-Images'] ? page['More-Images'].map(img => img) : [];
      const path = page.Path[0];

      // Extract and download main image
      const mainImageUrl = extractImageUrl(mainImageHTML);
      const mainImage = mainImageUrl ? await downloadAndUploadImage(mainImageUrl) : null;
      console.log('Main image after download and upload:', mainImage);

      // Extract and download more images
      const moreImagesRefs = [];
      for (let imgHTML of moreImagesHTML) {
        const imgUrl = extractImageUrl(imgHTML);
        if (imgUrl) {
          const imgRef = await downloadAndUploadImage(imgUrl);
          if (imgRef) moreImagesRefs.push(imgRef);
        }
      }

      // Create the Sanity document
      await createPageDocument({
        title,
        body,
        mainImage,
        moreImages: moreImagesRefs,
        path,
      });
    }
  });
}

// Run the script
processXMLFile('./import/stj-pages-export.xml');
