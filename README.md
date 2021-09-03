## Outline

* Create project structure
  * `stepzen.config.json`
  * `config.yaml`
  * `index.graphql`
  * `stepzen start`
* `rick-and-morty.graphql`
  * Run `CHARACTERS_QUERY`
  * Prefixes
  * Run `RICK_CHARACTERS_QUERY`
* `storyblok.graphql`
  * `config.yaml` for `storyblok_config`
  * Run `POSTS_QUERY`
* `fauna.graphql`
  * `config.yaml` for `fauna_config`
  * Run `CREATE_STORE`
  * Run `FIND_STORE_BY_ID`
  * Run `UPDATE_STORE_NAME`
  * Run `DELETE_STORE`
* GraphQL Helix
  * Create project and install dependencies
  * `app.js`
  * `handler.js`
  * `serverless.yml`
  * `webpack.config.js`
  * Run `serverless deploy`
  * `helix.graphql`
  * Run `HELLO_QUERY`
* Redwood App
  * Create Users schema
  * Provision a PostgreSQL database with [Railway](http://railway.app/)
  * Setup database with Prisma Migrate and generate scaffold
  * Setup Netlify Deploy
  * Push Project to GitHub and Connect Repo to Netlify
  * Test it with a query
  * `redwood.graphql`
* Run all queries

## Create project structure

```bash
mkdir -p graphql-mashup/schema
cd graphql-mashup
touch index.graphql schema/rick-and-morty.graphql schema/storyblok.graphql schema/fauna.graphql schema/helix.graphql schema/redwood.graphql
echo 'config.yaml\nnode_modules\n.DS_Store\n.serverless\nyarn.lock' > .gitignore
```

### `stepzen.config.json`

```bash
echo '{"endpoint": "api/graphql-mashup"}' > stepzen.config.json
```

### `config.yaml`

```bash
echo 'configurationset:' > config.yaml
```

### `index.graphql`

```graphql
schema
  @sdl(
    files: [
      "schema/rick-and-morty.graphql"
      "schema/storyblok.graphql"
      "schema/fauna.graphql"
      "schema/helix.graphql"
      "schema/redwood.graphql"
    ]
  ) {
  query: Query
}
```

### `stepzen start`

```bash
stepzen start
```

## `rick-and-morty.graphql`

```graphql
type Character {
  id: ID
  name: String
  image: String
}

type Characters {
  results: [Character]
}

type Query {
  characters: Characters
    @graphql(
      endpoint: "https://rickandmortyapi.com/graphql"
    )
}
```

### Run `CHARACTERS_QUERY`

```graphql
query CHARACTERS_QUERY {
  characters {
    results {
      id
      name
      image
    }
  }
}
```

### Prefixes

```graphql
type rick_Character {
  id: ID
  name: String
  image: String
}

type rick_Characters {
  results: [rick_Character]
}

type Query {
  rick_characters: rick_Characters
    @graphql(
      endpoint: "https://rickandmortyapi.com/graphql"
      prefix: { value: "rick_", includeRootOperations: true }
    )
}
```

### Run `RICK_CHARACTERS_QUERY`

```graphql
query RICK_CHARACTERS_QUERY {
  rick_characters {
    results {
      id
      name
    }
  }
}
```

## `storyblok.graphql`

```graphql
type PostItems {
  items: [PostItem]
}

type PostItem {
  name: String
  content: Content
}

type Content {
  title: String
  intro: String
}

type Query {
  postItems: PostItems
    @graphql(
      endpoint: "https://gapi.storyblok.com/v1/api"
      headers: [
        { name:"Token" value:"$token" }
      ]
      configuration: "storyblok_config"
    )
}
```

### `config.yaml` for `storyblok_config`

```yaml
configurationset:
  - configuration:
      name: storyblok_config
      token: xxxx
```

### Run `POSTS_QUERY`

```graphql
query POSTS_QUERY {
  PostItems {
    items {
      name
      content {
        intro
        title
      }
    }
  }
}
```

## `fauna.graphql`

```graphql
type Store {
  _id: ID!
  name: String!
}

type StorePage {
  data: [Store]!
  after: String
  before: String
}

input StoreInput {
  name: String!
}

type Query {
  findStoreByID(
    id: ID!
  ): Store
    @graphql(
      endpoint: "https://graphql.fauna.com/graphql"
      configuration: "fauna_config"
    )

  allStores: StorePage!
    @graphql(
      endpoint: "https://graphql.fauna.com/graphql"
      configuration: "fauna_config"
    )
}

type Mutation {
  createStore(
    data: StoreInput!
  ): Store!
    @graphql(
      endpoint: "https://graphql.fauna.com/graphql"
      configuration: "fauna_config"
    )

  updateStore(
    id: ID!
    data: StoreInput!
  ): Store
    @graphql(
      endpoint: "https://graphql.fauna.com/graphql"
      configuration: "fauna_config"
    )

  deleteStore(
    id: ID!
  ): Store
    @graphql(
      endpoint: "https://graphql.fauna.com/graphql"
      configuration: "fauna_config"
    )
}
```

### `config.yaml` for `fauna_config`

```yaml
configurationset:
  - configuration:
      name: storyblok_config
      token: xxxx
  - configuration:
      name: fauna_config
      Authorization: Basic MY_FAUNA_KEY
```

### Run `CREATE_STORE`

```graphql
mutation CREATE_STORE {
  createStore(data: {
    name: "Fake Store",
  }) {
    name
    _id
  }
}
```

### Run `FIND_STORE_BY_ID`

```graphql
query FIND_STORE_BY_ID {
  findStoreByID(id: "") {
    _id
    name
    address {
      street
      city
      state
      zipCode
    }
  }
}
```

### Run `UPDATE_STORE_NAME`

```graphql
mutation UPDATE_STORE_NAME {
  updateStore(
    id: ""
    data: {
      name: "Updated Fake Store"
    }
  ) {
    name
    _id
  }
}
```

### Run `DELETE_STORE`

```graphql
mutation DELETE_STORE {
  deleteStore(id: "") {
    _id
    name
  }
}
```

## GraphQL Helix

### Create project and install dependencies

```bash
mkdir -p server/apps/express/src
cd server
yarn init -y
yarn add express graphql-helix graphql serverless-http
yarn add -D serverless-webpack webpack
touch webpack.config.js
cd apps/express
touch src/app.js handler.js serverless.yml
```

### `app.js`

```js
// server/apps/express/src/app.js

import express from "express"
import {
  getGraphQLParameters,
  processRequest,
  renderGraphiQL,
  shouldRenderGraphiQL,
} from "graphql-helix"
import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql"

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: () => ({
      hello: {
        type: GraphQLString,
        resolve: () => "Hello from GraphQL Helix!",
      }
    }),
  }),
})

const app = express()

app.use(express.json())

app.use("/graphql", async (req, res) => {
  const request = {
    body: req.body,
    headers: req.headers,
    method: req.method,
    query: req.query,
  }

  if (shouldRenderGraphiQL(request)) {
    res.send(
      renderGraphiQL()
    )
  }

  else {
    const {
      operationName,
      query,
      variables
    } = getGraphQLParameters(request)

    const result = await processRequest({
      operationName,
      query,
      variables,
      request,
      schema,
    })

    if (result.type === "RESPONSE") {
      result.headers.forEach((
        { name, value }
      ) => res.setHeader(name, value))
      
      res.status(result.status)
      res.json(result.payload)
    }
  }
})

const port = process.env.PORT || 4000

app.listen(port, () => {
  console.log(`GraphQL server is running on port ${port}.`)
})

export default app;
```

### `handler.js`

```js
// server/apps/express/handler.js

import * as serverless from 'serverless-http';
import app from './src/app';

const handler = serverless(app);

export const start = async (event, context) => {
  const result = await handler(event, context);

  return result;
};
```

### `serverless.yml`

```yaml
# server/apps/express/serverless.yml

service: graphql-mashup
frameworkVersion: '2'

provider:
  name: aws
  region: us-west-1
  stage: dev
  runtime: nodejs14.x
  versionFunctions: false
  lambdaHashingVersion: 20201221

  httpApi:
    cors:
      allowedOrigins:
        - '*'
      allowedMethods:
        - GET
        - POST
        - HEAD
      allowedHeaders:
        - Accept
        - Authorization
        - Content-Type

functions:
  endpoint:
    handler: handler.start
    events:
      - httpApi:
          path: '*'
          method: '*'

plugins:
  - serverless-webpack

custom:
  webpack:
    includeModules: false
    packager: yarn
    webpackConfig: ../../webpack.config.js
```

### `webpack.config.js`

```js
// server/webpack.config.js

const path = require('path');
const slsw = require('serverless-webpack');

module.exports = {
  entry: slsw.lib.entries,
  mode: 'production',
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.resolve('.webpack'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.js', '.ts', '.mjs'],
  },
};
```

### Run `serverless deploy`

```bash
serverless deploy
```

### `helix.graphql`

```graphql
type Query {
  hello: String
    @graphql(
      endpoint:""
    )
}
```

### Run `HELLO_QUERY`

```graphql
query HELLO_QUERY {
  hello
}
```

## Redwood App

```bash
yarn create redwood-app stepzen-redwood-users
cd stepzen-redwood-users
```

### Create Users schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = "native"
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
}
```

### Provision a PostgreSQL database with [Railway](http://railway.app/)

```bash
railway login
railway init
railway add
echo DATABASE_URL=`railway variables get DATABASE_URL` > .env
```

### Setup database with Prisma Migrate and generate scaffold

```bash
yarn rw prisma migrate dev --name users-table
yarn rw g scaffold user
yarn rw dev
```

### Setup Netlify Deploy

```bash
yarn rw setup deploy netlify
```

### Push Project to GitHub and Connect Repo to Netlify

Create a blank repository at [repo.new](https://repo.new)

```bash
git init
git add .
git commit -m "users"
git remote add origin https://github.com/ajcwebdev/stepzen-redwood-users.git
git push -u origin main
```

### Test it with a query

```graphql
query USERS_QUERY {
  users {
    id
    name
  }
}
```

### `redwood.graphql`

```graphql
type User {
  id: Int!
  name: String!
}

type Query {
  users: [User!]!
    @graphql(
      endpoint:"https://stepzen-redwood-users.netlify.app/.netlify/functions/graphql"
    )
}
```

## Run all queries

```graphql
query ALL_QUERIES {
  rick_characters {
    results {
      id
      name
      image
    }
  }
  
  PostItems {
    items {
      name
      content {
        intro
        title
      }
    }
  }
  
  findStoreByID(id: "") {
    _id
    name
  }
  
  hello
  
  users {
    name
    id
  }
}
```
