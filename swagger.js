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
      {
        url: "https://your-render-app-url.onrender.com/api",
        description: "Render Deployment",
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
  apis: [
    path.resolve(__dirname, "./routes/*.js"),
    path.resolve(__dirname, "./app.js"),
  ],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export const swaggerDocs = (app) => {
  // ✅ Serve Swagger UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // ✅ Serve raw Swagger JSON
  app.get("/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // console.log("✅ Swagger Docs available at: http://localhost:8081/api-docs");
  // console.log("✅ Swagger JSON available at: http://localhost:8081/swagger.json");
};
