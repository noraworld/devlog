---
title: "コマンドラインでファイルを暗号化する方法"
emoji: "🔐"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["openssl", "smime"]
published: true
---

# TL;DR

```shell:Shell
# 鍵生成
openssl genrsa -aes256 -out key.pem 4096

# X.509 証明書生成 (自己署名証明書)
openssl req -new -x509 -key key.pem -out cert.pem -days 36500 -subj /CN="Kosuke Aoki"

# 証明書情報の確認
openssl x509 -noout -subject -dates -in cert.pem

# 暗号化
echo "This file will be encrypted." > plain.txt
openssl smime -aes256 -binary -encrypt -in plain.txt -out encrypted.txt cert.pem

# 復号
openssl smime -decrypt -in encrypted.txt -out unencrypted.txt -inkey key.pem
```



# はじめに
機密情報をクラウドで管理したり他の人にインターネット経由で送ったりする際にファイルを暗号化したいことがあるかと思います。そこで今回は CLI で簡単にファイルを暗号化する方法についてまとめます。

ファイルを暗号化するには、gpg、openssl-enc、openssl-cms など様々な方法がありますが、今回は Mac でも暗号化できて公開鍵暗号方式が使える openssl-smime を使うことにします。

`openssl` コマンドが必要になりますので、インストールしていない場合は事前にインストールしておいてください。



# 鍵生成
まずは鍵を生成します。鍵の生成には `genrsa` サブコマンドを使用します。

```shell:Shell
openssl genrsa <Cipher> -out <keyFile> <BitLength>
```

| オプション | 説明 |
| --- | --- |
| `<Cipher>` | 暗号化アルゴリズムの種類を指定する |
| `-out <keyFile>` | 鍵ファイルの出力先を指定する |
| `<BitLength>` | 鍵長を指定する |

以下は入力例です。

```shell:Shell
openssl genrsa -aes256 -out key.pem 4096
```

OpenSSL はたくさんの暗号化アルゴリズムをサポートしていますが、上記はその中でも安全性がかなり高い AES256 を採用しています。また、鍵長は長めに 4096 ビットとしています。

コマンド実行中にパスフレーズを求められますので十分に複雑な文字列を入力します。ここで設定したパスフレーズを忘れてしまうと暗号化されたファイルを復号できなくなってしまいますので、ウェブサイト等のパスワードと同様に大切に保管してください。



# 証明書生成
証明書の生成には `req` サブコマンドを使用します。

```shell:Shell
openssl req -new <CertType> -key <KeyFile> -out <CertFile> -days <Expiration> -subj <Subject>
```

| オプション | 説明 |
| --- | --- |
| `-new` | 新規作成 |
| `<CertType>` | 証明書の種類を指定する |
| `-key <KeyFile>` | 使用する鍵ファイルを指定する |
| `-out <CertFile>` | 証明書ファイルの出力先を指定する |
| `-days <Expiration>` | 証明書の有効期限を指定する |
| `-subj <Subject>` | 証明書の発行者情報を指定する |

今回使用する openssl-smime では X.509 証明書が必要になるので、`<CertType>` には `-x509` を指定します。

以下は入力例です。

```shell:Shell
openssl req -new -x509 -key key.pem -out cert.pem -days 36500 -subj /CN="Kosuke Aoki"
```

パスフレーズを求められたら、鍵を生成する際に設定したものを入力します。

## 有効期限について
有効期限は `-days <ExpirationDays>` オプションで指定できます。現在時刻からの経過日数が有効期限となります。たとえば `-days 365` と指定すると、現在時刻から 1 年後が有効期限となります。

このオプションを省略した場合、デフォルトでは 30 日となります。

有効期限を未設定にすることはできないようです。有効期限を設けたくない場合は十分に長い日数 (36500 = 100 年など) を指定するしかなさそうです。

## 証明書の発行者情報について
証明書の発行者情報は `-subj` オプションで指定できます。`-subj` を指定しないとコマンド実行中に証明書の発行者情報の入力をインタラクティブモード形式で求められます。入力を求められる情報は以下のとおりです。

| 英語表記 | 意味 | 記号 |
| --- | --- | :---: |
| Country Name (2 letter code) | 2 文字の国コード | `C` |
| State or Province Name | 都道府県名 | `ST` |
| Locality Name | 市区町村名 | `L` |
| Organization Name | 会社名や組織名 | `O` |
| Organizational Unit Name | 会社や組織の部署名 | `OU` |
| Common Name | 氏名またはサーバのホスト名 | `CN` |
| Email Address | メールアドレス | ? |

