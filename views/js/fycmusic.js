function formSubmit(value){
    document.getElementById('bucomit').value=value;
    document.getElementById('comit').submit();
}

$(function(){
    $('.nav__trigger').on('click', function(e){
        e.preventDefault();
        $(this).parent().toggleClass('nav--active');
    });

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

    })
    
    let AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioContext = new AudioContext();
    let analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser = audioContext.createAnalyser();

    let audio = document.getElementById('audio');
    let audioSrc = audioContext.createMediaElementSource(audio);
    audio.play();
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

})