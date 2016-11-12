souzai -惣菜-
====

##Overview

惣菜botです。
たぶん、Node.jsがあれば動きます。

## Description

省略。

## Requirement

Node.js  
つぶやきリストのテキストファイル。形式はdataフォルダ配下のサンプル参照。

## Usage
`npm start`

## Install

1.パッケージを適当な所に配置する。

2.必要なパッケージをインストールする。

    cd [配置したパッケージ]
    node install

3.環境変数をセットする。

以下はLinuxの場合。Windowsならset 環境変数名=値

    export TWIBOT_TWITTER_KEY=ツイッターアプリケーションのKEY  
    export TWIBOT_TWITTER_SECRET=ツイッターアプリケーションのKEY  
    export TWIBOT_TWITTER_TOKEN=トークン
    export TWIBOT_TWITTER_TOKEN_SECRET=トークンのSECRET
    export TWIBOT_BOT_NAME=BOTのユーザID(数字じゃなくてscreen_nameの方)
    export TWIBOT_RAND_LIST_FILE=ランダムツイートリストのファイル名。(例：./data/rand.tsv)
    export TWIBOT_REPLY_LIST_FILE=ランダム返信ツイートリストのファイル名。
    
4.実行する。

`npm start`

## Contribution

## Licence

[MIT](https://github.com/tcnksm/tool/blob/master/LICENCE)

## Author

[pasta04](https://github.com/pasta04)
