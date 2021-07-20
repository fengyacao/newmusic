function formSubmit(value){
    document.getElementById('bucomit').value=value;
    document.getElementById('comit').submit();
}
function formSubmitalbum(value){
    document.getElementById('socomit').value=value;
    document.getElementById('contentcomit').submit();
}
function formSubmitsong(value){
    document.getElementById('socomit').value=value;
    document.getElementById('contentcomit').submit();
}
$(function(){



    var flag=false;
    var contentheight=window.innerHeight-600;

    var styleh={
        height:contentheight + 'px'
    }
    $('#content').css(styleh)

    $('.nav__trigger').on('click', function(e){
        e.preventDefault();
        $(this).parent().toggleClass('nav--active');
    });
    let audio = document.getElementById('audio');
    $('.waveform').on('click',function (){
        let audio = document.getElementById('audio');
        console.log($('audio').attr("play"));
        if($('audio').attr("play")=="true"){
            $('.waveform').css({backgroundColor:"aquamarine" });
            $('#audio').attr({play:false});
            audio.pause();
            clearInterval(real)
        }else{
            $('#audio').attr({play:true});
            $('.waveform').css({backgroundColor:"whitesmoke"});
            audio.play();
            oTimer();
        }
        if(!flag){
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

    });

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
    var obg=document.getElementById("mybg");
    var kuan = odiv.clientWidth;
    var leftmine=0;
    obg.onclick=function (e){
        console.log("ok");
        leftmine = e.pageX +"px";
        console.log(leftmine);
        obar.style.width = leftmine;
        realTime = parseInt((e.pageX*totalTime)/kuan);
        realMinute = doubleNum(parseInt(realTime/60));
        realSecond = doubleNum(realTime%60);
        //oRealTime = $(".realTime")[0];
        audio.currentTime = realTime;
        //oRealTime.innerHTML = realMinute + ":" + realSecond;
    }
    obar.onclick=function (e){
        console.log("ok");
        leftmine = e.pageX +"px";
        console.log(leftmine);
        obar.style.width = leftmine;
        realTime = parseInt((e.pageX*totalTime)/kuan);
        realMinute = doubleNum(parseInt(realTime/60));
        realSecond = doubleNum(realTime%60);
        //oRealTime = $(".realTime")[0];
        audio.currentTime = realTime;
        //oRealTime.innerHTML = realMinute + ":" + realSecond;
    }
    /* 定时器 */
    function oTimer(){
        real = setInterval( function(){
            totalTime = parseInt(audio.duration);
            console.log(totalTime);
            realTime = parseInt(audio.currentTime);
            realMinute = doubleNum(parseInt(realTime/60));
            realSecond = doubleNum(realTime%60);
            // oRealTime.innerHTML = realMinute + ":" + realSecond;
            // left = (realTime*400)/totalTime;
            leftmine = (realTime*kuan)/totalTime;
             obar.style.width = leftmine  + "px";
            // if(audio.ended){
            //     Play = false;
            //     oPaly.className = "play iconfont Iconfont icon-zanting";
            //     oPaly.title = "播放";
            // }
            console.log(realTime);
            console.log(realMinute);
            console.log(realSecond);
        },1000)
    }

})