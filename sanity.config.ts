// ./sanity.config.ts

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemaTypes";
import { media } from "sanity-plugin-media";

export default defineConfig({
    name: "st-john",
    title: "St. John",
    projectId: "825c0oq2",
    dataset: "production",
    plugins: [structureTool(), visionTool(), media()],
    schema: {
        types: schemaTypes,
    },
});