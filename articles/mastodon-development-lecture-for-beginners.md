---
title: "ディレクトリ構成から見る Rails 初心者のための Mastodon 開発講座"
emoji: "📑"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["mastodon", "Rails", "Ruby"]
published: false
order: 44
---

# あいさつ
これは、[Mastodon Advent Calendar 2017](https://qiita.com/advent-calendar/2017/mastodon) の 25 日目の記事です。記事を担当する @noraworld です。実は Qiita アドベントカレンダーに投稿するのは今回が初めてです。よろしくお願いします。

12 月 25 日といえばクリスマスですが、みなさんいかがお過ごしでしょうか。僕は特に用事がないので、いつも通り家にこもっています。寂しいです。彼女欲しいです。

# この記事で紹介すること
それはさておき、日本では今年の 4 月に話題になり一気に広まった Mastodon。4 月当初から個人でインスタンスを立ち上げて、すっかり Mastodon の魅力にハマってしまいました。

Mastodon は Twitter と性質が似ていることから、よく Twitter と比較されることがありますが、Twitter と違う大きな特徴の一つとして、誰でも Mastodon の開発に関わることができ、コントリビュートできることがあげられます。技術者として、これはかなり大きなポイントだと思っています。

ところが、コントリビュートしたくても、Rails をよく知らないので、Rails を勉強するところからはじめないといけないのでハードルが高い… と思っている方が一定数いるのではないかと予想しています。

そこで今回は、Web の技術者・エンジニアだけど、Rails は全く触れたことがない、という人のために、Rails のディレクトリ構成から、なんとなくここをいじればいいんだなってことがわかるようになるまでのサポート的な記事を書きたいと思います。

Rails を全くやったことがない人が、いきなり Mastodon のコードを見ても、そもそもどこのファイルにどの機能のコードがあるのかがわからないのではないかと思ったので、この記事では、Mastodon にこういう機能を実装したい／ここのバグを修正したいと思ったときに、だいたいどのファイルをいじれば良いのかがなんとなくわかるようになることを目標にしています。

# ルートディレクトリ
Mastodon のコードは、[tootsuite / mastodon](https://github.com/tootsuite/mastodon) にあります。ここをルートディレクトリとします。

ルートディレクトリ直下にたくさんのファイルがあるかと思いますが、多くは設定ファイルです。はじめて Mastodon にコントリビュートする際は、いじることはあまりないと思います。Mastodon に開発に慣れてきたら、それぞれ確認してみると良いと思います。

# app
基本的な機能が実装されている部分は、[app](https://github.com/tootsuite/mastodon/tree/master/app) ディレクトリにあります。そのため、基本的には `/app` 以下を主にいじっていくことになると思います。まずは、`/app` の中身から見ていくことにしましょう。

## app/controllers, app/models, app/views
この 3 つは、Mastodon (Rails) のコアになる処理が書かれている重要な部分なので、より丁寧に紹介していきます。

Rails アプリケーションは、MVC アーキテクチャに基づいて作られています。M (Model) は、データを処理する部分、V (View) は、HTML を構成する見た目を決める部分、そして、C (Controller) は、Model と View を取り持つ処理を行う部分です。

わかりやすく例えると以下の通りです。

* **Model:** 「トゥートの文字数は 500 文字まで」や「メンションはメンション元のトゥートと belongs_to の関係で紐付いている」などの DB の制約などを処理
* **View:** タイムラインが表示されるページなどの HTML を表示する部分の処理
* **Controller:** トゥートの入力欄に入力された文字列を取得し、DB に保存するなど、Model と View を取りまとめる処理

厳密に言うと、500 文字制限は、[app/validators/status_length_validator.rb](https://github.com/tootsuite/mastodon/blob/master/app/validators/status_length_validator.rb) に書かれていて、それを Model 側で読み込んでいるのですが、イメージとしては、概ねこんな感じです。

Model は [app/models](https://github.com/tootsuite/mastodon/tree/master/app/models) 以下に、View は [app/views](https://github.com/tootsuite/mastodon/tree/master/app/views) 以下に、そして Controller は [app/controllers](https://github.com/tootsuite/mastodon/tree/master/app/controllers) にそれぞれあります。

たとえば、アカウントに関する DB の処理に変更を加えたければ、[app/models/account.rb](https://github.com/tootsuite/mastodon/blob/master/app/models/account.rb) を、リモートフォローに関する処理に変更を加えたければ、[app/controllers/remote_follow_controller.rb](https://github.com/tootsuite/mastodon/blob/master/app/controllers/remote_follow_controller.rb) を編集すれば良いといった具合です。

### Controller 内の特殊なメソッドについて
Controller 内のファイル (`/app/controllers` 内のファイル) の中を見てみると、いくつかのメソッド (`def` から `end` までのブロック) で構成されていることがわかります。そのメソッドのうち、以下の 7 つのメソッドは、他のメソッドとは少し違う特別な意味を持っています。

* index
* show
* new
* create
* edit
* update
* destroy

上記 7 つのメソッドの意味について、ブログアプリを例に説明します。

#### index
ブログ記事一覧を表示する際に処理される部分が index メソッドです。記事が 10 件あったら、その 10 件を DB から検索して変数に格納するといった処理を行う部分です。

#### show
10 件あるうちの一つの記事の内容を表示する際に処理される部分が show メソッドです。10 件の記事に、投稿順に 1 〜 10 までの id がふられているとしたら、3 つめの記事を DB から検索して変数に格納するといった処理を行う部分です。

#### new
新しく記事を追加するときに、新規投稿ページが表示される際に処理される部分が new メソッドです。

#### create
新しく記事が追加される直前 (POST リクエストが送信されたとき) に処理される部分が create メソッドです。その記事が正しく投稿できたかどうかを判定したり、正しく投稿できた場合は、記事詳細ページにリダイレクトする、正しく投稿できなかった場合は、新規投稿ページをレンダリングして、「投稿に失敗しました」などのメッセージを表示させるための処理を行ったりする部分です。

#### edit
一度、投稿された記事を編集するときに、記事編集ページが表示される際に処理される部分が edit メソッドです。どの記事を編集するのかを DB から検索して、変数に格納するといった処理を行う部分です。

#### update
記事を編集する直前 (POST リクエストが送信されたとき) に処理される部分が update メソッドです。create メソッド同様に、正しく編集できたかどうかの判定したりする処理を行う部分です。

### destroy
投稿された記事を削除する際に処理される部分が destroy メソッドです。削除する記事を DB から検索して削除したり、削除したあとに、記事一覧ページにリダイレクトしたりする処理を行う部分です。

この 7 つのメソッドは、「このメソッドは、こういうときにこういう目的で実行されます」といったことをわざわざ設定に書かなくても Rails がよしなに解釈して、適切なタイミングで処理してくれるものです。

すべての Controller において上記 7 つのすべてのメソッドがあるわけではありません。たとえばフォロー処理を行う [account_follow_controller.rb](https://github.com/tootsuite/mastodon/blob/master/app/controllers/account_follow_controller.rb) では、「フォローする」という機能しかなく、これに該当するのは、ブログアプリでいう「記事を投稿する」という部分なので、create メソッドのみになります。

### Controller 内のメソッドと View の対応関係について
[Model](https://github.com/tootsuite/mastodon/tree/master/app/models) や [Controller](https://github.com/tootsuite/mastodon/tree/master/app/controllers) は、ディレクトリ直下にファイルがあるのに対して、[View](https://github.com/tootsuite/mastodon/tree/master/app/views) は、ディレクトリ直下にさらにディレクトリがあります。

たとえば、Mastodon の [About ページ](https://mastodon.noraworld.jp/about) の HTML を編集したかったら、[app/views/about](https://github.com/tootsuite/mastodon/tree/master/app/views/about) を見れば良いのですが、その中にファイルが複数あって、どれを編集したら良いのかわからない… と思ってしまう方もいるかもしれません。

しかし、先ほど説明した Controller 内の 7 つのメソッドと View のファイルは対応しています。About ページは、ただページを表示するだけなので、ブログアプリでいう「記事の内容を表示する」部分になります。つまり show メソッドが呼び出されるわけです。実際に、[about_controller.rb](https://github.com/tootsuite/mastodon/blob/master/app/controllers/about_controller.rb) を見れば、show メソッドがあることがわかります。

ここまで来ると後はだいたい想像がつくかもしれませんが、About ページは show メソッドと対応するファイル名である [app/views/about/show.html.haml](https://github.com/tootsuite/mastodon/blob/master/app/views/about/show.html.haml) になります。

このように、Rails では、ディレクトリの構成やファイル名を見て、呼び出すメソッドや HTML を判断するので、ファイル名を見れば、どの Controller (Controller 内のメソッド) と View が結びついているかがわかるようになっています。

7 つのメソッド以外のファイル名になっているファイル ([more.html.haml](https://github.com/tootsuite/mastodon/blob/master/app/views/about/more.html.haml) や [terms.html.haml](https://github.com/tootsuite/mastodon/blob/master/app/views/about/terms.html.haml)) がどこのページと対応しているのかについては、[config/routes.rb](https://github.com/tootsuite/mastodon/blob/master/config/routes.rb) を見るとわかるようになっています。詳しくは後述します。

また、アンダースコアから始まっているファイル ([_registration.html.haml](https://github.com/tootsuite/mastodon/blob/master/app/views/about/_registration.html.haml) など) は、`render` を使うことで、他の HTML から呼び出すことができます。

たとえば、`/app/views/about/_registration.html.haml` は、About ページの新規登録を行うフォームの部分にあたる HTML なのですが、`/app/views/about/show.html.haml` 内で `render 'registration'` とすることで、その部分に `_registration.html.haml` の HTML がごっそり入ることになります。

別のページにも同じ新規登録フォームを表示させたいときに、同じ HTML を何度も書かないようにしたり、部品ごとにファイルを分けることで管理しやすくしたりするときに使います。

### @変数について
View の HTML を見ていると、@ (アットマーク) がついた変数があることに気づくと思いますが、これは、Controller 内で定義されているインスタンス変数と呼ばれるものです。

Controller 内で処理した結果を View で使いたいことが多々あります。そのときに Controller 内でインスタンス変数に格納しておくことで、その変数を View で使用することができます。

たとえば、Controller 内で、DB からユーザの一覧を取得する処理を書いたとします。そのユーザ一覧を表示するには、Controller で、取得したユーザ一覧を、@変数に代入して、View 側でその変数をループで回して表示したりすることができます。

アットマークをつけていない変数に値を代入して View 側でその変数を使おうとするとエラーになるので注意してください。また、Controller と View で変数を受け渡すことができるのは、対応した Controller と View だけです。

## app/helper
`/app/helper` 内には、様々なヘルパーが用意されています。ヘルパーは、よく使用される処理をまとめた便利メソッドで、View のいたるところに登場します。View 内のファイルを見ていて、そのファイル内にも、対応する Controller 側にも定義されていないメソッドが出てきたら、それはヘルパーで用意されているものかもしれません。

複数の箇所で同じような処理の結果を表示させたい場合や、ヘルパーとして用意されているメソッドに何かバグがあった場合は、`/app/helper` 内を確認してみましょう。

## app/javascript
`/app/javascript` には、CSS や JavaScript、画像ファイルなどがあります。

* **JavaScript:** [app/javascript/mastodon](https://github.com/tootsuite/mastodon/tree/master/app/javascript/mastodon) と [app/javascript/packs](https://github.com/tootsuite/mastodon/tree/master/app/javascript/packs)
* **CSS:** [app/javascript/styles](https://github.com/tootsuite/mastodon/tree/master/app/javascript/styles)
* **画像ファイル:** [app/javascript/images](https://github.com/tootsuite/mastodon/tree/master/app/javascript/images)
* **フォントファイル:** [app/javascript/fonts](https://github.com/tootsuite/mastodon/tree/master/app/javascript/fonts)

画像とフォントを変更する機会は、本家にコントリビュートするならあまりないかもしれませんが、JavaScript と CSS は変更することがあるかもしれません。該当する処理を行う JavaScript や、該当するスタイルを適用している CSS がどのファイルかは、ファイル名を見たりして判断してください。

## app/lib
`/app/lib` には、Mastodon 内で使用されるライブラリのような役割のコードが入っています。Ruby のコードの中のいたるところで登場します。ヘルパー同様、どこにも定義されていないクラスやメソッドが使用されていたら、`/app/lib` 内のコードで定義されているか確認してみましょう。

## app/mailers
Mastodon では、フォローされたときやメンションが来たときに、メールで通知を受け取ったりすることができます。そのメールの処理を行っているのが `/app/mailers` 内になります。

## app/validators
DB のバリデーションに関する処理がまとめられています。たとえば、[status_length_validator.rb](https://github.com/tootsuite/mastodon/blob/master/app/validators/status_length_validator.rb) は、500 文字という、トゥートの文字数制限をバリデーションする処理が書かれていて、これが、Model 側の [app/models/status.rb](https://github.com/tootsuite/mastodon/blob/master/app/models/status.rb) で `validates_with StatusLengthValidator` という形で呼び出されています。

Model は DB に関する処理を行う場所なので、バリデーションを Model 内のファイルに直接書くこともできますが、Mastodon では、バリデーションは `app/validators` 側で管理されているようです。

# bin
Rails で使用されるコマンドの設定ファイルが入っています。`rails` コマンドはもちろん、`bundle` コマンドや `rake` コマンドなども用意されています。ここにあるファイルを編集することはほとんどないかと思います。

# config
`/config` には各種設定や環境をはじめとした重要なファイルがあります。コントリビュートをするに当たって重要なファイルを中心に紹介していきます。

## config/routes.rb
Web のルーティングを設定する重要なファイルです。先ほど、Controller 内の 7 つの特殊なメソッドは View と対応していると説明しましたが、それ以外のメソッドと View の対応は、このファイルを見ればわかります。

たとえば、[more.html.haml](https://github.com/tootsuite/mastodon/blob/master/app/views/about/more.html.haml) や [terms.html.haml](https://github.com/tootsuite/mastodon/blob/master/app/views/about/terms.html.haml) は、`/app/views/about` 直下のファイルなので、About に関するどこかのページの HTML だということまではわかるのですが、具体的にどのページなのかはわかりません。(ファイル名がわかりやすいので、想像でわかる気もしますが…)

そこで、[config/routes.rb](https://github.com/tootsuite/mastodon/blob/master/config/routes.rb) を見てみましょう。`resource` や `resources` となっている箇所が多いことがわかりますが、これが 7 つの特殊なメソッドとルーティングの対応関係を定義している部分になります。`resource` や `resources` を使うことで、たとえば記事一覧にアクセスがあったときに、この Controller の index メソッドを呼び出して、記事の詳細にアクセスがあったときに show メソッドを呼び出して、新しい記事を書くページで POST リクエストがあったら create メソッドを呼び出して、…… などと、個別に設定する必要がありません。

ただ、About ページに関しては、記事の投稿や更新などがあるわけではなく、単にページを表示するだけなので、`resource` を使用しておらず、以下のように定義されています。

```ruby
get '/about', to: 'about#show'
get '/about/more', to: 'about#more'
get '/terms', to: 'about#terms'
```

1 行目の `get '/about', to: 'about#show'` は、`/about` で GET リクエストがあった場合に、[about_controller.rb](https://github.com/tootsuite/mastodon/blob/master/app/controllers/about_controller.rb) の `show` メソッドが実行される、という意味です。そして、それに対応する HTML である、[app/views/about/show.html.haml](https://github.com/tootsuite/mastodon/blob/master/app/views/about/show.html.haml) が表示されるわけです。

同じように 2 行目は、`/about/more` でアクセスがあったときに、[about_controller.rb](https://github.com/tootsuite/mastodon/blob/master/app/controllers/about_controller.rb) の `more` メソッドが呼ばれ、[app/views/about/more.html.haml](https://github.com/tootsuite/mastodon/blob/master/app/views/about/more.html.haml) が表示されます。

[about_controller.rb](https://github.com/tootsuite/mastodon/blob/master/app/controllers/about_controller.rb) の `more` メソッドは、`def more; end` となっており、定義されているものの、何も実行されません。つまり、`/about/more` にアクセスがあったときは、単に [app/views/about/more.html.haml](https://github.com/tootsuite/mastodon/blob/master/app/views/about/more.html.haml) が表示されるだけ、ということになります。

3 行目の terms に関しても同様で、`/terms` にアクセスがあると、[app/views/about/terms.html.haml](https://github.com/tootsuite/mastodon/blob/master/app/views/about/terms.html.haml) が表示されます。

あるページにアクセスがあったときに実行される Controller 内のメソッドと、そのページで表示される View 内の HTML は対応しています。7 つの特殊なメソッドの場合は、それぞれどんな役割を持っているのかあらかじめわかるようになっていますが、たとえば About の more や terms などは、メソッド名を見ただけでは、そのメソッドの役割や、どの URL でアクセスしたときに呼ばれるのかがわからないので、そういうときは、[config/routes.rb](https://github.com/tootsuite/mastodon/blob/master/config/routes.rb) を見てみましょう。

## config/locales
各言語の翻訳ファイルが入っています。たとえば、[config/locales/ja.yml](https://github.com/tootsuite/mastodon/blob/master/config/locales/ja.yml) を見ると、日本語の翻訳が書かれています。言語設定を日本語にしていて、日本語に翻訳されていない部分があったり、不自然な日本語を発見した場合はこのファイルを確認してみましょう。

# db
ここにはデータベースのスキーマやマイグレーションファイルなどが入っています。このディレクトリ内のファイルを編集することはほとんどなく、マイグレーションを実行する際に [db/migrate](https://github.com/tootsuite/mastodon/tree/master/db/migrate) に新しくファイルを生成するくらいだと思います。Rails でのマイグレーションについては他の記事を参考にしてください。

# docs
Mastodon のドキュメントが入っていますが、今は、[tootsuite / documentation](https://github.com/tootsuite/documentation) に移行したので、こちらを参照してください。ドキュメントは、Mastodon の開発とは直接は関係ないので、ここでの説明は省略します。

# lib
Mastodon 全体で使用されるライブラリや設定などが書かれたファイルが入っています。このディレクトリ内のファイルをいじる機会はあまりないかと思いますが、[lib/tasks](https://github.com/tootsuite/mastodon/blob/master/lib/tasks) の中にはコマンドラインから実行する、Rake と呼ばれるタスク実行ファイルが入っており、特に [lib/tasks/mastodon.rake](https://github.com/tootsuite/mastodon/blob/master/lib/tasks/mastodon.rake) は、Mastodon で使用される Rake タスクが定義されています。

たとえば、`bundle exec rails mastodon:make_admin USERNAME=alice` を実行すると、`@alice` を管理者に昇格させたり、`bundle exec rails mastodon:confirm_email USER_EMAIL=alice@example.com` を実行すると、`alice@example.com` で登録したアカウントのメールアドレスの確認をスキップできたりします。このような便利タスクが、[lib/tasks/mastodon.rake](https://github.com/tootsuite/mastodon/blob/master/lib/tasks/mastodon.rake) にあるので、もし他に新しくタスクを追加したかったり、既存のタスクを編集したりしたい場合はここを見てみると良いでしょう。

# log
ここは Rails のログが入るところです。開発中に何かエラーが起こったりしたときは、ここを見てみると良いでしょう。

# public
ここには静的ファイルが置かれています。500 エラーが発生したときに表示される HTML や、ファビコンなどがあります。

# spec
Ruby のテストフレームワークである RSpec のテストファイルが入っているディレクトリです。spec ディレクトリ内のディレクトリ構成は、app ディレクトリ内とだいたい同じです。たとえば Controller のテストファイルは [spec/controllers](https://github.com/tootsuite/mastodon/tree/master/spec/controllers) の中にあります。

Mastodon 本家にプルリクを送った際にテストを書いてくれと要求されたら、ここにあるテストファイルを参考に、テストを行ってください。

# streaming
[index.js](https://github.com/tootsuite/mastodon/blob/master/streaming/index.js) という JavaScript ファイルがあります。これはディレクトリの名前の通り、TL のストリーミングを行うための JavaScript のコードになります。ストリーミングに何かのバグを発見したりした場合はこちらのファイルを参照してみると良いでしょう。

# さいごに
さて、今回は、Mastodon (Rails) のディレクトリ構成に着目した、Mastodon 開発のざっくりとした説明でしたが、いかがだったでしょうか。

僕自身も Rails を完璧に理解しているわけではないので、至らない部分も多々あったかと思いますが、この記事を通して、今まで Rails や Mastodon の開発を一切やったことがなかった人が、少しでも開発に興味を持ってもらえれば良いかなと思います。

この記事だけでは、Rails の仕組みのすべてはわからないと思いますので、もっと Rails の仕組みを体系的に知りたい方は、[Ruby on Rails チュートリアル](https://railstutorial.jp) をおすすめします。

この記事で、[Mastodon Advent Calendar 2017](https://qiita.com/advent-calendar/2017/mastodon) は終了となります。このアドベントカレンダーに参加された他の方も執筆お疲れさまでした。

それではみなさん、良いクリスマス、そして良いお年を！
