-- 実験用のシードデータ
-- トヨタ自動車（7203）を 1 社だけ入れる

INSERT INTO stocks (code, name, price_jpy, market_cap_oku, description) VALUES (
  '7203',
  'トヨタ自動車',
  3050.0,
  498000,
  '世界販売台数首位の自動車メーカー。ハイブリッド（HEV）で圧倒的シェア、EV では出遅れたが全方位戦略を堅持。'
);
