function formSubmit(value){
    var idval=$("#textforlogin").attr("identify");
    console.log("identify:"+idval);
	var transdata={
        id: value,
        identfy: idval
    };
    $.get("/operation",transdata,
        function(result){
            // console.log(result.innerht);
            document.getElementById('content').innerHTML=result.innerht;
	    document.getElementById('content').innerHTML+="<div style=\"opacity: 0;height:90px\"></div>";
        });
    $('.nav__trigger').click();
}
function formSubmitalbum(value){
    var idval=$("#textforlogin").attr("identify");
    console.log("identify:"+idval);
    var transdata={
        id: value,
        identfy: idval
    };
	$.get("/album",transdata,
        function(result){
            // console.log(result.innerht);
            document.getElementById('content').innerHTML=result.innerht;
	    document.getElementById('content').innerHTML+="<div style=\"opacity: 0;height:90px\"></div>";
        });
}
function formSubmitsong(value){
    var idval=$("#textforlogin").attr("identify");
    var intex=document.getElementById('timenow').innerHTML;
    console.log("identify:"+idval+"   intex:"+intex);
    document.getElementById('songnowplaytime').value=intex;
    document.getElementById('songidentify').value=idval;
    document.getElementById('socomit').value=value;
    document.getElementById('contentcomit').submit();
}
function formSubmitfoot(value){
    var idval=$("#textforlogin").attr("identify");
    var idplay=$("#nowplaytext").attr("playid");
    console.log("identify:"+idval+" idplay:"+idplay);
    switch (value) {
        case 0:
            $("#prev").css({backgroundColor:"aquamarine" });
            var classval=$("#way").attr("class");
            if(classval=="iconfont icon-biao-"){
            }
            if(classval=="iconfont icon-xunhuanbofang"){
                value=6;
            }
            if(classval=="iconfont icon-luanxu"){
                value=7;
            }
            break;
        case 1:
            $('.waveform').click();
            return;
        case 2:
            $("#next").css({backgroundColor:"aquamarine" });
            var classval=$("#way").attr("class");
            if(classval=="iconfont icon-biao-"){
                value=5;
            }
            if(classval=="iconfont icon-xunhuanbofang"){
                value=6;
            }
            if(classval=="iconfont icon-luanxu"){
                value=7;
            }
            break;
        case 3:
            var classval=$("#way").attr("class");
            if(classval=="iconfont icon-biao-"){
                $("#way").attr({class:"iconfont icon-xunhuanbofang"});
                return;
            }
            if(classval=="iconfont icon-xunhuanbofang"){
                $("#way").attr({class:"iconfont icon-luanxu"});
                return;
            }
            if(classval=="iconfont icon-luanxu"){
                $("#way").attr({class:"iconfont icon-biao-"});
                return;
            }
            break;
        case 4:
            var transdata={
                id: value,
                identfy: idval
            };
            if($("#nowplaytext").text()!="无播放项" ){
                console.log("you nei rong ");
                var classval=$("#like").attr("class");
                console.log(classval);
                $.get("/foot",transdata,
                    function(result){
                        console.log(result.status);
                        if(result.status=="OK"){
                            if(classval=="iconfont icon-xiai1"){
                                $("#like").attr({class:"iconfont icon-xiai"});
                            }
                            if(classval=="iconfont icon-xiai"){
                                $("#like").attr({class:"iconfont icon-xiai1"});
                            }
                        }
                    });
            }else{console.log("无播放项");}
            return;
        default:
            break;
    }
    document.getElementById('footnowid').value=idplay;
    document.getElementById('footidentify').value=idval;
    document.getElementById('footcomit').value=value;
    document.getElementById('comitfoot').submit();
}


