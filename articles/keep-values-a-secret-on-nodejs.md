---
title: "【Node.js / Express 版】GitHub に公開したくない変数や値を隠して push する方法"
emoji: "📚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Node.js", "Express", "GitHub", "Git"]
published: true
order: 5
---

GitHub にパブリックでソースコードを公開するときに、そのソースコードに API key やパスワードなどが含まれていた場合は、その部分だけを隠す必要があります。

調べてみると、たしかにパスワード等を隠して push する方法が書かれたサイトがたくさん出てきますが、ほとんどが Rails の記事でした (自分が調べた限りでは)

環境変数を利用するという方法もありましたが、起動する度に環境変数を入力しないといけないので大変です。

自分は今 Express (Node.js) で開発しているので、なんとかして環境変数以外の方法でできるようにならないかと調べていたら良い方法が見つけました。

# 外部ファイルに設定を移す
今回は例として、ポート番号とテストサーバのIPアドレスを GitHub では公開せずに、実際の運用のときには使えるようにすることにします。

## config.js に公開したくない情報を書く
```lang:config.js
exports.port = 3000;
exports.url  = 'http://192.168.33.10:3000';
```

## プログラムから読み込む
```lang:app.js
var config  = require('./config');
```
プログラム (app.js) と設定ファイル (config.js) は同じディレクトリに置いてください。違うディレクトリに置きたい場合は、各自 require のパスを変更してください。

## 値を使う
```lang:app.js
var config = require('./config');

~~ 省略 ~~

app.locals.home = {
  url: config.url
};

~~ 省略 ~~

app.listen(config.port);
console.log('Server running on port ' + config.port + ' ...');
```
このように、直接プログラムにポート番号やURLを書かなくても使えるようになります。

## gitignore に設定
せっかく config.js に値を切り出しても、このファイルを GitHub に公開してしまっては元も子もありません。なので、gitignore で config.js を公開しないように設定します。

Git で管理するディレクトリ (.git があるディレクトリ) に `.gitignore` というファイルを生成します。そして、.gitignore に以下を書いて保存します。

```lang:.gitignore
config.js
```

※ config.js が .git と同じディレクトリにない場合は、各自で適切なパスを設定してください。

これで完了です。安心して GitHub に公開できます。
