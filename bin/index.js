// bot本体

// https://github.com/ttezel/twit

var app = require('../app');
var Twit = require('twit');
var CronJob = require("cron").CronJob;
var moment = require('moment');
var tsv2json = require('node-tsv-json');
var logger = require('./logger');
var fs = require('fs');

// key情報
var T = new Twit({
  consumer_key: app.get('options').key,
  consumer_secret: app.get('options').secret,
  access_token: app.get('options').token,
  access_token_secret: app.get('options').token_secret
});

// botのユーザ名
var bot_name = app.get('options').bot_name;
var target_name = app.get('options').target_name;

// ランダムツイート一覧
var randomTweetList;
// 返信ツイート一覧
var replyTweetList;

var lastTweetId;

// ランダムツイートファイル名
var randomTweetListFile = app.get('options').rand_list_file;

// 返信ツイートファイル名
var replyTweetListFile = app.get('options').reply_list_file;

//--------------------------------------------------------------------------

// 特定のユーザのツイートを取得する
//　https://dev.twitter.com/rest/reference/get/application/rate_limit_status
function rate_limit() {
  var tweets = [];
  T.get('application/rate_limit_status', {}, function(err, data, response) {
    if (typeof data === 'undefined') {
      throw '取得失敗';
    }
    logger.system.info('[rate_limit]data');
    logger.system.info(JSON.stringify(data, null, 2));
  });
}

// つぶやく
//　https://dev.twitter.com/rest/reference/post/statuses/update
function postTweet(message, in_reply_to_status_id) {
  logger.system.info('[postTweet]:' + message);
  if (message) {
    T.post('statuses/update', { status: message, in_reply_to_status_id: in_reply_to_status_id, count: 200 }, function(err, data, response) {
      logger.system.trace('[tweet]data');
      logger.system.trace(data);
      logger.system.trace('[tweet]response');
      logger.system.trace(response);
      if (typeof data === 'undefined') {
        logger.system.error('ツイート失敗したかも');
      }
    });
  }
}

// 特定のユーザのツイートを取得してファイルを更新
//　https://dev.twitter.com/rest/reference/get/statuses/user_timeline
function getSpecUserTweetandUpdateFile(screen_name, since_id) {
  logger.system.debug('[getSpecUserTweetandUpdateFile]screen_name:' + screen_name + ' since_id:' + since_id);
  var tweets = [];

  T.get('statuses/user_timeline', { screen_name: screen_name, since_id: since_id, count: 200 }, function(err, data, response) {
    try {
      logger.system.trace('[tweet]data');
      logger.system.trace(data);
      logger.system.trace('[tweet]response');
      logger.system.trace(response);

      // 取得したツイートを格納
      data.forEach(function(val, i) {
        if (val.hasOwnProperty('id') && val.hasOwnProperty('text')) {
          tweets[i] = {
            'id': val.id,
            'text': val.text
          };
        }
      });

      // 最終ツイートIDを更新
      lastTweetId = tweets[0].id;

      // 新しいツイートを下にする
      tweets.reverse();

      // 各ツイートについて、いろいろ
      for (var i = 0; i < tweets.length - 1; i++) {

        // URL入りはとりあえず除外する
        if (/http/.test(tweets[i].text)) {
          continue;
        }

        /// リプライ系
        if (/@[a-zA-Z0-9]/.test(tweets[i].text)) {
          // ユーザ名は削除する
          var str = tweets[i].text.replace(/@[a-zA-Z0-9_]+\s?/g, '');
          fs.appendFile(replyTweetListFile, str + '\t' + tweets[i].id + '\n', 'utf-8');
        } else {
          fs.appendFile(randomTweetListFile, tweets[i].text + '\t' + tweets[i].id + '\n', 'utf-8');
        }
      }
      logger.system.info('ツイートファイルを更新しました。');

    } catch (e) {
      logger.system.error('[getSpecUserTweet]何かあった');
      logger.system.error(e);
    }
  });
}

