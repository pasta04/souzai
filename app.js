var express = require('express');
var app = express();


var options = {
  // 環境変数から Titter アプリケーションのキー等を取得
  key: process.env.TWIBOT_TWITTER_KEY,
  secret: process.env.TWIBOT_TWITTER_SECRET,
  token: process.env.TWIBOT_TWITTER_TOKEN,
  token_secret: process.env.TWIBOT_TWITTER_TOKEN_SECRET,
  // botの名前
  bot_name: process.env.TWIBOT_BOT_NAME,
  // ツイートリスト
  rand_list_file: process.env.TWIBOT_RAND_LIST_FILE,
  reply_list_file: process.env.TWIBOT_REPLY_LIST_FILE
};
app.set('options', options);

// ポートをセット
app.set('port', (process.env.PORT || 5000));
// 静的コンテンツはこの配下
app.use(express.static(__dirname + '/public'));

// 直接アクセスされた場合
app.get('/', function(request, response) {
  //response.send('惣菜屋');
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});

module.exports = app;

