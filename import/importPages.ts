import fs from 'fs';
import { createRequire } from 'module';
import xml2js from 'xml2js';
import axios from 'axios';
import { createClient } from '@sanity/client';
import { Schema } from '@sanity/schema';
import path from 'path';
import {htmlToBlocks, getBlockContentFeatures} from '@sanity/block-tools'
import { pageType } from '../sanity/schemaTypes/pageType.ts';
//import { schema } from '../sanity/schemaTypes/pageType.ts'; // Import your Sanity schema



// Initialize Sanity client
const client = createClient({
  projectId: '825c0oq2', // Replace with your Sanity project ID
  dataset: 'production', // Replace with your dataset name
  token: 'skzVuyThc1ySHg86ggtC7M3vsYOWAQ8TlZJ5dl0JUNbWJb7plQnRiMRmaGS4jM6FQc3ECVsYO71nSb2rzxNRiDiBcZjvV22ARNzPRBKBZdxrem5Y5jaK8DEDtIZkZ6D1LlUe8nsVPkYqXLnFJtuHqoAIz9YNvlBhAIrKijgZ1MCb7RrMM6QS', // Replace with your Sanity API token
  useCdn: false,
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
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    const filename = path.basename(url);
    const filePath = `./images/${filename}`;

    // Ensure the directory exists
    ensureDirectoryExistence(filePath);

    // Write the image to the file
    fs.writeFileSync(filePath, buffer);

     // Upload the image to Sanity
     const imageAsset = await client.assets.upload('image', fs.createReadStream(filePath), {
      filename,
    });

    // Return the image reference
    return {
      _type: 'image',
      asset: { _ref: imageAsset._id },
    };

  } catch (error) {
    console.error(`Failed to download or upload image: ${url}`, error);
    return null;
  }
}


// Function to create a page document in Sanity
async function createPageDocument(pageData) {

    // Get the block content type from your schema
    //const blockContentType = schema.types.find(type => type.name === 'blockContent');



    const blockField = pageType.fields.find((field) => field.name === 'body');
    const blockContentType = blockField ? blockField.type : null;

    if (!blockContentType) {
      throw new Error('Block content type is not defined in the schema');
    }

    // Convert the HTML body content to Sanity block content
    const bodyBlocks = htmlToBlocks(pageData.body, blockContentType);
  
  try {
    const doc = {
      _type: 'page',
      title: pageData.title,
      body: bodyBlocks,
      path: pageData.path,
      mainImage: pageData.mainImage ? { _type: 'image', asset: { _ref: pageData.mainImage } } : null,
      moreImages: pageData.moreImages.length > 0 ? pageData.moreImages.map(img => ({ _type: 'image', asset: { _ref: img } })) : [],
    };

    await client.createOrReplace(doc);
    console.log(`Created page: ${pageData.title}`);
  } catch (error) {
    console.error(`Failed to create page: ${pageData.title}`, error);
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
