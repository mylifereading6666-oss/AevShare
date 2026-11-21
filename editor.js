(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],api=window.AEVSTUDIO_AUTH,client=api&&api.client,KEY='aevstudio.projects',START='<!--AEVSTUDIO_JS_START-->',END='<!--AEVSTUDIO_JS_END-->';
let projects=[],current=null,tab='visual',timer=null,user=null,cloudSaveQueue=Promise.resolve(),activePageIndex=0,previewMode='browse';const PAGE_META='<!--AEVSTUDIO_PAGES:';
function templateAccountSection(){
 return '<section class="content-section account-section" id="account"><div class="section-copy"><span class="eyebrow">MEMBER AREA</span><h2>アカウント</h2><p>ログイン・新規登録・プロフィール管理を配置するエリアです。実際の会員認証にはSupabaseなどの認証サービスとの接続が必要です。</p></div><div class="account-panel"><form class="template-account-form"><label>メールアドレス<input type="email" name="email" autocomplete="email" required placeholder="name@example.com"></label><label>パスワード<input type="password" name="password" autocomplete="current-password" required minlength="8" placeholder="8文字以上"></label><div class="account-actions"><button type="submit" data-auth-mode="login">ログイン</button><button type="button" data-auth-mode="signup" class="account-secondary">新規登録</button></div><p class="account-message" aria-live="polite">このフォームはテンプレート用のサンプルUIです。認証処理は未接続です。</p></form><div class="account-profile"><label>表示名<input type="text" placeholder="あなたの名前"></label><label>自己紹介<textarea rows="3" placeholder="プロフィールを入力"></textarea></label><button type="button" class="account-secondary" data-profile-save>プロフィール編集（サンプル）</button></div></div></section>';
}
function templateRuntime(){
 return "(function(){var root=document;var toggle=root.querySelector('[data-site-menu-toggle]');var menu=root.querySelector('[data-site-menu]');if(toggle&&menu){toggle.addEventListener('click',function(){var open=menu.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));});menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){menu.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');});});document.addEventListener('click',function(e){if(!menu.contains(e.target)&&!toggle.contains(e.target)){menu.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');}});}root.querySelectorAll('.template-account-form').forEach(function(form){form.addEventListener('submit',function(e){e.preventDefault();var msg=form.querySelector('.account-message');if(msg)msg.textContent='サンプル画面です。実際のログインにはSupabase Authなどの接続が必要です。';});form.querySelectorAll('[data-auth-mode]').forEach(function(btn){btn.addEventListener('click',function(){var msg=form.querySelector('.account-message');if(msg)msg.textContent=btn.dataset.authMode==='signup'?'新規登録フォームの見本です。認証サービスを接続すると登録できます。':'ログインフォームの見本です。認証サービスを接続するとログインできます。';});});});root.querySelectorAll('[data-profile-save]').forEach(function(btn){btn.addEventListener('click',function(){var panel=btn.closest('.account-profile');var msg=panel&&panel.querySelector('.account-message');if(!msg&&panel){msg=document.createElement('p');msg.className='account-message';panel.appendChild(msg);}if(msg)msg.textContent='プロフィール編集のサンプルです。保存機能は未接続です。';});});})();";
}
function templateHeader(name,nav){
 return '<header class="site-header"><a class="site-brand" href="index.html">'+name+'</a><button class="site-menu-toggle" type="button" data-site-menu-toggle aria-expanded="false" aria-controls="site-menu" aria-label="メニューを開く"><span></span><span></span><span></span></button><nav class="site-nav" id="site-menu" data-site-menu>'+nav+'</nav><a class="header-cta" href="#account">アカウント</a></header>';
}
function siteTemplate(key,name,title,description,color,heroImage,heroTag,mainHtml,sections){
 const allSections=sections.concat([{nav:'Account',eyebrow:'MEMBER AREA',heading:'アカウント',text:'ログイン・新規登録・プロフィール管理のためのエリアです。認証サービスを接続して利用できます。'}]);
 const nav=allSections.map((s,i)=>'<a href="#'+(i===allSections.length-1?'account':'section-'+i)+'">'+(i===allSections.length-1?'アカウント':s.nav)+'</a>').join('');
 const body=sections.map((s,i)=>'<section class="content-section" id="section-'+i+'"><div class="section-copy"><span class="eyebrow">'+s.eyebrow+'</span><h2>'+s.heading+'</h2><p>'+s.text+'</p></div>'+(s.image?'<img class="section-image" src="'+s.image+'" alt="'+s.alt+'" loading="lazy">':'')+(s.cards?'<div class="template-cards">'+s.cards.map((v,j)=>'<article class="template-card"><img src="'+v.image+'" alt="'+v.alt+'" loading="lazy"><div><small>'+v.kicker+'</small><h3>'+v.title+'</h3><p>'+v.text+'</p></div></article>').join('')+'</div>':'')+'</section>').join('');
 const html=templateHeader(name,nav)+'<main><section class="template-hero"><div class="hero-copy"><span class="eyebrow">'+heroTag+'</span><h1>'+title+'</h1><p>'+description+'</p><a class="hero-button" href="#section-0">詳しく見る <b>→</b></a></div><img class="hero-image" src="'+heroImage+'" alt="'+name+'のメイン画像"></section>'+body+templateAccountSection()+'</main><footer class="site-footer"><b>'+name+'</b><span>'+description+'</span><small>© '+name+' · All rights reserved.</small></footer>';
 const css=':root{--accent:'+color+';--ink:#172033;--muted:#68738a;--paper:#f6f7fb}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:90px}body{margin:0;font-family:Inter,system-ui,-apple-system,"Noto Sans JP",sans-serif;color:var(--ink);background:var(--paper)}a{color:inherit}.site-header{min-height:76px;padding:14px clamp(18px,6vw,90px);display:flex;align-items:center;gap:18px;background:#fff;position:sticky;top:0;z-index:20;box-shadow:0 5px 22px #18223a0a}.site-brand{font-size:20px;font-weight:850;text-decoration:none;letter-spacing:-.04em;margin-right:auto}.site-menu-toggle{width:46px;height:44px;border:1px solid #dce1eb;border-radius:12px;background:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:5px;cursor:pointer}.site-menu-toggle span{width:19px;height:2px;background:#253047;border-radius:2px}.site-nav{display:none;position:absolute;right:clamp(12px,5vw,70px);top:calc(100% - 4px);width:min(320px,calc(100vw - 24px));max-height:min(70vh,520px);overflow:auto;padding:10px;background:#fff;border:1px solid #e0e5ee;border-radius:16px;box-shadow:0 18px 50px #10182825}.site-nav.is-open{display:grid}.site-nav a{padding:13px 14px;text-decoration:none;border-radius:9px;font-size:14px}.site-nav a:hover{background:#f0f2f8}.header-cta,.hero-button{display:inline-flex;align-items:center;gap:18px;padding:12px 18px;border-radius:999px;background:var(--accent);color:white;text-decoration:none;font-weight:700;font-size:13px}.template-hero{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:clamp(24px,5vw,70px);padding:clamp(42px,8vw,112px) clamp(18px,8vw,120px);background:linear-gradient(135deg,#fff 0%,color-mix(in srgb,var(--accent) 9%,white) 100%)}.hero-copy{max-width:620px}.eyebrow{font-size:11px;letter-spacing:.2em;font-weight:800;color:var(--accent)}h1{font-size:clamp(36px,5.5vw,68px);line-height:1.12;letter-spacing:-.05em;margin:16px 0}h2{font-size:clamp(26px,3vw,40px);line-height:1.2;margin:12px 0}h3{margin:8px 0;font-size:20px}.hero-copy>p,.section-copy>p{line-height:1.9;color:var(--muted);max-width:560px}.hero-button{margin-top:16px}.hero-image{width:100%;height:clamp(250px,34vw,440px);object-fit:cover;border-radius:24px;box-shadow:0 24px 70px #18223a20}.content-section{padding:clamp(42px,7vw,90px) clamp(18px,8vw,120px);max-width:1500px;margin:auto}.section-copy{max-width:760px;margin-bottom:24px}.section-image{width:100%;max-height:420px;object-fit:cover;border-radius:20px}.template-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:18px;margin-top:24px}.template-card{overflow:hidden;border-radius:18px;background:white;box-shadow:0 12px 34px #18223a0c}.template-card img{width:100%;height:190px;object-fit:cover;display:block}.template-card>div{padding:18px}.template-card small{color:var(--accent);font-weight:800;letter-spacing:.12em}.template-card p{color:var(--muted);line-height:1.7;font-size:14px}.account-panel{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:18px}.template-account-form,.account-profile{display:grid;gap:14px;padding:22px;background:#fff;border:1px solid #e5e9f1;border-radius:16px}.template-account-form label,.account-profile label{display:grid;gap:7px;font-size:13px;font-weight:700}.template-account-form input,.account-profile input,.account-profile textarea{width:100%;padding:12px;border:1px solid #d9dfeb;border-radius:9px;font:inherit}.account-actions{display:flex;gap:10px;flex-wrap:wrap}.account-actions button,.account-profile button{border:0;border-radius:9px;padding:11px 16px;background:var(--accent);color:#fff;font-weight:700;cursor:pointer}.account-actions .account-secondary,.account-profile .account-secondary{background:#eef0f6;color:#29344b}.account-message{font-size:12px;line-height:1.7;color:var(--muted);margin:0}.site-footer{display:grid;gap:10px;padding:38px clamp(18px,8vw,120px);background:#151d2d;color:#fff}.site-footer span,.site-footer small{color:#aeb8ca;font-size:13px}.media-gallery{padding:30px clamp(18px,8vw,120px);display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px}.media-gallery figure{margin:0}.media-gallery img{width:100%;height:auto;max-height:420px;object-fit:cover;border-radius:16px}.media-gallery figcaption{font-size:12px;color:var(--muted);padding:6px}@media(max-width:760px){.site-header{gap:10px}.header-cta{padding:10px 12px;font-size:12px}.template-hero{grid-template-columns:1fr;padding:38px 20px}.hero-image{height:240px}.content-section{padding:44px 20px}.template-card img{height:170px}}@media(max-width:380px){.header-cta{display:none}}';
 return {name:name,title:title,description:description,color:color,type:key,html:html,css:css,js:templateRuntime()};
}
const img=(id,w=1200)=>'https://images.unsplash.com/'+id+'?auto=format&fit=crop&w='+w+'&q=85';
const templates={
 blank:siteTemplate('blank','MY WEBSITE','アイデアを、形に。','あなたのWebサイト制作をここから始めましょう。','#8065ed',img('photo-1498050108023-c5249f4df085'),'START YOUR WEBSITE','',[
  {nav:'About',eyebrow:'ABOUT',heading:'このサイトについて',text:'ここにサイトの目的や紹介文を入力してください。',image:img('photo-1516321318423-f06f85e504b3'),alt:'ノートパソコンで作業する様子'},
  {nav:'Contact',eyebrow:'GET IN TOUCH',heading:'お問い合わせ',text:'連絡先やSNSへのリンクを掲載できます。',image:img('photo-1497366754035-f200968a6e72'),alt:'明るいワークスペース'}
 ]),
 portfolio:siteTemplate('portfolio','YOUR NAME','つくることが、好きです。','デザイン・開発・写真。これまでの作品とプロフィールを紹介します。','#8b6cff',img('photo-1498050108023-c5249f4df085'),'SELECTED WORKS','',[
  {nav:'Works',eyebrow:'01 / SELECTED WORKS',heading:'制作した作品',text:'作品ごとに画像・担当内容・使用技術を紹介できます。',cards:[
   {image:img('photo-1460925895917-afdab827c52f',700),alt:'Webサイトの分析画面',kicker:'WEB DESIGN',title:'Webサイトデザイン',text:'情報を整理した見やすいWebサイトを制作。'},
   {image:img('photo-1558655146-d09347e92766',700),alt:'グラフィックデザイン',kicker:'GRAPHIC',title:'ビジュアル制作',text:'色とレイアウトを工夫したデザイン作品。'},
   {image:img('photo-1516321318423-f06f85e504b3',700),alt:'ノートパソコン',kicker:'DEVELOPMENT',title:'Webアプリ開発',text:'使いやすさを重視したWebアプリ。'}
  ]},
  {nav:'Profile',eyebrow:'02 / PROFILE',heading:'プロフィール',text:'自己紹介・得意分野・使用できるツールなどを掲載しましょう。',image:img('photo-1521737711867-e3b97375f902'),alt:'チームで制作について話し合う様子'},
  {nav:'Contact',eyebrow:'03 / CONTACT',heading:'一緒につくりませんか？',text:'お問い合わせ方法やSNSのリンクを掲載できます。',image:img('photo-1522071820081-009f0129c71c'),alt:'共同作業するメンバー'}
 ]),
 landing:siteTemplate('landing','NOVA / SERVICE','毎日の「できた」を、もっと。','サービスの特徴をわかりやすく伝え、次のアクションにつなげる紹介ページです。','#6558df',img('photo-1460925895917-afdab827c52f'),'A BETTER WAY TO WORK','',[
  {nav:'Features',eyebrow:'WHY NOVA',heading:'選ばれる3つの理由',text:'サービスの価値を、具体的なメリットとともに紹介します。',cards:[
   {image:img('photo-1553877522-43269d4ea984',700),alt:'チームで計画する様子',kicker:'SIMPLE',title:'シンプルで使いやすい',text:'初めての人でも迷わず使える設計。'},
   {image:img('photo-1551434678-e076c223a692',700),alt:'パソコンで作業する様子',kicker:'SMART',title:'作業を効率化',text:'必要な機能をひとつにまとめます。'},
   {image:img('photo-1521737711867-e3b97375f902',700),alt:'サポートチーム',kicker:'SUPPORT',title:'安心のサポート',text:'困ったときも相談できる体制。'}
  ]},
  {nav:'About',eyebrow:'ABOUT THE SERVICE',heading:'サービスについて',text:'サービスの背景、対象ユーザー、利用するメリットを詳しく説明します。',image:img('photo-1497366754035-f200968a6e72'),alt:'明るいオフィス'},
  {nav:'Start',eyebrow:'GET STARTED',heading:'今日から始めよう',text:'申込み・資料請求・お問い合わせなどのボタンをここに設置します。',image:img('photo-1516321318423-f06f85e504b3'),alt:'作業スペース'}
 ]),
 blog:siteTemplate('blog','THE DAILY NOTE','日々の発見を、言葉に。','日記・レビュー・お知らせなどを読みやすく届けるブログテンプレートです。','#27858a',img('photo-1455390582262-044c0a7d8a75'),'STORIES & JOURNAL','',[
  {nav:'Articles',eyebrow:'LATEST STORIES',heading:'新着記事',text:'記事のタイトル・概要・サムネイルを並べて掲載できます。',cards:[
   {image:img('photo-1499750310107-5fef28a66643',700),alt:'ノートとペン',kicker:'2026.11.21 · DIARY',title:'新しいことを始める日',text:'日々の気づきや体験を記事にしてみましょう。'},
   {image:img('photo-1516321318423-f06f85e504b3',700),alt:'ノートパソコン',kicker:'2026.11.18 · TECH',title:'制作メモと学び',text:'学んだことや便利なテクニックを記録。'},
   {image:img('photo-1497366754035-f200968a6e72',700),alt:'作業デスク',kicker:'2026.11.12 · LIFE',title:'お気に入りの作業環境',text:'日常の出来事やおすすめを紹介。'}
  ]},
  {nav:'About',eyebrow:'ABOUT THIS BLOG',heading:'このブログについて',text:'ブログのテーマ、運営者、更新頻度などを紹介します。',image:img('photo-1455390582262-044c0a7d8a75'),alt:'文章を書くためのノート'}
 ]),
 shop:siteTemplate('shop','ATELIER STORE','お気に入りに出会う場所。','商品写真・特徴・価格・購入案内を掲載する小さなオンラインストアのデザインです。','#b36a43',img('photo-1491553895911-0055ec6402d0'),'CURATED FOR YOU','',[
  {nav:'Products',eyebrow:'SHOP COLLECTION',heading:'おすすめの商品',text:'商品画像・商品名・特徴・価格を紹介します。実際の決済機能は別途連携が必要です。',cards:[
   {image:img('photo-1523275335684-37898b6baf30',700),alt:'腕時計',kicker:'NEW ARRIVAL',title:'ミニマルウォッチ',text:'シンプルなデザイン · ¥8,800'},
   {image:img('photo-1548036328-c9fa89d128fa',700),alt:'バッグ',kicker:'POPULAR',title:'デイリーバッグ',text:'毎日に使いやすいサイズ · ¥6,500'},
   {image:img('photo-1503602642458-232111445657',700),alt:'椅子',kicker:'LIFESTYLE',title:'デザインチェア',text:'空間になじむフォルム · ¥12,000'}
  ]},
  {nav:'About',eyebrow:'OUR CONCEPT',heading:'ものづくりへのこだわり',text:'ショップのコンセプトや商品選びの基準を説明します。',image:img('photo-1494438639946-1ebd1d20bf85'),alt:'雑貨の並ぶ棚'},
  {nav:'Guide',eyebrow:'SHOP GUIDE',heading:'ご利用ガイド',text:'配送・返品・問い合わせ方法などを掲載します。',image:img('photo-1556742049-0cfed4f6a45d'),alt:'商品購入のイメージ'}
 ]),
 restaurant:siteTemplate('restaurant','BISTRO LUMIÈRE','季節を味わう、特別なひととき。','料理・店内・メニュー・営業時間など、お店の魅力を伝えるレストランサイトです。','#9b633d',img('photo-1517248135467-4c7edcad34c4'),'WELCOME TO OUR TABLE','',[
  {nav:'Menu',eyebrow:'SEASONAL MENU',heading:'季節のおすすめ',text:'料理の写真とメニュー説明を掲載できます。',cards:[
   {image:img('photo-1504674900247-0877df9cc836',700),alt:'彩り豊かな料理',kicker:'MAIN',title:'季節のプレート',text:'旬の食材を使ったおすすめ料理。'},
   {image:img('photo-1476224203421-9ac39bcb3327',700),alt:'パスタ料理',kicker:'PASTA',title:'自家製パスタ',text:'素材の味を大切にした一皿。'},
   {image:img('photo-1488477181946-6428a0291777',700),alt:'デザート',kicker:'DESSERT',title:'本日のデザート',text:'食後に楽しむ季節の甘い一品。'}
  ]},
  {nav:'Space',eyebrow:'OUR SPACE',heading:'落ち着いた店内',text:'座席・内装・お店の雰囲気を写真で紹介しましょう。',image:img('photo-1414235077428-338989a2e8c0'),alt:'レストランのテーブル'},
  {nav:'Info',eyebrow:'INFORMATION',heading:'店舗情報・ご予約',text:'住所・営業時間・定休日・予約方法を記載してください。',image:img('photo-1559339352-11d035aa65de'),alt:'カフェの店内'}
 ]),
 event:siteTemplate('event','CREATIVE MEETUP','アイデアが出会う、一日。','イベント・展示会・勉強会の日時、会場、内容、参加案内をまとめるテンプレートです。','#3e72bd',img('photo-1505373877841-8d25f7d46678'),'SAVE THE DATE','',[
  {nav:'Program',eyebrow:'EVENT PROGRAM',heading:'イベントプログラム',text:'開催内容やタイムテーブルを紹介します。',cards:[
   {image:img('photo-1511578314322-379afb476865',700),alt:'イベント会場',kicker:'10:00 · OPENING',title:'オープニング',text:'イベントの概要と当日の流れを紹介。'},
   {image:img('photo-1515187029135-18ee286d815b',700),alt:'セッションの様子',kicker:'13:00 · SESSION',title:'トークセッション',text:'登壇者とテーマを掲載します。'},
   {image:img('photo-1511632765486-a01980e01a18',700),alt:'交流する参加者',kicker:'16:00 · NETWORKING',title:'交流タイム',text:'参加者同士で交流する時間。'}
  ]},
  {nav:'Venue',eyebrow:'VENUE & ACCESS',heading:'会場・アクセス',text:'会場名、住所、アクセス方法、地図へのリンクを掲載します。',image:img('photo-1497366811353-6870744d04b2'),alt:'イベントスペース'},
  {nav:'Join',eyebrow:'REGISTRATION',heading:'参加する',text:'申込方法・参加費・注意事項を掲載します。',image:img('photo-1511578314322-379afb476865'),alt:'イベントの参加者'}
 ]),
 photography:siteTemplate('photography','FRAME & LIGHT','光と景色を、記録する。','写真家・フォトグラファー向け。大きな写真を主役にしたギャラリーサイトです。','#596f78',img('photo-1470252649378-9c29740c9fa8'),'PHOTOGRAPHY PORTFOLIO','',[
  {nav:'Gallery',eyebrow:'SELECTED PHOTOGRAPHS',heading:'フォトギャラリー',text:'写真を大きく見せて、作品の世界観を伝えます。',cards:[
   {image:img('photo-1470252649378-9c29740c9fa8',900),alt:'朝日の風景',kicker:'LANDSCAPE',title:'Morning Light',text:'朝の光と風景。'},
   {image:img('photo-1470770841072-f978cf4d019e',900),alt:'湖と山の風景',kicker:'NATURE',title:'Quiet Lake',text:'静かな湖畔の風景。'},
   {image:img('photo-1500530855697-b586d89ba3ee',900),alt:'山と自然',kicker:'TRAVEL',title:'Beyond the Road',text:'旅先で出会った景色。'}
  ]},
  {nav:'About',eyebrow:'ABOUT THE PHOTOGRAPHER',heading:'撮影について',text:'撮影スタイル、使用機材、依頼可能な内容などを紹介します。',image:img('photo-1452587925148-ce544e77e70d'),alt:'カメラを持つフォトグラファー'},
  {nav:'Contact',eyebrow:'BOOKING',heading:'撮影のご相談',text:'撮影依頼・利用条件・連絡先を掲載してください。',image:img('photo-1516035069371-29a1b244cc32'),alt:'カメラ機材'}
 ]),
 gaming:siteTemplate('gaming','PLAYER ONE','PLAY. CREATE. CONNECT.','ゲームチーム・コミュニティ・配信者の活動やイベントを紹介するサイトです。','#6a5ae0',img('photo-1542751371-adc38448a05e'),'GAMING COMMUNITY','',[
  {nav:'About',eyebrow:'WHO WE ARE',heading:'コミュニティ紹介',text:'チームの方針、活動内容、メンバーを紹介します。',image:img('photo-1511512578047-dfb367046420'),alt:'ゲームをプレイする様子'},
  {nav:'News',eyebrow:'LATEST UPDATES',heading:'最新ニュース',text:'大会・配信・アップデートなどのお知らせを掲載します。',cards:[
   {image:img('photo-1542751371-adc38448a05e',700),alt:'eスポーツ会場',kicker:'TOURNAMENT',title:'大会開催のお知らせ',text:'開催日時や参加方法を案内。'},
   {image:img('photo-1593305841991-05c297ba4575',700),alt:'ゲーム機器',kicker:'STREAM',title:'配信スケジュール',text:'配信予定やチャンネルを紹介。'},
   {image:img('photo-1511512578047-dfb367046420',700),alt:'ゲームプレイ',kicker:'COMMUNITY',title:'メンバー募集',text:'参加条件やルールを掲載。'}
  ]},
  {nav:'Join',eyebrow:'JOIN US',heading:'一緒にプレイしよう',text:'参加方法・ルール・SNSや配信チャンネルへのリンクを掲載します。',image:img('photo-1593305841991-05c297ba4575'),alt:'ゲーム環境'}
 ]),
 agency:siteTemplate('agency','NORTH / CREATIVE','ブランドの可能性を、デザインする。','制作会社・個人事業・クリエイティブチーム向けのサービスサイトです。','#315e83',img('photo-1497366811353-6870744d04b2'),'DESIGN & DIGITAL STUDIO','',[
  {nav:'Services',eyebrow:'WHAT WE DO',heading:'サービス',text:'提供するサービスと対応範囲を整理して紹介します。',cards:[
   {image:img('photo-1460925895917-afdab827c52f',700),alt:'Web分析画面',kicker:'01 / WEB',title:'Webサイト制作',text:'目的に合わせたWebサイトを設計・制作。'},
   {image:img('photo-1558655146-d09347e92766',700),alt:'デザイン制作',kicker:'02 / BRAND',title:'ブランドデザイン',text:'ロゴやビジュアルの方向性を設計。'},
   {image:img('photo-1553877522-43269d4ea984',700),alt:'打ち合わせ',kicker:'03 / SUPPORT',title:'運用サポート',text:'公開後の改善や更新を支援。'}
  ]},
  {nav:'Works',eyebrow:'OUR WORK',heading:'制作実績',text:'実績画像・担当内容・成果を掲載します。',image:img('photo-1497366754035-f200968a6e72'),alt:'制作スタジオ'},
  {nav:'Contact',eyebrow:'START A PROJECT',heading:'プロジェクトの相談',text:'相談フォームやメールアドレス、対応時間を掲載してください。',image:img('photo-1521737711867-e3b97375f902'),alt:'チームミーティング'}
 ]),
 account:siteTemplate('account','MEMBER SPACE','アカウントを管理する。','プロフィール・設定・セキュリティ情報をまとめる会員ページのデザインです。','#7566d8',img('photo-1521737711867-e3b97375f902'),'YOUR ACCOUNT CENTER','',[
  {nav:'Profile',eyebrow:'YOUR PROFILE',heading:'プロフィール',text:'表示名・プロフィール画像・自己紹介などを掲載するエリアです。',image:img('photo-1521737711867-e3b97375f902'),alt:'プロフィールのイメージ'},
  {nav:'Settings',eyebrow:'PREFERENCES',heading:'アカウント設定',text:'表示テーマ・言語・通知などの設定項目を整理します。',image:img('photo-1497366754035-f200968a6e72'),alt:'設定画面のイメージ'},
  {nav:'Security',eyebrow:'SECURITY',heading:'セキュリティ',text:'パスワード変更・ログイン状態・アカウント削除案内などを配置します。',image:img('photo-1555949963-ff9fe0c870eb'),alt:'セキュリティのイメージ'}
 ]),
 dashboard:siteTemplate('dashboard','CONTROL CENTER','必要な情報をひと目で。','統計・最近の活動・ショートカットをまとめたダッシュボードです。','#3d79b7',img('photo-1460925895917-afdab827c52f'),'YOUR OVERVIEW','',[
  {nav:'Overview',eyebrow:'OVERVIEW',heading:'利用状況',text:'合計数・進捗・達成状況などの概要をカード形式で見せます。',image:img('photo-1460925895917-afdab827c52f'),alt:'分析ダッシュボード'},
  {nav:'Activity',eyebrow:'RECENT ACTIVITY',heading:'最近の活動',text:'更新履歴・最近開いた項目・通知などを一覧表示します。',image:img('photo-1497366754035-f200968a6e72'),alt:'作業履歴のイメージ'},
  {nav:'Shortcuts',eyebrow:'QUICK ACTIONS',heading:'クイック操作',text:'よく使う機能へのリンクや新規作成ボタンを配置します。',image:img('photo-1516321318423-f06f85e504b3'),alt:'作業スペース'}
 ]),
 community:siteTemplate('community','CREATOR HUB','好きなことを、つながる場所に。','メンバー紹介・お知らせ・参加案内を備えたコミュニティサイトです。','#438c91',img('photo-1529156069898-49953e39b3ac'),'WELCOME TO THE COMMUNITY','',[
  {nav:'Members',eyebrow:'OUR MEMBERS',heading:'メンバー紹介',text:'参加者や運営メンバーのプロフィールを紹介します。',image:img('photo-1529156069898-49953e39b3ac'),alt:'コミュニティのイメージ'},
  {nav:'Updates',eyebrow:'LATEST UPDATES',heading:'お知らせ',text:'イベント・更新情報・重要なお知らせを掲載します。',image:img('photo-1517245386807-bb43f82c33c4'),alt:'お知らせのイメージ'},
  {nav:'Join',eyebrow:'JOIN US',heading:'参加方法',text:'参加条件・ルール・問い合わせ先などをわかりやすく案内します。',image:img('photo-1521737711867-e3b97375f902'),alt:'参加案内のイメージ'}
 ])
};
function makeId(){if(window.crypto&&window.crypto.randomUUID)return window.crypto.randomUUID();const bytes=new Uint8Array(16);if(window.crypto&&window.crypto.getRandomValues)window.crypto.getRandomValues(bytes);else for(let i=0;i<16;i++)bytes[i]=Math.floor(Math.random()*256);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20)}
function validUuid(value){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''))}
function normalizeCloudId(p){if(!validUuid(p.id)){const old=p.id;p.id=makeId();if(current&&current.id===old)current.id=p.id;projects=projects.map(x=>x===p||x.id===old?Object.assign({},x,{id:p.id}):x)}return p}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function split(html){let pages=null;const m=html.match(/<!--AEVSTUDIO_PAGES:([\s\S]*?)-->/);if(m){try{pages=JSON.parse(m[1])}catch(e){}html=html.replace(m[0],'')}const a=html.indexOf(START),b=html.indexOf(END);return a<0||b<a?{html:html,js:'',pages:pages}:{html:html.slice(0,a)+html.slice(b+END.length),js:html.slice(a+START.length,b),pages:pages}}
function packed(p){return (p.html||'')+START+(p.js||'')+END+(p.pages&&p.pages.length>1?PAGE_META+JSON.stringify(p.pages)+'-->':'')}
function say(s,bad){$('#save-status').textContent=s;$('#save-status').style.color=bad?'#ff9baf':'var(--cyan)'}
function localSave(){try{localStorage.setItem(KEY,JSON.stringify(projects.map(p=>Object.assign({},p,{html:packed(p)}))))}catch(e){say('端末の保存容量が不足しています',true)}}
function visual(){
 const title=$('#page-title').value.trim()||'My Website',desc=$('#page-description').value,color=$('#page-color').value;
 let html=current&&current.html?current.html:templates.blank.html;
 try{const doc=new DOMParser().parseFromString(html,'text/html');const brand=doc.querySelector('.site-brand,header b,header strong');if(brand)brand.textContent=$('#project-name').value.trim()||title;const heading=doc.querySelector('.template-hero h1,main h1,h1');if(heading)heading.textContent=title;const intro=doc.querySelector('.template-hero .hero-copy>p,main p:not(.eyebrow)');if(intro)intro.textContent=desc;html=doc.body.innerHTML}catch(e){}
 let css=current&&current.css?current.css:templates[$('#site-type').value]?.css||templates.blank.css;
 css=css.replace(/--accent:[^;]+;/,'--accent:'+color+';');
 return {title:title,description:desc,color:color,type:$('#site-type').value,html:html,css:css};
} 
function showMediaStatus(message,bad){const el=$('#media-status');if(el){el.textContent=message;el.classList.toggle('error',!!bad)}}
function insertImage(src,alt){
 if(!current)return;const safeSrc=esc(src),safeAlt=esc(alt||'追加した画像');
 const figure='<figure><img src="'+safeSrc+'" alt="'+safeAlt+'" loading="lazy"><figcaption>'+safeAlt+'</figcaption></figure>';
 let html=$('#html-code').value||current.html||'';
 const galleryStart=html.indexOf('<section class="media-gallery"');if(galleryStart>=0){const galleryEnd=html.indexOf('</section>',galleryStart);if(galleryEnd>=0)html=html.slice(0,galleryEnd)+figure+html.slice(galleryEnd)}else html+='<section class="media-gallery"><div class="media-gallery-heading"><h2>Gallery</h2><p>追加した画像</p></div>'+figure+'</section>';
 current.html=html;current.visualDirty=false;$('#html-code').value=html;
 const css=$('#css-code').value||current.css||'';if(!css.includes('.media-gallery{'))$('#css-code').value=css+'\n.media-gallery{padding:34px clamp(18px,8vw,120px);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:16px}.media-gallery figure{margin:0}.media-gallery img{display:block;width:100%;height:220px;object-fit:cover;border-radius:14px}.media-gallery figcaption{padding:7px;color:#68738a;font-size:12px}';
 current.css=$('#css-code').value;current.updated_at=new Date().toISOString();preview();save();
 const previewBox=$('#media-preview');if(previewBox){const im=document.createElement('img');im.src=src;im.alt=alt||'追加画像';previewBox.prepend(im)}
 showMediaStatus('画像をページに追加しました。プレビューで確認できます。');
}
function readFileAsDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('画像を読み込めませんでした'));reader.readAsDataURL(file)})}
async function compressImage(file){
 if(!file.type.startsWith('image/'))throw new Error('画像ファイルを選択してください');
 const data=await readFileAsDataURL(file);const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('画像を開けませんでした'));img.src=data});
 const scale=Math.min(1,1500/Math.max(img.naturalWidth,img.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
 let quality=.78,blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));while(blob&&blob.size>240*1024&&quality>.42){quality-=.08;blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality))}
 if(!blob)throw new Error('画像を軽量化できませんでした');if(blob.size>360*1024)throw new Error('画像が大きすぎます。小さい画像を選んでください');
 return await readFileAsDataURL(new File([blob],(file.name||'image').replace(/\.[^.]+$/,'')+'.webp',{type:'image/webp'}));
}

