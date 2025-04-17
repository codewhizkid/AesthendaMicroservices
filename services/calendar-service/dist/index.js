"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const drainHttpServer_1 = require("@apollo/server/plugin/drainHttpServer");
const schema_1 = require("@graphql-tools/schema");
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const schema_2 = require("./schema");
const resolvers_1 = require("./resolvers");
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/calendar';
mongoose_1.default.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
// Create schema
const schema = (0, schema_1.makeExecutableSchema)({ typeDefs: schema_2.typeDefs, resolvers: resolvers_1.resolvers });
// Create Apollo Server
const server = new server_1.ApolloServer({
    schema,
    plugins: [
        (0, drainHttpServer_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
    ],
});
// Start the server
async function startServer() {
    await server.start();
    app.use('/graphql', (0, cors_1.default)(), express_1.default.json(), (0, express4_1.expressMiddleware)(server, {
        context: async ({ req }) => {
            // Get the user token from the headers
            const token = req.headers.authorization || '';
            // Here you would verify the token and get user info
            // For now, we'll return a mock user context
            return {
                user: {
                    id: '1',
                    role: 'ADMIN',
                    tenantId: 'default'
                }
            };
        },
    }));
    const PORT = 5005;
    await new Promise(resolve => httpServer.listen({ port: PORT }, resolve));
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
}
startServer().catch(err => console.error('Error starting server:', err));
//# sourceMappingURL=index.js.map