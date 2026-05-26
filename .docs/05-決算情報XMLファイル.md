# 決算情報XMLファイル

3 か月前 更新
このページでは、ダウンロード ページ にて提供している、Gビズインフォに登録されている決算情報を収録したXMLファイルの定義を示します。

※「Metadata」タグ内の項目はファイル ダウンロード時に [メタデータを出力する] を選択した場合にのみ出力されます。

| 通番 | 深さ | 要素名 | タグ名 | データ型 | 説明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 01 | 決算情報 | FinancialInformation | - | - |
| 2 | 02 | 官報掲載情報 | KanpouPostedInformation | - | - |
| 3 | 03 | 記番号 | DataName | string | データ識別番号 |
| 4 | 03 | ステータス | Status | string | 公開ステータス<br>・Add：追加（データを追加）<br>・Replace：差替（官報の訂正・正誤記事に基づく修正） |
| 5 | 03 | 発行日 | IssueDate | string | 官報発行日<br>YYYY年MM月DD日で表記 |
| 6 | 03 | 官報種 | Classification | string | 官報の発行形態（本紙、号外などの別） |
| 7 | 03 | 号数 | Number | string | 官報掲載号数 |
| 8 | 03 | 頁 | Page | string | 官報掲載頁 |
| 9 | 02 | 法人情報 | CorporateInformation | - | |
| 10 | 03 | 期 | Period | string | 決算公告期 |
| 11 | 03 | 公開日(官報掲載日又は定時株主総会日) | Release | string | 公開日(官報掲載日又は定時株主総会日)<br>YYYY年M月D日で表記 |
| 12 | 03 | 法人名 | CompanyName | string | 法人名 |
| 13 | 03 | 単位 | Unit | string | 金額の単位 |
| 14 | 03 | 法人番号 | CorporateNumber | string | 法人番号 |
| 15 | 02 | 表の情報 | Report | - | |
| 16 | 03 | 表名 | ReportName | string | 表名<br>・貸借対照表の要旨<br>・損益計算書の要旨 |
| 17 | 04 | 日付または期間 | BsPlDate | string | 日付または期間<br>・YYYY年M月D日現在<br>・自YYYY年M月D日～至YYYY年M月D日 |
| 18 | 05 | 部 | Division | string | 部<br>・資産の部<br>・負債及び純資産の部<br>・負債及び正味財産の部<br>・負債の部<br>・純資産の部 |
| 19 | 06 | 明細情報 | Meisai | - | |
| 20 | 07 | 勘定科目名 | Subject | string | 勘定科目名 |
| 21 | 07 | 金額 | Amount | string | 金額 |
| 22 | 02 | メタデータ | Metadata | - | |
| 23 | 03 | キー情報 | KeyField | string | gBizINFOが付番する一意となる識別子を示す。 |
| 24 | 03 | データ品質 | DataQuality | string | YYYY年MM月DD日 |
| 25 | 03 | 出典元 | Source | string | データを取得したシステム名称または行政庁名を示す。 |
| 26 | 03 | データ取込頻度 | ImportFrequency | string | Gビズインフォへのデータ取込頻度を示す。固定値「月次」 |
| 27 | 03 | 最終取得日 | Issued | string | データを外部システムから最後に取得した日付を示す。<br>入力形式は以下のとおりとする。<br>・YYYY年MM月DD日 |
| 28 | 03 | 最終更新日 | Updated | string | Gビズインフォ上でデータが最後に更新・修正された日付を示す。<br>入力形式は以下のとおり。<br>・YYYY年MM月DD日 |