// ストリーミングAPIを起動してツイートを受信する
// https://dev.twitter.com/overview/api/tweets
function startStreamingAPI() {
  logger.system.info('streamingAPI起動');
  //var stream = T.stream('user', { stringify_friend_ids: true });
  var stream = T.stream('user');

  stream.on('tweet', function(tweet) {
    try {
      logger.system.debug('[streamingAPI]name:' + tweet.user.name); // ツイートしたユーザの表示名
      logger.system.debug('[streamingAPI]screen_name:' + tweet.user.screen_name); // ユーザ名
      logger.system.debug('[streamingAPI]id:' + tweet.id); // ツイートID
      logger.system.debug('[streamingAPI]text:' + tweet.text);　 // ツイート本文
      logger.system.trace('[streamingAPI]in_reply_to_status_id:' + tweet.in_reply_to_status_id); // リプライ先のツイートID
      logger.system.trace('[streamingAPI]in_reply_to_status_id_str:' + tweet.in_reply_to_status_id_str);
      logger.system.trace('[streamingAPI]in_reply_to_user_id:' + tweet.in_reply_to_user_id); // 返信相手のユーザID(数字の方)
      logger.system.trace('[streamingAPI]in_reply_to_user_id_str:' + tweet.in_reply_to_user_id_str);
      logger.system.trace('[streamingAPI]in_reply_to_screen_name:' + tweet.in_reply_to_screen_name); // 返信相手のユーザ名

      // 自分に対するリプライだった時
      //if (tweet.in_reply_to_screen_name === bot_name) {
      // 本文中にIDが含まれていたら返信することにした。
      if (tweet.text.indexOf('@' + bot_name) != -1) {
        logger.system.debug('自分に返信が来た');

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
      logger.system.error('[startStreamingAPI]何かあった');
      logger.system.error(e);
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
    logger.system.error('[getReplyTweet]何かあった');
    logger.system.error(e);
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
    logger.system.error('[getReplyTweet]何かあった');
    logger.system.error(e);
  } finally {
    return message;
  }
}

// CSVからランダム分に格納する
function updateRandomTweetList() {
  logger.system.debug('[updateRandomTweetList]');
  var tmp = [];
  try {
    tsv2json({
      input: randomTweetListFile,
      output: null,
      parseRows: true
    }, function(err, result) {
      if (err) {
        logger.system.error(err);
      } else {
        var id;
        result.forEach(function(v) {
          if (v[1]) {
            id = v[1];
          }
          tmp.push(v[0]);
        });
        randomTweetList = tmp;
        // 最終ツイートIDを更新
        if (id) {
          lastTweetId = id;
        }
      }
      logger.system.info('最終ツイートID:' + lastTweetId);
      logger.system.trace(randomTweetList);
    });

  } catch (e) {
    logger.system.error('[updateRandomTweetList]何かあった');
    logger.system.error(e);
  }
}

// CSVから返信リストに格納する
function updateReplyTweetList() {
  logger.system.debug('[updateReplyTweetList]');
  var tmp = [];
  try {
    tsv2json({
      input: replyTweetListFile,
      output: null,
      parseRows: true
    }, function(err, result) {
      if (err) {
        logger.system.error(err);
      } else {
        result.forEach(function(v) {
          tmp.push(v[0]);
        });
        replyTweetList = tmp;
      }
      logger.system.trace(replyTweetList);
    });

  } catch (e) {
    logger.system.error('[updateReplyTweetList]何かあった');
    logger.system.error(e);
  }
}


//--------------------------------------------------------------------------
// 実行内容
// 定期実行する
// 秒 分 時 日 月 週
var cronTweet = new CronJob({
  cronTime: '0 */20 6-23 * * *',
  //cronTime: '0 * * * * *',
  onTick: function() {
    postTweet(getRandomTweet());
  },
  start: false,
});

var cronUpdate = new CronJob({
  cronTime: '0 0 0 * * *',
  onTick: function() {
    // ツイート取得とファイル更新
    // 非同期だから反映は翌日
    getSpecUserTweetandUpdateFile(target_name, lastTweetId);
    // ファイルから読み込み
    updateRandomTweetList();
    updateReplyTweetList();
  },
  start: false,
});
//--------------------------------------------------------------------------

// APIの残量
//rate_limit();

// cronを実行
cronUpdate.start();
cronTweet.start();

// ストリーミングAPI起動
startStreamingAPI();

// ツイート取得とファイル更新
//getSpecUserTweetandUpdateFile(target_name, lastTweetId);

// テキストから読み込む
updateRandomTweetList();
updateReplyTweetList();

//---------------------------------------------------------------------------

