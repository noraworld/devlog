---
title: "Mac mini (2018) + Blackmagic eGPU Pro の組み合わせで Boot Camp 環境の Windows 10 を使用することはできない（たぶん......）"
emoji: "😭"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["Mac", "egpu", "blackmagicdesign", "Bootcamp", "Windows10"]
published: false
order: 65
---

:warning: **この記事は、もしかすると読むだけ時間の無駄になる可能性があるのでご注意ください。**

ぼくと同じように、今後 Boot Camp 環境で eGPU を使おうかなと思っている方がいたら、それには相当な覚悟が必要かもしれないし、ぼくのように結局うまくいかなくて終わる可能性もある、ということが事前に知っていただけたら幸いです。

使用する Mac の種類（MacBook Pro など）や eGPU の種類によっては、この記事に書いてある手順で動作するかもしれませんが、サポートされている方法ではないので基本的には動かないと思ったほうが良いです。

# はじめに
少し前から唐突に PC ゲーム（VR 含む）をやりたくなりました。ところがぼくは Mac しか持っていないので Boot Camp を使用して Mac に Windows 10 をインストールして遊ぶことにしました。

ところが、ゲームはまともに動作しませんでした。それもそのはず、ぼくが持っている Mac mini (2018) は GPU を積んでいない（Intel UHD Graphics 630 を除く）ので、動画編集やゲームのような大量のグラフィック処理を行うことができません。

それならば、ということで、Apple が公式に販売・サポートしている Blackmagic eGPU Pro を使用すればゲームも快適にできるのではないかと考えたのです（現在、Blackmagic eGPU Pro は販売終了しており、Apple Store から購入することはできません）。

実は、Apple は Boot Camp 環境の Windows 10 は eGPU には「対応していない」と言っています。

