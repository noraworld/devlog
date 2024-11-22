---
title: "Ruby 3.3 の RSpec 内の Capybara で ArgumentError が発生する問題の解決法"
emoji: "🦫"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["ruby", "rails", "rspec", "capybara"]
published: false
---

# 環境
| ミドルウェア | バージョン |
| --- | :---: |
| Ruby | 3.3.5 |
| Rails | 6.1.7.9 |
| RSpec | 3.13.0 |
| Capybara | 3.40.0 |

Rails 以外は現時点（2024 年 10 月 23 日現在）では最新版の環境における情報です。



# 問題
Ruby 3.0.7 から Ruby 3.3.5 にアップデートしたあと RSpec を実行すると Capybara を使用している部分で ArgumentError が発生するようになりました。

```ruby:foo_spec.rb
RSpec.describe '/foo', type: :request do
  context 'foo' do
    let(:html) { Capybara.string response.body }

    it "displays the flash message" do
      expect(html).to have_css '.success', text: 'Field was created successfully'
    end
  end
end
```

```
Failure/Error: expect(html).to have_css '.success', text: 'Field was created successfully'

ArgumentError:
wrong number of arguments (given 2, expected 1)
```



# 解決法
現状では主に 2 種類の解決法があります。

## feature specs または system specs を利用する
この問題は request specs を使用している場合に発生するということがわかりました。部分的に system specs に書き換えて実行したところ ArgumentError は発生しないことがわかりました。

```ruby:foo_spec.rb
RSpec.describe '/foo', type: :system do
  context 'foo' do
    let(:html) { Capybara.string response.body }

    it "displays the flash message" do
      expect(html).to have_css '.success', text: 'Field was created successfully'
    end
  end
end
```

feature specs, system specs, request specs などの違いについては以下の記事が参考になります。

* [RailsのRSpecで行うべきテストの種類と注意点 #Ruby - Qiita](https://qiita.com/ryouzi/items/4d198eac8df5958ddb1e)
* [System SpecとFeature Specは何が違うの？ #Ruby - Qiita](https://qiita.com/shima-zu/items/3eb08662f2da05196ec9)

## Capybara のマッチャーを使う（RSpec のマッチャーを使わない）
feature specs や system specs に置き換えるとなると、テストケースが膨大（ファイルが巨大）な場合はすぐに修正するのが難しくこの直し方は現実的ではないかもしれません。あるいは、わけあって request specs を使いたい場合もあるかもしれません。

そのような場合は RSpec のマッチャーの代わりに Capybara のマッチャーを使うことで ArgumentError を回避できます。

```ruby:foo_spec.rb
RSpec.describe '/foo', type: :request do
  context 'foo' do
    let(:html) { Capybara.string response.body }

    it "displays the flash message" do
      expect(html.has_css?('.success', text: 'Field was created successfully')).to be_truthy
    end
  end
end
```

変更した部分は以下のとおりです。

```diff
-      expect(html).to have_css '.success', text: 'Field was created successfully'
+      expect(html.has_css?('.success', text: 'Field was created successfully')).to be_truthy
```

RSpec のマッチャーに関しては詳しく調べていないのですが、どうやらそちら側に問題があるようなので、それを回避するために Capybara 側のマッチャーを使います。上記の例でいうと `have_css` ではなく `has_css?` を使い、`html` ではなく `html.has_css?('.success', text: 'Field was created successfully')` が `true` を返すかどうかを判定します。

書き方としてあまりスマートではないですがこれでも ArgumentError を回避できます。将来的には RSpec 側に修正が入りこのような書き方をしなくても済むかもしれません。

なお、今回は `have_css` を `has_css?` に変える例を挙げましたが、`have_link` だったら `has_link?` に変える、`have_content` だったら `has_content?` に変えるなど、適宜変更が必要です。



# 所感
日本語で調べても英語で調べても Google 検索では大した結果が出てこなくて [Capybara のイシュー](https://github.com/teamcapybara/capybara/issues/2679) に情報ないかなと思って探していたらようやく解決策を見つけました。やはり開発元をあたるというのは重要ですね。

あと [Capybara の README](https://github.com/teamcapybara/capybara/tree/0480f90168a40780d1398c75031a255c1819dce8?tab=readme-ov-file#using-capybara-with-rspec) にも feature specs か system specs を使うように指示があるため README を読むのも大事だなと思いました。



# 参考
* [have_css matcher fails in ruby 3.2](https://github.com/teamcapybara/capybara/issues/2679#issuecomment-1949022747)
* [Using Capybara with RSpec](https://github.com/teamcapybara/capybara/tree/0480f90168a40780d1398c75031a255c1819dce8?tab=readme-ov-file#using-capybara-with-rspec)
