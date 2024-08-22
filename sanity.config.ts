// ./sanity.config.ts

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

export default defineConfig({
    name: "st-john",
    title: "St. John",
    projectId: "825c0oq2",
    dataset: "production",
    plugins: [structureTool()],
    schema: {
        types: [
            /* Your types here */
        ],
    },
});