オプションで指定したい場合は上表に記載の記号を使用します。たとえば `/C=JP/ST=Tokyo` とすると Country Name (2 文字の国コード) に "JP" (日本) を、State or Province Name (都道府県名) に "Tokyo" を指定したことになります。

なお、上記すべての項目を未入力 (または空欄) にすることはできないようですので、特に情報を付与する必要がない場合は Common Name (氏名またはサーバのホスト名) にニックネームまたは証明書のわかりやすいタイトルでもつけておくと良いでしょう。

## 発行者情報や有効期限の確認方法
コマンド実行時または実行中に設定した発行者情報や有効期限を確認したい場合は以下のコマンドを実行します。

```shell:Shell
openssl x509 -noout -subject -dates -in <CertFile>
```

`<CertFile>` には先ほど発行した証明書ファイルを指定します。

上記コマンドを実行すると以下のような出力が表示されます。

```
subject= /CN=Kosuke Aoki
notBefore=Jan  2 20:00:07 2023 GMT
notAfter=Feb  1 20:00:07 2023 GMT
```

それぞれの項目の意味は以下のとおりです。

| 項目 | 意味 |
| --- | --- |
| `subject` | 発行者情報 |
| `notBefore` | 証明書の開始日時 |
| `notAfter` | 証明書の有効期限日時 |



# 暗号化
鍵と証明書が用意できたら、所望のファイルを暗号化します。`smime` サブコマンドを使ってファイルを暗号化することができます。

```shell:Shell
openssl smime <Cipher> -binary -encrypt -in <PlainFile> -out <EncryptedFile> <CertFile>
```

| オプション | 説明 |
| --- | --- |
| `<Cipher>` | 暗号化アルゴリズムの種類を指定する |
| `-binary` | バイナリとして出力する |
| `-encrypt` | 暗号化する |
| `-in <PlainFile>` | 暗号化したい平文ファイルを指定する |
| `-out <EncryptedFile>` | 暗号文の出力先ファイルを指定する |
| `<CertFile>` | 証明書を指定する |

暗号化する際は証明書を使用します。公開鍵暗号方式でいう公開鍵に該当します。

以下は入力例です。暗号化する前のファイルを適当に生成しています。

```shell:Shell
echo "This file will be encrypted." > plain.txt
openssl smime -aes256 -binary -encrypt -in plain.txt -out encrypted.txt cert.pem
```

`plain.txt` の内容を暗号化したファイル `encrypted.txt` が生成されます。



# 復号
暗号化したファイルを復号する場合は以下のコマンドを実行します。

```shell:Shell
openssl smime -decrypt -in <EncryptedFile> -out <PlainFile> -inkey <KeyFile>
```

| オプション | 説明 |
| --- | --- |
| `-decrypt` | 復号する |
| `-in <EncryptedFile>` | 復号したい暗号化ファイルを指定する |
| `-out <PlainFile>` | 復号文の出力先ファイルを指定する |
| `-inkey <KeyFile>` | 鍵を指定する |

今度は暗号化されたファイルを復号するので、証明書ではなく鍵を使用します。公開鍵暗号方式でいう秘密鍵に該当します。

以下は入力例です。先ほど暗号化したファイル `encrypted.txt` を復号してみます。

```shell:Shell
openssl smime -decrypt -in encrypted.txt -out unencrypted.txt -inkey key.pem
```

パスフレーズを求められたら最初に設定した鍵のパスフレーズを入力します。

`encrypted.txt` の内容を復号したファイルが `unencrypted.txt` が生成されます。



# 他の人とファイルを共有する場合の使い方
他の人から暗号化されたファイルを送ってもらいたいときは、以下の手順を行います。

1. 証明書 (cert.pem) を事前に相手に送っておきます
2. こちらから送った証明書を使って、相手にファイルを暗号化して送ってもらいます
3. 受け取った暗号化されたファイルを鍵を使って復号します

**証明書と間違えて鍵 (key.pem) を送ってしまわないように注意しましょう**。

反対に、他の人に暗号化されたファイルを送りたい場合は、以下の手順を行います。

1. 相手が生成した証明書を事前に送ってもらいます
2. 相手から受け取った証明書を使って、ファイルを暗号化します
3. 暗号化したファイルを送ります



# 参考
* [ファイルをお手軽に暗号化したい！ – openssl cms のススメ](https://eng-blog.iij.ad.jp/archives/9268)
* [opensslコマンドでcsrファイルを作成する際のサーバ名等をコマンドラインオプションで指定する](https://pcvogel.sarakura.net/2015/03/24/31434)
