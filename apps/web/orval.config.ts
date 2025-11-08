import { defineConfig } from "orval";

export default defineConfig({
  rest: {
    input: {
      target: "./docs/swagger.json",
      override: {
        transformer: (schema) => {
          // Remove the websocket path so it doesn't get generated in REST
          delete schema.paths["/ws"];
          return schema;
        },
      },
    },
    output: {
      mode: "tags-split",
      target: "./src/services/endpoints",
      schemas: "./src/services/schemas",
      client: "react-query",
      clean: true,
      override: {
        mutator: {
          path: "./src/services/axios-config.ts",
          name: "axiosInstance",
        },
      },
    },
  },
});
