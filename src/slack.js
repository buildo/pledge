const WebClient = require('@slack/client').WebClient;

export const postOnSlack = async (json, botAccessToken) => {
  const web = new WebClient(botAccessToken);
  web.im.list((err, result) => {
    if (err) {
      return console.log(err);
    } else {
      const imChannel = result.ims.find((im) => im.user === json.channel).id;
      return web.chat.postMessage(imChannel, json.text, json.opts, (err) => {
        if (err) {
          console.log('Error:', err);
        }
      });
    }
  });
};

export const postOnSlackMultipleChannels =
  (json, channels, botAccessToken) => Promise.all(channels.map(c =>
    postOnSlack({ channel: c, ...json }, botAccessToken)));
