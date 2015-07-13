tyrano.plugin.kag.tag.registerAudioChannel = {

    vital: ['name'],

    pm: {
        name   : '',
        folder : '',
        save   : false, // start audio layer on game load
        stop   : false
    },

    start: function(pm) {
        // make shure that pm.save is boolean
        if (pm.save === 'true') {
            pm.save = true;
        } else if (pm.save === 'false') {
            pm.save = false;
        }

        // make shure that pm.stop is boolean
        if (pm.stop === 'true') {
            pm.stop = true;
        } else if (pm.stop === 'false') {
            pm.stop = false;
        }

        // define audio_channels variable if it isn't defined yet
        if (!this.kag.tmp.audio_channels) {
            this.kag.tmp.audio_channels = {};
        }
        this.kag.tmp.audio_channels[pm.name] = {
            folder : 'data/' + pm.folder + '/',
            save   : pm.save
        }

        this.kag.tmp.map_audio[pm.name] = {};
        this.kag.stat.current_audio[pm.name] = [];

        // define layer volume variable
        if (this.kag.variable.sf.settings.volume[pm.name] === undefined) {
            this.kag.variable.sf.settings.volume[pm.name] = 100;
        }

        if (pm.stop === false) {
            this.kag.ftag.nextOrder();
        }
    }
}

tyrano.plugin.kag.tag.playaudio = {

    vital: ["storage","channel"],

    pm: {
        loop    : "false",
        storage : "",
        fadein  : "false",
        time    : 2000,
        channel : "",
        click   : "false", //音楽再生にクリックが必要か否か
        stop    : "false"  //trueの場合自動的に次の命令へ移動しない。ロード対策
    },

    start:function(pm){

        if (!this.kag.tmp.audio_channels[pm.channel]) {
            this.kag.error('Audio cahnnel ' + pm.channel + 'is not defined');
            return
        }

        var that = this;

        
        //スマホアプリの場合
        if (that.kag.define.FLAG_APRI == true) {

            that.playGap(pm);

        } else if ($.userenv() != "pc") { //スマホからのアクセスの場合は、クリックを挟む

            this.kag.layer.hideEventLayer();

            //スマホからの場合、スキップ中は音楽をならさない
            if (this.kag.stat.is_skip == true && this.kag.tmp.map_audio[pm.channel].save === false) {

                that.kag.layer.showEventLayer();
                that.kag.ftag.nextOrder();

            } else {

                if (pm.click == "true") {
                    $(".tyrano_base").bind("click.bgm",function(){
                        that.play(pm);
                        $(".tyrano_base").unbind("click.bgm");
                        that.kag.layer.showEventLayer();
                    });
                } else {
                    that.play(pm);
                    $(".tyrano_base").unbind("click.bgm");
                    that.kag.layer.showEventLayer();
                }

            }

        } else {

            that.play(pm);

        }

    },

    play: function(pm) {

        var that,
            audio_obj,
            baseUrl,
            storage_url,
            maxVolume;

        that = this;

        if ($.isHTTP(pm.storage)) {
            storage_url = pm.storage;   
        } else {
            storage_url = './' + this.kag.tmp.audio_channels[pm.channel].folder + pm.storage;
        }

        //音楽再生
        var audio_obj = new Audio(storage_url);
        if (pm.loop == "true") {
            audio_obj.loop = true;

            audio_obj.onended = function() {
                this.play();
            }; 
        }

        maxVolume = this.kag.variable.sf.settings.volume.main/100 * this.kag.variable.sf.settings.volume[pm.channel]/100;

        audio_obj.volume = maxVolume;
        this.kag.tmp.map_audio[pm.channel][pm.storage] = audio_obj;
        that.kag.stat.current_audio[pm.channel].push(pm);

        audio_obj.play();

        if (pm.fadein == "true") {

            var vars = jQuery.extend($('<div>')[0], { volume: 0 });

            $(vars).stop().animate({ volume: maxVolume }, {
                easing: "linear",
                duration: parseInt(pm.time),
                step: function() {
                    audio_obj.volume = this.volume; // this == vars
                }
            });

        }

        if (pm.stop == "false") {
            this.kag.ftag.nextOrder();
        }
    },

    //phonegapで再生する
    playGap: function(pm) {

        var that,
            audio_obj,
            baseUrl,
            storage_url;

        that = this;

        if ($.userenv()==="android" || $.userenv()==="andoroid") {
            //android ならパス表記変更
            baseUrl = $.getBaseURL();
        } else {
            //iphone の場合
            baseUrl = './';
        }

        storage_url = baseUrl + this.kag.tmp.audio_channels[pm.channel].folder + pm.storage;

        // example: new Media(src, mediaSuccess, [mediaError], [mediaStatus])
        var audio_obj = new Media(
            storage_url,        // url
            null,               // success callback
            null,               // error callback
            function(status) {  // status change callback
                // Statuses list:
                // 0 - Media.MEDIA_NONE
                // 1 - Media.MEDIA_STARTING
                // 2 - Media.MEDIA_RUNNING
                // 3 - Media.MEDIA_PAUSED
                // 4 - Media.MEDIA_STOPPED
                if (pm.loop == "true" && status === Media.MEDIA_STOPPED) {
                    if (that.kag.tmp.map_audio[pm.channel][pm.storage]) {
                        audio_obj.play();
                    }
                }
            }
        );

        audio_obj.setVolume(that.kag.variable.sf.settings.volume.main/100 * that.kag.variable.sf.settings.volume[pm.channel]/100);
        this.kag.tmp[pm.channel][pm.storage] = audio_obj;
        that.kag.stat.current_audio[pm.channel].push(pm);

        audio_obj.play();

        if(pm.stop == "false"){
            this.kag.ftag.nextOrder();
        }

        
    },

};

