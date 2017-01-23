FROM node:6

ENV TZ="Europe/Rome"

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY . /srv/app

WORKDIR /srv/app

RUN npm run build

CMD npm run start
