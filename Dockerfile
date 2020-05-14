# build environment
FROM node AS builder
RUN mkdir /usr/src/app
WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH
COPY package.json /usr/src/app/package.json
RUN npm install # --silent
RUN npm install react-scripts -g --silent
COPY . /usr/src/app

#CMD ["npm", "start"]
RUN npm run build

FROM nginx:stable-alpine 
COPY --from=builder /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


