const WebClient = require('@slack/client').WebClient;

export const postOnSlack = (json, botAccessToken) => {
  console.log(' =>  => botAccessToken', botAccessToken);
  const web = new WebClient(botAccessToken);
  web.chat.postMessage(json.channel, json.text, json.opts, (err) => {
    if (err) {
      console.log('Error:', err);
    }
  });
};

export const postOnSlackMultipleChannels =
  (json, channels, botAccessToken) => Promise.all(channels.map(c =>
    postOnSlack({ channel: c, ...json }, botAccessToken)));
