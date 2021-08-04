---
title: "Raspberry Pi を Bluetooth オーディオサーバにする最速セットアップ手順"
emoji: "💨"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["PulseAudio", "Bluetooth", "RaspberryPi"]
published: false
order: 99
layout: article
---

# はじめに
我が家では、Mac や iPhone などを Raspberry Pi に Bluetooth 接続して、複数のデバイスの音声をミキシングして音声をまとめて、Bluetooth ヘッドフォンで同時に聞けるようにしている。

具体的な構築方法は以前に記事を公開した。

https://ja.developers.noraworld.blog/pulseaudio-bluetooth

ところが先日、SD カード壊れてしまい、新しい SD カードを買い直して再セットアップすることになった。

上記の記事は個人的には丁寧にまとめたつもりなのだが、いかんせん手順が長く説明が長いので、自分自身でも忘れてしまうし、毎回必要なところをかいつまんで読むのも大変だ。

そこで、個人の備忘録もかねて、作業に必要な最低限の手順だけをまとめた記事を新たに執筆することにした。

はじめてこの手順を行う人は、基本的には上記の記事を先に参照してほしいが、筆者のように何度か試したことがある人は、この記事が役立つことを願う。

なお、以降の見出しに「(任意)」と書かれていた場合はやってもやらなくても良い。筆者自身は全部やるので、参考程度で書いている。



# Ubuntu のインストール
以下を参考に、Ubuntu を Raspberry Pi にインストールする。

https://ja.developers.noraworld.blog/setup-ubuntu-on-raspberry-pi-without-keyboard



# タイムゾーンの変更 (任意)
最初は UTC になっているが、ログの時刻を JST にしたいので、タイムゾーンを変更する。

```shell
sudo timedatectl set-timezone Asia/Tokyo
```



# IP アドレス固定 (任意)
初回起動の際に DHCP により自動でプライベート IP アドレスが付与されるが、このアドレスが今まで Raspberry Pi に付与されていたものと異なると、いちいち `~/.ssh/config` を書き換えないといけなくてめんどくさいので、以下の記事を参考にプライベート IP アドレスを固定する。

https://ja.developers.noraworld.blog/ubuntu-fixed-ip-address-via-cli



# SSH セットアップ (任意)
SSH のときに毎回パスワード入力するのは面倒なのと、一応、最低限のセキュリティを確保するため、SSH の設定を行う。

以下のリポジトリに筆者が使っている SSH の設定ファイルが置かれているので、自分で設定するのがめんどくさい人は適宜利用してほしい。

https://github.com/noraworld/ssh-conf

```shell
git clone https://github.com/noraworld/ssh-conf.git
cd ssh-conf
sudo rm /etc/ssh/sshd_config
sudo ln -s $PWD/ssh/sshd_config /etc/ssh
sudo rm -r /etc/ssh/sshd_config.d
sudo ln -s $PWD/ssh/sshd_config.d /etc/ssh
```

次に、`ssh/sshd_config.d/port.conf` というファイルを作って SSH 用のポート番号を追加する。

すでにローカルの `~/.ssh/config` に Raspberry Pi 用の設定があり、ポート番号も変えるのが面倒な場合は、そのポート番号を以下のコマンドで追加する。

```shell
echo "Port <YOUR_PORT>" | tee -a $PWD/ssh/sshd_config.d/port.conf
```

今回、新しくポート番号を設定する場合は、以下のコマンドで乱数を生成しつつ書き込むことができる。ただし以下のコマンドは短時間の間に何度も実行しないこと。

```shell
echo "Port $(od -An -tu2 -N2 /dev/random | tr -d ' ')" | tee -a $PWD/ssh/sshd_config.d/port.conf
```

ポート番号を乱数で設定した場合は、ファイルへの記載と同時にターミナル上にも表示されたポート番号を忘れずに控えておく。

以下の設定がまだの場合、各自設定すること。

* ローカルの `~/.ssh/config` に Raspberry Pi 用の設定追加
* ローカルで SSH 鍵を生成し、公開鍵を Raspberry Pi に `~/.ssh/authorized_keys` としてアップロード

次に、ファイアウォールの設定で先ほど設定した SSH 用のポートを開放する。

```shell
sudo ufw enable
sudo ufw default deny
sudo ufw deny ssh
sudo ufw allow <YOUR_PORT>/tcp
```

SSH とファイアウォールの設定を反映させる。

```shell
sudo systemctl restart ssh
sudo ufw reload
```

現在の SSH のコネクションはそのままにしておき、ターミナルの別タブまたは別ウィンドウを開き、SSH できるかどうかを確認する。



# バックアップファイルのリストア (任意)
Raspberry Pi で使っていた以前のデータのバックアップがある場合はそれをリストアする。

以下は個人的なメモ。バックアップ取っておくと今回みたいな再セットアップ時に楽になるファイルたち。

* `.marlin_aliases`
* `.env.preferences`
* `.ssh/`



# dotfiles のセットアップ (任意)
プレーンなシェルだと不便なので自分の dotfiles がある場合はそれのセットアップを行う。

以下は筆者の dotfiles なので、適宜読み替えること。

```shell
git clone https://github.com/noraworld/dotfiles.git
cd dotfiles
./setup
```



