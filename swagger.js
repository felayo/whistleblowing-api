// swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Whistle-Blowing Reporting System API",
      version: "1.0.0",
      description:
        "API documentation for the Whistle-Blowing System to combat public property vandalism in Lagos State.",
      contact: {
        name: "Ayorinde Ajibaye",
        email: "ajibaye@gmail.com",
      },
    },
    servers: [
      {
        url: "http://localhost:8081/api",
        description: "Local Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // 👇 Tells Swagger where to look for annotations
  apis: [
    path.resolve(__dirname, "./routes/*.js"),
    path.resolve(__dirname, "./app.js"), // optional if you later add global tags
  ],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export const swaggerDocs = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("✅ Swagger Docs available at: http://localhost:8081/api-docs");
};