tyrano.plugin.kag.tag.stopaudio = {

    vital: ['channel'],

    pm: {
        fadeout : "false",
        time    : 2000,
        channel : "",
        stop    : "false"  //trueの場合自動的に次の命令へ移動しない。ロード対策
    },

    start: function(pm) {

        var that,
            channel_map,
            browser,
            audio_obj;

        that = this;

        channel_map = this.kag.tmp.map_audio[pm.channel];

        browser = $.getBrowser();

        //ロード画面の場合、再生中の音楽はそのまま、直後にロードするから
        if (pm.stop == "false") {
            that.kag.stat.current_audio[pm.channel] = [];
        }

        //アプリで再生している場合
        if (that.kag.define.FLAG_APRI == true) {

            for (key in channel_map) {

                audio_obj = channel_map[key];

                delete that.kag.tmp.map_audio[pm.channel][key];

                audio_obj.statusCallback = undefined; // clear statusCallback to prevent restart looped sound
                //上記マップを削除した後に、ストップ処理を行うといいのではないか。 
                audio_obj.stop();
                audio_obj.release();

            }

        } else {

            for (key in channel_map) {

                audio_obj = channel_map[key];

                delete that.kag.tmp.map_audio[pm.channel][key];

                //フェードアウトしながら再生停止
                if (pm.fadeout == "true") {

                    var vars = jQuery.extend($('<div>')[0], { volume: audio_obj.volume });

                    $(vars).stop().animate({ volume: 0 }, {
                        easing: "linear",
                        duration: parseInt(pm.time),
                        step: function() {
                            audio_obj.volume = this.volume; // this == vars
                        },
                        complete: function() {
                            audio_obj.pause();
                        }
                    });

                } else {

                    audio_obj.pause();

                }

            }
        }

        if (pm.stop == "false") {
            this.kag.ftag.nextOrder();
        }
    }

};

