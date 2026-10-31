import swaggerJsdoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Asset Management System API",
            version: "1.0.0",
            description: "API documentation for the asset management system, including employees, assets, printers, monitors, assignments, and database operations."
        },
        servers: [
            {
                url: "/",
                description: "Current server"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    },
    apis: [
        "./api/*.js",
        "./printers/*.js",
        "./admin/*.js"
    ]
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;