# Ubuntu 再起動時に自動ログイン
再起動したあと、一度も SSH していない場合、通常はシステム起動後に一度も一般ユーザでログインしていない状態となる。

しかし、これだと一般ユーザで動くデーモン (今回使用する PulseAudio や dummy-sound など) が再起動後に起動してくれない。

そこで、以下の記事を参考に、システム再起動後に一般ユーザとして自動でログインするように設定する。

https://ja.developers.noraworld.blog/ubuntu-reboot-auto-login



# 必要なパッケージのインストール
```shell
sudo apt -y install pulseaudio pulseaudio-utils alsa-base alsa-utils bluetooth bluez pulseaudio-module-bluetooth ofono
```



# systemd-units の導入
通常は手動で設定するものだが、筆者はめんどくさがりなので、GitHub リポジトリで管理しており、そこから設定を丸ごとインポートする。

https://github.com/noraworld/systemd-units

各サービスファイル内の `WorkingDirectory` は適宜変更する必要があるが、ユーザ名が `ubuntu` (デフォルト) で、ホームディレクトリ以下に `workspace` という名前のディレクトリを作り、その中で clone した場合は `WorkingDirectory` の変更は不要。

```shell
whoami # ubuntu
cd
mkdir workspace
cd workspace
git clone https://github.com/noraworld/systemd-units.git
```

各サービスファイルをリンクしてデーモンリロードする。

```shell
cd systemd-units
sudo systemctl link $PWD/lib/systemd/system/*
systemctl --user link $PWD/lib/systemd/user/*
sudo systemctl daemon-reload
systemctl --user daemon-reload
```

dummy-sound の自動起動設定をする。

```shell
systemctl --user enable dummy-sound
```



# bluetooth-conf の導入
これも通常は手動で設定するが、リポジトリ管理なので、そこから設定を丸ごとインポートする。

https://github.com/noraworld/bluetooth-conf

```shell
git clone https://github.com/noraworld/bluetooth-conf.git
cd bluetooth-conf
sudo rm -r /etc/bluetooth
sudo ln -s $PWD/bluetooth /etc/bluetooth
sudo systemctl enable bluetooth
```



# pulse-conf の導入
これも同じくリポジトリから設定を丸ごとインポートする。

https://github.com/noraworld/pulse-conf

```shell
git clone https://github.com/noraworld/pulse-conf.git
cd pulse-conf
sudo rm -r /etc/pulse
sudo ln -s $PWD/pulse /etc/pulse
systemctl --user enable pulseaudio
sudo gpasswd -a $(whoami) pulse
sudo gpasswd -a $(whoami) pulse-access
```

`pulse/default.pa` 内の音声出力先 (`set-default-sink`) と音声入力元 (`set-default-source`) は、以下のコマンドで調べて適宜変更すること。

```shell
pactl list sinks short | awk '{ print $2 }'
```



# 再起動
```shell
sudo reboot
```



# bluetoothctl-autoconnector の導入
Bluetooth 操作 (ペアリング等) を簡単に行うためのツールを導入する。

https://github.com/noraworld/bluetoothctl-autoconnector

```shell
git clone https://github.com/noraworld/bluetoothctl-autoconnector.git
cd bluetoothctl-autoconnector
./setup.sh
```

以下を各自で設定する。

* `bin` にパスを通す
* `~/.marlin_aliases` というファイルを作成後にそのファイルに BD アドレスと識別名 (好きな文字列) のペアを記載する

```markdown:~/.marlin_aliases
XX:XX:XX:XX:XX:XX MacBook Pro 15
XX:XX:XX:XX:XX:XX iPhone 7
XX:XX:XX:XX:XX:XX iPad Air 2
XX:XX:XX:XX:XX:XX Oculus Quest
XX:XX:XX:XX:XX:XX KJ-43X8500F
```

デバイスをペアリングするには、以下のようなコマンドを実行する。

```shell
marlin register MacBook\ Pro\ 15
```

上記は `~/.marlin_aliases` で "MacBook Pro 15" と名付けた MacBook Pro 15-inch (名前そのまま) を Raspberry Pi とペアリングする。

このツールの詳しい説明は以下の URL を参照すること。

https://ja.developers.noraworld.blog/bluetoothctl-autoconnect



# SD カードの耐久性について (余談)
ちなみに、壊れてしまった SD カードは以下のキットに付属していたもので、使用から約 8 ヶ月で壊れてしまった。

https://amzn.to/3ikXnrW

原因に関しては、はっきりとはわかっていないが、おそらく書き込み回数の限界に達してしまったのではないかと推測している。

以前は、1 分ごとの Bluetooth の自動接続のログを取っており、それが SD カードに負荷を与えてしまったのではないかと考えている。

なので今回はそのログは (そこまで役には立っていなかったので) 取らないようにすると同時に、耐久性の高い SLC (Single Level Cell) の SD カードを買うことにした。

https://amzn.to/2VlLIR1

まだ買ったばかりなので耐久性についてはなんともいえないが、明らかに以前よりシェルのログインや操作の応答が圧倒的に速くなった。

今まではシェルの操作がもっさりしていたのだが、これは Raspberry Pi の性能ではなく SD カードの性能だったのだとわかった。

まだ SD カード (Raspberry Pi) を購入前の場合は、SD カードは SLC のものをおすすめする。