function normalizePreviewMarkup(p){const doc=new DOMParser().parseFromString(p.html||'','text/html');const pageCount=Array.isArray(p.pages)?p.pages.length:1;doc.querySelectorAll('[data-site-menu],.site-nav,nav').forEach(nav=>{let found=false;[...nav.querySelectorAll('a')].forEach(a=>{const href=(a.getAttribute('href')||'').toLowerCase().split(/[?#]/)[0],label=(a.textContent||'').trim().toLowerCase();const isAccount=href.endsWith('/account.html')||href==='account.html'||href==='#account'||label==='アカウント'||label==='account'||label==='account management';if(!isAccount)return;if(found){a.remove();return}found=true;a.setAttribute('href',pageCount>1?'page-'+pageCount+'.html#account':'#account')})});doc.querySelectorAll('.header-cta').forEach(a=>{const v=(a.textContent||'')+' '+(a.getAttribute('href')||'');if(v.includes('アカウント')||v.toLowerCase().includes('account'))a.remove()});return doc.body.innerHTML}
function compose(p){const diagnosticRuntime=`<script>(function(){window.addEventListener('error',function(e){window.parent.postMessage({type:'AEVSTUDIO_PREVIEW_ERROR',kind:'実行エラー',message:e.message||'JavaScriptの実行中にエラーが発生しました',line:e.lineno||0},'*')});window.addEventListener('unhandledrejection',function(e){var reason=e.reason;window.parent.postMessage({type:'AEVSTUDIO_PREVIEW_ERROR',kind:'非同期エラー',message:reason&&reason.message?reason.message:String(reason||'Promise rejection')},'*')})})();<\/script>`;const inspectorScript=`<script>(function(){var last=null,inspectMode=false;window.addEventListener('message',function(e){if(e.source!==window.parent||!e.data||e.data.type!=='AEVSTUDIO_SET_PREVIEW_MODE')return;inspectMode=e.data.mode==='inspect';if(!inspectMode&&last){last.style.outline='';last.style.outlineOffset='';last=null}});document.addEventListener('click',function(e){var el=e.target;if(!el||el===document.documentElement||el===document.body)return;var link=el.closest&&el.closest('a[href]');var href=link?(link.getAttribute('href')||'').trim():'';if(!inspectMode){if(!link)return;if(!href||href.charAt(0)==='#')return;if(/^(?:mailto:|tel:|javascript:)/i.test(href))return;var parentUrl=window.parent.location.href;var resolved;try{resolved=new URL(href,parentUrl)}catch(_){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();window.parent.postMessage({type:'AEVSTUDIO_PREVIEW_LINK_BLOCKED',href:href,label:(link.textContent||'').trim()},'*');return}var parentOrigin=window.parent.location.origin;if(/^https?:$/i.test(resolved.protocol)&&resolved.origin!==parentOrigin)return;var path=resolved.pathname.toLowerCase();var file=path.split('/').pop()||'';var pageMatch=file.match(/^page-(\\d+)\\.html$/i);var label=(link.textContent||'').trim();var lowerLabel=label.toLowerCase();var accountMatch=file==='account.html'||lowerLabel==='アカウント'||lowerLabel==='account'||lowerLabel==='account management';var isHome=file===''||file==='index.html'||file==='home.html';e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();window.parent.postMessage({type:'AEVSTUDIO_PREVIEW_PAGE_NAV',index:accountMatch?-1:(pageMatch?Math.max(0,Number(pageMatch[1])-1):(isHome?0:null)),hash:resolved.hash||'',href:href,label:label},'*');return}var target=el.closest('a,button,input,textarea,select,img,section,article,header,footer,nav,h1,h2,h3,p,div,span')||el;if(last){last.style.outline='';last.style.outlineOffset=''}last=target;target.style.outline='3px solid #8b6cff';target.style.outlineOffset='2px';var path=[],node=target;while(node&&node!==document.body&&path.length<6){var part=node.tagName.toLowerCase();if(node.id){part+='#'+node.id;path.unshift(part);break}if(node.classList&&node.classList.length)part+='.'+Array.from(node.classList).slice(0,2).join('.');var parent=node.parentElement;if(parent){var same=Array.from(parent.children).filter(function(x){return x.tagName===node.tagName});if(same.length>1)part+=':nth-of-type('+(same.indexOf(node)+1)+')'}path.unshift(part);node=parent}var info={type:'AEVSTUDIO_PREVIEW_SELECT',tag:target.tagName.toLowerCase(),id:target.id||'',classes:typeof target.className==='string'?target.className:'',selector:path.join(' > '),text:(target.innerText||target.alt||target.getAttribute('aria-label')||'').trim().replace(/\\s+/g,' ').slice(0,180),outer:target.outerHTML.slice(0,700)};window.parent.postMessage(info,'*');e.preventDefault();e.stopPropagation();e.stopImmediatePropagation()},true)})();<\/script>`;return '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(p.title||p.name)+'</title><style>'+p.css+'</style></head><body>'+normalizePreviewMarkup(p)+diagnosticRuntime+'<script>'+String(p.js||'').replace(/<\/script/gi,'<\\/script')+'<\/script>'+inspectorScript+'</body></html>'}
function showPreviewSelection(info){const panel=$('#preview-inspector');if(!panel)return;panel.classList.add('has-selection');$('#inspect-tag').textContent='<'+info.tag+'>';$('#inspect-selector').textContent=info.selector||info.tag;$('#inspect-text').textContent=info.text||'テキストなし（画像・装飾など）';$('#inspect-id').textContent=info.id?'ID: '+info.id:'ID: なし';$('#inspect-class').textContent=info.classes?'class: '+info.classes:'class: なし';$('#inspect-source').textContent=info.outer||'';panel.dataset.inspectId=info.id||'';panel.dataset.inspectClass=info.classes||'';panel.dataset.inspectTag=info.tag||'';panel.dataset.inspectOuter=info.outer||'';$('#inspect-html').disabled=false;$('#inspect-css').disabled=false}
function locatePreviewSelection(){const panel=$('#preview-inspector');if(!panel)return;const source=$('#html-code').value;const id=panel.dataset.inspectId,classes=(panel.dataset.inspectClass||'').split(/\\s+/).filter(Boolean),tag=panel.dataset.inspectTag;let needle=id?'id="'+id+'"':id?"id='"+id+"'":'';let pos=needle?source.indexOf(needle):-1;if(pos<0&&classes.length){needle='class="'+panel.dataset.inspectClass+'"';pos=source.indexOf(needle);if(pos<0){needle=classes[0];pos=source.indexOf(needle)}}if(pos<0&&tag){needle='<'+tag;pos=source.toLowerCase().indexOf(needle.toLowerCase())}switchTab('html');const area=$('#html-code');if(pos>=0){let start=source.lastIndexOf('<',pos);if(start<0)start=pos;let end=source.indexOf('>',pos);if(end<0)end=Math.min(source.length,pos+needle.length);area.focus();area.setSelectionRange(start,Math.min(source.length,end+1));const line=source.slice(0,start).split('\\n').length;say('HTMLの '+line+' 行目付近を選択しました')}else{area.focus();say('該当要素をHTML内で特定できませんでした。セレクター: '+(panel.querySelector('#inspect-selector')?.textContent||''),true)}}
function setPreviewMode(mode){previewMode=mode==='inspect'?'inspect':'browse';$('[data-preview-mode]').forEach(b=>{const active=b.dataset.previewMode===previewMode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});const frame=$('#site-preview');if(frame&&frame.contentWindow)frame.contentWindow.postMessage({type:'AEVSTUDIO_SET_PREVIEW_MODE',mode:previewMode},'*');const hint=$('#preview-mode-hint');if(hint)hint.textContent=previewMode==='inspect'?'確認モード：プレビュー内の要素をタップしてコード位置を確認':'閲覧モード：メニュー・ボタン・リンクを通常どおり操作';}
function setupPreviewInspector(){const frame=$('#site-preview');if(frame&&!frame.dataset.modeBound){frame.dataset.modeBound='1';frame.addEventListener('load',()=>setPreviewMode(previewMode))}$('[data-preview-mode]').forEach(b=>b.addEventListener('click',()=>setPreviewMode(b.dataset.previewMode)));setPreviewMode(previewMode);const preview=$('.preview-panel');if(!preview||$('#preview-inspector'))return;preview.insertAdjacentHTML('afterend','<section class="preview-inspector" id="preview-inspector"><div class="inspector-heading"><b>クリックした箇所</b><span>LIVE ELEMENT INSPECTOR</span></div><div class="inspector-empty" id="inspect-empty">ライブプレビュー内の変更したい場所をタップすると、該当箇所の情報を表示します。</div><div class="inspector-details"><div class="inspector-tag" id="inspect-tag"></div><code id="inspect-selector"></code><p id="inspect-text"></p><small id="inspect-id"></small><small id="inspect-class"></small><pre id="inspect-source"></pre><div class="inspector-actions"><button type="button" class="btn btn-small" id="inspect-html" disabled>HTMLの該当箇所を開く</button><button type="button" class="btn btn-small" id="inspect-css" disabled>CSS編集を開く</button></div></div></section>');$('#inspect-html').onclick=locatePreviewSelection;$('#inspect-css').onclick=()=>{switchTab('css');say('CSS編集画面を開きました。セレクター: '+$('#inspect-selector').textContent)}}
window.addEventListener('message',e=>{if(e.source!==$('#site-preview')?.contentWindow||!e.data)return;if(e.data.type==='AEVSTUDIO_PREVIEW_ERROR'){const box=$('#code-diagnostics');const message=(e.data.message||'プレビュー内でエラーが発生しました').slice(0,300);const line=e.data.line?'<span>（'+Number(e.data.line)+'行目）</span>':'';if(box){box.innerHTML='<div class="diagnostic-errors"><b>⚠ プレビュー実行エラー</b><ul><li><strong>'+esc(e.data.kind||'JavaScript')+'</strong>：'+esc(message)+line+'</li></ul></div>'}return}if(e.data.type==='AEVSTUDIO_PREVIEW_LINK_BLOCKED'){say('このリンク先に対応するページがプロジェクト内にありません: '+(e.data.label||e.data.href||''),true);return}if(e.data.type==='AEVSTUDIO_PREVIEW_PAGE_NAV'){if(!current||!current.pages||!current.pages.length)return;let index=e.data.index===null?-2:Number(e.data.index);if(!Number.isInteger(index)||index<0||index>=current.pages.length){const label=String(e.data.label||'').trim().toLowerCase();const href=String(e.data.href||'');const file=href.split(/[?#]/)[0].split('/').pop().toLowerCase();if(file==='account.html'||label==='アカウント'||label==='account'||label==='account management')index=current.pages.length-1;else if(file==='index.html'||file==='home.html'||!file)index=0;else index=current.pages.findIndex(p=>[p.name,p.title].some(v=>String(v||'').trim().toLowerCase()===label));}if(index<0||index>=current.pages.length){say('リンク先のページが見つかりません: '+(e.data.label||e.data.href||''),true);return}checkpoint();activePageIndex=index;const q=current.pages[index];$('#page-title').value=q.title||q.name;$('#page-description').value=q.description||'';$('#html-code').value=q.html||'';$('#css-code').value=q.css||'';$('#js-code').value=q.js||'';renderPageControls();preview();if(e.data.hash){const frame=$('#site-preview');try{frame.contentWindow.postMessage({type:'AEVSTUDIO_PREVIEW_SCROLL',hash:e.data.hash},'*')}catch(_){}}return}if(e.data.type==='AEVSTUDIO_PREVIEW_SELECT')showPreviewSelection(e.data)});
function read(){const page={name:$('#page-title').value.trim()||'ページ',title:$('#page-title').value,description:$('#page-description').value,html:$('#html-code').value,css:$('#css-code').value,js:$('#js-code').value};const pages=(current.pages&&current.pages.length?current.pages:[page]).map((x,i)=>i===activePageIndex?Object.assign({},x,page):x);return Object.assign({},current,{name:$('#project-name').value.trim()||'Untitled Project',title:page.title,description:page.description,color:$('#page-color').value,type:$('#site-type').value,html:page.html,css:page.css,js:page.js,pages:pages,updated_at:new Date().toISOString()})}
function showCodeDiagnostics(items){const box=$('#code-diagnostics');if(!box)return;if(!items.length){box.innerHTML='<div class="diagnostic-ok">✓ エラーは見つかりませんでした</div>';return}box.innerHTML='<div class="diagnostic-errors"><b>⚠ '+items.length+'件のエラー・警告</b><ul>'+items.map(x=>'<li><strong>'+esc(x.kind)+'</strong>：'+esc(x.message)+(x.line?' <span>（'+x.line+'行目）</span>':'')+'</li>').join('')+'</ul></div>'}
function checkCodeDiagnostics(){const errors=[];const html=$('#html-code')?.value||'';const css=$('#css-code')?.value||'';const js=$('#js-code')?.value||'';try{const doc=new DOMParser().parseFromString(html,'text/html');const parserError=doc.querySelector('parsererror');if(parserError)errors.push({kind:'HTML',message:parserError.textContent.trim().slice(0,240)})}catch(e){errors.push({kind:'HTML',message:e.message||String(e)})}try{new Function(js)}catch(e){errors.push({kind:'JavaScript',message:e.message||String(e),line:e.lineNumber||0})}try{const sheet=new CSSStyleSheet();sheet.replaceSync(css)}catch(e){errors.push({kind:'CSS',message:e.message||String(e)})}showCodeDiagnostics(errors);return errors}
function preview(){if(current){checkCodeDiagnostics();$('#site-preview').srcdoc=compose(read())}}
function list(){const root=$('#editor-project-list');root.innerHTML=projects.length?projects.map(p=>'<button class="editor-project-item '+(current&&p.id===current.id?'active':'')+'" data-id="'+esc(p.id)+'"><b>'+esc(p.name||'Untitled')+'</b><small>'+new Date(p.updated_at||Date.now()).toLocaleDateString('ja-JP')+'</small></button>').join(''):'<p class="empty">プロジェクトがありません。</p>';root.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const p=projects.find(x=>x.id===b.dataset.id);if(p){fill(p);history.replaceState({},'', 'editor.html?project='+encodeURIComponent(p.id))}})}
function fill(p){current=p;activePageIndex=0;if(!Array.isArray(current.pages)||!current.pages.length)current.pages=[{name:'トップページ',title:p.title||'My Website',description:p.description||'',html:p.html||'',css:p.css||'',js:p.js||''}];const q=current.pages[0];$('#project-name').value=p.name||'Untitled';$('#page-title').value=q.title||p.title||'My Website';$('#page-description').value=q.description||p.description||'';$('#page-color').value=p.color||'#8b6cff';$('#site-type').value=p.type||'website';$('#html-code').value=q.html||p.html||'';$('#css-code').value=q.css||p.css||'';$('#js-code').value=q.js||p.js||'';renderPageControls();list();preview()}
function checkpoint(){if(!current)return null;let p=read();if(tab==='visual'&&current.visualDirty){const v=visual();p=Object.assign(p,v);p.pages[activePageIndex]=Object.assign({},p.pages[activePageIndex],{name:$('#page-title').value.trim()||'ページ',title:p.title,description:p.description,html:p.html,css:p.css,js:p.js});$('#html-code').value=p.html;$('#css-code').value=p.css;current.visualDirty=false}current=p;projects=[p].concat(projects.filter(x=>x.id!==p.id));localSave();list();return p}
async function save(){let p=checkpoint();if(!p)return;say('端末に自動保存しました');if(client&&user){p=normalizeCloudId(p);current=p;projects=[p].concat(projects.filter(x=>x.id!==p.id));localSave();list();const payload={id:p.id,user_id:user.id,name:p.name,title:p.title,description:p.description,color:p.color,html:packed(p),css:p.css,updated_at:p.updated_at};cloudSaveQueue=cloudSaveQueue.then(()=>client.from('studio_projects').upsert(payload)).catch(error=>({error}));const result=await cloudSaveQueue;if(result.error)say('端末保存済み・クラウド保存失敗: '+result.error.message,true);else say('プロジェクトをクラウドに保存しました')}}
function makeTemplatePages(template,count){const doc=new DOMParser().parseFromString(template.html,'text/html'),hero=doc.querySelector('.template-hero'),sections=[...doc.querySelectorAll('.content-section:not(.account-section)')];if(count===1){const account=doc.querySelector('.account-section')? '':templateAccountSection();return [{name:'トップページ',title:template.title,description:template.description,html:doc.body.innerHTML+account,css:template.css,js:template.js||templateRuntime()}];}const groups=[],per=Math.ceil(sections.length/Math.max(1,count-1));for(let i=0;i<count-1;i++)groups.push(sections.slice(i*per,(i+1)*per));const names=['トップページ',...groups.map((g,i)=>g[0]?.querySelector('h2')?.textContent||('ページ'+(i+2)))];return Array.from({length:count},(_,i)=>{const body=i===0?(hero?.outerHTML||''):((groups[i-1]||[]).map(x=>x.outerHTML).join('')||'<section class="content-section"><h1>新しいページ</h1><p>このページの内容を編集してください。</p></section>');const nav=names.map((n,j)=>'<a href="'+(j===0?'index.html':'page-'+(j+1)+'.html')+'">'+esc(n)+'</a>').join('')+'<a href="'+(count===1?'#account':'page-'+count+'.html#account')+'">アカウント</a>';const header='<header class="site-header"><a class="site-brand" href="index.html">'+esc(template.name)+'</a><button class="site-menu-toggle" type="button" data-site-menu-toggle aria-expanded="false" aria-controls="site-menu" aria-label="メニューを開く"><span></span><span></span><span></span></button><nav class="site-nav" id="site-menu" data-site-menu>'+nav+'</nav></header>';const account=i===count-1?templateAccountSection():'';return {name:names[i],title:i===0?template.title:names[i],description:i===0?template.description:'ページの内容を紹介します。',html:header+'<main>'+body+account+'</main><footer class="site-footer"><b>'+esc(template.name)+'</b></footer>',css:template.css,js:template.js||templateRuntime()}})}
function renderPageControls(){const root=$('#page-manager-list');if(!root||!current)return;root.innerHTML=(current.pages||[]).map((p,i)=>'<div class="page-manager-row"><button type="button" data-page-index="'+i+'" class="page-manager-select '+(i===activePageIndex?'active':'')+'"><b>'+(i+1)+'. '+esc(p.name||p.title||'ページ')+'</b><small>'+(i===0?'トップページ':'サブページ')+'</small></button>'+(i?'<button type="button" class="page-manager-remove" data-remove-page="'+i+'">削除</button>':'')+'</div>').join('');root.querySelectorAll('[data-page-index]').forEach(b=>b.onclick=()=>{checkpoint();activePageIndex=Number(b.dataset.pageIndex);const q=current.pages[activePageIndex];$('#page-title').value=q.title||q.name;$('#page-description').value=q.description||'';$('#html-code').value=q.html||'';$('#css-code').value=q.css||'';$('#js-code').value=q.js||'';renderPageControls();preview()});root.querySelectorAll('[data-remove-page]').forEach(b=>b.onclick=()=>{if(confirm('このページを削除しますか？')){checkpoint();current.pages.splice(Number(b.dataset.removePage),1);activePageIndex=Math.min(activePageIndex,current.pages.length-1);fill(current);save()}})}
function addPage(){checkpoint();const n=current.pages.length+1;current.pages.push({name:'新しいページ'+n,title:'新しいページ'+n,description:'ページの説明を入力してください。',html:'<header class="site-header"><a class="site-brand" href="index.html">'+esc(current.name)+'</a><nav><a href="index.html">トップページ</a></nav></header><main><h1>新しいページ</h1><p>ここに内容を追加してください。</p></main>',css:current.css||templates.blank.css,js:''});activePageIndex=current.pages.length-1;const updated=read();current=Object.assign(updated,{pages:current.pages});fill(current);activePageIndex=current.pages.length-1;const q=current.pages[activePageIndex];$('#page-title').value=q.title;$('#page-description').value=q.description;$('#html-code').value=q.html;$('#css-code').value=q.css;$('#js-code').value=q.js;renderPageControls();preview();save()}
function create(t,count,requestedName){const s=templates[t]||templates.blank,p=Object.assign({id:makeId(),name:s.title,updated_at:new Date().toISOString()},s);p.pages=makeTemplatePages(s,Math.max(1,Math.min(20,Number(count)||1)));const projectName=String(requestedName||p.name||s.title).trim().slice(0,80)||s.title;Object.assign(p,p.pages[0]);p.name=projectName;projects.unshift(p);fill(p);localSave();history.replaceState({},'', 'editor.html?project='+encodeURIComponent(p.id));save()}
function switchTab(t){tab=t;$$('.editor-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));$('#visual-pane').classList.toggle('hidden',t!=='visual');['html','css','js'].forEach(x=>$('#'+x+'-pane').classList.toggle('hidden',t!==x));if(t==='visual'){const v=visual();$('#html-code').value=v.html;$('#css-code').value=v.css}preview()}
function schedule(){if(tab==='visual'&&current)current.visualDirty=true;checkpoint();say('変更をプロジェクトに自動保存中...');clearTimeout(timer);timer=setTimeout(async()=>{await save();preview()},650)}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200)}
async function zip(){await save();const p=read();if(!window.JSZip){download('index.html',compose(p),'text/html;charset=utf-8');say('ZIP機能を読込中のためHTMLを保存しました');return}const z=new JSZip(),pages=p.pages&&p.pages.length?p.pages:[p];pages.forEach((pg,i)=>{const stem=i===0?'index':'page-'+(i+1);z.file(stem+'.html','<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(pg.title||pg.name)+'</title><link rel="stylesheet" href="'+stem+'.css"></head><body>'+pg.html+'<script src="'+stem+'.js">'+'</'+'script></body></html>');z.file(stem+'.css',pg.css||p.css||'');z.file(stem+'.js',pg.js||'')});const blob=await z.generateAsync({type:'blob'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='AevStudio-project.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);say('ZIPを書き出しました')}
async function load(){
 // Render from this device first. Network/auth must never block the editor.
 let local=[];
 try{
  const stored=JSON.parse(localStorage.getItem(KEY)||'[]');
  local=Array.isArray(stored)?stored:[];
 }catch(error){console.warn('AevStudio local project data could not be parsed:',error)}
 projects=local.map(p=>{
  const q=split(p.html||'');
  return Object.assign({},p,{html:q.html,js:p.js||q.js||'',pages:Array.isArray(p.pages)&&p.pages.length?p.pages:(q.pages||[{name:'トップページ',title:p.title||'My Website',description:p.description||'',html:q.html,css:p.css||'',js:p.js||q.js||''}])});
 });
 const params=new URLSearchParams(location.search);
 const pid=params.get('project');
 const hasTemplate=params.has('template');
 const t=params.get('template')||'blank';
 let requestedProject=null;
 if(hasTemplate){
  const requestedCount=Math.max(1,Math.min(20,parseInt(params.get('pages')||'1',10)||1));
  create(templates[t]?t:'blank',requestedCount,params.get('name')||'');
  requestedProject=current;
 }else if(pid){
  const found=projects.find(p=>String(p.id)===String(pid));
  if(found)fill(found);
  else if(projects.length)fill(projects[0]);
  else create('blank',1);
 }else if(projects.length){
  fill(projects[0]);
 }else{
  create('blank',1);
 }
 list();
 say('端末のプロジェクトを読み込みました');

 // Cloud sync runs in the background with a timeout. It cannot hold the editor
 // in its initial "準備中" state or prevent local projects from opening.
 const withTimeout=(promise,label)=>Promise.race([
  promise,
  new Promise((_,reject)=>setTimeout(()=>reject(new Error(label+'がタイムアウトしました')),8000))
 ]);
 (async()=>{
  try{
   if(!client)return;
   const authResult=await withTimeout(client.auth.getSession(),'Supabase認証');
   if(authResult.error)throw authResult.error;
   user=authResult.data.session?.user||null;
   if(!user)return;
   const result=await withTimeout(client.from('studio_projects').select('*').order('updated_at',{ascending:false}),'クラウド読み込み');
   if(result.error)throw result.error;
   const cloud=(result.data||[]).map(x=>{
    const q=split(x.html||'');
    return {id:x.id,name:x.name,title:x.title||'My Website',description:x.description||'',color:x.color||'#8b6cff',html:q.html,js:q.js,css:x.css||'',pages:q.pages||[{name:'トップページ',title:x.title||'My Website',description:x.description||'',html:q.html,css:x.css||'',js:q.js||''}],updated_at:x.updated_at||new Date().toISOString()};
   });
   const activeId=requestedProject?.id||pid||current?.id;
   const merged=new Map();
   projects.concat(cloud).forEach(p=>{
    const old=merged.get(String(p.id));
    if(!old||new Date(p.updated_at||0)>=new Date(old.updated_at||0))merged.set(String(p.id),p);
   });
   projects=Array.from(merged.values()).sort((a,b)=>new Date(b.updated_at||0)-new Date(a.updated_at||0));
   localSave();
   const active=projects.find(p=>String(p.id)===String(activeId));
   if(active)fill(active);
   list();
   if(requestedProject){
    const saved=projects.find(p=>String(p.id)===String(requestedProject.id))||requestedProject;
    const payload={id:saved.id,user_id:user.id,name:saved.name,title:saved.title,description:saved.description,color:saved.color,html:packed(saved),css:saved.css,updated_at:saved.updated_at||new Date().toISOString()};
    const upsert=await withTimeout(client.from('studio_projects').upsert(payload),'クラウド保存');
    if(upsert.error)throw upsert.error;
    say('プロジェクトを端末とクラウドに保存しました');
   }else{
    say('プロジェクトを読み込みました（クラウド同期済み）');
   }
  }catch(error){
   console.warn('AevStudio background cloud sync failed:',error);
   say('端末のプロジェクトは利用できます。クラウド同期は未完了です: '+(error?.message||String(error)),true);
  }
 })();
}
$('#new-project').onclick=()=>{location.href='create-project.html'};const addPageButton=$('#add-page-button');if(addPageButton)addPageButton.onclick=addPage;
$$('.editor-tab').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
['project-name','page-title','page-description','page-color','site-type','html-code','css-code','js-code'].forEach(k=>$('#'+k).addEventListener('input',()=>{if(['html-code','css-code','js-code'].includes(k))checkCodeDiagnostics();schedule()}));
$('#add-image-url').onclick=()=>{const url=$('#image-url').value.trim();if(!(url.startsWith('https://')||url.startsWith('http://'))){showMediaStatus('https:// から始まる画像URLを入力してください',true);return}insertImage(url,$('#image-alt').value.trim());$('#image-url').value=''};
$('#image-files').addEventListener('change',async e=>{const files=[...e.target.files].slice(0,4);if(!files.length)return;let done=0;for(const file of files){try{const data=await compressImage(file);insertImage(data,file.name.split('.').slice(0,-1).join('.'));done++}catch(err){showMediaStatus(err.message,true)}}if(done)showMediaStatus(done+'枚の画像を追加しました。端末とログイン中のクラウドに保存します。');e.target.value=''});
$('#site-type').addEventListener('change',e=>{const key=e.target.value;if(!templates[key])return;if(current&&!confirm('テンプレートを切り替えると、現在のページ構成とコードが新しいテンプレートに置き換わります。続けますか？')){e.target.value=current.type||'blank';return}const old=current;const next=Object.assign({},templates[key],{id:old.id,name:templates[key].name,updated_at:new Date().toISOString()});fill(next);$('#project-name').value=next.name;$('#page-title').value=next.title;$('#page-description').value=next.description;$('#page-color').value=next.color;save()});
window.addEventListener('pagehide',()=>{clearTimeout(timer);checkpoint()});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){clearTimeout(timer);checkpoint();if(client&&user)save().catch(()=>{})}});$('#save-now').onclick=save;$('#refresh-preview').onclick=()=>{preview();say('プレビューを更新しました')};$('#preview-size').onchange=e=>{const w=e.target.value;$('#site-preview').style.width=w;$('#preview-label').textContent=(w==='100%'?'自動':w==='1200px'?'PC':w==='768px'?'タブレット':'スマホ')+' · '+w};$('#download-html').onclick=()=>download('index.html',compose(read()),'text/html;charset=utf-8');$('#export-zip').onclick=zip;
if(client)client.auth.onAuthStateChange(async(_e,s)=>{user=s&&s.user;if(user){const r=await client.from('studio_projects').select('*').order('updated_at',{ascending:false});if(!r.error&&r.data){r.data.forEach(x=>{const q=split(x.html||'');if(!projects.some(p=>p.id===x.id))projects.push({id:x.id,name:x.name,title:x.title||'My Website',description:x.description||'',color:x.color||'#8b6cff',html:q.html,js:q.js,css:x.css||'',pages:q.pages||[{name:'トップページ',title:x.title||'My Website',description:x.description||'',html:q.html,css:x.css||'',js:q.js||''}],updated_at:x.updated_at})});list()}}});
const jszip=document.createElement('script');jszip.src='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';jszip.async=true;document.head.appendChild(jszip);
setupPreviewInspector();load().catch(e=>{console.error('AevStudio cloud load error:',e);say('読み込みエラー: '+(e?.message||String(e)),true);if(!current)create('blank')});
})();