/*
#[playbgm]
:group
オーディオ関連
:title
BGMの再生
:exp
BGMを再生します。
mp3形式、ogg形式　等　HTML5標準をサポートします。
再生するファイルはプロジェクトフォルダのbgmフォルダに格納してください。

:sample
[playbgm storage="music.mp3"]
:param
storage=再生する音楽ファイルを指定してください,
loop=true（デフォルト）またはfalse を指定してください。trueを指定すると繰り返し再生されます,
click=スマートフォンのブラウザから閲覧した場合のみ動作（アプリの場合不要）true またはfalse（デフォルト）を指定してください。trueの場合、スマートフォン（ブラウザ）から閲覧した場合、再生前にクリックが必要になります。
これは、スマートフォンの仕様上、クリックしないと音が鳴らせない縛りがあるため、例えば、背景変更後に音楽再生をしたい場合はtrueを指定しないと音はなりません。通常のテキストの中で音楽再生の場合はfalseで大丈夫です。スマートフォンから閲覧して音楽が鳴らない場合はtrueにしてみてください
#[end]
*/


//音楽再生
tyrano.plugin.kag.tag.playbgm = {

    vital:["storage"],

    pm:{
        loop:"true",
        storage:"",
        channel:"bgm"
    },

    start:function(pm){
        this.kag.ftag.startTag("playaudio",pm);
    }

};


/*
#[stopbgm]
:group
オーディオ関連
:title
BGMの停止
:exp
再生しているBGMの再生を停止します
:sample
[stopbgm ]
:param
#[end]
*/


tyrano.plugin.kag.tag.stopbgm = {

    pm:{
        channel:"bgm",
    },

    start:function(pm){
        this.kag.ftag.startTag("stopaudio",pm);
    }


};

/*
#[fadeinbgm]
:group
オーディオ関連
:title
BGMにフェードイン
:exp
BGMを徐々に再生します。
一部環境（Firefox、Sarafi等）においては対応していません。その場合、playbgmの動作となります。
:sample
[fadeinbgm storage=sample.mp3 loop=false time=3000]
:param
storage=再生する音楽ファイルを指定してください,
loop=true（デフォルト）またはfalse を指定してください。trueを指定すると繰り返し再生されます,
click=スマートフォンのブラウザから閲覧した場合のみ動作（アプリの場合不要）true またはfalse（デフォルト）を指定してください。trueの場合、スマートフォン（ブラウザ）から閲覧した場合、再生前にクリックが必要になります。
これは、スマートフォンの仕様上、クリックしないと音が鳴らせない縛りがあるため、例えば、背景変更後に音楽再生をしたい場合はtrueを指定しないと音はなりません。通常のテキストの中で音楽再生の場合はfalseで大丈夫です。スマートフォンから閲覧して音楽が鳴らない場合はtrueにしてみてください,
time=フェードインを行なっている時間をミリ秒で指定します。
#[end]
*/

tyrano.plugin.kag.tag.fadeinbgm = {

    vital:["storage"],

    pm:{
        loop:"true",
        storage:"",
        fadein:"true",
        channel:"bgm"
    },

    start:function(pm){
        this.kag.ftag.startTag("playaudio",pm);
    }

};



/*
#[fadeoutbgm]
:group
オーディオ関連
:title
BGMのフェードアウト
:exp
再生中のBGMをフェードアウトしながら停止します。
一部環境（Firefox、Sarafi等）においては対応していません。その場合、playbgmの動作となります。
:sample
[fadeoutbgm  time=3000]
:param
time=フェードアウトを行なっている時間をミリ秒で指定します。
#[end]
*/
tyrano.plugin.kag.tag.fadeoutbgm = {

    pm:{
        fadeout: "true",
        channel: "bgm"
    },

    start:function(pm){
        this.kag.ftag.startTag("stopaudio",pm);
    }

};


/*
#[xchgbgm]
:group
オーディオ関連
:title
BGMのクロスフェード（入れ替え）
:exp
BGMを入れ替えます。
音楽が交差して切り替わる演出に使用できます。
一部環境（Firefox、Safari等）において対応していません。その場合、playbgmの動作となります。
:sample
[xchgbgm storage=new.mp3 loop=true time=3000]
:param
storage=次に再生するファイルを指定してください,
loop=true（デフォルト）またはfalse を指定してください。trueを指定すると繰り返し再生されます,
click=スマートフォンのブラウザから閲覧した場合のみ動作（アプリの場合不要）true またはfalse（デフォルト）を指定してください。trueの場合、スマートフォン（ブラウザ）から閲覧した場合、再生前にクリックが必要になります。
これは、スマートフォンの仕様上、クリックしないと音が鳴らせない縛りがあるため、例えば、背景変更後に音楽再生をしたい場合はtrueを指定しないと音はなりません。通常のテキストの中で音楽再生の場合はfalseで大丈夫です。スマートフォンから閲覧して音楽が鳴らない場合はtrueにしてみてください,
time=クロスフェードを行なっている時間をミリ秒で指定します。
#[end]
*/

