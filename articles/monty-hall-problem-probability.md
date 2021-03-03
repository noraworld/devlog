---
title: "モンティホール問題の解が 50% にならないことを暗号論的擬似乱数を使って検証してみる"
emoji: "😽"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Ruby", "モンティ・ホール問題", "モンティホール", "暗号論的擬似乱数"]
published: false
order: 78
---

# モンティホール問題とは？
モンティホール問題とは、以下のような確率の問題です。

>
3 つの閉じたドアがあります。
>
そのうちの 1 つのドアの先には景品の新車があり、残り 2 つのドアの先にはハズレを意味するヤギがいます。プレイヤーは新車があるドアを開けると新車をもらうことができます。
>
プレイヤーがドアを 1 つ選ぶと、司会者のモンティホールは、残りの 2 つのドアのうちヤギがいるドアを 1 つ開けてヤギを見せます。
>
ここでプレイヤーは、最初に選んだドアから、まだ開けられていないもう 1 つのドアに変更することができます。
>
さて、プレイヤーはドアを変更するべきでしょうか？ (どちらのほうが新車を当てられる確率が高いでしょうか？)

[モンティ・ホール問題 - Wikipedia](https://ja.wikipedia.org/wiki/%E3%83%A2%E3%83%B3%E3%83%86%E3%82%A3%E3%83%BB%E3%83%9B%E3%83%BC%E3%83%AB%E5%95%8F%E9%A1%8C)

「司会者がハズレのヤギのドアを開けたんだから、残るドアは 2 つで、ドアを変更してもしなくても確率 1/2 でしょ？」と思った方。実はこれは不正解です。

正解は、「ドアを変更したほうが当たる確率が高い」です。ドアを変更しなかった場合は当たる確率 1/3 で、ドアを変更した場合は当たる確率 2/3 になります。

なぜこのような結果になるのかについては以下の動画で解説されています。

[Twitterのアンケートが意外な結果に！「モンティホール問題変形バージョン」](https://youtu.be/XtHetfo3O0w)

# 検証してみよう
さて、答えはわかったとしても、本当にそうなるのかがまだ納得できないという人もいるかもしれません。

なので、途中でドアを変更した場合と変更しない場合で 100 万回試行してみて、本当にその確率に沿う結果になるのかどうかを検証するプログラムを書いてみました。

結果だけ知りたい方は「[検証結果](#%E6%A4%9C%E8%A8%BC%E7%B5%90%E6%9E%9C)」までジャンプしてください。

# プログラム
実際に書いたプログラムが以下になります。Ruby で実装しました。

```ruby:monty_hall_problem.rb
# frozen_string_literal: true

require 'optparse'
require 'securerandom'

options = {}
OptionParser.new do |opt|
  opt.on('-d NUMBER', '--doors=NUMBER') { |v| options[:doors_count] = v }
  opt.on('-t NUMBER', '--trials=NUMBER') { |v| options[:trials] = v }
  opt.parse!(ARGV)
end

DOORS_COUNT = options[:doors_count].to_i >= 3 ? options[:doors_count].to_i : 3
TRIALS      = options[:trials].to_i      >= 1 ? options[:trials].to_i      : 100

def main
  correct_count = { changed: 0, never: 0 }

  TRIALS.times do
    correct_count[:changed] += 1 if try(changed: true)
  end

  TRIALS.times do
    correct_count[:never] += 1 if try(changed: false)
  end

  puts "Number of doors:  #{DOORS_COUNT} doors"
  puts "Number of trials: #{TRIALS} times each"
  puts
  puts "Changed: #{correct_count[:changed]} times (Actual: #{((correct_count[:changed].to_f / TRIALS.to_f) * 100).round(2)}%, Expected: #{(((DOORS_COUNT - 1).to_f / DOORS_COUNT.to_f) * 100).round(2)}%)"
  puts "Never:   #{correct_count[:never]} times (Actual: #{((correct_count[:never].to_f / TRIALS.to_f) * 100).round(2)}%, Expected: #{((1.0 / DOORS_COUNT.to_f) * 100).round(2)}%)"
end

def try(changed:)
  doors = Array.new(DOORS_COUNT, false)
  doors[SecureRandom.random_number(DOORS_COUNT)] = true
  first_choice = SecureRandom.random_number(DOORS_COUNT)

  doors = reveal(doors, first_choice)

  doors[second_choice(doors, first_choice, changed: changed)]
end

def reveal(doors, first_choice)
  if doors[first_choice] # the first choice is correct
    leftover = nil

    loop do
      leftover = SecureRandom.random_number(DOORS_COUNT)
      break if leftover != first_choice
    end

    doors.map.with_index { |door, index| door if door || index == leftover }
  else # the first choice is incorrect
    doors.map.with_index { |door, index| door if door || index == first_choice }
  end
end

def second_choice(doors, first_choice, changed:)
  return first_choice unless changed

  second_choice = nil
  doors.each_with_index do |door, index|
    unless door.nil? || index == first_choice
      second_choice = index
      break
    end
  end

  second_choice
end

main
```

なお、元々のモンティホール問題は 3 つのドアですが、これが 10 個のドアだったり 100 個のドアだったりしても検証できる[^1]ようなプログラムになっています。`DOORS_COUNT` がドアの数を表しています。デフォルトは 3 です。

[^1]: 100 個のドアだった場合は、プレイヤーが 1 つのドアを選んだあと、司会者が残り 98 個のヤギがいるドアを開けます。

また、試行回数を変えることもできます。`TRIALS` が試行回数を表しています。デフォルトは 100 です。

引数に `-d NUMBER` を入れるとドアの数を変更できます。`NUMBER` には数値が入ります。また、`-t NUMBER` を入れると試行回数を変更できます。たとえば `-t 100000` とすると 10 万回試行します。

## main
途中でドアを変更した場合と変更しない場合に分けて何回か試行した結果を出力するメソッドです。

`correct_count` に結果 (当たりを引いた回数) を入れていきます。`correct_count[:changed]` が途中でドアを変えた場合の当たりの回数、`correct_count[:never]` が途中でドアを変えなかった場合の当たりの回数です。

## try
試行するメソッドです。当たりのドアを引けば `true`、ハズレのドアを引けば `false` を返します。

すべての要素が `false` の配列 `doors` を用意して、その中のどこかにランダムで `true` を入れます。`true` が新車があるドア、`false` がヤギがいるドアということです。

`first_choice` に配列 `doors` の取りうる添字の値をランダムで入れます。これが、プレイヤーがドアを一つ選んだ状態となります。プレイヤーはもちろん答えを知らないのでランダムに値を取得します。

## reveal
司会者が、残りのドアのうちヤギがいるドアを開けるメソッドです。

プレイヤーが選んだドア (`first_choice` で指定した要素) と、新車があるドア (`true` の要素) 以外をすべて `nil` にした配列を返します。

ただし、もしプレイヤーが最初から新車のあるドア (`true` の要素) を選んでいた場合は、全部のドアを開けてしまうと問題になりませんので、その場合は選ばれていないドア (すべてヤギのドアです) のうち 1 つのドアをランダムに選び、その要素はそのままにして、それ以外の要素 (もちろんプレイヤーが選んだドアを除く) をすべて `nil` にします。

`nil` が入っている要素は、司会者によってヤギがいる (ハズレである) ことが明らかになっている[^2]ドアを意味します。

[^2]: "reveal" は「明らかにする」という意味です。

## second_choice
プレイヤーが 2 回目に選んだドアを返すメソッドです。配列 `doors` の取りうる添字の値を返します。

引数として受け取る `changed` には `true` または `false` が入ります。`true` はドアを途中で変えたことを意味し、`false` はドアを変えないことを意味します。

ドアを変えない場合は `first_choice` と同じということなので、そのまま `first_choice` の値を返します。

ドアを変える場合は `nil` ではない要素であり、かつ `first_choice` とは違う値を返します。司会者が、ヤギがいるドアを開けたあとは、最初に選んだドアと、まだ開けられていないドアの 2 つしかないので、変えるとしたら一意に定まります。

# 検証結果
では実際に検証してみましょう。100 万回試行してみます。

```shell
$ ruby monty_hall_problem.rb -t 1000000
```

```
Number of doors:  3 doors
Number of trials: 1000000 times each

Changed: 666764 times (Actual: 66.68%, Expected: 66.67%)
Never:   333181 times (Actual: 33.32%, Expected: 33.33%)
```

わかりやすく表にまとめると以下のとおりです。

|| 途中でドアを変更した場合 | 途中でドアを変更しなかった場合 |
|---|---:|---:|
| 当たりを引いた回数 (100 万回中) | 666,764 回 | 333,181 回 |
| 正解率 (小数点第 3 位四捨五入) | 66.68% | 33.32% |
| 本当の確率 (小数点第 3 位四捨五入) | 66.67% | 33.33% |

ドアを変更した場合はほぼ 2/3 の確率で正解し、ドアを変更しなかった場合はほぼ 1/3 の確率で正解しました。

というわけで、ドアを変更してもしなくても確率 50% というのは間違いで、たしかに変更したほうが正解率が高くなる、ということがわかりました。

# おまけ: 暗号論的擬似乱数を使った理由
たいていの言語には、(ただの) 擬似乱数と暗号論的擬似乱数の 2 種類あります。

Ruby にももちろん両方あります。

```irb:擬似乱数
irb(main):001:0> rand
=> 0.3204722194100945
```

```irb:暗号論的擬似乱数
irb(main):001:0> require 'securerandom'
=> true
irb(main):002:0> SecureRandom.rand
=> 0.6596803273103891
```

今回のプログラムでは、ただの擬似乱数ではなく暗号論的擬似乱数 (`SecureRandom.random_number`) を使いました。その理由は、**ただの擬似乱数だと偏りが発生する可能性があるから**[^3] です。

だからといって、暗号論的擬似乱数が全く偏りの生じない真の乱数列であるというわけではないのですが、暗号に使われている乱数ということもあって、予測できないほど偏りの生じない乱数であるとはいえます。

今回は数学的な確率を求める検証だったので、なるべく偏りの生じない乱数を使用したほうが良いと判断し、暗号論的擬似乱数を使用しました。

参考: [各言語での、本当に安全な乱数の作り方](https://qiita.com/gakuri/items/27cca8f0fa28b78ddeca)

[^3]: [擬似乱数 - Wikipedia](https://ja.wikipedia.org/wiki/%E6%93%AC%E4%BC%BC%E4%B9%B1%E6%95%B0)
