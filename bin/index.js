// bot本体

// https://github.com/ttezel/twit

var app = require('../app');
var Twit = require('twit');
var CronJob = require("cron").CronJob;
var moment = require('moment');
var tsv2json = require('node-tsv-json');

// key情報
var T = new Twit({
  consumer_key: app.get('options').key,
  consumer_secret: app.get('options').secret,
  access_token: app.get('options').token,
  access_token_secret: app.get('options').token_secret
});

// botのユーザ名
var bot_name = app.get('options').bot_name;

// ランダムツイート一覧
var randomTweetList; //= ['ランダム犬', 'ランダム猫', 'ランダム鳥', 'ランダムタコ', 'ランダムイカ'];
// 返信ツイート一覧
var replyTweetList; // = ['返信犬', '返信猫', '返信鳥', '返信タコ', '返信イカ'];

// ランダムツイートファイル名
var randomTweetListFile = app.get('options').rand_list_file;

// 返信ツイートファイル名
var replyTweetListFile = app.get('options').reply_list_file;

//--------------------------------------------------------------------------

// つぶやく
//　https://dev.twitter.com/rest/reference/post/statuses/update
function postTweet(message, in_reply_to_status_id) {
  console.log('[postTweet]メッセージ:' + message);
  try {
    if (message) {
      T.post('statuses/update', { status: message, in_reply_to_status_id: in_reply_to_status_id }, function(err, data, response) {
        //console.log('[tweet]data');
        //console.log(data);
        //console.log('[tweet]response');
        //console.log(response);
        if (typeof data === 'undefined') {
          console.log('ツイート失敗したかも');
        }
      });
    }
  } catch (e) {
    console.log('[postTweet]何かあった');
    console.log(e);
  }
}

// ストリーミングAPIを起動してツイートを受信する
// https://dev.twitter.com/overview/api/tweets
function startStreamingAPI() {

  //var stream = T.stream('user', { stringify_friend_ids: true });
  var stream = T.stream('user');
  console.log('streamingAPI起動');

  stream.on('tweet', function(tweet) {
    try {
      //console.log('[streamingAPI]');
      //console.log(tweet);
      console.log('[streamingAPI]name:' + tweet.user.name); // ツイートしたユーザの表示名
      console.log('[streamingAPI]screen_name:' + tweet.user.screen_name); // ユーザ名
      console.log('[streamingAPI]id:' + tweet.id); // ツイートID
      console.log('[streamingAPI]text:' + tweet.text);　 // ツイート本文
      //console.log('[streamingAPI]in_reply_to_status_id:' + tweet.in_reply_to_status_id); // リプライ先のツイートID
      //console.log('[streamingAPI]in_reply_to_status_id_str:' + tweet.in_reply_to_status_id_str);
      //console.log('[streamingAPI]in_reply_to_user_id:' + tweet.in_reply_to_user_id); // 返信相手のユーザID(数字の方)
      //console.log('[streamingAPI]in_reply_to_user_id_str:' + in_reply_to_user_id_str);
      //console.log('[streamingAPI]in_reply_to_screen_name:' + tweet.in_reply_to_screen_name); // 返信相手のユーザ名

      // 自分に対するリプライだった時
      if (tweet.in_reply_to_screen_name === bot_name) {
        console.log('自分に返信が来た');

        // 返信相手
        var prefix = '';
        if (typeof tweet.user.screen_name !== undefined && tweet.user.screen_name !== null) {
          prefix = '@' + tweet.user.screen_name + ' ';
        }
        // 返信メッセージを決定
        var message = prefix + getReplyTweet();
        // 返信する
        postTweet(message, tweet.id);
      }

    } catch (e) {
      console.log('何かあった');
      console.log(e);
    }
  });
}

// yyyyMMddhhmmss時間を取得する
function getTime() {
  var dt = new Date();
  //年
  var year = dt.getFullYear();
  //月
  //1月が0、12月が11。そのため+1をする。
  var month = dt.getMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }
  //日
  var date = dt.getDate();
  if (date < 10) {
    date = '0' + date;
  }
  //時
  var hours = dt.getHours();
  if (hours < 10) {
    hours = '0' + hours;
  }
  //分
  var minutes = dt.getMinutes();
  if (minutes < 10) {
    minutes = '0' + minutes;
  }
  //秒
  var seconds = dt.getSeconds();
  if (seconds < 10) {
    seconds = '0' + seconds;
  }

  var time = '' + year + month + date + hours + minutes + seconds;
  return time;
}

// リプライ用のツイートをランダムに選定
function getReplyTweet() {
  var message = null;

  try {
    message = replyTweetList[Math.floor(Math.random() * replyTweetList.length)];
  } catch (e) {
    console.log('[getReplyTweet]何かあった');
    console.log(e);
  } finally {
    return message;
  }
}

// 普段つぶやくランダムツイート
function getRandomTweet() {
  var message = null;

  try {
    message = randomTweetList[Math.floor(Math.random() * randomTweetList.length)];
  } catch (e) {
    console.log('[getReplyTweet]何かあった');
    console.log(e);
  } finally {
    return message;
  }
}

// CSVからランダム分に格納する
function updateRandomTweetList() {
  console.log('[updateRandomTweetList]');
  var tmp = [];
  try {
    tsv2json({
      input: randomTweetListFile,
      output: null,
      parseRows: true
    }, function(err, result) {
      if (err) {
        console.error(err);
      } else {
        //console.log(result);
        result.forEach(function(v) {
          //console.log(v);
          tmp.push(v[0]);
        });
        //console.log(randomTweetList);
        randomTweetList = tmp;
      }
    });

  } catch (e) {
    console.log('[updateRandomTweetList]何かあった');
    console.log(e);
  }
}

// CSVから返信リストに格納する
function updateReplyTweetList() {
  console.log('[updateReplyTweetList]');
  var tmp = [];
  try {
    tsv2json({
      input: replyTweetListFile,
      output: null,
      parseRows: true
    }, function(err, result) {
      if (err) {
        console.error(err);
      } else {
        //console.log(result);
        result.forEach(function(v) {
          //console.log(v);
          tmp.push(v[0]);
        });
        replyTweetList = tmp;
        //console.log(replyTweetList);
      }
    });

  } catch (e) {
    console.log('[updateReplyTweetList]何かあった');
    console.log(e);
  }
}


//--------------------------------------------------------------------------
// 実行内容
// 定期実行する
// 秒 分 時 日 月 週
var cronTweet = new CronJob({
  cronTime: '0 */20 6-23 * * *',
  onTick: function() {
    postTweet(getRandomTweet());
  },
  start: false,
});

var cronUpdate = new CronJob({
  cronTime: '0 0 0 * * *',
  onTick: function() {
    updateRandomTweetList();
    updateReplyTweetList();
  },
  start: false,
});
//--------------------------------------------------------------------------

// cronを実行
cronUpdate.start();
cronTweet.start();

// ストリーミングAPI起動
startStreamingAPI();

// テキストから読み込む
updateRandomTweetList();
updateReplyTweetList();

//---------------------------------------------------------------------------

