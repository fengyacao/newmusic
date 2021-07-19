function formSubmit(value){
    document.getElementById('bucomit').value=value;
    document.getElementById('comit').submit();
}

$(function(){
    var flag=false;
    $('.nav__trigger').on('click', function(e){
        e.preventDefault();
        $(this).parent().toggleClass('nav--active');
    });
    let audio = document.getElementById('audio');
    $('.waveform').on('click',function () {
        let audio = document.getElementById('audio');
        console.log($('audio').attr("play"));
        if($('audio').attr("play")=="true"){
            $('.waveform').css({backgroundColor:"aquamarine" });
            $('#audio').attr({play:false});
            audio.pause();
        }else{
            $('#audio').attr({play:true});
            $('.waveform').css({backgroundColor:"whitesmoke"});
            audio.play();
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
        console.log(totalTime);
        console.log(realTime);
        console.log(realMinute);
        console.log(realSecond);
    });

    /* 歌曲进度条 */
    /* 音频时间 */
    //总时长
    var real;
    var totalTime;
    var totalMinute;
    var totalSecond;
    var oTotalTime;
    /* 确保获取成功 */
    setTimeout( function(){
        audio.addEventListener("canplay", function() {
            console.log(parseInt(audio.duration));
            totalTime = parseInt(audio.duration);
        });
        totalMinute = doubleNum(parseInt(totalTime/60));
        totalSecond = doubleNum(totalTime%60);
        oTotalTime = $(".totalTime")[0];
        oTotalTime.innerHTML = totalMinute + ":" + totalSecond;
    },200);
    /* 当前时长 */
    var realTime = parseInt(audio.currentTime);
    var realMinute = doubleNum(parseInt(realTime/60));
    var realSecond = doubleNum(realTime%60);





})