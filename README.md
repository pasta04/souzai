souzai -惣菜-
====

##Overview

( ^ω^)惣菜botでしょー  
たぶん、Node.jsがあれば動きます。

## Description
- 定期的につぶやきリストの内容をつぶやきます。
- ストリーミングでツイートを受信し、当botに返信があれば返信用リストからランダムに返信します。
- 毎日0時に指定されたテキストファイルを読んで、つぶやきリストを更新します。

## Requirement
- Node.js  
- つぶやきリストのテキストファイル2種。形式はdataフォルダ配下のサンプル参照。

## Usage
###環境変数をセット
``` 
export TWIBOT_TWITTER_KEY=ツイッターアプリケーションのKEY  
export TWIBOT_TWITTER_SECRET=ツイッターアプリケーションのKEY  
export TWIBOT_TWITTER_TOKEN=トークン  
export TWIBOT_TWITTER_TOKEN_SECRET=トークンのSECRET  
export TWIBOT_BOT_NAME=BOTのユーザID(数字じゃなくてscreen_nameの方)  
export TWIBOT_RAND_LIST_FILE=ランダムツイートリストのファイル名。(例：./data/rand.tsv)  
export TWIBOT_REPLY_LIST_FILE=ランダム返信ツイートリストのファイル名。  
``` 
###実行
`npm start`

## Install

###パッケージを適当な所に配置する。
```
cp souzai-master.zip [どこか]
cd [どこか]
unzip souzai-master.zip
```
※gitでcloneするのもあり。

###必要なパッケージをインストールする。
``` 
cd souzai-master
node install
``` 

## Licence

[MIT](https://github.com/tcnksm/tool/blob/master/LICENCE)

## Author

[pasta04](https://github.com/pasta04)