tyrano.plugin.kag.tag.xchgbgm = {

    vital:["storage"],

    pm:{
        loop:"true",
        storage:"",
        fadein:"true",
        fadeout:"true",
        channel: "bgm"
    },

    start:function(pm){

        this.kag.ftag.startTag("stopaudio",pm);
        this.kag.ftag.startTag("playaudio",pm);

    }

};



/*
#[playse]
:group
オーディオ関連
:title
効果音の再生
:exp
効果音を再生します
効果音ファイルはプロジェクトフォルダのsoundフォルダに入れてください
:sample
[playse storage=sound.mp3 loop=false ]
:param
storage=再生するファイルを指定してください,
loop=trueまたはfalse （デフォルト）を指定してください。trueを指定すると繰り返し再生されます,
clear=trueまたはfalse(デフォルト) 他のSEが鳴っている場合、trueだと他のSEを停止した後、再生します。音声などはtrueが便利でしょう
#[end]
*/

tyrano.plugin.kag.tag.playse = {

    vital:["storage"],

    pm:{
        storage:"",
        channel:"se",
        clear:"false" //他のSEがなっている場合、それをキャンセルして、新しく再生します
    },

    start:function(pm){

        if(pm.clear == "true"){
            this.kag.ftag.startTag("stopaudio",{channel:"se",stop:"true"});
        }

        this.kag.ftag.startTag("playaudio",pm);

    }

};

/*
#[stopse]
:group
オーディオ関連
:title
効果音の停止
:exp
効果音を再生を停止します
:sample
[stopse ]
:param
#[end]
*/

tyrano.plugin.kag.tag.stopse = {

    pm:{
        cahnnel:"se"
    },

    start:function(pm){
        this.kag.ftag.startTag("stopaudio",pm);
    }

};

/*
#[fadeinse]
:group
オーディオ関連
:title
効果音のフェードイン
:exp
効果音をフェードインしながら再生します
:sample
[fadeinse storage=sound.mp3 loop=false time=2000 ]
:param
storage=次に再生するファイルを指定してください,
loop=trueまたはfalse （デフォルト）を指定してください。trueを指定すると繰り返し再生されます,
time=フェードインの時間をミリ秒で指定します
#[end]
*/

tyrano.plugin.kag.tag.fadeinse = {

    vital:["storage"],

    pm:{
        storage:"",
        channel:"se",
        fadein:"true"
    },

    start:function(pm){

        this.kag.ftag.startTag("playaudio",pm);

    }

};

/*
#[fadeoutse]
:group
オーディオ関連
:title
効果音の再生
:exp
効果音をフェードアウトします
:sample
[fadeoutse time=2000 ]
:param
time=フェードアウトを行なっている時間をミリ秒で指定します。
#[end]
*/

tyrano.plugin.kag.tag.fadeoutse = {

    pm:{
        channel:"se",
        fadeout:"true"
    },

    start:function(pm){

        this.kag.ftag.startTag("stopaudio",pm);

    }

};

/*
#[wb]
:group
オーディオ関連
:title
BGMの再生完了を待ちます
:exp
BGMの再生完了を待ちます
:sample
:param
#[end]
*/

//BGMのフェード完了を待ちます
tyrano.plugin.kag.tag.wb = {

    pm:{
    },
    start:function(){
        this.kag.layer.hideEventLayer();

    }
};


//未実装　seの再生終了を待ちます 
tyrano.plugin.kag.tag.wc = {

    pm:{
    },
    start:function(){
       this.kag.layer.hideEventLayer();
    }
};





/*
[fadeinbgm storage="e:3" time=5000]
再生中・・・停止するにはクリックしてください。[l]
[fadeoutbgm time=5000]
*/


