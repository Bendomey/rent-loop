FROM node:20-alpine AS base

# Install Java Runtime Environment (OpenJDK 11) for pdf3html library
# Required for Apache Tika and PDFBox dependencies
RUN apk add --no-cache openjdk11-jre

# Verify Java installation
RUN java -version

# install all node_modules, including dev
FROM base as deps

RUN mkdir /app/
WORKDIR /app/

ADD package.json yarn.lock ./

RUN yarn install --frozen-lockfile --production=false

# setup production node_modules
FROM base as production-deps

RUN mkdir /app/
WORKDIR /app/

ADD package.json yarn.lock /app/
RUN yarn install --frozen-lockfile --production=true

# build app
FROM base as build

ARG COMMIT_SHA
ENV COMMIT_SHA=$COMMIT_SHA

RUN mkdir /app/
WORKDIR /app/

COPY --from=deps /app/node_modules /app/node_modules

# app code changes all the time
ADD . .
RUN yarn build

# build smaller image for running
FROM base

ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV

ENV PORT=3000

COPY --from=production-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
COPY --from=build /app/public /app/public
COPY --from=build /app/package.json /app/package.json
WORKDIR /app

CMD ["yarn", "start"]
EXPOSE 3000
