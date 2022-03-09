---
title: "Rails コマンドがうんともすんとも言わないときの対処法"
emoji: "😎"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Rails", "Spring", "Ruby"]
published: true
order: 129
layout: article
---

# 症状
`rails` コマンドを実行したときに、10 分以上待っても何も反応しないことがある。

```shell:Shell
bundle exec rails generate scaffold blog title:string body:text
# 10 分以上待っても反応しない
```

かといって、エラーが出るわけでもない。完全に止まっている状態になる。

# 対処方法
この場合、かなりの確率で Spring に原因がある場合がある。

Spring を一度ストップしてあげると正常に動くようになる。

```shell:Shell
bundle exec spring stop
```

```
Spring stopped.
```

これで `rails` コマンドが正常に実行できるようになる。

# 参考サイト
* ["rails generate" not working](https://stackoverflow.com/questions/23157426/rails-generate-not-working)
