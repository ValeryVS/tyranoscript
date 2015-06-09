

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
        fadein:"false",
        time:2000,
        target:"bgm", //"bgm" or "se"
        click:"false", //音楽再生にクリックが必要か否か
        stop:"false"  //trueの場合自動的に次の命令へ移動しない。ロード対策
        
    },
    
    start:function(pm){
        
        var that = this;
        
        
        if(pm.target=="bgm" && that.kag.stat.play_bgm == false){
            that.kag.ftag.nextOrder();
            return ;
        }
        
        if(pm.target=="se" && that.kag.stat.play_se == false){
            that.kag.ftag.nextOrder();
            return ;
        }
        
        if(pm.target=="ambience" && that.kag.stat.play_ambience == false){
            that.kag.ftag.nextOrder();
            return ;
        }
        
        
        //スマホアプリの場合
        if(that.kag.define.FLAG_APRI == true){
        
            that.playGap(pm);
        
        //スマホからのアクセスの場合は、クリックを挟む
        }else if($.userenv() !="pc"){
            
            this.kag.layer.hideEventLayer();
            //スマホからの場合、スキップ中は音楽をならさない
            if(this.kag.stat.is_skip == true && pm.target=="se"){
               that.kag.layer.showEventLayer();
               that.kag.ftag.nextOrder();
               
           }else{
               
               if(pm.click == "true"){
                    
                    $(".tyrano_base").bind("click.bgm",function(){
                    
                        that.play(pm);
                        $(".tyrano_base").unbind("click.bgm");
                        that.kag.layer.showEventLayer();
                     
                    });
                
               }else{
                    
                     that.play(pm);
                     $(".tyrano_base").unbind("click.bgm");
                     that.kag.layer.showEventLayer();
                     
               }
                
            }
            
        }else{
            
            var browser = $.getBrowser();
            
            if(browser == "firefox" || browser =="opera" ){
                
                //swfによる音楽の再生を廃止
                //that.playSwf(pm); 
                that.play(pm);
                
            }else{
            	that.play(pm);
                
            }
        }
         
    },
    
    play:function(pm){
        
        var that = this;
        
        var target = "bgm";
        
        if(pm.target =="se" || pm.target =="ambience"){
            target = "sound";
        }
        
        var storage_url = "";
        
         if($.isHTTP(pm.storage)){
    	 	storage_url = pm.storage;	
    	 }else{
    	    storage_url = "./data/"+target+"/" + pm.storage;
    	 }
        
        //音楽再生
        var audio_obj = new Audio(storage_url);
        if(pm.loop =="true"){
            audio_obj.loop = true;
           
           audio_obj.onended=function(){
                    this.play();
           }; 
        }
        
        var maxVolume = 1;
        
        switch (pm.target) {
            case "se":
                this.kag.tmp.map_se[pm.storage] = audio_obj;
                maxVolume = this.kag.variable.sf.settings.volume.main/100 * this.kag.variable.sf.settings.volume.se/100;
                audio_obj.volume = maxVolume;
                break;
            case "ambience":
                this.kag.tmp.map_ambience[pm.storage] = audio_obj;
                that.kag.stat.current_ambience.push(pm);
                maxVolume = this.kag.variable.sf.settings.volume.main/100 * this.kag.variable.sf.settings.volume.ambience/100;
                audio_obj.volume = maxVolume;
                break;
            case "bgm":
                this.kag.tmp.map_bgm[pm.storage] = audio_obj;
                that.kag.stat.current_bgm.push(pm);
                maxVolume = this.kag.variable.sf.settings.volume.main/100 * this.kag.variable.sf.settings.volume.bgm/100;
                audio_obj.volume = maxVolume;
        }
        
        audio_obj.play();
        
        if(pm.fadein =="true"){
            
            var vars = jQuery.extend($('<div>')[0], { volume: 0 });
            
            $(vars).stop().animate({ volume: maxVolume }, {
                easing: "linear",
                duration: parseInt(pm.time),
                step: function() {
                    audio_obj.volume = this.volume; // this == vars
                },
                complete:function(){
                    //alert("complete fade");
                    //that.kag.ftag.completeTrans();   
                }
            });
        
        }
        
        if(pm.stop == "false"){
        
            this.kag.ftag.nextOrder();
        }
    },
    
    //phonegapで再生する
    playGap:function(pm){
        
        var that = this;
        
        var target = "bgm";
        if(pm.target =="se" || pm.target =="ambience"){
            target = "sound";
        }
        
        var audio_obj = null;

        switch (pm.target) {
            case "se":
                // do nothing
                break;
            case "ambience":
                that.kag.stat.current_ambience.push(pm);
                break;
            case "bgm":
                this.kag.stat.current_bgm.push(pm);
        }

        //iphone の場合
        var src_url = "./data/"+target+"/"+ pm.storage;
        
        //android ならパス表記変更
        if($.userenv()==="android" || $.userenv()==="andoroid"){
            src_url = $.getBaseURL()+"data/"+target+"/"+ pm.storage;
        }
        
        var audio_obj = new Media(src_url, function(){
            if (pm.loop == "true") {
                var tmp_obj = null;

                switch (pm.target) {
                    case "se":
                        tmp_obj = that.kag.tmp.map_se[pm.storage];
                        that.kag.tmp.map_se[pm.storage] = audio_obj;
                        audio_obj.volume = that.kag.variable.sf.settings.volume.main/100 * that.kag.variable.sf.settings.volume.se/100;
                        break;
                    case "ambience":
                        tmp_obj = that.kag.tmp.map_ambience[pm.storage];
                        audio_obj.volume = that.kag.variable.sf.settings.volume.main/100 * that.kag.variable.sf.settings.volume.ambience/100;
                        break;
                    case "bgm":
                        tmp_obj = that.kag.tmp.map_bgm[pm.storage];
                        audio_obj.volume = that.kag.variable.sf.settings.volume.main/100 * that.kag.variable.sf.settings.volume.bgm/100;
                }

                if(tmp_obj != null){
                    audio_obj.play();
                }
            }
        });


        switch (pm.target) {
            case "se":
                this.kag.tmp.map_se[pm.storage] = audio_obj;
                break;
            case "ambience":
                this.kag.tmp.map_ambience[pm.storage] = audio_obj;
                break;
            case "bgm":
                this.kag.tmp.map_bgm[pm.storage] = audio_obj;
        }
        
        //audio_obj.play();     
        //setTimeout(function(){audio_obj.play();},300);
		
		this.playAudio(audio_obj);

		
        if(pm.stop == "false"){
        
            this.kag.ftag.nextOrder();
        
        }
        
        
    },
    
    playAudio:function(audio_obj){
    	audio_obj.play();
    },
    
    //フラッシュで再生する
    playSwf:function(pm){
        
        var target = "bgm";
        
        if(pm.target =="se" || pm.target =="ambience"){
            target = "sound";
        }
        
        
        var repeat = 1;
        
        if(pm.loop =="true"){
            repeat = 9999;
        }
        
        
        var target = "bgm";
        if(pm.target =="se" || pm.target =="ambience"){
            target = "sound";
        }
        
        var storage_url = "";
        
         if($.isHTTP(pm.storage)){
    	 	storage_url = pm.storage;	
    	 }else{
    	    storage_url = "./data/"+target+"/" + pm.storage;
    	 }

        switch (pm.target) {
            case "se":
                this.kag.sound_swf.playSound(storage_url ,repeat);
                break;
            case "ambience":
                this.kag.stat.current_ambience.push(pm);
                this.kag.sound_swf.playSound(storage_url ,repeat);
                break;
            case "bgm":
                this.kag.stat.current_bgm.push(pm);
                this.kag.sound_swf.playMusic(storage_url ,repeat);
        }
        
        
        if(pm.stop == "false"){
            this.kag.ftag.nextOrder();
        }
        
        
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
        fadeout:"false",
        time:2000,
        target:"bgm",
        stop:"false"  //trueの場合自動的に次の命令へ移動しない。ロード対策
        
    },

    start:function(pm){
        
        var that = this;
        
        var target_map =null;

        switch (pm.target) {
            case "se":
                target_map = this.kag.tmp.map_se;
                break;
            case "ambience":
                target_map = this.kag.tmp.map_ambience;
                break;
            case "bgm":
                target_map = this.kag.tmp.map_bgm;
        }
        
        var browser = $.getBrowser();
        
        //アプリで再生している場合
        if(that.kag.define.FLAG_APRI == true){
            //
             for(key in target_map ){
                    
                    (function(){
                        
                        var _key = key;
                        var _audio_obj = null;
                        
                        _audio_obj = target_map[_key];

                        switch (pm.target) {
                            case "se":
                                // do nothing
                                break;
                            case "ambience":
                            	// TODO
                            	// just clear, without stop==false
                            	// this logic moved to saveload
                                if(pm.stop == "false"){
                                    that.kag.stat.current_ambience = [];
                                }
                                break;
                            case "bgm":
                            	// TODO
                            	// just clear, without stop==false
                            	// this logic moved to saveload
                                //ロード画面の場合、再生中の音楽はそのまま、直後にロードするから
                                if(pm.stop == "false"){
                                    that.kag.stat.current_bgm = [];
                                }
                        }

                        switch (pm.target) {
                            case "se":
                                that.kag.tmp.map_se[_key] = null;
                                delete that.kag.tmp.map_se[_key];
                                break;
                            case "ambience":
                                that.kag.tmp.map_ambience[_key] = null;
                                delete that.kag.tmp.map_ambience[_key];
                                break;
                            case "bgm":
                                that.kag.tmp.map_bgm[_key] = null;
                                delete that.kag.tmp.map_bgm[_key];
                        }
                        
                        //上記マップを削除した後に、ストップ処理を行うといいのではないか。 
                        _audio_obj.stop();
                        _audio_obj.release();
                        
                         
                    })();
                    
            }
            
        //フラッシュで再生している場合
        }else if(browser == "firefox" || browser =="opera"){
            
            
            this.kag.sound_swf.stopMusic();
            
            //ロード画面の場合、再生中の音楽はそのまま、直後にロードするから
            
            var target = "bgm";
            if(pm.target =="se" || pm.target =="ambience"){
                target = "sound";
            }

            switch (pm.target) {
                case "se":
                    // do nothing
                    break;
                case "ambience":
		    // TODO
		    // just clear, without stop==false
		    // this logic moved to saveload
                    if(pm.stop == "false"){
                        that.kag.stat.current_ambience = [];
                    }
                    break;
                case "bgm":
		    // TODO
		    // just clear, without stop==false
		    // this logic moved to saveload
                    //ロード画面の場合、再生中の音楽はそのまま、直後にロードするから
                    if(pm.stop == "false"){
                        that.kag.stat.current_bgm = [];
                    }
            }
        
            
        }else{
        
            
            for(key in target_map ){
                    
                    (function(){
                        
                        var _key = key;
                        
                        var _audio_obj = null;
                        
                        _audio_obj = target_map[_key];
                        switch (pm.target) {
                            case "se":
                                // do nothing
                                break;
                            case "ambience":
                                if(pm.stop == "false"){
                                    that.kag.stat.current_ambience = [];
                                }
                                break;
                            case "bgm":
                                //ロード画面の場合、再生中の音楽はそのまま、直後にロードするから
                                if(pm.stop == "false"){
                                    that.kag.stat.current_bgm = [];
                                }
                        }
                        
                        //フェードアウトしながら再生停止
                        if(pm.fadeout =="true"){
                            
                            var vars = jQuery.extend($('<div>')[0], { volume: _audio_obj.volume });
                            
                            $(vars).stop().animate({ volume: 0 }, {
                                easing: "linear",
                                duration: parseInt(pm.time),
                                step: function() {
                                    _audio_obj.volume = this.volume; // this == vars
                                },
                                complete: function() {
                                    _audio_obj.pause();
                                    //that.kag.ftag.completeTrans();
                                }
                            });
                        
                        }else{
                            
                            _audio_obj.pause();

                            switch (pm.target) {
                                case "se":
                                    delete that.kag.tmp.map_se[_key];
                                    break;
                                case "ambience":
                                    delete that.kag.tmp.map_ambience[_key];
                                    break;
                                case "bgm":
                                    delete that.kag.tmp.map_bgm[_key];
                            }
                        
                        }
                    
                    })();
                    
            }
        }
        
        if(pm.stop == "false"){
            this.kag.ftag.nextOrder();
        }
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
    
    vital:["storage","time"],
    
    pm:{
        loop:"true",
        storage:"",
        fadein:"true",
        time:2000
    },
    
    start:function(pm){
        this.kag.ftag.startTag("playbgm",pm);
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
    
    //vital:["time"],
    
    pm:{
        loop:"true",
        storage:"",
        fadeout:"true",
        time:2000
    },
    
    start:function(pm){
        this.kag.ftag.startTag("stopbgm",pm);
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
    
    vital:["storage","time"],
    
    pm:{
        loop:"true",
        storage:"",
        fadein:"true",
        fadeout:"true",
        time:2000
    },
    
    start:function(pm){
        
        this.kag.ftag.startTag("stopbgm",pm);
        this.kag.ftag.startTag("playbgm",pm);
        
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
        target:"se",
        loop:"false",
        clear:"false" //他のSEがなっている場合、それをキャンセルして、新しく再生します
    },
    
    start:function(pm){
        
        if(pm.clear == "true"){
            this.kag.ftag.startTag("stopbgm",{target:"se",stop:"true"});
        }
        
        this.kag.ftag.startTag("playbgm",pm);
        
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
        storage:"",
        fadeout:"false",
        time:2000,
        target:"se"
    },
    
    start:function(pm){
        this.kag.ftag.startTag("stopbgm",pm);
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
    
    vital:["storage","time"],
    
    pm:{
        storage:"",
        target:"se",
        loop:"false",
        fadein:"true",
        time:"2000"
        
    },
    
    start:function(pm){
        
        this.kag.ftag.startTag("playbgm",pm);
        
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
        storage:"",
        target:"se",
        loop:"false",
        fadeout:"true"
    },
    
    start:function(pm){
        
        this.kag.ftag.startTag("stopbgm",pm);
        
    }
    
};

/*
#[playambience]
:group
オーディオ関連
:title
ambienceの再生
:exp
ambienceを再生します
ambienceファイルはプロジェクトフォルダのsoundフォルダに入れてください
:sample
[playambience storage=sound.mp3 loop=false ]
:param
storage=再生するファイルを指定してください,
loop=trueまたはfalse （デフォルト）を指定してください。trueを指定すると繰り返し再生されます,
clear=trueまたはfalse(デフォルト) 他のSEが鳴っている場合、trueだと他のSEを停止した後、再生します。音声などはtrueが便利でしょう
#[end]
*/

tyrano.plugin.kag.tag.playambience = {
    
    vital:["storage"],
    
    pm:{
        storage:"",
        target:"ambience",
        loop:"false",
        clear:"false" //他のSEがなっている場合、それをキャンセルして、新しく再生します
    },
    
    start:function(pm){
        
        if(pm.clear == "true"){
            this.kag.ftag.startTag("stopbgm",{target:"ambience",stop:"true"});
        }
        
        this.kag.ftag.startTag("playbgm",pm);
        
    }
    
};

/*
#[stopambience]
:group
オーディオ関連
:title
ambienceの停止
:exp
ambienceを再生を停止します
:sample
[stopambience ]
:param
#[end]
*/

tyrano.plugin.kag.tag.stopambience = {
    
    pm:{
        storage:"",
        fadeout:"false",
        time:2000,
        target:"ambience"
    },
    
    start:function(pm){
        this.kag.ftag.startTag("stopbgm",pm);
    }
    
};

/*
#[fadeinambience]
:group
オーディオ関連
:title
ambienceのフェードイン
:exp
ambienceをフェードインしながら再生します
:sample
[fadeinambience storage=sound.mp3 loop=false time=2000 ]
:param
storage=次に再生するファイルを指定してください,
loop=trueまたはfalse （デフォルト）を指定してください。trueを指定すると繰り返し再生されます,
time=フェードインの時間をミリ秒で指定します
#[end]
*/

tyrano.plugin.kag.tag.fadeinambience = {
    
    vital:["storage","time"],
    
    pm:{
        storage:"",
        target:"ambience",
        loop:"false",
        fadein:"true",
        time:"2000"
        
    },
    
    start:function(pm){
        
        this.kag.ftag.startTag("playbgm",pm);
        
    }
    
};

/*
#[fadeoutambience]
:group
オーディオ関連
:title
ambienceの再生
:exp
ambienceをフェードアウトします
:sample
[fadeoutambience time=2000 ]
:param
time=フェードアウトを行なっている時間をミリ秒で指定します。
#[end]
*/

tyrano.plugin.kag.tag.fadeoutambience = {
    
    pm:{
        storage:"",
        target:"ambience",
        loop:"false",
        fadeout:"true"
    },
    
    start:function(pm){
        
        this.kag.ftag.startTag("stopbgm",pm);
        
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