[Mac で Blackmagic eGPU を使う](https://support.apple.com/ja-jp/HT208897)

しかし、インターネットでいろいろ調べてみると、非公式ではあるものの、eGPU を Boot Camp 環境の Windows 10 で使用する方法がたくさん出てきます。当初はそこまで本格的にゲームをするつもりはなかったので、とりあえず Full HD 30fps くらいで動いてくれれば良いという気持ちで環境構築を始めました。

しかしこの考えが地獄の始まりでした......。

今回の記事は「結局、解決しませんでした」というオチなので正直誰かの役に立つ内容ではないと思いますが、インターネット上では具体的にどのような解決方法が提示されているのか、なぜ Boot Camp 環境ではうまくいかないのか、あたりは参考になるかなと思いこの記事を書くことにしました。

# TL;DR
以下に示す記事の内容・ツール等は一通り試しましたが、ぼくの環境ではどれもうまくいきませんでした。

<details><summary>解決法を試した記事・使用したツール・参考にした記事一覧（クリックで展開）</summary><div>

- [Boot CampのWindows10でeGPUが使えるように！](https://bobsmac.com/egpu/166.html)
- [[EFI Loader] Error 12 Fix in Boot Camp for Apple T2 Security Chip Macs (apple_set_os loader v0.5)](https://egpu.io/forums/bootcamp/macbook-pro-16-windows-egpu-error-12-fix/)
- [0xbb / apple_set_os.efi](https://github.com/0xbb/apple_set_os.efi)
- [[Solved] automate-eGPU EFI - eGPU boot manager for macOS and Windows](https://egpu.io/forums/mac-setup/automate-egpu-efi-egpu-boot-manager-for-macos-and-windows/)
- [eGPUとRADEON RX5700XTでMac mini 2018をゲーミングPC化した](https://jun3010.me/macmini2018-akitio-node-rx5700xt-17565.html)
- [bootcampdrivers.com](https://www.bootcampdrivers.com/)
- [Mac mini（2018）のBootCampでRX5700XTをeGPUとして使う！](https://mizuki-an.hatenablog.jp/entry/2020/01/15/200000)
- [BOOT CAMP EGPU SETUP GUIDE – WINDOWS GAMING WITH MACS](https://egpu.io/boot-camp-egpu-setup-guide/)
- [[GUIDE] keeping iGPU activated when booting into Windows using apple_set_os.efi](https://egpu.io/forums/mac-setup/how-to-keep-mbps-irisiris-pro-activated-when-booting-into-windows-boot-camp/)
- [Mac mini 2018 + bootcamp + eGPU(vega 56)](https://qiita.com/linzhenggang/items/0ce8577839ca2f83346a)
- [automate-eGPU EFI - Mac bootscreen on eGPU](https://www.techinferno.com/index.php?/forums/topic/10057-automate-egpu-efi-mac-bootscreen-on-egpu/)
- [Trying to get Vega 56 to work in Windows with a 2019 iMac.](https://egpu.io/forums/pc-setup/trying-to-get-vega-56-to-work-in-windows-with-a-2019-imac/)
- [Use your eGPU under BootCamp with MacBook Pro and Mojave](https://www.imore.com/use-your-egpu-under-bootcamp-macbook-pro-and-mojave)
- [DSDTを編集してWindowsにeGPUを正しく認識させる](http://battleformac.blog.jp/archives/52438135.html)
- [CloverによるDSDTの上書き](http://battleformac.blog.jp/archives/52438382.html)
- [eGPU でどこまでゲームが速くなるか？](http://battleformac.blog.jp/archives/52437855.html)
- [MacBookPro(mojave)のbootcampでblackmagic egpuを使う方法](https://qiita.com/nierlain/items/1c10600a3e494a5aed7c)
- [MacBookにBoot CampしてeGPUを繋ごう](https://kouki.hatenadiary.com/entry/2018/11/26/210530)
</div></details>

# 使用したデバイス・環境
| 種類 | 内容 |
|---|---|
| Mac | Mac mini (2018) |
| eGPU | Blackmagic eGPU Pro (AMD Radeon RX Vega 56) |
| macOS | macOS Catalina バージョン 10.15.4 と 10.15.5 |
| Windows | Windows 10 バージョン 1909 と 2020 (Insider Program) |

<details><summary>補足情報（クリックで展開）</summary><div>

<img width="577" alt="スクリーンショット 2020-06-01 0.32.44.png" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/6bce32d8-7843-0caf-5553-5361e8cf674b.png">

作業時は macOS Catalina バージョン 10.15.4 でしたが、そのあと 10.15.5 のアップデートが来てインストールしました。そのあとにも試してみましたがやはりダメでした。

それから、最初は Windows 10 バージョン 1909 でしたが、Insider Program に参加する（新しいバージョンをインストールする）とうまくいくという例もあったので、2020 にアップグレードして試してみましたがこちらもダメでした。
</div></details>

# そもそもなぜ Boot Camp 環境では使えないのか？
Blackmagic eGPU Pro という商品は、Apple が公式でサポートしている eGPU なので、当然 macOS では動作します。Mac と Blackmagic eGPU Pro を Thunderbolt 3 対応の USB-C ケーブルで接続するだけで使えます。

それと同じ要領で Boot Camp 環境の Windows 10 で使おうとしても、使えません。Windows 10 を起動する前に eGPU を接続する場合と、起動したあとで eGPU を接続する場合とで使えない理由が異なります。

## Windows 10 起動前に eGPU を接続していた場合
Mac の電源を落とした状態で、eGPU をあらかじめ接続しておきます。その状態で Mac の電源を入れて Windows 10 を起動すると、画面に何も映りません。

Mac 本体とモニターと接続しても、eGPU 側とモニターを接続しても、何も映りません。起動する前にモニターと接続しておいても、途中で接続しても、抜き差しを繰り返しても、別の端子に接続しても、USB-C 接続から HDMI 接続にしても、映りません。

理由としては、Apple のファームウェアが関係してくるようです。Mac は、macOS 以外の OS が起動しようとすると Apple のファームウェアが eGPU を制御しようとします。そのとき Windows 10 はカーネルの起動の最中だったりするので、Apple のファームウェアに邪魔されて、eGPU をうまく制御できなくなります。その結果、画面には何も映らなくなります。

## Windows 10 起動後に eGPU を接続した場合
それならば、Windows 10 が起動したあとに eGPU を接続すれば良いのではと考えますが、これもうまくいきません。

Windows 10 は仕様上、4 GB 以上のメモリを使用するデバイスが接続された際にリソース不足というエラーを出します。コード 12 というエラーです。

eGPU は大量のリソースを消費するため、起動後に接続してもエラー 12 で使用不可能な状態となってしまいます。

<img width="347" alt="error_12.png" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/22660069-db12-f8a1-c7bb-f98e71dd4dd0.png">

---

macOS では上記のいずれの問題も発生しないように設計されているため接続するだけで認識・動作しますが、これが Windows 10 となると一筋縄ではいかなくなります。

というわけで、この問題を解決しないと Boot Camp 環境では eGPU が使用できないというわけです。ここから先は、ぼくが実際に試した方法（結局どれもうまくいきませんでしたが）を順番に紹介していきます。

# 🍎 事前準備
| 作業する際に使用する OS |
|:---:|
| macOS (リカバリーモード) |

---

以下のいくつかの方法を試す前に、あらかじめ SIP やセキュリティブートを無効化しておく必要があります。

SIP を無効化する方法に関してはこちらを参考にしてください。
[【上級者向け】System Integrity Protection (SIP) を無効にする方法](https://www.too.com/support/faq/mac/maintenance/23554.html)

セキュリティブートを無効化する方法に関してはこちらを参考にしてください。
[「安全な起動」について](https://support.apple.com/ja-jp/HT208330)

「安全な起動」は「完全なセキュリティ」から「セキュリティなし」に変更し、「外部起動」は「外部メディアからの起動を許可しない」から「外部メディアからの起動を許可」に変更します。

# 🍎 🏴󠁧󠁢󠁳󠁣󠁴󠁿 apple_set_os.efi を使用する
| 作業する際に使用する OS |
|:---:|
| macOS または Windows 10 |

---

おそらく一番最初（か 2 番目）に出てくる方法が `apple_set_os.efi` を使用する方法ではないでしょうか。

仕組みとしては、Apple のファームウェアをバイパスして Windows 10 を起動させるための UEFI みたいです。この UEFI を間にかませて Windows 10 を起動することで eGPU を認識した状態にすることができるようです。

## 手順 1: パーティションを作成する
`apple_set_os.efi` をブートローダから読み込ませるためのパーティションを用意します。この作業は、macOS、Windows 10 のどちらからでも作業できます。

`apple_set_os.efi` ファイルを置くだけなので、パーティションのサイズは小さくて良いです。フォーマットの際のファイルシステムについては後述します。

パーティションの作成方法に関しては以下を参考にしてください。

- macOS から作業する場合 → [Macのディスクユーティリティで物理ディスクにパーティションを作成する](https://support.apple.com/ja-jp/guide/disk-utility/dskutl14027/mac)
- Windows 10 から作業する場合 → [Windows10　新しいドライブ(パーティション)を作成する](https://pc-chain.com/windows10-create-partition/2046/)

## 手順 2: apple_set_os.efi を配置する
`apple_set_os.efi` を以下の GitHub のページからダウンロードします。

[Releases · 0xbb/apple_set_os.efi](https://github.com/0xbb/apple_set_os.efi/releases)

最新バージョンの `apple_set_os.efi` をダウンロードします。

先ほど作成したパーティションに `apple_set_os.efi` を配置します。ファイルを置くだけなのですが、ブートローダに認識させるためにはディレクトリ構造とファイル名が重要になります。具体的には

```
EFI/BOOT/bootx64.efi
```

というディレクトリ構造とファイル名にします。つまり、`apple_set_os.efi` を `bootx64.efi` にリネームして、`EFI/BOOT` ディレクトリを作り、その中に配置します。

## 手順 3: ブートローダを開き、apple_set_os.efi をロードする
macOS または Windows 10 を、再起動、またはシステム終了してからもう一度電源を入れます。そして、OS が起動する前にキーボードのオプションキーを押し続けます。するとブートローダが開きます。

そこには、`Windows` (Windows 10) と `Macintosh HD` (macOS) の他に、`EFI Boot` という起動ディスクがあると思いますので、それを選択して起動します。

![IMG_6386.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/1220bd8e-0f6b-7d7b-f041-64b4a5790d93.jpeg)

▲ キーボードの左右の矢印キーで移動して `EFI Boot` を選択した状態でリターンキーを押します。

すると apple_set_os の黒い画面が表示されます（下図のような画面）。その画面が表示されたら約 6 秒以内に（その黒い画面が消えてしまう前に）Blackmagic eGPU Pro を接続します。

| eGPU 接続前 | eGPU 接続後 |
|:---:|:---:|
| ![IMG_6392.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/fca0fe70-ac2e-ead3-8bea-9f9588dc4438.jpeg) | ![IMG_6389.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/6abfabec-7229-2410-539b-a35337238ec8.jpeg) |
▲ eGPU 接続後は一番下に `00001002 0000687F AMD - Vega 10 XL/XT [Radeon RX Vega 56/64]` という行が追加されているのがわかります。Blackmagic eGPU Pro を認識しています。

eGPU を認識したら、そのまま待つか、`z` 以外の何かしらのキー（リターンキーで良いと思います）を押すと Windows 10 が起動します。

---

この手順で Windows 10 が起動すると、本来なら eGPU が使えるようになるようです。が、ぼくの環境では残念ながら使えませんでした。

他の方法とも合わせて何度か試しているうちに症状が変わったりすることもありましたが、使えるようになることは一度もありませんでした。以下、参考までに症状を書きます。

## 症状 1: ドライバエラー（エラー 12）になる
これは `apple_set_os.efi` などを使わずに、Blackmagic eGPU Pro も接続せずにふつうに Windows 10 を起動して、そのあと Blackmagic eGPU Pro を接続した場合と同じ症状です。つまり、エラー 12 を解決できていません。

<img width="293" alt="driver_error.png" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/834f0d37-d4d7-469c-0424-08ceb1042dcc.png">
▲ Blackmagic eGPU Pro を認識はしているものの、「ドライバエラー」となり使用できません。「再起動してください」と出ることもありますが、再起動しても「ドライバエラー」のままです。

## 症状 2: 映像が全く映らない
これは `apple_set_os.efi` などを使わずに、Blackmagic eGPU Pro を接続した状態で電源を入れて Windows 10 を起動した場合と同じ症状です。Mac mini 本体側、Blackmagic eGPU Pro 側含め、どの端子を使用してもモニターには何も映像が映りません。はじめからモニターと接続した状態で電源を入れたり、電源を入れてからモニターと接続したり、いろいろ試しましたが、ダメでした。

## 症状 3: そもそも認識しない
Windows 10 上では、まるでケーブルを挿していないのと全く同じ状態となります。デバイスマネージャーを開いてみても、そもそも認識していません。

| 認識はしている場合 (症状 1) | 認識すらしていない場合 (症状 3) |
|---|---|
| <img width="226" alt="device_manager_with_egpu.png" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/c0a90cbf-9edc-c3a6-9f8e-71eb30608c11.png"> | <img width="287" alt="device_manager_no_egpu.png" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/adc7e422-8230-2c2a-bdc8-7b7658b2d278.png"> |

`apple_set_os.efi` をロードしたときの黒い画面では Blackmagic eGPU Pro を認識していたので、ケーブルが抜けているとか接触が悪いとかそういうことではありません。

---

いろいろな試行錯誤をしてみましたが解決せず。

## 試行錯誤 1: パーティションのファイルシステムやサイズを変えてみる
`apple_set_os.efi` を置くパーティションのフォーマットをいろいろ変えてフォーマットしてみました。

- FAT → eGPU が使えない
- FAT32 → eGPU が使えない
- APFS → そもそもブートローダに表示されない

FAT のときは 80 MB、FAT 32 のときは 10 GB、APFS のときは 6 GB と、試すたびにパーティションをサイズがバラバラでしたが、それは本質的ではないような気がします。

## 試行錯誤 2: ファイルのパーミッションや所有者を変えてみる
`apple_set_os.efi` (実際には `bootx64.efi` にリネームしています) のパーミッションのせいでうまく動かないとか、そんなことあるかなーと思いつつも、いろいろ試してみることが重要だと思い試しました。でもやはりダメでした。

## 試行錯誤 3: ディレクトリ名の大文字小文字を変えてみる
絶対に違うよなーと思いつつ、これも試しました。もちろんダメでした。

- `EFI/BOOT/bootx64.efi`
- `EFI/Boot/bootx64.efi`
- `efi/boot/bootx64.efi`

いずれもロードはされますが本質的なところは変わりません。というかむしろ大文字でも小文字でもちゃんと認識するんだ、という驚きが少しありました。

## 試行錯誤 4: 挿す端子を変えてみる
Mac mini には USB-C 端子が 4 つあります。どの端子に接続してもダメでした。

## 試行錯誤 5: apple_set_os.efi がロードされる前に接続してみる
最初は Blackmagic eGPU Pro を接続しない状態で電源を入れ、`apple_set_os.efi` がロードされてから接続して認識させていましたが、電源を入れる前からあらかじめ接続しておき、`apple_set_os.efi` をロードする方法も試してみました。

結果的には、これでも `apple_set_os.efi` の黒い画面上では Blackmagic eGPU Pro を認識していました。でも結果は同じです。

## 試行錯誤 6: apple_set_os loader v0.5 を試してみる
以下のフォーラムにある手順を試してみても変わらず。

[[EFI Loader] Error 12 Fix in Boot Camp for Apple T2 Security Chip Macs (apple_set_os loader v0.5)](https://egpu.io/forums/bootcamp/macbook-pro-16-windows-egpu-error-12-fix/)

---

というわけでいろいろ試しましたがダメでした。

# 🍎 🏴󠁧󠁢󠁳󠁣󠁴󠁿 automate-eGPU EFI を使用する
| 作業する際に使用する OS |
|:---:|
| macOS または Windows 10 |

---

これが 2 番目（か一番最初）に出てくる方法だと思います。

[[Solved] automate-eGPU EFI - eGPU boot manager for macOS and Windows](https://egpu.io/forums/mac-setup/automate-egpu-efi-egpu-boot-manager-for-macos-and-windows/)

上記のフォーラムにある通りに進めます。[EFI Package](https://egpu.io/wp-content/uploads/2018/10/EFI.zip) をダウンロードして展開すると、`EFI` というフォルダが出てきます。

先ほど `apple_set_os.efi` を作成したパーティションがあるので、そのパーティションを空にして（`apple_set_os.efi` は削除して）代わりに automate-eGPU EFI を配置します。展開した `EFI` フォルダの中身をそのまま配置すれば OK です。

<details><summary>ディレクトリ構造としてはこのような感じです（クリックで展開）</summary><div>

```
.
├── EFI
│   ├── BOOT
│   │   ├── BOOTX64.efi
│   │   └── automate-eGPU.efi
│   └── CLOVER
│   ├── ACPI
│   │   └── WINDOWS
│   ├── config.plist
│   ├── drivers64UEFI
│   │   └── apple_set_os.efi
│   └── misc
└── __MACOSX
 ├── ._EFI
 └── EFI
 ├── ._BOOT
 ├── ._CLOVER
 ├── BOOT
 │   ├── ._BOOTX64.efi
 │   └── ._automate-eGPU.efi
 └── CLOVER
 ├── ._ACPI
 ├── ._config.plist
 ├── ._drivers64UEFI
 ├── ._misc
 ├── ACPI
 │   └── ._WINDOWS
 └── drivers64UEFI
 └── ._apple_set_os.efi
```
</div></details>

この状態で、`apple_set_os.efi` のときと同じようにブートローダを起動し、automate-eGPU EFI をロードします。ブートローダ上では `apple_set_os.efi` のときと同じように `EFI Boot` という名前の起動ディスクがありますのでそれを選択してロードします。

すると `apple_set_os.efi` と似たような黒い画面が表示されます。なぜか Blackmagic eGPU Pro を接続しても `eGPU not detected` と表示されるのですが、GPU の情報が書かれている欄には 2 つの GPU が表示されているので Blackmagic eGPU Pro も認識していることがわかります。（片方は CPU 内蔵の Intel UHD Graphics 630 で、もう片方が Blackmagic eGPU Pro だと思います）。

| eGPU 未接続時 | eGPU 接続時 |
|:---:|:---:|
| ![IMG_6404.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/f6fedad9-a420-b7b7-fad1-808e09bc692d.jpeg) | ![IMG_6405.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/a5aaa8a3-4e68-f5f9-3544-d0bd85154b2e.jpeg) |
▲ 表の右の画像のように、`GPU(s)` の欄に `[0x1002 0x687F]` が追加されていれば Blackmagic eGPU Pro を認識している状態だと思います。`eGPU not detected` というのが気になりますが。

その画面でキーボードの `q` を押すと、macOS を起動するか Windows を起動するかを選択できますので、Windows を選択してリターンキーを押します。すると Windows 10 が起動します。

![IMG_6401.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/e8f1f881-7019-2846-c7f7-8bd644526f5a.jpeg)
▲ キーボードの上下の矢印キーで移動し、`Load Windows` を選択してリターンキーを押します。

なお、`apple_set_os.efi` のときはこの黒い画面が表示されている間に eGPU を接続すると認識して画面を更新してくれますが、automate-eGPU EFI の場合は接続を認識してくれなかったので、電源を入れる前に Blackmagic eGPU Pro を接続しておく必要があります。

しかしこれも同じ結果でした。発生した症状も試したことも `apple_set_os.efi` と同じです。

# 🍎 rEFInd を使用する
| 作業する際に使用する OS |
|:---:|
| macOS |

---

rEFInd というのは、フリーで使用できるブートローダです。これを使わなくても Mac の電源を入れてオプションキーを押し続けた状態で起動する Apple のブートローダを使用すれば良いような気もしますが、これでうまくいったという例もあったので念のため試してみました。

[eGPU でどこまでゲームが速くなるか？](http://battleformac.blog.jp/archives/52437855.html)

rEFInd のインストール方法は、上記の記事に書いてあるものを参考にさせていただきました。rEFInd の場合はオプションキーを押し続ける必要はない（というかオプションキーを押し続けると Apple のブートローダが起動してしまいます）ので若干楽です。

再起動するかシステム終了してからもう一度電源を入れると rEFInd の画面が表示されます。ここで先ほど紹介した `apple_set_os.efi` や automate-eGPU EFI をロードして Windows 10 を起動しますが、やはりこれも結果は変わりませんでした。

# 🏴󠁧󠁢󠁳󠁣󠁴󠁿 AMD の公式ページからドライバをインストールする
| 作業する際に使用する OS |
|:---:|
| Windows 10 |

---

ドライバエラー（エラー 12）と表示されることが多かったですが、そもそも正しいドライバがインストールされていないのでは？ と思い、公式ページからドライバをインストールすることにしました。

Blackmagic eGPU Pro に搭載されている GPU は AMD Radeon RX Vega 56 なので、このチップに対応したドライバを AMD のページからダウンロードします。

[Radeon™ RX Vega 56 Drivers & Support](https://www.amd.com/ja/support/graphics/radeon-rx-vega-series/radeon-rx-vega-series/radeon-rx-vega-56)

Windows 10 - 64 ビット版を選択してダウンロードします。Revision Number が異なるものがいくつかありますが、試したのは一番上のものです。

<img width="1864" alt="radeon_driver_download_page.png" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/25512e1f-f114-cbdd-e3fb-abbb52fa41b8.png">

ダウンロードしたら、EXE ファイルを実行します。Blackmagic eGPU Pro を接続していない状態で実行すると、AMD の GPU を認識できませんという趣旨のエラーが表示されるのであらかじめ接続しておきます。この時点ではドライバエラーと表示されていても問題ありません。

接続するとインストールできるようになります。詳細オプションで工場リセットのチェック項目がありますが、チェックした場合は再起動を求められます。チェックしない場合とチェックする場合、両方試しました。

しかし、インストールは完了するものの、グラフィックスデバイスに潜在的な問題があるというエラーが表示され、ドライバを適用することができませんでした。インストール自体はうまくいっているようですが、やはり Blackmagic eGPU Pro は使えませんでした。

<img width="596" alt="amd_driver_not_work.png" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/02c05f9f-3b27-9a05-4e90-e354a7e55c83.png">

何度か試して、この画面が表示されたあとに再起動を求められることもありましたが、再起動しても特に何も変わりませんでした。

このエラー（エラー 207）に関してインターネットで調べてみてもよくわかりませんでした。

# 🏴󠁧󠁢󠁳󠁣󠁴󠁿 BootCampDrivers を使用する
| 作業する際に使用する OS |
|:---:|
| Windows 10 |

---

[bootcampdrivers.com](https://www.bootcampdrivers.com/) にアクセスすると、ロゴの下に "Unofficial, turbo-charged AMD graphics drivers for Mac users running BootCamp" と書かれていたので、もしかして Boot Camp 環境では、AMD の公式ページのドライバではダメで、こちらを使用しないとうまくいかないのかな？ と思いました。なのでこれを試してみることにしました。

ページ左上あたりの "Downloads" から "Windows 10 ..." → "2020 drivers ..." と進み、"Adrenalin April 2020 Red Gaming edition (Best FPS in games)" を選択しダウンロードします。

<img width="1238" alt="bootcampdrivers_download_page.png" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/113895/7a7716bb-cf08-286d-3864-b968e71fb4c6.png">

外部ページに飛び、ダウンロードボタンを押すと何やらサインイン（サインアップ）を求められますが、サインインしなくても問題なくダウンロードできます。

インストール手順に関しては以下のリンクで YouTube 動画が公開されているのでそちらの動画を見ながら進めます。

[BootCampDrivers Installation Video](https://www.youtube.com/watch?v=pmBWGdIGke8)

おおまかな手順としては、DDU というものを使い既存のディスプレイドライバーを削除してから AMD のドライバをインストールするというものです。

BootCampDrivers からダウンロードしてきたフォルダの中にある `Setup.exe` というのが AMD のドライバになるのですが、これが AMD の公式ページからダウンロードしてきたものと同じなのか、それとも BootCampDrivers 用にカスタマイズされたものなのかは不明です。とりあえずここでは `Setup.exe` を起動してドライバをインストールしました。

YouTube の説明動画ではドライバインストール後に成功しましたというメッセージが出ていますが、ぼくの環境ではやはり公式ページからダウンロードしてきたドライバのときと同じようにエラー 207 が発生してしまいました。当然 Blackmagic eGPU Pro も使えない状態でした。

## 試行錯誤 1: 違うドライバをインストールしてみる
BootCampDrivers には何種類かのドライバが用意されており、その中に Red edition と書かれているものと Blue edition と書かれているものがあります。両者の違いが何なのかはよくわかりませんが、とりあえず両方とも試してみました。しかしどちらも同じエラー 207 が発生してしまいました。

## 試行錯誤 2: DDU で既存のドライバを削除後、AMD 公式ページからダウンロードしたドライバをインストールしてみる
もしかしたら既存のドライバが残ってしまっていたから、公式ページからダウンロードしたほうのドライバがうまくいかなかったのかなとも思い、既存のドライバを削除後、公式ページからダウンロードしたほうのドライバをインストールしました。しかし結果は変わらず。

---

BootCampDrivers からダウンロードしてきたドライバも、公式ページからダウンロードしてきたドライバのときと同様に、工場リセットや、インストール後の再起動なども行いましたがやはりダメでした。

# Mac mini や Blackmagic eGPU Pro 自体は正常に動作する
ここまでくるともはや Blackmagic eGPU Pro が壊れているんじゃないかと疑うレベルでうまくいきません。

なので、そもそも Blackmagic eGPU Pro が正しく動作しているかを確認するために、macOS を起動して、macOS に対応しているゲームをやってみることにしました。もちろん購入することになるので、実際にやりたいゲームの中で、macOS に対応しているものを Steam で探しました。

正直やりたいゲームはほとんど Windows のみ対応で macOS 対応のものがほとんどなかったのですが、「[Life is Strange 2](https://store.steampowered.com/app/532210/Life_is_Strange_2/)」は macOS 対応だったので購入して遊んでみることにしました。

まず Blackmagic eGPU Pro を接続せずにプレイしてみると、明らかに映像処理が追いついていなくて映像がカクカクでした。設定で解像度や画質を調整することができるのですが、画質を一番低い設定まで落として解像度も HD くらいまで下げてみたのですが、それでも 30fps 出ていないくらいカクついていました。

次に Blackmagic eGPU Pro を接続してモニターを eGPU 側に接続してプレイしました。結果は明らかに違いました。かなりサクサク動作します。解像度を 4K にして画質も最高画質にしても問題ありませんでした。ただ視点切り替えのときに若干フレームレートの低下が気になるので、解像度を 2K まで下げたら全く問題なくなりました。

というわけで、Blackmagic eGPU Pro 自体は間違いなく動作はします。しかしやはり Boot Camp 環境だとうまくいきません。もしかしたら Windows が認識していないだけで、本当は eGPU が有効になっているんじゃないか？ とか淡い期待を抱いたりもしましたがそんなことはありませんでした。

# うまくいかなかった理由はわからない
もちろん Apple は Boot Camp 環境では非対応だと言っているので文句があるわけでは全くないのですが、非公式とはいえこれだけインターネット上に解決策が示されているのに、どれを試しても全くうまくいかないのは正直よくわかりません。

ただ、インターネット上で紹介されているのは、MacBook Pro + eGPU box や、Mac mini + Blackmagic eGPU (Pro がつかないもの) だったりして、Mac mini + Blackmagic eGPU Pro という、全く同じ組み合わせの例でうまくいったという記事は、調べた限りでは見つかりませんでした。まあでも、eGPU であることに変わりはないので、本質的には変わらないと思うのですがねえ......。

ましてや Mac mini + Blackmagic eGPU (Pro がつかないもの) でうまくいっている例があって、Blackmagic eGPU Pro に搭載されている AMD Radeon RX Vega 56 は Blackmagic eGPU Pro 専用に作られたチップではなく Windows PC にも搭載されているものであり、Mac と相性が悪いと言われている（サポートも切れている）NVIDIA の GeForce でもないのに、うまくいかないのは一体なぜなんでしょう......。

しかも、Mac mini には最近の MacBook Pro のように dGPU が搭載されていない分、dGPU を共存させて動作させるとかさせないとかいうことを考える必要もないのでむしろうまくいく可能性は高い気がするんです（詳しくはわかりませんが egpu.io のフォーラムではそのように書かれていました）。

# まだ試していない方法
調べた限りで出てきた方法はほとんど試しましたが、まだ試していないものといえば少し古いバージョンの Windows 10 を使うとか、古いバージョンの macOS を使うというものです。

でもここ数日、さんざんやってダメだったので、これでうまくいく希望は正直持てないし、わざわざ古いバージョンの OS を入れ直すという気力も起こりません。仮にこれでうまくいったとしても、そうなるともう OS のアップデートができなくなってしまうということになります。古いバージョンで脆弱性が発見されたとなればもうお終いです。

あと、これはぼく個人の環境の話になりますが、Mac mini のストレージは 512 GB のもので、Boot Camp 環境なので、Windows 10 に割ける容量はもっと少なくなります。そうなるとゲームをインストールするには少し足りなくなってくる気がします（たとえば FF15 は 100 GB 使うようです）。まあ外付け SSD とかをつければ良いのかもしれませんが、外付けだらけでデスクがごちゃごちゃになります。

それから、Blackmagic eGPU Pro はたしかに高性能ですが、VR ゲームを快適に動作させるほどのパワーがあるかどうかは謎です。eGPU だとその性質上、パフォーマンスが 20 〜 30 % ほど落ちてしまうようなので、AMD Radeon RX Vega 56 の 75% ほどの性能と考えると、どうなんでしょうね......。

というわけで、結論としては......。

# 結論
**PC ゲームをやりたいなら、素直にゲーミング PC を買うか自作しましょう**（知ってた）
