FROM node:6

COPY . /srv/app

WORKDIR /srv/app

RUN npm run build

CMD npm run start
