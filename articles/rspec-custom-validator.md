---
title: "Rails の Custom Validator を RSpec で柔軟かつ簡単にテストする方法"
emoji: "🧑‍🔧"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Rails", "RSpec", "Ruby"]
published: true
order: 108
layout: article
---

# はじめに
カスタムバリデータのテストを RSpec で記述するにあたり、いくつかの技術記事を参考にしたが、どれも一部情報が欠けているものばかりだった。

そこで、カスタムバリデータのテストの書き方について、個人的につまずいた部分を解消したものをまとめておく。





# 目標
以下のようなカスタムバリデータがあり、そのテストコードを RSpec で記述できるようにする。

```ruby:app/validators/inclusion_in_array_validator.rb
# frozen_string_literal: true

# 配列の中身に特定の値が含まれている、または、特定の値の範囲内かを検証するカスタムバリデーション
class InclusionInArrayValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return if value.all? { |v| options[:in].include?(v) }

    record.errors.add(attribute, options[:message] || :inclusion_in_array)
  end
end
```

ちなみに、使い方としては、以下のようなものを想定している。

```ruby
validates :prefecture, inclusion_in_array: { in: (1..47) }
```

都道府県を複数選択し、`[1, 13, 27, 47]` のような配列が送信されたとき、各々の数値が都道府県 ID の範囲内に含まれるか検証するカスタムバリデータである。





# CustomValidatorHelper の作成
カスタムバリデータを単体でテストするためには、ダミーモデルを生成し、それを呼び出す。

いくつかのカスタムバリデータを実装している場合は、それぞれに全く同じダミーモデル生成の処理を書くのは DRY ではない。

そこで、CustomValidatorHelper というヘルパーを作り、そこにダミーモデルを生成する処理を書く。

`spec/support/helper/custom_validator_helper.rb` というファイルを生成し、以下のコードを書く。

```ruby:spec/support/helper/custom_validator_helper.rb
# frozen_string_literal: true

# カスタムバリデータを簡単にテストできるようにするためのモジュール
module CustomValidatorHelper
  def build_validator_mock(attribute: nil, record: nil, validator: nil, options: nil)
    record    ||= :record
    attribute ||= :attribute
    validator ||= self.described_class.to_s.underscore.gsub(/_validator\Z/, '').to_sym
    options   ||= true

    Struct.new(attribute, record, keyword_init: true) do
      include ActiveModel::Validations

      def self.name
        'DummyModel'
      end

      validates attribute, validator => options
    end
  end
end

RSpec.configure do |config|
  config.include CustomValidatorHelper, type: :model
end
```





# CustomValidatorHelper をロード
CustomValidatorHelper を用意しただけでは、各 spec ファイルで読み込んでくれない。そのため、全 spec 内で CustomValidatorHelper が自動的に読み込まれるようにする。

`spec/rails_helper.rb` に以下のコードを追加する。

```ruby:spec/rails_helper.rb
RSpec.configure do |config|
  Dir[Rails.root.join('spec/support/config/*.rb')].each { |f| require f }
  Dir[Rails.root.join('spec/support/helper/*.rb')].each { |f| require f }
end
```

`RSpec.configure do |config| ... end` はすでに書かれていると思うので、そのブロック内の任意の箇所 (末尾など) に中身を記述すれば良い。





