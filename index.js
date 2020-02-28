const { GraphQLServer } = require("graphql-yoga");
const { startDB, models } = require("./db/index.js");
import resolvers from "./resolvers/resolvers.js";
// import { request } from "https";
// import { middleware } from "graphql-middleware";
import { userAuth } from "./middleware/index";

const db = startDB();

const context = {
  models,
  db
};

const server = new GraphQLServer({
  typeDefs: `${__dirname}/typeDefs/schema.graphql`,
  resolvers,
  context: async request => {
    let user = await userAuth(request);
    return {
      user,
      ...request,
      ...context
    };
  }
});

// We're also able to use Express directly. Below are some examples:
// Custom middleware
// server.express.use(userAuth());
// Custom Route in Express
server.express.get("/user", (req, res) => {
  // console.log("one");
  res.send("books");
});
// Custom options for Server
const options = { port: 4000 };
// Start Server
server.start(options, () =>
  console.log("Server is running on localhost:" + options.port)
);
