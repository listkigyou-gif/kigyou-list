# 法人情報JSONファイル

3 か月前 更新
このページでは、ダウンロード ページ にて提供している、Gビズインフォに登録されている法人情報を収録したJSONファイルの定義を示します。

※法人活動情報を１件以上保有している法人のみ出力しています。
※「meta-data」オブジェクト及び内部のキーは、ファイル ダウンロード時に [メタデータを出力する] を選択した場合にのみ出力されます。

| 通番 | 深さ | 要素名 | キー名 | データ型 | 説明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 01 | 法人情報 | - | Array | |
| 2 | 03 | 法人番号 | corporate_number | string | 法人番号の指定を受けた者（以下「法人番号保有者」という。）の法人番号を示すデータ項目。 |
| 3 | 03 | 法人名 | name | string | 法人番号保有者の商号又は名称を示すデータ項目。 |
| 4 | 03 | 法人名フリガナ | kana | string | 法人番号保有者の商号又は名称を示すデータ項目。 |
| 5 | 03 | 法人名英語 | name_en | string | 法人番号保有者の商号又は名称を示すデータ項目。 |
| 6 | 03 | 郵便番号 | postal_code | string | 国内所在地の文字情報を基に設定した郵便番号。 |
| 7 | 03 | 本社所在地 | location | string | 法人番号保有者の本店又は主たる事務所の所在地。 |
| 8 | 03 | 処理区分 | process | string | 法人番号の指定、商号又は所在地に変更等が発生した事由をコード値で表す項目。<br>※英語表記及びフリガナの登録並びに検索対象除外の情報の更新に係る処理区分はありません（これらの項目は、提供済みのデータに英語表記若しくはフリガナの登録又は検索対象除外の情報を追加した上で、訂正データとして提供するため）。 |
| 9 | 03 | 訂正区分 | aggregated_year | string | 提供していたデータについて、次の場合に値を設定するデータ項目。<br>①　履歴データ（過去分含む。）の内容に誤りがあり、訂正が生じた場合<br>②　履歴データの追加が生じた場合<br>③　履歴データの削除が生じた場合<br>④　英語表記の登録情報を提供する場合<br>⑤　フリガナの登録情報を提供する場合<br>⑥　検索対象除外の情報を提供する場合<br><br>処理区分が「99：削除」の場合は、訂正区分はブランクとなる。<br>内容に誤りがあった場合は、当該データ項目を活用し、誤った内容のデータを削除して、訂正データを取り込むことにより、保有データを訂正することができる。<br>なお、訂正処理があった場合は、訂正した法人番号保有者に係る全ての履歴データを提供している。 |
| 10 | 03 | 状態 | status | string | 処理区分が"21"の場合、"閉鎖"を出力。それ以外の場合は""を出力 |
| 11 | 03 | 登記記録の閉鎖等年月日 | close_date | string | 登記記録の閉鎖等の事由が生じた年月日を表す。 |
| 12 | 03 | 登記記録の閉鎖等の事由 | close_cause | string | 閉鎖の事由は、登記記録の閉鎖等が生じた事由を表すデータ項目。 |
| 13 | 03 | 法人種別 | kind | string | 法人種別を判別するためのデータ項目。<br>例えば、データの取込み処理を行う場合などにおいて、処理対象として必要としない法人（組織区分）のデータを、法人種別のコード値を利用して除外設定を行うなどの活用が考えられるために提供する項目。 |
| 14 | 03 | 法人代表者名 | representative_name | string | 法人番号保有者の代表者役職氏名。 |
| 15 | 03 | 資本金 | capital_stock | string | 法人番号保有者の資本金。 |
| 16 | 03 | 従業員数 | employee_number | string | 法人番号保有者の従業員数。 |
| 17 | 03 | 企業規模詳細(男性) | company_size_male | string | 法人番号保有者の従業員数の内、男性が占める人数。 |
| 18 | 03 | 企業規模詳細(女性) | company_size_female | string | 法人番号保有者の従業員数の内、女性が占める人数。 |
| 19 | 03 | 事業概要 | business_summary | string | 法人番号所有者の事業概要。 |
| 20 | 03 | 企業ホームページ | company_url | string | 法人番号所有者の企業ホームページ。 |
| 21 | 03 | 創業年 | founding_year | string | 法人番号所有者の創業年。 |
| 22 | 03 | 業種 | industry | Array | 法人番号所有者の事業種目。 |
| 23 | 03 | 設立年月日 | date_of_establishment | string | 法人番号所有者の設立年月日。 |
| 24 | 03 | 全省庁統一資格の営業品目 | business_items | Array | 該当資格者の営業品目。<br>保有している営業品目コードをすべて全角カンマ区切りで出力する。<br>営業品目コードはデジタル庁の電子調達システム（GEPS）から収録。コード値についてはコード一覧の「２ 格納データ項目詳細」を参照。 |
| 25 | 03 | 全省庁統一資格の資格等級 | qualification_grade | string | 全省庁統一資格の資格等級。<br>格納データは”X\|X\|X\|X”となり、資格等級を保有している場合は（A～D）、保有していない場合は空文字となる。<br>それぞれ”物品の製造、物品の販売、役務の提供等、物品の買受け”の順に対応している |
| 26 | 03 | メタデータ | meta-data | Object | |
| 27 | 04 | キー情報 | key_field | string | gBizINFOが付番する一意となる識別子を示す。 |
| 28 | 04 | データ品質 | data_quality | Object | データの区分を以下のいずれかで示す。<br>・政府承認データ<br>・自己申告データ |
| 29 | 05 | 項目別メタデータ | {項目名} | string | |
| 30 | 04 | 出典元 | source | Object | データを取得したシステム名称または行政庁名を示す。 |
| 31 | 05 | 項目別メタデータ | {項目名} | string | |
| 32 | 04 | データ取込頻度 | import_frequency | Object | Gビズインフォへのデータ取込頻度を示す。<br>・年次<br>・月次<br>・日次<br>・半年毎 |
| 33 | 05 | 項目別メタデータ | {項目名} | string | |
| 34 | 04 | 最終取得日 | acquisition_date | Object | データを外部システムから最後に取得した日付を示す。<br>入力形式は以下のとおりとする。<br>・YYYY-MM-DD（西暦-月-日） |
| 35 | 05 | 項目別メタデータ | {項目名} | string | |
| 36 | 04 | 最終取得日 | updated_day | Object | Gビズインフォ上でデータが最後に更新・修正された日付を示す。<br>入力形式は以下のとおり。<br>・YYYY-MM-DD（西暦-月-日） |
| 37 | 05 | 項目別メタデータ | {項目名} | string | |
| 38 | 03 | 補助金情報 | subsidy | Array | |
| 39 | 05 | 認定日 | date_of_approval | string | 補助金情報の認定日。 |
| 40 | 05 | 補助金等 | title | string | 補助金情報の活動名称。 |
| 41 | 05 | 金額 | amount | string | 補助金情報の活動金額。 |
| 42 | 05 | 対象 | target | string | 補助金情報の対象。 |
| 43 | 05 | 府省 | government_departments | string | 補助金情報の公表組織。 |
| 44 | 05 | メタデータ | meta-data | Object | |
| 45 | 06 | キー情報 | key_field | string | gBizINFOが付番する一意となる識別子を示す。 |
| 46 | 06 | データ品質 | data_quality | string | データの区分を以下のいずれかで示す。<br>・政府承認データ<br>・自己申告データ |
| 47 | 06 | 出典元 | source | string | データを取得したシステム名称または行政庁名を示す。 |
| 48 | 06 | データ取込頻度 | import_frequency | string | Gビズインフォへのデータ取込頻度を示す。<br>・年次<br>・月次<br>・日次<br>・半年毎 |
| 49 | 06 | 最終取得日 | acquisition_date | string | データを外部システムから最後に取得した日付を示す。<br>入力形式は以下のとおりとする。<br>・YYYY-MM-DD（西暦-月-日） |
| 50 | 06 | 最終更新日 | updated_day | string | Gビズインフォ上でデータが最後に更新・修正された日付を示す。<br>入力形式は以下のとおり。<br>・YYYY-MM-DD（西暦-月-日） |
| 51 | 03 | 表彰情報 | commendation | Array | |
| 52 | 05 | 年月日 | date_of_commendation | string | 表彰情報の認定日。 |
| 53 | 05 | 表彰名 | title | string | 表彰情報の活動名称。 |
| 54 | 05 | 受賞対象 | target | string | 表彰情報の受賞対象。 |
| 55 | 05 | 部門 | category | string | 表彰情報の部門。 |
| 56 | 05 | 府省 | government_departments | string | 表彰情報の公表組織。 |
| 57 | 05 | 備考 | note | string | 備考 |
| 58 | 05 | メタデータ | meta-data | Object | |
| 59 | 06 | キー情報 | key_field | string | gBizINFOが付番する一意となる識別子を示す。 |
| 60 | 06 | データ品質 | data_quality | string | データの区分を以下のいずれかで示す。<br>・政府承認データ<br>・自己申告データ |
| 61 | 06 | 出典元 | source | string | データを取得したシステム名称または行政庁名を示す。 |
| 62 | 06 | データ取込頻度 | import_frequency | string | Gビズインフォへのデータ取込頻度を示す。<br>・年次<br>・月次<br>・日次<br>・半年毎 |
| 63 | 06 | 最終取得日 | acquisition_date | string | データを外部システムから最後に取得した日付を示す。<br>入力形式は以下のとおりとする。<br>・YYYY-MM-DD（西暦-月-日） |
| 64 | 06 | 最終更新日 | updated_day | string | Gビズインフォ上でデータが最後に更新・修正された日付を示す。<br>入力形式は以下のとおり。<br>・YYYY-MM-DD（西暦-月-日） |
| 65 | 03 | 届出・認定情報 | certification | Array | |
| 66 | 05 | 認定日 | date_of_approval | string | 届出認定情報の認定日。 |
| 67 | 05 | 届出認定等 | title | string | 届出認定情報の活動名称。 |
| 68 | 05 | 対象 | target | string | 届出認定情報の対象。 |
| 69 | 05 | 府省 | government_departments | string | 届出認定情報の部門。 |
| 70 | 05 | 部門 | category | string | 届出認定情報の公表組織名。 |
| 71 | 05 | メタデータ | meta-data | Object | |
| 72 | 06 | キー情報 | key_field | string | gBizINFOが付番する一意となる識別子を示す。 |
| 73 | 06 | データ品質 | data_quality | string | データの区分を以下のいずれかで示す。<br>・政府承認データ<br>・自己申告データ |
| 74 | 06 | 出典元 | source | string | データを取得したシステム名称または行政庁名を示す。 |
| 75 | 06 | データ取込頻度 | import_frequency | string | Gビズインフォへのデータ取込頻度を示す。<br>・年次<br>・月次<br>・日次<br>・半年毎 |
| 76 | 06 | 最終取得日 | acquisition_date | string | データを外部システムから最後に取得した日付を示す。<br>入力形式は以下のとおりとする。<br>・YYYY-MM-DD（西暦-月-日） |
| 77 | 06 | 最終更新日 | updated_day | string | Gビズインフォ上でデータが最後に更新・修正された日付を示す。<br>入力形式は以下のとおり。<br>・YYYY-MM-DD（西暦-月-日） |
| 78 | 03 | 調達情報 | procurement | Array | |
| 79 | 05 | 受注日 | date_of_order | string | 調達情報の認定日。 |
| 80 | 05 | 事業名 | title | string | 調達情報の活動名称。 |
| 81 | 05 | 金額 | amount | string | 調達情報の活動金額。 |
| 82 | 05 | 府省 | government_departments | string | 調達情報の公表組織。 |
| 83 | 05 | 備考 | note | string | 備考 |
| 84 | 05 | メタデータ | meta-data | Object | |
| 85 | 06 | キー情報 | key_field | string | gBizINFOが付番する一意となる識別子を示す。 |
| 86 | 06 | データ品質 | data_quality | string | データの区分を以下のいずれかで示す。<br>・政府承認データ<br>・自己申告データ |
| 87 | 06 | 出典元 | source | string | データを取得したシステム名称または行政庁名を示す。 |
| 88 | 06 | データ取込頻度 | import_frequency | string | Gビズインフォへのデータ取込頻度を示す。<br>・年次<br>・月次<br>・日次<br>・半年毎 |
| 89 | 06 | 最終取得日 | acquisition_date | string | データを外部システムから最後に取得した日付を示す。<br>入力形式は以下のとおりとする。<br>・YYYY-MM-DD（西暦-月-日） |
| 90 | 06 | 最終更新日 | updated_day | string | Gビズインフォ上でデータが最後に更新・修正された日付を示す。<br>入力形式は以下のとおり。<br>・YYYY-MM-DD（西暦-月-日） |
| 91 | 03 | 特許情報 | patent | Array | |
| 92 | 05 | 特許/意匠/商標 | patent_type | string | 特許データの場合には、値「特許」を出力する。<br>意匠データの場合には、値「意匠」を出力する。<br>商標データの場合には、値「商標」を出力する。 |
| 93 | 05 | 登録番号 | registration_number | string | 特許情報の登録番号。 |
| 94 | 05 | 出願年月日 | application_date | string | 特許情報の出願年月日。 |
| 95 | 05 | 分類 | classifications | string | |
| 96 | 05 | 発明の名称(等)/意匠に係る物品/表示用商標 | title | string | 特許データの場合には、発明の名称を出力する。<br>意匠データの場合には、意匠に関わる物品を出力する。<br>商標データの場合には、表示用商標を出力する。 |
| 97 | 05 | 文献固定アドレス | url | string | 「J-PlatPat」で提供される、特定の文献（特許、実用新案、意匠、商標など）にアクセスするためのURLである。<br>※将来的に提供を開始予定の項目であり、現在は空。 |
| 98 | 05 | メタデータ | meta-data | Object | |
| 99 | 06 | キー情報 | key_field | string | gBizINFOが付番する一意となる識別子を示す。 |
| 100 | 06 | データ品質 | data_quality | string | データの区分を以下のいずれかで示す。<br>・政府承認データ<br>・自己申告データ |
| 101 | 06 | 出典元 | source | string | データを取得したシステム名称または行政庁名を示す。 |
| 102 | 06 | データ取込頻度 | import_frequency | string | Gビズインフォへのデータ取込頻度を示す。<br>・年次<br>・月次<br>・日次<br>・半年毎 |
| 103 | 06 | 最終取得日 | acquisition_date | string | データを外部システムから最後に取得した日付を示す。<br>入力形式は以下のとおりとする。<br>・YYYY-MM-DD（西暦-月-日） |
| 104 | 06 | 最終更新日 | updated_day | string | Gビズインフォ上でデータが最後に更新・修正された日付を示す。<br>入力形式は以下のとおり。<br>・YYYY-MM-DD（西暦-月-日） |
| 105 | 03 | 財務情報 | finance | Object | |
| 106 | 05 | 会計基準 | accounting_standards | string | 財務情報の会計基準。 |
| 107 | 05 | 事業年度 | fiscal_year_cover_page | string | 財務情報の事業年度。 |
| 108 | 05 | 財務 | management_index | Object | |
| 109 | 05 | 回次 | period | string | 財務情報の回次。 |
| 110 | 05 | 売上高 | net_sales_summary_of_business_results | string | 財務情報の売上高。 |
| 111 | 05 | 売上高（単位) | net_sales_summary_of_business_results_unit_ref | string | 財務情報の売上高の単位。 |
| 112 | 05 | 営業収益 | operating_revenue1_summary_of_business_results | string | 財務情報の営業収益。 |
| 113 | 05 | 営業収益（単位） | operating_revenue1_summary_of_business_results_unit_ref | string | 財務情報の営業収益の単位。 |
| 114 | 55 | 営業収入 | operating_revenue2_summary_of_business_results | string | 財務情報の営業収入。 |
| 115 | 05 | 営業収入（単位） | operating_revenue2_summary_of_business_results_unit_ref | string | 財務情報の営業収入の単位。 |
| 116 | 05 | 営業総収入 | gross_operating_revenue_summary_of_business_results | string | 財務情報の営業総収入。 |
| 117 | 05 | 営業総収入（単位） | gross_operating_revenue_summary_of_business_results_unit_ref | string | 財務情報の営業総収入の単位。 |
| 118 | 05 | 経常収益 | ordinary_income_summary_of_business_results | string | 財務情報の経常収益。 |
| 119 | 05 | 経常収益（単位） | ordinary_income_summary_of_business_results_unit_ref | string | 財務情報の経常収益の単位。 |
| 120 | 05 | 正味収入保険料 | net_premiums_written_summary_of_business_results_ins | string | 財務情報の正味収入保険料。 |
| 121 | 05 | 正味収入保険料（単位） | net_premiums_written_summary_of_business_results_ins_unit_ref | string | 財務情報の正味収入保険料の単位。 |
| 122 | 05 | 経常利益又は経常損失（△） | ordinary_income_loss_summary_of_business_results | string | 財務情報の経常利益又は経常損失（△）。 |
| 123 | 05 | 経常利益又は経常損失（△）(単位) | ordinary_income_loss_summary_of_business_results_unit_ref | string | 財務情報の経常利益又は経常損失（△）の単位。 |
| 124 | 05 | 当期純利益又は当期純損失（△） | net_income_loss_summary_of_business_results | string | 財務情報の当期純利益又は当期純損失（△）。 |
| 125 | 05 | 当期純利益又は当期純損失（△）(単位) | net_income_loss_summary_of_business_results_unit_ref | string | 財務情報の当期純利益又は当期純損失（△）の単位。 |
| 126 | 05 | 資本金 | capital_stock_summary_of_business_results | string | 財務情報の資本金。 |
| 127 | 05 | 資本金(単位) | capital_stock_summary_of_business_results_unit_ref | string | 財務情報の資本金の単位。 |
| 128 | 05 | 純資産額 | net_assets_summary_of_business_results | string | 財務情報の純資産額。 |
| 129 | 05 | 純資産額(単位) | net_assets_summary_of_business_results_unit_ref | string | 財務情報の純資産額の単位。 |
| 130 | 05 | 総資産額 | total_assets_summary_of_business_results | string | 財務情報の総資産額。 |
| 131 | 05 | 総資産額(単位) | total_assets_summary_of_business_results_unit_ref | string | 財務情報の総資産額の単位。 |
| 132 | 05 | 従業員数 | number_of_employees | string | 財務情報の従業員数。 |
| 133 | 05 | 従業員数(単位) | number_of_employees_unit_ref | string | 財務情報の従業員数の単位。 |
| 134 | 05 | 大株主 | major_shareholders | Array | |
| 135 | 07 | 氏名又は名称 | name_major_shareholders | string | 財務情報の大株主名。 |
| 136 | 07 | 発行済株式総数に対する所有株式数の割合 | shareholding_ratio | string | 発行済株式総数に対する所有株式数の割合。 |
| 137 | 05 | メタデータ | meta-data | Object | |
| 138 | 06 | キー情報 | key_field | string | gBizINFOが付番する一意となる識別子を示す。 |
| 139 | 06 | データ品質 | data_quality | string | データの区分を以下のいずれかで示す。<br>・政府承認データ<br>・自己申告データ |
| 140 | 06 | 出典元 | source | string | データを取得したシステム名称または行政庁名を示す。 |
| 141 | 06 | データ取込頻度 | import_frequency | string | Gビズインフォへのデータ取込頻度を示す。<br>・年次<br>・月次<br>・日次<br>・半年毎 |
| 142 | 06 | 最終取得日 | acquisition_date | string | データを外部システムから最後に取得した日付を示す。<br>入力形式は以下のとおりとする。<br>・YYYY-MM-DD（西暦-月-日） |
| 143 | 06 | 最終更新日 | updated_day | string | Gビズインフォ上でデータが最後に更新・修正された日付を示す。<br>入力形式は以下のとおり。<br>・YYYY-MM-DD（西暦-月-日） |
| 144 | 03 | 職場情報 | workplace_info | Array | |
| 145 | 04 | 勤務基本情報 | base_infos | Object | |
| 146 | 05 | 平均継続勤務年数-範囲 | average_continuous_service_years_type | string | 職場情報の平均継続勤続年数-範囲。 |
| 147 | 05 | 平均継続勤務年数-男性 | average_continuous_service_years_Male | string | 職場情報の平均継続勤続年数-男性。 |
| 148 | 05 | 平均継続勤務年数-女性 | average_continuous_service_years_Female | string | 職場情報の平均継続勤続年数-女性。 |
| 149 | 05 | 正社員の平均継続勤務年数 | average_continuous_service_years | string | 職場情報の正社員の平均継続勤務年数。 |
| 150 | 05 | 従業員の平均年齢 | average_age | string | 職場情報の従業員の平均年齢。 |
| 151 | 05 | 月平均所定外労働時間 | month_average_predetermined_overtime_hours | string | 職場情報の月平均所定外労働時間。 |
| 152 | 04 | 女性の活躍に関する情報 | women_activity_infos | Object | |
| 153 | 05 | 労働者に占める女性労働者の割合-範囲 | female_workers_proportion_type | string | 職場情報の労働者に占める女性労働者の割合-範囲。 |
| 154 | 05 | 労働者に占める女性労働者の割合 | female_workers_proportion | string | 職場情報の労働者に占める女性労働者の割合。 |
| 155 | 05 | 女性管理職人数 | female_share_of_manager | string | 職場情報の女性管理職人数。 |
| 156 | 05 | 管理職全体人数（男女計） | gender_total_of_manager | string | 職場情報の管理職全体人数（男女計）。 |
| 157 | 05 | 女性役員人数 | female_share_of_officers | string | 職場情報の女性役員人数。 |
| 158 | 05 | 役員全体人数（男女計） | gender_total_of_officers | string | 職場情報の役員全体人数（男女計）。 |
| 159 | 04 | 育児・仕事の両立に関する情報 | compatibility_of_childcare_and_work | Object | |
| 160 | 05 | 育児休業対象者数（男性） | number_of_paternity_leave | string | 職場情報の育児休業対象者数（男性）。 |
| 161 | 05 | 育児休業対象者数（女性） | number_of_maternity_leave | string | 職場情報の育児休業対象者数（女性）。 |
| 162 | 05 | 育児休業取得者数（男性） | paternity_leave_acquisition_num | string | 職場情報の育児休業取得者数（男性）。 |
| 163 | 05 | 育児休業取得者数（女性） | maternity_leave_acquisition_num | string | 職場情報の育児休業取得者数（女性）。 |
| 164 | 04 | メタデータ | meta-data | Object | |
| 165 | 05 | キー情報 | key_field | string | gBizINFOが付番する一意となる識別子を示す。 |
| 166 | 05 | データ品質 | data_quality | string | データの区分を以下のいずれかで示す。<br>・政府承認データ<br>・自己申告データ |
| 167 | 05 | 出典元 | source | string | データを取得したシステム名称または行政庁名を示す。 |
| 168 | 05 | データ取込頻度 | import_frequency | string | Gビズインフォへのデータ取込頻度を示す。<br>・年次<br>・月次<br>・日次<br>・半年毎 |
| 169 | 05 | 最終取得日 | acquisition_date | string | データを外部システムから最後に取得した日付を示す。<br>入力形式は以下のとおりとする。<br>・YYYY-MM-DD（西暦-月-日） |
| 170 | 05 | 最終更新日 | updated_day | string | Gビズインフォ上でデータが最後に更新・修正された日付を示す。<br>入力形式は以下のとおり。<br>・YYYY-MM-DD（西暦-月-日） |