# 使い方
[目標](#目標) の項で提示した `InclusionInArrayValidator` のテストを以下に示す。

```ruby
# frozen_string_literal: true

require 'rails_helper'

RSpec.describe InclusionInArrayValidator, type: :model do
  describe '#validate_each' do
    # valid? または invalid? を呼び出さないとエラーメッセージが取得できないので
    before do
      mock.valid?
    end

    let(:mock) { build_validator_mock(options: options).new(attribute: value) }

    # 例として都道府県を想定 (1 〜 47 まで)
    context '正常な場合' do
      context '範囲内の整数を複数指定した場合' do
        let(:value)   { [1, 13, 27, 47] }
        let(:options) { { in: (1..47) } }

        specify 'バリデーションを通過すること' do
          expect(mock).to be_valid
        end
      end
    end

    context '異常な場合' do
      context '0 を指定した場合' do
        let(:value)   { [0] }
        let(:options) { { in: (1..47) } }

        specify 'バリデーションを通過しないこと' do
          expect(mock).to be_invalid
        end

        specify 'エラーメッセージが表示されること' do
          expect(mock.errors.added?(:attribute, :inclusion_in_array)).to be_truthy
        end
      end

      context '負の数を指定した場合' do
        let(:value)   { [-5] }
        let(:options) { { in: (1..47) } }

        specify 'バリデーションを通過しないこと' do
          expect(mock).to be_invalid
        end

        specify 'エラーメッセージが表示されること' do
          expect(mock.errors.added?(:attribute, :inclusion_in_array)).to be_truthy
        end
      end
    end
  end
end
```

注目すべき点は以下の 1 行だけ。

```ruby
let(:mock) { build_validator_mock(options: options).new(attribute: value) }
```

説明のわかりやすさのため、`options` と `value` に適当な値を入れたものを以下に示す。

```ruby
let(:mock) { build_validator_mock(options: { in: (1..47) }).new(attribute: [1, 13, 27, 47]) }
```

先ほど作成した CustomValidatorHelper の `build_validator_mock` メソッドを呼び出している。

このメソッドを呼び出すことにより、アプリケーション内で以下のようにバリデータを呼び出したことになる。

```ruby
validates :attribute, inclusion_in_array: { in: (1..47) }
```

`attribute` や `inclusion_in_array` がどこから出てきたのか不思議に思うかもしれないが、これは `build_validator_mock` メソッド内で暗黙的に値を設定しているためである。

`InclusionInArrayValidator` のテストを行いたいため、`validates` に渡す第 2 引数のキーの名前は必然的に `inclusion_in_array` となる。それを `build_validator_mock` メソッドで暗黙的に行っている。

これらを明示的に指定したい場合は、以下のようにする。

```ruby
let(:mock) { build_validator_mock(attribute: :prefecture, validator: :inclusion_in_array, options: { in: (1..47) }).new(prefecture: [1, 13, 27, 47]) }
```

`attribute` の値を `:prefecture` に変えたので、`attribute: [1, 13, 27, 47]` の部分が `prefecture: [1, 13, 27, 47]` になったことに注意すること。

すると、以下のようにバリデータを呼び出したことになる。

```ruby
validates :prefecture, inclusion_in_array: { in: (1..47) }
```

基本的に、カスタムバリデータ単体のテストを書くときは、属性名 (DB に紐付いている場合はカラム名のこと) は何でも良いはず[^1]なので、通常は省略して構わない。

[^1]: 一応、エラーメッセージ内に属性名が含まれるので、エラーメッセージの文字列が正しいかどうかをテストする際には関係してくるかもしれないが、そもそもエラーメッセージの文言をそのままテストで書くのはあまり良い作法ではないと個人的には思う。

また、呼び出すバリデータの名称に関しても、`RSpec.describe InclusionInArrayValidator, type: :model do ... end` のように書いたら、ふつうは `inclusion_in_array` で呼び出すはずなので、こちらも省略して構わない。

## options を省略した場合
なお、`options: { in: (1..47) }` の部分を省略して、

```ruby
let(:mock) { build_validator_mock.new(attribute: [1, 13, 27, 47]) }
```

のように書いた場合、以下のようにバリデータを呼び出したことになる。

```ruby
validates :prefecture, inclusion_in_array: true
```

`options` を省略すると、代わりに `true` が入る。ここに指定するとして、`true` が来ることが多い印象なので、省略時は `true` が入るように CustomValidatorHelper で実装している。

## 他の属性 (カラム) と依存関係のあるカスタムバリデータをテストしたい場合
今までの説明 (都道府県 ID) のように、1 つの属性単体で完結する場合はこれで十分だろう。しかし、他の属性と依存関係がある場合はどのように書けば良いだろうか。

たとえば、サブカテゴリという属性があり、それがメインカテゴリと依存関係にあった場合のことを考える。

サブカテゴリ ID はメインカテゴリ ID と関係があり、ユーザから送信されるサブカテゴリ ID は、同じくユーザから送信されるメインカテゴリ ID に属しているものでなければならないとする。

もう少し具体的に説明するため、以下のリスト (以下、`※ 1` とする) を参照してほしい。

* ゲーム (ID: 1)
    * アクション (ID: 1)
    * パズル (ID: 2)
    * RPG (ID: 3)
* アニメ (ID: 2)
    * 日常系 (ID: 4)
    * アドベンチャー (ID: 5)
    * ほのぼの (ID: 6)
* ... (ID: 3)
    * ... (ID: 7)
    * ... (ID: 8)
    * ... (ID: 9)

それぞれ、ネストされていないのがメインカテゴリを表し、ネストされているのがサブカテゴリを表している。

ユーザからはメインカテゴリ ID とサブカテゴリ ID が送られてくるが、サブカテゴリ ID が、メインカテゴリ ID に属している必要がある。

たとえば、メインカテゴリで「ゲーム」(ID: 1) を選択しているのに、サブカテゴリで「ほのぼの」(ID: 6) を選択していたら弾くようなバリデータを想定している。

これを、以下のように実装したとする。

```ruby:app/validators/sub_category_dependency_validator.rb
# frozen_string_literal: true

# 指定されたサブカテゴリの ID が正しいかどうかをチェックするカスタムバリデーション
#
#   送信されたすべてのサブカテゴリ ID からメインカテゴリ ID を調べた際に
#   それらがすべて、送信されたメインカテゴリ ID に含まれていれば OK
#   そうでなければメインカテゴリとサブカテゴリに不整合が起きているので弾く
#
class SubCategoryDependencyValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return if (SubCategory.find(value).pluck(:main_category_id) - record.main_category).empty?

    record.errors.add(attribute, options[:message] || :sub_category_dependency)
  end
end
```

送信されたサブカテゴリに対してバリデーションをかけるカスタムバリデータの中で、送信されたメインカテゴリを参照している。`record.main_category` の部分が該当する。

その際、メインカテゴリをテスト内でどのように指定するか、ということである。

その場合は、`build_validator_mock` を以下のように呼び出せば良い。

```ruby
let(:mock) do
  build_validator_mock(attribute: :sub_category, record: :main_category).
                   new(sub_category: [1, 2], main_category: [3, 6])
end
```

`build_validator_mock` を呼び出す際の引数として、`record: :main_category` というものを追加する。

そして、`attribute` と `record` に指定したそれぞれのキーを使って、`new(sub_category: [1, 2], main_category: [3, 6])` のようにインスタンスを生成する。

これにより、バリデータ内で、`value` には、`attribute` として指定した `sub_category` の値 (`[1, 2]`) が入り、`record.main_category` には、`record` として指定した `main_category` の値 (`[3, 6]`) が入ることになる。

ちなみに、上記のサブカテゴリ ID は、`※ 1` のリストによれば、メインカテゴリ ID に属しているので、正常系となる。

```ruby
new(sub_category: [1, 2], main_category: [3, 6])
```

の部分を、たとえば

```ruby
new(sub_category: [1], main_category: [6])
```

のようにした場合、メインカテゴリ「ゲーム」と、メインカテゴリ「ゲーム」に属さない (メインカテゴリ「アニメ」に属する) サブカテゴリ「ほのぼの」が指定されているため、異常系となる。