$(function(){
    var flag=false;
    var txt = document.getElementById("textae");
    var contentheight=window.innerHeight-txt.getAttribute("heightvalue");
    lrc=txt.value;
    //console.log(lrc.value);
    let audio = document.getElementById('audio');

    var styleh={
        height:contentheight + 'px'
    };
    $('#content').css(styleh);

    $('.nav__trigger').on('click', function(e){
        e.preventDefault();
        $(this).parent().toggleClass('nav--active');
    });
    $('.waveform').on('click',function (){
        // console.log($('audio').attr("play"));
        if($('audio').attr("play")=="true"){
            $('.waveform').css({backgroundColor:"aquamarine" });
            $('#audio').attr({play:false});
            $("#pause").attr({class:"iconfont icon-bofang"});
            audio.pause();
            // clearInterval(real);
        }else{
            $('#audio').attr({play:true});
            $('.waveform').css({backgroundColor:"whitesmoke"});
            $("#pause").attr({class:"iconfont icon-stop-playing"});
            audio.play();
        }

    });

    if(!flag){
        if($('audio').attr("play")=="true"){
            oTimer();
        }
        let AudioContext = window.AudioContext || window.webkitAudioContext;
        let audioContext = new AudioContext();
        let analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser = audioContext.createAnalyser();


        let audioSrc = audioContext.createMediaElementSource(audio);
        audioSrc.connect(analyser);
        analyser.connect(audioContext.destination);
        let canvas = document.getElementById('canvas');

        let ctx = canvas.getContext("2d");
        ctx.lineWidth = 2;
        let grd = ctx.createLinearGradient(0, 0, 600, 0);
        grd.addColorStop(0, "#00d0ff");
        grd.addColorStop(1, "#eee");

        let het = 1;
        var globalID;

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            ctx.beginPath();
            for (let i = 0; i < 60; i++) {
                let value = dataArray[8 * i];
                ctx.fillStyle = grd;
                ctx.fillRect(i * 6, 200, 4, -value + 1);
                // ctx.fillRect(i * 5, 180 - value, 2, het);
            }
            globalID = requestAnimationFrame(render);
        };
        globalID = requestAnimationFrame(render);
        flag=true;
    }

    /* 歌曲进度条 */
    /* 音频时间 */
    //总时长
    var real;
    var totalTime;
    var totalMinute;
    var totalSecond;
    var oTotalTime;
    var realTime;
    var realMinute;
    var realSecond;

    function doubleNum(n){
        return (n <10) ? ("0" + n) : (n);
    }

    var odiv=document.getElementById("mydiv");
    var obar=document.getElementById("mybar");
    var obbar=document.getElementById("mybuffbar");
    var obg=document.getElementById("mybg");
    var kuan = odiv.clientWidth;
    var leftmine=0;
    var bufftime=0;
    var oRealTime=document.getElementById("timenow");
    var oTotalTime=document.getElementById("timetotal");
    obg.onclick=function (e){
        // console.log("ok");
        leftmine = e.pageX +"px";
        // console.log(leftmine);
        obar.style.width = leftmine;
        realTime = parseInt((e.pageX*totalTime)/kuan);
        realMinute = doubleNum(parseInt(realTime/60));
        realSecond = doubleNum(realTime%60);
        audio.currentTime = realTime;
        oRealTime.innerHTML = realMinute + ":" + realSecond;
    };
    obar.onclick=function (e){
        audio.load();
        leftmine = e.pageX +"px";
        obar.style.width = leftmine;
        realTime = parseInt((e.pageX*totalTime)/kuan);
        realMinute = doubleNum(parseInt(realTime/60));
        realSecond = doubleNum(realTime%60);
        audio.currentTime = realTime;
        oRealTime.innerHTML = realMinute + ":" + realSecond;
    };
    obbar.onclick=function (e){
        leftmine = e.pageX +"px";
        obar.style.width = leftmine;
        realTime = parseInt((e.pageX*totalTime)/kuan);
        realMinute = doubleNum(parseInt(realTime/60));
        realSecond = doubleNum(realTime%60);
        audio.currentTime = realTime;
        oRealTime.innerHTML = realMinute + ":" + realSecond;
    };
    /* 定时器 */
    function oTimer(){
        real = setInterval( function(){
            totalTime = parseInt(audio.duration);
            totalMinute = doubleNum(parseInt(totalTime/60));
            totalSecond = doubleNum(totalTime%60);
            oTotalTime.innerHTML = totalMinute + ":" + totalSecond;
            realTime = parseInt(audio.currentTime);
            realMinute = doubleNum(parseInt(realTime/60));
            realSecond = doubleNum(realTime%60);
            oRealTime.innerHTML = realMinute + ":" + realSecond;
            leftmine = (realTime*kuan)/totalTime;
            obar.style.width = leftmine  + "px";
            var timeRanges = audio.buffered;
            // 获取以缓存的时间
            var timeBuffered = timeRanges.end(timeRanges.length-1);
            var timeBufferedend = timeRanges.start(timeRanges.length-1);
            bufftime=(timeBuffered*kuan)/totalTime;
            //console.log(timeRanges.length +"--"+timeBufferedend+"--"+timeBuffered);
            obbar.style.width = bufftime  + "px";
            // if(audio.ended){
            //     Play = false;
            //     oPaly.className = "play iconfont Iconfont icon-zanting";
            //     oPaly.title = "播放";
            // }
        },1000)
    }


    /* 解析lrc */
    var arrdata=null;
    var lrcArr = lrc.split("[");
    var html = "";
    let oLyric = document.getElementById('Lyric');
    // console.log(oLyric);
    Initialize();
    function Initialize(){
        console.log("initialize");
        for(let i=0; i < lrcArr.length ; i++){
            lrcArr = lrc.split("[");
            arr = lrcArr[i].split("]");
            var time = arr[0].split(".");
            var timer = time[0].split(":");
            var ms = timer[0] * 60 + timer[1] * 1;
            var text = arr[1];
            if(text){
                // console.log(ms);
                // console.log(text);
                html += "<p id=" + ms +" style=\"display:none\">" + text + "</p>";
            }
            oLyric.innerHTML = html;
            arr[0] = null; arr[1] = null;
        }
        html = "";
    }
    var temptext="";
    var innerhtml="";
    let lyplay = document.getElementById('lyricplay');
    audio.addEventListener("timeupdate",function(){
        if($("#"+realTime).length==1){
            temptext=$("#"+realTime).text();
        }
        if(temptext!=null){
            innerhtml="";
            innerhtml+="<a class='textlinem'>"+temptext;
            innerhtml+="</a>";
            document.title=temptext;
        }
        else{
            innerhtml="";
            innerhtml+="<a class='textlinem'>fycmusic</a>";
            document.title="fycmusic";
        }
        lyplay.innerHTML=innerhtml;
        if(realTime >= (totalTime-1)){
            temptext="";
        }
    });
    audio.onended = function() {
        $("#next").click();
    }
});
