---
title: "Rails における UserBook.all と UserBook.joins(:user).joins(:book) の違い"
emoji: "📚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["rails", "activerecord", "database"]
published: true
---

# はじめに
中間テーブル `user_books` があったとき、Rails (Active Record) における `UserBook.all` と `UserBook.joins(:user).joins(:book)` の違いについて説明します。



# モデルの定義
以下のようなモデルがあったとします。ユーザは複数の本を所有しており、本は複数のユーザに所有されている、いわゆる多対多の関係になっています。

```ruby
class User < ApplicationRecord
  has_many :user_books
  has_many :books, through: :user_books
end
```

```ruby
class Book < ApplicationRecord
  has_many :user_books
  has_many :users, through: :user_books
end
```

```ruby
class UserBook < ApplicationRecord
  belongs_to :user
  belongs_to :book
end
```



# レコード
以下のようなレコードがデータベースに格納されていたとします。

## `users` テーブル
| id | name |
| :---: | --- |
| 1 | 一郎 |
| 2 | 二郎 |
| 3 | 三郎 |

## `books` テーブル
| id | name |
| :---: | --- |
| 1 | こころ |
| 2 | 三四郎 |
| 3 | 人間失格 |
| 4 | 雪国 |
| 5 | 羅生門 |

## `user_books` テーブル
`user_books` 自体の主キーである `id` は省略します。

| user_id | book_id |
| :---: | :---: |
| 1 | 1 |
| 1 | 2 |
| 1 | 3 |
| 2 | 2 |
| 2 | 3 |
| 2 | 4 |
| 3 | 4 |
| 3 | 5 |

上記のテーブルの内容を言語的にまとめると以下のようになります。

* 一郎さんは「こころ」と「三四郎」と「人間失格」を所有している
* 二郎さんは「三四郎」と「人間失格」と「雪国」を所有している
* 三郎さんは「雪国」と「羅生門」を所有している



## ユースケース
「羅生門」は書庫で管理しなくなったなどの理由でレコードを削除したとします。

```ruby
Book.find_by(name: "羅生門").destroy
```

さて、この状態で `user_books` テーブルに存在する、`users` と `books` に紐づいた全レコードを取得したいとします。

以下の Active Record では正しく **取得できません**。

```ruby
UserBook.all
```

なぜなら、`books` テーブルから「羅生門」は削除しましたが、`user_books` テーブルから「三郎さんが羅生門を所有している」という情報は削除されていないからです。

`users` テーブルあるいは `books` テーブルから削除されたレコードが紐づいているものを含まない `user_books` テーブルの全レコードを取得したい場合は以下の Active Record を実行する必要があります。

```ruby
UserBook.joins(:user).joins(:book)
```



# おまけ
逆に `users` テーブルあるいは `books` テーブルから削除されているレコードに紐づく `user_books` テーブルのレコードのみを取得したい場合は以下の Active Record を実行すれば良さそうです。

```ruby
UserBook
  .left_outer_joins(:user, :book)
  .where(users: { id: nil })
  .or(UserBook.where(books: { id: nil }))
```

上記の例でいうとこれは「削除された本『羅生門』を所有しているユーザの情報のみを表示したい」という要件の場合に使用できます。



# 関連するレコードを一緒に削除したい場合
上記の例で `books` テーブルから「羅生門」を削除しましたが、その際に `user_books` テーブルから「三郎さんが羅生門を所有している」というレコードも一緒に消したい場合は該当するアソシエーションに `dependent: :destroy` を付与します。

```diff
class Book < ApplicationRecord
-  has_many :user_books
+  has_many :user_books, dependent: :destroy
  has_many :users, through: :user_books
end
```

これで、`books` テーブルからレコードが削除された際に、そのレコードと紐づいた `user_books` に含まれるレコードも一緒に削除されます。



# 参考
* [ChatGPT - Active Record 中間テーブル 取得](https://chatgpt.com/share/6715f5be-cd9c-8004-b66b-b1cd3a58c001)
* [中間テーブルを用いた処理(Rails) #Ruby - Qiita](https://qiita.com/ysda/items/87c056aed33280995332)
* [【Rails】ActiveRecordでSQLっぽくテーブル結合する方法 #Ruby - Qiita](https://qiita.com/teddy_bear_eng/items/0f7c7723f5d121a493f9)
* [日本文学作品のおすすめ36選。読まれ続けてきた数々の名作をご紹介](https://sakidori.co/article/1324884)
